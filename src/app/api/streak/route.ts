import { NextResponse } from 'next/server';
import { db } from '@/db';
import { streaks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

/**
 * Handles HTTP GET requests to retrieve user streak information.
 *
 * The function retrieves the user's session from the request headers. If the session is missing or
 * invalid, it returns a 401 Unauthorized response. With a valid session, it queries the database for
 * the user's streak record. If no record is found, it returns a JSON response with default values;
 * otherwise, it returns the retrieved streak data as JSON. In case of an error during processing, the
 * error is logged and a 500 Internal Server Error response is returned.
 *
 * @returns A NextResponse containing streak data, default values for missing streak records, or an error message.
 */
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userStreak = await db.query.streaks.findFirst({
      where: eq(streaks.userId, session.user.id),
    });

    if (!userStreak) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
      });
    }

    return NextResponse.json(userStreak);
  } catch (error) {
    console.error('Failed to get streak info:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to get streak information' }), 
      { status: 500 }
    );
  }
} 