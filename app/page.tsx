import { UserButton } from "@clerk/nextjs";
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
    redirect("/create-profile");
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-row items-center justify-between w-full py-4 px-8">
        <h1 className="text-2xl font-bold">Trimly</h1>
        <UserButton />
      </div>
    </div>
  );
}
