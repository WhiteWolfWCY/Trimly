import { getAvailableTimeSlots } from "@/actions/visits/bookings";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const serviceId = searchParams.get('serviceId');
  const hairdresserId = searchParams.get('hairdresserId');
  
  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  try {
    const slots = await getAvailableTimeSlots(
      date, 
      serviceId ? parseInt(serviceId, 10) : undefined,
      hairdresserId ? parseInt(hairdresserId, 10) : undefined
    );
    
    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' }, 
      { status: 500 }
    );
  }
} 