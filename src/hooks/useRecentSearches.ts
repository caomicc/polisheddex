'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SearchEntityType } from '@/lib/search-data';

const STORAGE_KEY = 'polisheddex-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export interface RecentSearch {
  id: string;
  name: string;
  href: string;
  type: SearchEntityType;
}

export interface UseRecentSearchesReturn {
  recentSearches: RecentSearch[];
  addRecent: (search: RecentSearch) => void;
  clearRecents: () => void;
  isLoading: boolean;
}

/**
 * Hook to manage recent searches in localStorage
 */
export function useRecentSearches(): UseRecentSearchesReturn {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
    setIsLoading(false);
  }, []);

  const addRecent = useCallback((search: RecentSearch) => {
    setRecentSearches((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((s) => s.id !== search.id || s.type !== search.type);

      // Add to front and limit to max
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save recent searches:', error);
      }

      return updated;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    recentSearches,
    addRecent,
    clearRecents,
    isLoading,
  };
}
