import { getUserVisits } from "@/actions/visits/visits";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

interface Params {
    params: Promise<{ id: string }>;
}
  
export async function GET(request: NextRequest, { params }: Params) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
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
