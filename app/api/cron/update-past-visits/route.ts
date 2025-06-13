import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { bookingsTable } from '@/db/schema';
import { and, lt, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
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