'use server';

import { parseISO, format, getDay } from 'date-fns';
import { db } from '@/db/drizzle';
import { bookingsTable, userProfileTable, hairdressersTable, servicesTable } from '@/db/schema';
import { eq, between, and, desc } from 'drizzle-orm';
import ExcelJS from 'exceljs';

interface ReportParams {
  from: string;
  to: string;
}

const dayNames = [
  'Niedziela',
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
];

export async function generateExcelReport({ from, to }: ReportParams): Promise<Uint8Array> {
  const bookings = await db
    .select({
      id: bookingsTable.id,
      userId: bookingsTable.userId,
      hairdresserId: bookingsTable.hairdresserId,
      serviceId: bookingsTable.serviceId,
      appointmentDate: bookingsTable.appointmentDate,
      status: bookingsTable.status,
      notes: bookingsTable.notes,
      cancellationReason: bookingsTable.cancellationReason,
      created_at: bookingsTable.created_at,
      user: {
        first_name: userProfileTable.first_name,
        last_name: userProfileTable.last_name,
        email: userProfileTable.email,
      },
      hairdresser: {
        first_name: hairdressersTable.first_name,
        last_name: hairdressersTable.last_name,
      },
      service: {
        name: servicesTable.name,
        price: servicesTable.price,
        time_required: servicesTable.time_required,
      },
    })
    .from(bookingsTable)
    .leftJoin(userProfileTable, eq(bookingsTable.userId, userProfileTable.userId))
    .leftJoin(hairdressersTable, eq(bookingsTable.hairdresserId, hairdressersTable.id))
    .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(
      and(
        between(
          bookingsTable.appointmentDate,
          parseISO(from + 'T00:00:00Z'),
          parseISO(to + 'T23:59:59Z')
        )
      )
    )
    .orderBy(desc(bookingsTable.appointmentDate));

  const totalIncome = bookings
    .filter((booking) => booking.status === 'booked' || booking.status === 'past')
    .reduce((sum, booking) => {
      if (!booking.service || !booking.service.price) return sum;

      const price = typeof booking.service.price === 'string' 
        ? parseFloat(booking.service.price) 
        : Number(booking.service.price);
      return sum + price;
    }, 0);

  const bookingsByStatus = bookings.reduce<Record<string, number>>((acc, booking) => {
    if (!booking.status) return acc;
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  const hairdresserCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
    if (!booking.hairdresser) return acc;
    const hairdresserName = `${booking.hairdresser.first_name} ${booking.hairdresser.last_name}`;
    acc[hairdresserName] = (acc[hairdresserName] || 0) + 1;
    return acc;
  }, {});

  const popularHairdressers = Object.entries(hairdresserCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const serviceCounts = bookings.reduce<Record<string, { count: number; income: number }>>((acc, booking) => {
    if (!booking.service || !booking.service.name) return acc;
    
    const serviceName = booking.service.name;
    if (!acc[serviceName]) {
      acc[serviceName] = { count: 0, income: 0 };
    }
    acc[serviceName].count++;
    
    if ((booking.status === 'booked' || booking.status === 'past') && booking.service.price) {
      const price = typeof booking.service.price === 'string' 
        ? parseFloat(booking.service.price) 
        : Number(booking.service.price);
      acc[serviceName].income += price;
    }
    
    return acc;
  }, {});

  const popularServices = Object.entries(serviceCounts)
    .map(([name, { count, income }]) => ({ name, count, income }))
    .sort((a, b) => b.count - a.count);

  const dayOfWeekCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
    if (!booking.appointmentDate) return acc;
    
    const date = new Date(booking.appointmentDate);
    const dayOfWeek = getDay(date);
    const dayName = dayNames[dayOfWeek];
    
    acc[dayName] = (acc[dayName] || 0) + 1;
    return acc;
  }, {});

  const popularDays = Object.entries(dayOfWeekCounts)
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count);

  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  const totalDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
  const averageBookingsPerDay = bookings.length / totalDays;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Trimly';
  workbook.lastModifiedBy = 'Trimly';
  workbook.created = new Date();
  workbook.modified = new Date();

  const summarySheet = workbook.addWorksheet('Podsumowanie');
  
  summarySheet.mergeCells('A1:D1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `Raport rezerwacji (${format(fromDate, 'dd.MM.yyyy')} - ${format(toDate, 'dd.MM.yyyy')})`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  
  summarySheet.addRow(['']);
  summarySheet.addRow(['Podstawowe statystyki']);
  summarySheet.getRow(3).font = { bold: true };
  
  summarySheet.addRow(['Łączna liczba rezerwacji:', bookings.length]);
  summarySheet.addRow(['Łączny przychód:', `$${totalIncome.toFixed(2)}`]);
  summarySheet.addRow(['Średnia liczba rezerwacji dziennie:', averageBookingsPerDay.toFixed(1)]);
  
  summarySheet.addRow(['']);
  summarySheet.addRow(['Status rezerwacji']);
  summarySheet.getRow(8).font = { bold: true };
  
  Object.entries(bookingsByStatus).forEach(([status, count]) => {
    summarySheet.addRow([status.charAt(0).toUpperCase() + status.slice(1), count]);
  });

  summarySheet.addRow(['']);
  summarySheet.addRow(['Najpopularniejsi fryzjerzy']);
  summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
  
  popularHairdressers.slice(0, 5).forEach(({ name, count }) => {
    summarySheet.addRow([name, count]);
  });
  
  summarySheet.addRow(['']);
  summarySheet.addRow(['Najpopularniejsze usługi', 'Liczba rezerwacji', 'Przychód']);
  summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
  
  popularServices.slice(0, 5).forEach(({ name, count, income }) => {
    summarySheet.addRow([name, count, `$${income.toFixed(2)}`]);
  });
  
  summarySheet.addRow(['']);
  summarySheet.addRow(['Najpopularniejsze dni tygodnia']);
  summarySheet.getRow(summarySheet.rowCount).font = { bold: true };
  
  popularDays.forEach(({ day, count }) => {
    summarySheet.addRow([day, count]);
  });
  
  summarySheet.columns.forEach(column => {
    column.width = 25;
  });

  const detailsSheet = workbook.addWorksheet('Szczegóły rezerwacji');
  
  detailsSheet.addRow([
    'Data', 
    'Godzina', 
    'Klient', 
    'Email', 
    'Fryzjer', 
    'Usługa', 
    'Cena', 
    'Status',
    'Powód anulacji'
  ]);
  detailsSheet.getRow(1).font = { bold: true };
  
  bookings.forEach(booking => {
    const date = new Date(booking.appointmentDate);
    detailsSheet.addRow([
      format(date, 'yyyy-MM-dd'),
      format(date, 'HH:mm'),
      booking.user ? `${booking.user.first_name} ${booking.user.last_name}` : 'N/A',
      booking.user?.email || 'N/A',
      booking.hairdresser ? `${booking.hairdresser.first_name} ${booking.hairdresser.last_name}` : 'N/A',
      booking.service?.name || 'N/A',
      booking.service ? `$${parseFloat(booking.service.price?.toString() || '0').toFixed(2)}` : '$0.00',
      booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'N/A',
      booking.cancellationReason || ''
    ]);
  });
  
  detailsSheet.columns.forEach(column => {
    column.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
} 