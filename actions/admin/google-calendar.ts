'use server';

import { db } from "@/db/drizzle";
import { googleCalendarCredentialsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from '@/actions/user/role';
import { 
  getAuthUrl, 
  getToken, 
  setCredentials, 
  CalendarCredentials 
} from '@/lib/google-calendar';
import { revalidateTag } from "next/cache";

export async function getGoogleCalendarAuthUrl() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const role = await getUserRole(userId);
  
  if (role !== 'admin') {
    throw new Error("Unauthorized");
  }
  
  return getAuthUrl();
}

export async function saveGoogleCalendarCredentials(code: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const role = await getUserRole(userId);
  
  if (role !== 'admin') {
    throw new Error("Unauthorized");
  }

  try {
    const tokens = await getToken(code);
    
    const existingCredentials = await db
      .select()
      .from(googleCalendarCredentialsTable)
      .limit(1);
    
    if (existingCredentials.length > 0) {
      await db
        .update(googleCalendarCredentialsTable)
        .set({
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token || existingCredentials[0].refresh_token,
          scope: tokens.scope!,
          token_type: tokens.token_type!,
          expiry_date: new Date(tokens.expiry_date!),
          updated_at: new Date(),
        })
        .where(eq(googleCalendarCredentialsTable.id, existingCredentials[0].id));
    } else {
      await db
        .insert(googleCalendarCredentialsTable)
        .values({
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token!,
          scope: tokens.scope!,
          token_type: tokens.token_type!,
          expiry_date: new Date(tokens.expiry_date!),
          created_at: new Date(),
          updated_at: new Date(),
        });
    }

    revalidateTag('google-calendar');
    
    return { success: true };
  } catch (error) {
    console.error("Error saving Google Calendar credentials:", error);
    throw new Error("Failed to save Google Calendar credentials");
  }
}

export async function isGoogleCalendarConnected() {
  try {
    const credentials = await db
      .select()
      .from(googleCalendarCredentialsTable)
      .limit(1);
    
    return credentials.length > 0;
  } catch (error) {
    console.error("Error checking Google Calendar connection:", error);
    return false;
  }
}

export async function loadGoogleCalendarCredentials(): Promise<CalendarCredentials | null> {
  try {
    const credentials = await db
      .select()
      .from(googleCalendarCredentialsTable)
      .limit(1);
    
    if (credentials.length === 0) {
      return null;
    }
    
    const calendarCredentials: CalendarCredentials = {
      access_token: credentials[0].access_token,
      refresh_token: credentials[0].refresh_token,
      scope: credentials[0].scope,
      token_type: credentials[0].token_type,
      expiry_date: credentials[0].expiry_date.getTime(),
    };
    
    setCredentials(calendarCredentials);
    
    return calendarCredentials;
  } catch (error) {
    console.error("Error loading Google Calendar credentials:", error);
    return null;
  }
}

export async function disconnectGoogleCalendar() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const role = await getUserRole(userId);
  
  if (role !== 'admin') {
    throw new Error("Unauthorized");
  }

  try {
    await db.delete(googleCalendarCredentialsTable);
    revalidateTag('google-calendar');
    
    return { success: true };
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    throw new Error("Failed to disconnect Google Calendar");
  }
} 