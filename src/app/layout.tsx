import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/db";
import { diaryEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { StreakDisplay } from "@/components/StreakDisplay";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyDiary - Your Personal Journal",
  description: "A simple diary app to record your daily thoughts and memories.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();
  const headers = new Headers();
  headers.append('cookie', cookieHeader);

  const session = await auth.api.getSession({
    headers,
  });

  // Check if user has already written an entry for today
  let hasTodayEntry = false;
  if (session?.user?.id) {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = await db.query.diaryEntries.findFirst({
      where: and(
        eq(diaryEntries.userId, session.user.id),
        eq(diaryEntries.entryDate, today)
      ),
    });
    hasTodayEntry = !!todayEntry;
  }

  return (
    <html lang="en">
      <body className={inter.className}>
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
                    {!hasTodayEntry && (
                      <Link
                        href="/new"
                        className="text-sm hover:text-primary transition-colors"
                      >
                        <Button variant="outline">New Entry</Button>
                      </Link>
                    )}
                    <form action="/api/auth/signout" method="post">
                      <Button type="submit" variant="outline">
                        Sign Out
                      </Button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/api/auth/signin"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    <Button variant="outline">Sign In</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
