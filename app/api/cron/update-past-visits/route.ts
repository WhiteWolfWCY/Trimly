import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { bookingsTable } from '@/db/schema';
import { and, lt, eq, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Use SQL CURRENT_TIMESTAMP to properly compare with timestamp field
    // This will mark any booking whose appointment datetime has passed as 'past'
    const result = await db
      .update(bookingsTable)
      .set({ 
        status: 'past',
        updated_at: new Date()
      })
      .where(
        and(
          eq(bookingsTable.status, "booked"),
          lt(bookingsTable.appointmentDate, sql`CURRENT_TIMESTAMP`)
        )
      );

      console.log(result)

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