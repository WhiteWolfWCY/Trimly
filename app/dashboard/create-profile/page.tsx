import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";

export default async function CreateProfile() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Utwórz swoje konto</h1>
        <ProfileForm />
      </div>
    </div>
  );
} 