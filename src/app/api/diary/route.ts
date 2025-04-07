import { NextResponse } from 'next/server';
import { db, canEditEntry } from '@/db';
import { diaryEntries, streaks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

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