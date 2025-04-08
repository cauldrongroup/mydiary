import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { diaryEntries, streaks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import Link from 'next/link';

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
    .orderBy(diaryEntries.entryDate)
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-8">Welcome to MyDiary</h1>
        <p className="text-lg mb-8">Please sign in to start writing your diary.</p>
        <Link
          href="/auth"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Sign In
        </Link>
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
                    {format(new Date(entry.entryDate), 'MMM d, yyyy')}
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
