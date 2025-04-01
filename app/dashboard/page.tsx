import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { userProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    <div className="flex flex-col h-screen px-8">
      Siema
    </div>
  );
}
