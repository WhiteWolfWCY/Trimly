'use server';

import { db } from "@/db/drizzle";
import { bookingsTable, userProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserVisits(userId: string) {
    const visits = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, userId));
    console.log("visits", visits);
    return visits;
}
