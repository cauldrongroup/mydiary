import { NextResponse } from 'next/server';
import { db, canEditEntry } from '@/db';
import { diaryEntries, streaks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

/**
 * Updates the user's diary streak based on a new diary entry date.
 *
 * This function retrieves the current streak record for the user and determines
 * whether to create, increment, or reset the streak based on the provided entry date.
 * It computes yesterday's date from the entry date and compares it with the user's
 * last recorded entry:
 * - Creates a new streak record if none exists.
 * - Increments the streak (and updates the longest streak if needed) if the last entry was yesterday.
 * - Resets the streak to 1 if the last entry was before yesterday.
 * No update is made when the entry date is the same as the current recorded entry.
 *
 * @param userId - The unique identifier of the user.
 * @param entryDate - The ISO string representing the diary entry date.
 */
async function updateStreak(userId: string, entryDate: string) {
  // Get the current streak info
  const userStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  const today = new Date(entryDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (!userStreak) {
    // First time user, create streak record
    await db.insert(streaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastEntryDate: entryDate,
    });
    return;
  }

  // If the last entry was yesterday, increment the streak
  if (userStreak.lastEntryDate === yesterdayStr) {
    const newCurrentStreak = userStreak.currentStreak + 1;
    const newLongestStreak = Math.max(newCurrentStreak, userStreak.longestStreak);
    
    await db.update(streaks)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastEntryDate: entryDate,
      })
      .where(eq(streaks.userId, userId));
  } 
  // If the last entry was before yesterday, reset streak to 1
  else if (userStreak.lastEntryDate < yesterdayStr) {
    await db.update(streaks)
      .set({
        currentStreak: 1,
        lastEntryDate: entryDate,
      })
      .where(eq(streaks.userId, userId));
  }
  // If entry is for today, don't update the streak
}

/**
 * Handles HTTP POST requests to create a new diary entry.
 *
 * This handler authenticates the user's session using request headers. It then parses the request's JSON body for the diary entry data, including the title, content, and entryDate. If the user is not authenticated, it returns a 401 response. If an entry for the given date already exists for the user, it returns a 409 response. On successfully creating the new diary entry, it updates the user's streak and returns the created entry as a JSON response. In case of an unexpected error, it logs the error and returns a 500 response.
 *
 * @param req - The HTTP request containing headers for authentication and a JSON payload with the new diary entry data.
 * @returns A JSON response containing the created diary entry or an error message.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title, content, entryDate } = await req.json();
    
    // Check if an entry already exists for this date and user
    const existingEntry = await db.query.diaryEntries.findFirst({
      where: and(
        eq(diaryEntries.userId, session.user.id),
        eq(diaryEntries.entryDate, entryDate)
      ),
    });

    if (existingEntry) {
      return new NextResponse(
        JSON.stringify({ message: "An entry already exists for this date" }), 
        { status: 409 }
      );
    }

    const entry = await db.insert(diaryEntries).values({
      title,
      content,
      userId: session.user.id,
      entryDate,
    }).returning();

    // Update streak after successfully creating the entry
    await updateStreak(session.user.id, entryDate);

    return NextResponse.json(entry[0]);
  } catch (error) {
    console.error('Failed to create diary entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to create diary entry' }), 
      { status: 500 }
    );
  }
}

/**
 * Updates an existing diary entry.
 *
 * Verifies the authenticated user's session and checks whether the diary entry for the specified date is eligible for editing.
 * If editing is permitted, the function updates the entry with the new title and content, sets the current timestamp, and returns the updated entry in JSON format.
 *
 * @remarks
 * Returns a 401 status if the user is not authenticated, a 403 status if the diary entry can no longer be edited, and a 500 status in case of an internal error.
 *
 * @param req - HTTP request containing a JSON body with the updated diary entry details (title, content, and entryDate).
 * @returns A JSON response containing the updated diary entry or an error response with an appropriate HTTP status code.
 */
export async function PUT(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { title, content, entryDate } = await req.json();
    
    // Check if the entry can be edited
    const canEdit = await canEditEntry(session.user.id, entryDate);
    if (!canEdit) {
      return new NextResponse('Entry can no longer be edited', { status: 403 });
    }

    const updatedEntry = await db.update(diaryEntries)
      .set({
        title,
        content,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diaryEntries.userId, session.user.id),
          eq(diaryEntries.entryDate, entryDate)
        )
      )
      .returning()
      .get();

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Failed to update diary entry:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Retrieves the authenticated user's diary entries.
 *
 * This function verifies the request's user session and queries the database for diary entries belonging
 * to the user. If a 'date' query parameter is provided, only entries corresponding to that date are returned.
 * It responds with a JSON payload of the entries, a 401 Unauthorized response if the user is not authenticated,
 * or a 500 Internal Server Error response if an error occurs during retrieval.
 *
 * @returns A NextResponse containing the diary entries JSON or an error response.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    const conditions = [eq(diaryEntries.userId, session.user.id)];
    if (date) {
      conditions.push(eq(diaryEntries.entryDate, date));
    }

    const entries = await db.select()
      .from(diaryEntries)
      .where(and(...conditions))
      .orderBy(diaryEntries.entryDate)
      .all();

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Failed to fetch diary entries:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 