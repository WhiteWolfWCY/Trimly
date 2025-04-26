import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { bookingsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserRole } from '@/actions/user/role';
import { revalidateTag } from 'next/cache';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const role = await getUserRole(userId);
    const visitId = parseInt(params.id);
    
    // Get the visit first to check permissions
    const [visit] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, visitId))
      .limit(1);

    if (!visit) {
      return new NextResponse('Visit not found', { status: 404 });
    }

    // Only allow admin or the visit owner to reschedule
    if (role !== 'admin' && visit.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if visit is already cancelled
    if (visit.status === 'cancelled') {
      return new NextResponse('Cannot reschedule cancelled visit', { status: 400 });
    }

    const { newAppointmentDate } = await request.json();

    if (!newAppointmentDate) {
      return new NextResponse('New appointment date is required', { status: 400 });
    }

    // Check if the new date is in the past
    if (new Date(newAppointmentDate) < new Date()) {
      return new NextResponse('Cannot reschedule to a past date', { status: 400 });
    }

    // Update the visit
    const [updatedVisit] = await db
      .update(bookingsTable)
      .set({
        appointmentDate: new Date(newAppointmentDate),
        updated_at: new Date(),
      })
      .where(eq(bookingsTable.id, visitId))
      .returning();

    // Revalidate the visits cache
    revalidateTag('visits');
    
    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error('Error rescheduling visit:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error', 
      { status: 500 }
    );
  }
} 