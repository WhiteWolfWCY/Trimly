import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { userProfileTable } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { userId: authUserId } = await auth();
    
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, firstName, lastName, email, phoneNumber } = await request.json();

    if (authUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.insert(userProfileTable).values({
      userId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phoneNumber || null
    }).returning();

    return NextResponse.json({ success: true, profile: result[0] });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 