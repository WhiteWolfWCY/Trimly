"use client";

import { UserButton } from "@clerk/nextjs";
import { Scissors, Settings } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SettingsDialog from "@/components/SettingsDialog";

const HeaderComponent = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  return (
    <div className="flex flex-row items-center justify-between w-full py-4 px-8">
      <div className="flex flex-row items-center gap-1">
        <Scissors className="w-6 h-6 text-primary -rotate-20" />
        <h1 className="text-2xl font-bold">Trimly</h1>
      </div>
      <div className="flex flex-row items-center gap-2">
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
