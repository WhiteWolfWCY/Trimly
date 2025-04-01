import { getHairdressersWithServices } from "@/actions/visits/bookings";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const hairdressers = await getHairdressersWithServices();
    return NextResponse.json(hairdressers);
  } catch (error) {
    console.error('Error fetching hairdressers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hairdressers' }, 
      { status: 500 }
    );
  }
} 