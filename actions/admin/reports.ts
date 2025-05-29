'use server';

import { parseISO, getDay } from 'date-fns';
import { db } from '@/db/drizzle';
import { bookingsTable, userProfileTable, hairdressersTable, servicesTable } from '@/db/schema';
import { eq, between, and, desc } from 'drizzle-orm';

interface ReportParams {
  from: string;
  to: string;
}

interface HairdresserCount {
  name: string;
  count: number;
}

interface ServiceCount {
  name: string;
  count: number;
  income: number;
}

interface DayCount {
  day: string;
  count: number;
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

export async function generateReport({ from, to }: ReportParams) {
  // Fetch all bookings in the date range with their relations
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

  // Calculate total income (only from booked or past appointments)
  const totalIncome = bookings
    .filter((booking) => booking.status === 'booked' || booking.status === 'past')
    .reduce((sum, booking) => {
      if (!booking.service || !booking.service.price) return sum;

      const price = typeof booking.service.price === 'string' 
        ? parseFloat(booking.service.price) 
        : Number(booking.service.price);
      return sum + price;
    }, 0);

  // Count bookings by status
  const bookingsByStatus = bookings.reduce<Record<string, number>>((acc, booking) => {
    if (!booking.status) return acc;
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  // Count bookings by hairdresser
  const hairdresserCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
    if (!booking.hairdresser) return acc;
    const hairdresserName = `${booking.hairdresser.first_name} ${booking.hairdresser.last_name}`;
    acc[hairdresserName] = (acc[hairdresserName] || 0) + 1;
    return acc;
  }, {});

  const popularHairdressers: HairdresserCount[] = Object.entries(hairdresserCounts)
    .map(([name, count]): HairdresserCount => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Count bookings by service and calculate income per service
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

  const popularServices: ServiceCount[] = Object.entries(serviceCounts)
    .map(([name, { count, income }]): ServiceCount => ({ name, count, income }))
    .sort((a, b) => b.count - a.count);

  // Count bookings by day of week
  const dayOfWeekCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
    if (!booking.appointmentDate) return acc;
    
    const date = new Date(booking.appointmentDate);
    const dayOfWeek = getDay(date);
    const dayName = dayNames[dayOfWeek];
    
    acc[dayName] = (acc[dayName] || 0) + 1;
    return acc;
  }, {});

  const popularDays: DayCount[] = Object.entries(dayOfWeekCounts)
    .map(([day, count]): DayCount => ({ day, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate average bookings per day
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  const totalDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
  const averageBookingsPerDay = bookings.length / totalDays;

  return {
    bookings,
    stats: {
      totalBookings: bookings.length,
      totalIncome,
      bookingsByStatus,
      popularHairdressers,
      popularServices,
      popularDays,
      averageBookingsPerDay,
    },
  };
} 