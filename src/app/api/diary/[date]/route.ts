import { NextRequest, NextResponse } from 'next/server';
import { db, canEditEntry } from '@/db';
import { diaryEntries } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

/**
 * Handles HTTP PUT requests to update a user's diary entry.
 *
 * This function verifies the user's session for authentication and extracts the new title and content from the request's JSON body.
 * It retrieves the diary entry date from the route parameters and checks if an entry exists for the authenticated user. If the entry is absent,
 * a 404 response is returned; if the entry cannot be edited, a 403 response is issued. On successful validation, the entry is updated with the
 * new details and the current timestamp, and the updated entry is returned as a JSON response.
 *
 * @param request - The incoming HTTP request.
 * @param params - An object with a promise resolving to route parameters, including the diary entry date.
 *
 * @returns A NextResponse containing the updated diary entry if the update succeeds, or an error response with an appropriate status code
 *          (401 if unauthorized, 404 if not found, 403 if editing is forbidden, or 500 for internal errors).
 */
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