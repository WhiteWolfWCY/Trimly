"use client";

import { useState, useEffect } from "react";
import { SignUp } from "@clerk/nextjs";
import { LogIn } from "lucide-react";

import { motion } from "framer-motion";

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background opacity-70" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md z-10 flex items-center justify-center flex-col"
      >
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
        </div>

        <SignUp signInUrl="/sign-in" />
      </motion.div>
    </div>
  );
}
