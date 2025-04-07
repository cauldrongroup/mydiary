import { NextRequest, NextResponse } from 'next/server';
import { db, canEditEntry } from '@/db';
import { diaryEntries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
): Promise<NextResponse> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { title, content } = await request.json();
    const { date: entryDate } = await params;
    
    // Check if the entry exists
    const existingEntry = await db.query.diaryEntries.findFirst({
      where: and(
        eq(diaryEntries.userId, session.user.id),
        eq(diaryEntries.entryDate, entryDate)
      ),
    });

    if (!existingEntry) {
      return new NextResponse(
        JSON.stringify({ message: "Entry not found" }), 
        { status: 404 }
      );
    }

    // Check if the entry can be edited
    const canEdit = await canEditEntry(session.user.id, entryDate);
    if (!canEdit) {
      return new NextResponse(
        JSON.stringify({ message: "Entry can no longer be edited" }), 
        { status: 403 }
      );
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
      .returning();

    return NextResponse.json(updatedEntry[0]);
  } catch (error) {
    console.error('Failed to update diary entry:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to update diary entry' }), 
      { status: 500 }
    );
  }
} 