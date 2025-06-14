"use server";

import { hairdressersTable, hairdresserAvailabilityTable, hairdressersServices } from '@/db/schema';
import { db } from '@/db/drizzle';
import { eq } from 'drizzle-orm';
import {
  Hairdresser,
  NewHairdresser,
  HairdresserWithRelations,
  HairdresserUpdateRelations
} from '@/types/hairdresser';

export async function getHairdressers(): Promise<Hairdresser[]> {
  return db.select().from(hairdressersTable).orderBy(hairdressersTable.first_name);
}

export async function getHairdresserById(id: number): Promise<Hairdresser | undefined> {
  const result = await db
    .select()
    .from(hairdressersTable)
    .where(eq(hairdressersTable.id, id))
    .limit(1);
  
  return result[0];
}

export async function createHairdresserWithRelations(data: HairdresserWithRelations): Promise<Hairdresser> {
  try {
    const [hairdresser] = await db
      .insert(hairdressersTable)
      .values({
        first_name: data.hairdresser.first_name,
        last_name: data.hairdresser.last_name,
        phone_number: data.hairdresser.phone_number || null,
        city: data.hairdresser.city || null,
        postal_code: data.hairdresser.postal_code || null,
        street: data.hairdresser.street || null,
        house_number: data.hairdresser.house_number || null,
        apartment_number: data.hairdresser.apartment_number || null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    if (data.availability.length > 0) {
      await db
        .insert(hairdresserAvailabilityTable)
        .values(
          data.availability.map(avail => ({
            hairdresserId: hairdresser.id,
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            created_at: new Date(),
            updated_at: new Date(),
          }))
        );
    }

    if (data.services.length > 0) {
      await db
        .insert(hairdressersServices)
        .values(
          data.services.map(serviceId => ({
            hairdresserId: hairdresser.id,
            serviceId,
            created_at: new Date(),
            updated_at: new Date(),
          }))
        );
    }

    return hairdresser;
  } catch (error) {
    console.error("Error in createHairdresserWithRelations:", error);
    throw error;
  }
}

export async function updateHairdresserWithRelations(id: number, data: HairdresserUpdateRelations): Promise<Hairdresser | undefined> {
  try {
    if (data.hairdresser) {
      const updateData = {
        ...(data.hairdresser.first_name !== undefined && { first_name: data.hairdresser.first_name }),
        ...(data.hairdresser.last_name !== undefined && { last_name: data.hairdresser.last_name }),
        ...(data.hairdresser.phone_number !== undefined && { phone_number: data.hairdresser.phone_number }),
        ...(data.hairdresser.city !== undefined && { city: data.hairdresser.city }),
        ...(data.hairdresser.postal_code !== undefined && { postal_code: data.hairdresser.postal_code }),
        ...(data.hairdresser.street !== undefined && { street: data.hairdresser.street }),
        ...(data.hairdresser.house_number !== undefined && { house_number: data.hairdresser.house_number }),
        ...(data.hairdresser.apartment_number !== undefined && { apartment_number: data.hairdresser.apartment_number }),
        updated_at: new Date()
      };

      if (Object.keys(updateData).length > 1) {
        await db
          .update(hairdressersTable)
          .set(updateData)
          .where(eq(hairdressersTable.id, id));
      }
    }

    if (data.availability) {
      await db
        .delete(hairdresserAvailabilityTable)
        .where(eq(hairdresserAvailabilityTable.hairdresserId, id));

      if (data.availability.length > 0) {
        await db
          .insert(hairdresserAvailabilityTable)
          .values(
            data.availability.map(avail => ({
              hairdresserId: id,
              dayOfWeek: avail.dayOfWeek,
              startTime: avail.startTime,
              endTime: avail.endTime,
              created_at: new Date(),
              updated_at: new Date(),
            }))
          );
      }
    }

    if (data.services) {
      await db
        .delete(hairdressersServices)
        .where(eq(hairdressersServices.hairdresserId, id));

      if (data.services.length > 0) {
        await db
          .insert(hairdressersServices)
          .values(
            data.services.map(serviceId => ({
              hairdresserId: id,
              serviceId,
              created_at: new Date(),
              updated_at: new Date(),
            }))
          );
      }
    }

    const [hairdresser] = await db
      .select()
      .from(hairdressersTable)
      .where(eq(hairdressersTable.id, id))
      .limit(1);

    return hairdresser;
  } catch (error) {
    console.error("Error in updateHairdresserWithRelations:", error);
    throw error;
  }
}

export async function deleteHairdresser(id: number): Promise<boolean> {
  try {
    await db
      .delete(hairdresserAvailabilityTable)
      .where(eq(hairdresserAvailabilityTable.hairdresserId, id));
    
    await db
      .delete(hairdressersServices)
      .where(eq(hairdressersServices.hairdresserId, id));
    
    const result = await db
      .delete(hairdressersTable)
      .where(eq(hairdressersTable.id, id))
      .returning({ id: hairdressersTable.id });
    
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting hairdresser:', error);
    return false;
  }
} 