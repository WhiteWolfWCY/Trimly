import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { bookingsTable } from '@/db/schema';
import { and, lt, eq, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron (commented out for testing)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    // First, let's see what bookings we have that should be updated
    const pastBookings = await db
      .select({
        id: bookingsTable.id,
        appointmentDate: bookingsTable.appointmentDate,
        status: bookingsTable.status
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, "booked"),
          lt(bookingsTable.appointmentDate, sql`NOW()`)
        )
      );

    console.log('Found past bookings to update:', pastBookings);
    console.log('Current timestamp:', new Date().toISOString());

    if (pastBookings.length === 0) {
      console.log('No past bookings found to update');
      return NextResponse.json({ 
        success: true, 
        message: 'No past bookings found to update',
        foundBookings: 0,
        updatedCount: 0
      });
    }

    // Now update the bookings
    const result = await db
      .update(bookingsTable)
      .set({ 
        status: 'past',
        updated_at: new Date()
      })
      .where(
        and(
          eq(bookingsTable.status, "booked"),
          lt(bookingsTable.appointmentDate, sql`NOW()`)
        )
      );

    console.log('Update result:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully updated past visits',
      foundBookings: pastBookings.length,
      updatedCount: result.rowCount || pastBookings.length
    });
  } catch (error) {
    console.error('Error updating past visits:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update past visits',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 