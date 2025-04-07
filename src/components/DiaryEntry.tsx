"use client";

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, usePathname } from 'next/navigation';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownEditor } from './MarkdownEditor';

interface DiaryEntryProps {
  initialTitle?: string;
  initialContent?: string;
  isEditing?: boolean;
  entryDate?: string;
}

/**
 * Renders a diary entry form that lets users create or update a diary entry.
 *
 * This component displays an input for the title and a Markdown editor for the content.
 * It manages local state for these fields and handles the save operation by determining
 * whether to create a new entry or update an existing one based on the current route.
 * Upon saving, it checks for a valid user session, submits the entry via an API call,
 * displays error feedback if needed, and navigates appropriately.
 *
 * @param initialTitle - The initial title for the diary entry.
 * @param initialContent - The initial content for the diary entry.
 * @param isEditing - Indicates if the entry is in edit mode, affecting post-save navigation.
 * @param entryDate - Optional diary entry date; defaults to the current date if not provided.
 * @returns A JSX element representing the diary entry form.
 */
export function DiaryEntry({ initialTitle = '', initialContent = '', isEditing = false, entryDate }: DiaryEntryProps) {
  const { data: sessionData } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!sessionData?.user?.id) return;
    
    setIsSaving(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // If we're on the /new page, create a new entry
      // If we're on /entry/[date], update the existing entry
      const isNewEntry = pathname === '/new';
      const endpoint = isNewEntry ? '/api/diary' : `/api/diary/${entryDate || today}`;
      const method = isNewEntry ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          entryDate: entryDate || today,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save entry');
      }

      router.refresh();
      if (!isEditing) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to save diary entry:', error);
      setError(error instanceof Error ? error.message : 'Failed to save diary entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto p-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-2xl font-bold"
      />
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Write about your day..."
      />
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving || !title || !content}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
        </Button>
      </div>
    </div>
  );
} 