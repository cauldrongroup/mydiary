import { NextResponse } from 'next/server';
import { db } from '@/db';
import { streaks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

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