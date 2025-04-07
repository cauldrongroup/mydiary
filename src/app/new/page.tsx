import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DiaryEntry } from '@/components/DiaryEntry';

export default async function NewEntryPage() {
  const cookieHeader = cookies().toString();
  const headers = new Headers();
  headers.append('cookie', cookieHeader);

  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">New Entry</h1>
      <DiaryEntry />
    </div>
  );
} 