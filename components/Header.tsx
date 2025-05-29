"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { Scissors, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { InteractiveBackButton } from "@/components/magicui/interactive-back-button";
import SettingsDialog from "@/components/SettingsDialog";
import { useRouter, usePathname } from "next/navigation";
import { getUserRole } from "@/actions/user/role";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const HeaderComponent = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { userId } = useAuth();
  
  const isAdminPage = pathname === "/dashboard/admin";
  
  useEffect(() => {
    const getUserRoleFunction = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const role = await getUserRole(userId);
        console.log("User role:", role);
        setUserRole(role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    getUserRoleFunction();
  }, [userId]);

  const isAdmin = userRole === "admin";

  return (
    <div className="flex flex-row items-center justify-between w-full py-4 px-8 mb-4">
      <div className="flex flex-row items-center gap-1 hover:cursor-pointer" onClick={() => router.push("/")}>
        <Scissors className="w-6 h-6 text-primary -rotate-20" />
        <h1 className="text-2xl font-bold">Trimly</h1>
      </div>
      
      {!isLoading && isAdmin && (
        isAdminPage ? (
          <InteractiveBackButton onClick={() => router.push("/dashboard/")}>
            Strona główna
          </InteractiveBackButton>
        ) : (
          <InteractiveHoverButton onClick={() => router.push("/dashboard/admin")}>
            Panel admina
          </InteractiveHoverButton>
        )
      )}
      
      <div className="flex flex-row items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4" />
        </Button>
        <UserButton />
      </div>
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default HeaderComponent;
