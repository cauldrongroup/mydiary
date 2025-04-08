import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DiaryEntry } from '@/components/DiaryEntry';
import { db } from '@/db';
import { diaryEntries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { format, parseISO } from 'date-fns';

interface EntryPageProps {
  params: Promise<{
    date: string;
  }>;
}

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
        Entry for {format(parseISO(entry.entryDate), 'MMMM d, yyyy')}
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