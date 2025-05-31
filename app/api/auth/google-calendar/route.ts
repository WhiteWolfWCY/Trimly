import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/actions/user/role';
import { getGoogleCalendarAuthUrl } from '@/actions/admin/google-calendar';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const role = await getUserRole(userId);
    
    if (role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const authUrl = await getGoogleCalendarAuthUrl();
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error getting Google Calendar auth URL:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    );
  }
} 