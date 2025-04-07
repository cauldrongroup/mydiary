import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { diaryEntries, streaks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import Link from 'next/link';

/**
 * Removes Markdown formatting from text and truncates it to a specified maximum length.
 *
 * The function strips common Markdown syntax such as headers, bold, italics, links, and list markers, then trims the result. If the cleaned text exceeds the provided maximum length, it is truncated to the last whole word within the limit and an ellipsis is appended.
 *
 * @param content - Markdown-formatted text to be processed.
 * @param maxLength - Maximum allowed length of the processed text (default is 150 characters).
 *
 * @returns The cleaned plain text, possibly truncated with an ellipsis.
 */
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

/**
 * Retrieves all diary entries for the specified user.
 *
 * This function asynchronously queries the database for diary entries associated with the provided user identifier
 * and orders the entries by their entry date.
 *
 * @param userId - The identifier of the user whose diary entries are retrieved.
 * @returns A promise that resolves to an array of diary entries ordered by entry date.
 */
async function getEntries(userId: string) {
  const entries = await db.select()
    .from(diaryEntries)
    .where(eq(diaryEntries.userId, userId))
    .orderBy(diaryEntries.entryDate)
    .all();

  return entries;
}

/**
 * Retrieves the current diary entry streak for a specified user.
 *
 * Queries the database's streaks table for the first record where the user's identifier matches the provided value.
 * Returns the associated current streak if found, or 0 if no streak record exists.
 *
 * @param userId - The unique identifier of the user.
 * @returns The current streak count for the user, or 0 if no streak is recorded.
 */
async function getStreak(userId: string) {
  const userStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  return userStreak?.currentStreak || 0;
}

/**
 * Renders the diary homepage.
 *
 * Checks for an authenticated user session using cookies. If no session is found, displays a sign-in prompt.
 * When authenticated, fetches the user's diary entries and current day streak, then renders a personalized welcome message,
 * the streak count, and a list of up to five recent diary entries with truncated content and formatted dates.
 *
 * @returns A JSX element representing the diary homepage.
 */
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
          href="/api/auth/signin"
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
