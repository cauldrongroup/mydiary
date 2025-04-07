import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DiaryEntry } from '@/components/DiaryEntry';
import { db } from '@/db';
import { diaryEntries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

interface EntryPageProps {
  params: Promise<{
    date: string;
  }>;
}

/**
 * Renders a diary entry page for a specified date.
 *
 * This asynchronous server component authenticates the user using request cookies, fetches the diary entry
 * corresponding to the provided date, and determines if the entry can be edited (only when the entry date matches
 * the current date). If the user is not authenticated, it redirects to the sign-in page; if no diary entry exists,
 * it redirects to the home page.
 *
 * @param params - A promise that resolves to an object containing the `date` string for the diary entry.
 * @returns A JSX element representing the diary entry page.
 */
export default async function EntryPage({ params }: EntryPageProps) {
  const cookieHeader = cookies().toString();
  const headers = new Headers();
  headers.append('cookie', cookieHeader);

  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const { date } = await params;
  const entry = await db.select()
    .from(diaryEntries)
    .where(
      and(
        eq(diaryEntries.userId, session.user.id),
        eq(diaryEntries.entryDate, date)
      )
    )
    .get();

  if (!entry) {
    redirect('/');
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const isEditable = entry.entryDate === today;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Entry for {format(new Date(entry.entryDate), 'MMMM d, yyyy')}
      </h1>
      <DiaryEntry
        initialTitle={entry.title}
        initialContent={entry.content}
        isEditing={isEditable}
        entryDate={entry.entryDate}
      />
    </div>
  );
} 