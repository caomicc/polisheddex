'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCookiePreference, setCookiePreference } from '@/lib/faithful-cookie';

export interface FaithfulPreferenceSafeHook {
  showFaithful: boolean;
  toggleFaithful: () => void;
  setFaithful: (faithful: boolean) => void;
  isLoading: boolean;
}

/**
 * Safe version of faithful preference hook that handles SSR gracefully
 * Uses only cookie-based storage for static export compatibility
 */
export function useFaithfulPreferenceSafe(): FaithfulPreferenceSafeHook {
  const [showFaithful, setShowFaithful] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from cookie on mount
  useEffect(() => {
    const cookiePreference = getCookiePreference();
    setShowFaithful(cookiePreference);
    setIsLoading(false);
  }, []);

  const setFaithful = useCallback((faithful: boolean) => {
    setShowFaithful(faithful);
    setCookiePreference(faithful);
  }, []);

  const toggleFaithful = useCallback(() => {
    setShowFaithful((prev) => {
      const newValue = !prev;
      setCookiePreference(newValue);
      // Refresh the page to activate the cookie for SSG pages
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return newValue;
    });
  }, []);

  return {
    showFaithful,
    toggleFaithful,
    setFaithful,
    isLoading,
  };
}
