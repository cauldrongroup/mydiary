'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StreakDisplay } from "@/components/StreakDisplay";
import { SignOutButton } from "@/components/SignOutButton";
import { useSession } from "@/lib/auth-client";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold">
              MyDiary
            </Link>
            {session?.user && <StreakDisplay />}
          </div>
          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <Link
                  href="/new"
                  className="text-sm hover:text-primary transition-colors"
                >
                  <Button variant="outline">New Entry</Button>
                </Link>
                <SignOutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm hover:text-primary transition-colors"
              >
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 