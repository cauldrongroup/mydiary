'use client';

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <Button 
      onClick={handleSignOut} 
      variant="outline"
    >
      Sign Out
    </Button>
  );
} 