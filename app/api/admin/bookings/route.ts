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
  const status = searchParams.get('status');
  const date = searchParams.get('date');
  const search = searchParams.get('search');

  const conditions = [];

  if (status && status !== 'all' && 
      (status === 'booked' || status === 'cancelled' || status === 'past')) {
    conditions.push(eq(bookingsTable.status, status as typeof bookingStatusEnum.enumValues[number]));
  }

  if (date) {
    const searchDate = parseISO(date);
    conditions.push(
      and(
        sql`${bookingsTable.appointmentDate} >= ${startOfDay(searchDate)}`,
        sql`${bookingsTable.appointmentDate} <= ${endOfDay(searchDate)}`
      )
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