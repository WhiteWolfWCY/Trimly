'use server';

import { db } from "@/db/drizzle";
import { bookingsTable, servicesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";

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
            created_at: bookingsTable.created_at,
            updated_at: bookingsTable.updated_at,
            service: {
                id: servicesTable.id,
                name: servicesTable.name,
                price: servicesTable.price,
                time_required: servicesTable.time_required,
            },
        })
        .from(bookingsTable)
        .leftJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
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

  revalidateTag('visits');
  
  return updatedVisit;
}
