import { getUserVisits } from "@/actions/visits/visits";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface Params {
    params: { userId: string };
}
  
export async function GET(request: NextRequest, { params }: Params) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId: id } = await params;

    console.log("id", id);

    const visits = await getUserVisits(id);   

    console.log("visits", visits);

    return NextResponse.json(visits);
    
}
