import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { diaryEntries, streaks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, BookOpen, Sparkles, Trophy } from 'lucide-react';

function truncateContent(content: string, maxLength: number = 150): string {
  // Remove Markdown syntax
  const cleanContent = content
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
    .replace(/^[-*+]\s/gm, '') // Remove list markers
    .trim();

  if (cleanContent.length <= maxLength) return cleanContent;
  
  // Find the last complete word within the limit
  const truncated = cleanContent.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.slice(0, lastSpace) + '...'
    : truncated + '...';
}

async function getEntries(userId: string) {
  const entries = await db.select()
    .from(diaryEntries)
    .where(eq(diaryEntries.userId, userId))
    .orderBy(desc(diaryEntries.entryDate))
    .all();

  return entries;
}

async function getStreak(userId: string) {
  const userStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  return userStreak?.currentStreak || 0;
}

export default async function Home() {
  const cookieHeader = cookies().toString();
  const headers = new Headers();
  headers.append('cookie', cookieHeader);

  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Your Personal Digital Diary
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Capture your thoughts, track your journey, and build a daily writing habit.
            </p>
            <Link href="/auth">
              <Button size="lg" className="font-semibold">
                Start Writing Today
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Daily Journaling
                </CardTitle>
                <CardDescription>
                  Build a consistent writing habit with our daily entry system
                </CardDescription>
              </CardHeader>
              <CardContent>
                Record one meaningful entry each day to maintain your streak and track your progress.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Streak Tracking
                </CardTitle>
                <CardDescription>
                  Stay motivated with achievement tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                Watch your writing streak grow and celebrate your consistency milestones.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Personal Growth
                </CardTitle>
                <CardDescription>
                  Track your journey of self-discovery
                </CardDescription>
              </CardHeader>
              <CardContent>
                Look back on your experiences and see how you've grown over time through your daily reflections.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Rich Text Support
                </CardTitle>
                <CardDescription>
                  Express yourself fully
                </CardDescription>
              </CardHeader>
              <CardContent>
                Write with Markdown formatting to structure your thoughts exactly how you want.
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of others who are documenting their lives, one day at a time.
            </p>
            <Link href="/auth">
              <Button variant="outline" size="lg" className="font-semibold">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const entries = await getEntries(session.user.id);
  const streak = await getStreak(session.user.id);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
        <div className="text-center">
          <div className="text-4xl font-bold">{streak}</div>
          <div className="text-sm text-muted-foreground">Day Streak</div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Recent Entries</h2>
        {entries.length === 0 ? (
          <p className="text-muted-foreground">No entries yet. Start writing today!</p>
        ) : (
          <div className="grid gap-4">
            {entries.slice(0, 5).map((entry) => (
              <Link
                key={entry.id}
                href={`/entry/${entry.entryDate}`}
                className="block bg-card p-4 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <h3 className="font-semibold mb-2">{entry.title}</h3>
                    <p className="text-muted-foreground">
                      {truncateContent(entry.content)}
                    </p>
                  </div>
                  <time className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(parseISO(entry.entryDate), 'MMM d, yyyy')}
                  </time>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
