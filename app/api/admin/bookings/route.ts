import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { 
  bookingsTable, 
  userProfileTable, 
  servicesTable,
  hairdressersTable,
  bookingStatusEnum 
} from '@/db/schema';
import { and, eq, like, or, sql, desc } from 'drizzle-orm';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { getUserRole } from '@/actions/user/role';

export async function GET(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const role = await getUserRole(userId);
  
  if (role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statuses = searchParams.getAll('status');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const search = searchParams.get('search');
  const hairdresserIds = searchParams.getAll('hairdresserId');

  const conditions = [];

  if (statuses.length > 0) {
    const validStatuses = statuses.filter(status => 
      status === 'booked' || status === 'cancelled' || status === 'past'
    );
    if (validStatuses.length > 0) {
      conditions.push(
        or(...validStatuses.map(status => 
          eq(bookingsTable.status, status as typeof bookingStatusEnum.enumValues[number])
        ))
      );
    }
  }

  if (hairdresserIds.length > 0) {
    const validIds = hairdresserIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (validIds.length > 0) {
      conditions.push(
        or(...validIds.map(id => eq(bookingsTable.hairdresserId, id)))
      );
    }
  }

  if (dateFrom && dateTo) {
    const startDate = parseISO(dateFrom);
    const endDate = parseISO(dateTo);
    conditions.push(
      and(
        sql`${bookingsTable.appointmentDate} >= ${startOfDay(startDate)}`,
        sql`${bookingsTable.appointmentDate} <= ${endOfDay(endDate)}`
      )
    );
  } else if (dateFrom) {
    const startDate = parseISO(dateFrom);
    conditions.push(
      sql`${bookingsTable.appointmentDate} >= ${startOfDay(startDate)}`
    );
  } else if (dateTo) {
    const endDate = parseISO(dateTo);
    conditions.push(
      sql`${bookingsTable.appointmentDate} <= ${endOfDay(endDate)}`
    );
  }

  if (search) {
    conditions.push(
      or(
        like(userProfileTable.first_name, `%${search}%`),
        like(userProfileTable.last_name, `%${search}%`),
        like(userProfileTable.email, `%${search}%`)
      )
    );
  }

  const baseQuery = db
    .select({
      id: bookingsTable.id,
      appointmentDate: bookingsTable.appointmentDate,
      status: bookingsTable.status,
      cancellationReason: bookingsTable.cancellationReason,
      rescheduleReason: bookingsTable.rescheduleReason,
      hairdresserId: bookingsTable.hairdresserId,
      serviceId: bookingsTable.serviceId,
      user: {
        first_name: userProfileTable.first_name,
        last_name: userProfileTable.last_name,
        email: userProfileTable.email,
      },
      service: {
        id: servicesTable.id,
        name: servicesTable.name,
        price: servicesTable.price,
        time_required: servicesTable.time_required,
      },
      hairdresser: {
        first_name: hairdressersTable.first_name,
        last_name: hairdressersTable.last_name,
      },
      notes: bookingsTable.notes,
    })
    .from(bookingsTable)
    .leftJoin(userProfileTable, eq(bookingsTable.userId, userProfileTable.userId))
    .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .leftJoin(hairdressersTable, eq(bookingsTable.hairdresserId, hairdressersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.appointmentDate));

  const bookings = await baseQuery;

  return NextResponse.json(bookings);
} 