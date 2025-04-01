"use server";

import { db } from '@/db/drizzle';
import { servicesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Service, NewService } from '@/types/service';

export async function getServices(): Promise<Service[]> {
  return db.select().from(servicesTable).orderBy(servicesTable.name);
}

export async function getServiceById(id: number): Promise<Service | undefined> {
  const result = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, id))
    .limit(1);
  
  return result[0];
}

export async function createService(data: NewService): Promise<Service> {
  const result = await db
    .insert(servicesTable)
    .values({
      name: data.name,
      price: data.price.toString(),
      time_required: data.time_required.toString(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning();
  
  return result[0];
}

export async function updateService(id: number, data: Partial<NewService>): Promise<Service | undefined> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  
  if (data.price !== undefined) {
    updateData.price = data.price.toString();
  }
  
  if (data.time_required !== undefined) {
    updateData.time_required = data.time_required.toString();
  }
  
  const result = await db
    .update(servicesTable)
    .set(updateData)
    .where(eq(servicesTable.id, id))
    .returning();
  
  return result[0];
}

export async function deleteService(id: number): Promise<boolean> {
  try {
    const result = await db
      .delete(servicesTable)
      .where(eq(servicesTable.id, id))
      .returning({ id: servicesTable.id });
    
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting service:', error);
    return false;
  }
} 