import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { userProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import NewVisit from "@/components/dashboard/NewVisit";
import UserVisits from "@/components/dashboard/UserVisits";
import { VisitsProvider } from '@/contexts/VisitsContext';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const userProfile = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.userId, user.id));

  if (userProfile.length === 0) {
    redirect("/dashboard/create-profile");
  }

  return (
    <div className="flex flex-col h-screen p-8 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <VisitsProvider>
        <div className="grid direction-reverse grid-cols-1 lg:grid-cols-5 gap-4">
          <NewVisit />
          <UserVisits />
        </div>
      </VisitsProvider>
    </div>
  );
}
