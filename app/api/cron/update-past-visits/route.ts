import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { bookingsTable } from '@/db/schema';
import { and, lt, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update all booked visits that are before today to 'past' status
    const result = await db
      .update(bookingsTable)
      .set({ 
        status: 'past',
        updated_at: new Date()
      })
      .where(
        and(
          eq(bookingsTable.status, 'booked'),
          lt(bookingsTable.appointmentDate, today)
        )
      );

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully updated past visits',
      updatedCount: result.rowCount
    });
  } catch (error) {
    console.error('Error updating past visits:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update past visits'
      },
      { status: 500 }
    );
  }
} 