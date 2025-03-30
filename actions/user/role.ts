"use server";

import { db } from "@/db/drizzle";
import { userProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getUserRole = async (userId: string) => {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.userId, userId));

  return user[0].role;
};
