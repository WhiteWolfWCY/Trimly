'use server';

import { db } from "@/db/drizzle";
import { bookingsTable, servicesTable, hairdressersServices, hairdressersTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { getUserRole } from '@/actions/user/role';
import { removeBookingFromCalendar, updateBookingInCalendar } from './calendar-sync';

export async function getUserVisits(userId: string) {
    const visits = await db
        .select({
            id: bookingsTable.id,
            userId: bookingsTable.userId,
            hairdresserId: bookingsTable.hairdresserId,
            serviceId: bookingsTable.serviceId,
            appointmentDate: bookingsTable.appointmentDate,
            status: bookingsTable.status,
            notes: bookingsTable.notes,
            cancellationReason: bookingsTable.cancellationReason,
            rescheduleReason: bookingsTable.rescheduleReason,
            created_at: bookingsTable.created_at,
            updated_at: bookingsTable.updated_at,
            service: {
                id: servicesTable.id,
                name: servicesTable.name,
                price: servicesTable.price,
                time_required: servicesTable.time_required,
            },
            hairdresser: {
                id: hairdressersTable.id,
                first_name: hairdressersTable.first_name,
                last_name: hairdressersTable.last_name,
            },
        })
        .from(bookingsTable)
        .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
        .leftJoin(hairdressersTable, eq(bookingsTable.hairdresserId, hairdressersTable.id))
        .where(eq(bookingsTable.userId, userId));

    return visits;
}

export async function cancelVisit(visitId: number, reason?: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [visit] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, visitId))
    .limit(1);

  if (!visit) {
    throw new Error("Visit not found");
  }

  if (visit.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (visit.status === 'cancelled') {
    throw new Error("Visit is already cancelled");
  }

  const [updatedVisit] = await db
    .update(bookingsTable)
    .set({
      status: 'cancelled',
      cancellationReason: reason || null,
      updated_at: new Date(),
    })
    .where(eq(bookingsTable.id, visitId))
    .returning();

  try {
    await removeBookingFromCalendar(visitId);
  } catch (error) {
    console.error("Failed to remove visit from Google Calendar:", error);
  }

  revalidateTag('visits');
  
  return updatedVisit;
}

export async function rescheduleVisit(
  visitId: number, 
  newAppointmentDate: Date,
  newServiceId: number,
  newHairdresserId: number,
  rescheduleReason?: string
) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [visit] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, visitId))
    .limit(1);

  if (!visit) {
    throw new Error("Visit not found");
  }

  const role = await getUserRole(userId);
  
  if (role !== 'admin' && visit.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (visit.status === 'cancelled') {
    throw new Error("Cannot reschedule cancelled visit");
  }

  if (new Date(newAppointmentDate) < new Date()) {
    throw new Error("Cannot reschedule to a past date");
  }

  const [hairdresserService] = await db
    .select()
    .from(hairdressersServices)
    .where(
      and(
        eq(hairdressersServices.hairdresserId, newHairdresserId),
        eq(hairdressersServices.serviceId, newServiceId)
      )
    )
    .limit(1);

  if (!hairdresserService) {
    throw new Error("Selected hairdresser does not provide this service");
  }

  const [updatedVisit] = await db
    .update(bookingsTable)
    .set({
      appointmentDate: newAppointmentDate,
      serviceId: newServiceId,
      hairdresserId: newHairdresserId,
      rescheduleReason: rescheduleReason || null,
      updated_at: new Date(),
    })
    .where(eq(bookingsTable.id, visitId))
    .returning();

  try {
    await updateBookingInCalendar(visitId);
  } catch (error) {
    console.error("Failed to update visit in Google Calendar:", error);
  }

  revalidateTag('visits');
  
  return updatedVisit;
}
