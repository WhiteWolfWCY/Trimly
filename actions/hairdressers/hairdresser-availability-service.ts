"use server";

import { db } from '@/db/drizzle';
import { hairdresserAvailabilityTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { 
  HairdresserAvailability, 
  NewHairdresserAvailability, 
  DayOfWeek 
} from '@/types/hairdresser';

export async function getHairdresserAvailability(hairdresserId: number): Promise<HairdresserAvailability[]> {
  return db
    .select()
    .from(hairdresserAvailabilityTable)
    .where(eq(hairdresserAvailabilityTable.hairdresserId, hairdresserId))
    .orderBy(hairdresserAvailabilityTable.dayOfWeek);
}

export async function createHairdresserAvailability(data: NewHairdresserAvailability): Promise<HairdresserAvailability> {
  const result = await db
    .insert(hairdresserAvailabilityTable)
    .values({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning();
  
  return result[0];
}

export async function deleteHairdresserAvailability(hairdresserId: number): Promise<boolean> {
  const result = await db
    .delete(hairdresserAvailabilityTable)
    .where(eq(hairdresserAvailabilityTable.hairdresserId, hairdresserId))
    .returning({ id: hairdresserAvailabilityTable.id });
  
  return result.length > 0;
} 