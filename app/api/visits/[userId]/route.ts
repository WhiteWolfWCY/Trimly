import { getUserVisits } from "@/actions/visits/visits";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

interface Params {
    params: { userId: string };
}
  
export async function GET(request: NextRequest, { params }: Params) {
    const { userId } = await auth();
    const headersList = headers();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId: id } = params;
    const visits = await getUserVisits(id);   

    const response = NextResponse.json(visits, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        }
    });

    response.headers.set('Cache-Control', 'no-store');
    
    return response;
}
