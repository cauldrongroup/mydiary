import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DiaryEntry } from '@/components/DiaryEntry';

/**
 * Renders the new diary entry page for authenticated users.
 *
 * This asynchronous component retrieves the current user session by extracting cookies from
 * the request headers and querying the authentication API. If no authenticated user is found,
 * it redirects to the sign-in page. Otherwise, it displays a container with a page title and
 * the diary entry component.
 */
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