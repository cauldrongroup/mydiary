"use client";

import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Flame } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
}

/**
 * Displays a user's streak information using badge components.
 *
 * This component fetches streak data asynchronously from the `/api/streak` endpoint and updates its display accordingly.
 * It refetches data when the route changes and refreshes automatically every minute. If streak data is not available,
 * the component renders nothing.
 */
export function StreakDisplay() {
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const pathname = usePathname();

  const fetchStreak = async () => {
    try {
      const response = await fetch('/api/streak');
      if (response.ok) {
        const data = await response.json();
        setStreak(data);
      }
    } catch (error) {
      console.error('Failed to fetch streak:', error);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, [pathname]); // Refetch when route changes

  // Refresh streak every minute
  useEffect(() => {
    const interval = setInterval(fetchStreak, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!streak) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="flex items-center gap-1">
        <Flame className="w-4 h-4 text-orange-500" />
        <span>{streak.currentStreak} day{streak.currentStreak !== 1 ? 's' : ''}</span>
      </Badge>
      {streak.longestStreak > streak.currentStreak && (
        <Badge variant="outline" className="flex items-center gap-1">
          Best: {streak.longestStreak} days
        </Badge>
      )}
    </div>
  );
} 