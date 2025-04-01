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
    // 1. Create the hairdresser
    const [hairdresser] = await db
      .insert(hairdressersTable)
      .values({
        first_name: data.hairdresser.first_name,
        last_name: data.hairdresser.last_name,
        phone_number: data.hairdresser.phone_number || null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // 2. Create availability entries
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

    // 3. Create service associations
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
    // Since we don't have transactions, we might want to attempt cleanup here
    // However, this would need additional error handling
    throw error; // Re-throw to let the caller handle it
  }
}

export async function updateHairdresserWithRelations(id: number, data: HairdresserUpdateRelations): Promise<Hairdresser | undefined> {
  try {
    // 1. Update hairdresser data if provided
    if (data.hairdresser) {
      const updateData = {
        ...(data.hairdresser.first_name !== undefined && { first_name: data.hairdresser.first_name }),
        ...(data.hairdresser.last_name !== undefined && { last_name: data.hairdresser.last_name }),
        ...(data.hairdresser.phone_number !== undefined && { phone_number: data.hairdresser.phone_number }),
        updated_at: new Date()
      };

      // Only update if there are fields to update
      if (Object.keys(updateData).length > 1) { // > 1 because updated_at is always there
        await db
          .update(hairdressersTable)
          .set(updateData)
          .where(eq(hairdressersTable.id, id));
      }
    }

    // 2. Update availability if provided
    if (data.availability) {
      // Delete current availability 
      await db
        .delete(hairdresserAvailabilityTable)
        .where(eq(hairdresserAvailabilityTable.hairdresserId, id));

      // Create new availability entries
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

    // 3. Update services if provided
    if (data.services) {
      // Delete current services
      await db
        .delete(hairdressersServices)
        .where(eq(hairdressersServices.hairdresserId, id));

      // Create new service associations
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

    // Fetch the updated hairdresser
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
    // Delete related data first (due to foreign key constraints)
    await db
      .delete(hairdresserAvailabilityTable)
      .where(eq(hairdresserAvailabilityTable.hairdresserId, id));
    
    await db
      .delete(hairdressersServices)
      .where(eq(hairdressersServices.hairdresserId, id));
    
    // Now delete the hairdresser
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