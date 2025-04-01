"use server";

import { db } from '@/db/drizzle';
import { hairdressersServices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { HairdresserService, NewHairdresserService } from '@/types/hairdresser';

export async function getHairdresserServices(hairdresserId: number): Promise<HairdresserService[]> {
  return db
    .select()
    .from(hairdressersServices)
    .where(eq(hairdressersServices.hairdresserId, hairdresserId));
}

export async function createHairdresserService(data: NewHairdresserService): Promise<HairdresserService> {
  const result = await db
    .insert(hairdressersServices)
    .values({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning();
  
  return result[0];
}

export async function deleteHairdresserServices(hairdresserId: number): Promise<boolean> {
  const result = await db
    .delete(hairdressersServices)
    .where(eq(hairdressersServices.hairdresserId, hairdresserId))
    .returning({ id: hairdressersServices.id });
  
  return result.length > 0;
} 