import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/actions/user/role';
import { saveGoogleCalendarCredentials } from '@/actions/admin/google-calendar';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const role = await getUserRole(userId);
    
    if (role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return new NextResponse('Authorization code missing', { status: 400 });
    }

    await saveGoogleCalendarCredentials(code);
    
    return NextResponse.redirect(new URL('/dashboard/admin', request.url));
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    );
  }
} 