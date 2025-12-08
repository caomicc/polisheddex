'use client';

import { useCallback, useEffect, useState } from 'react';

export interface FaithfulPreferenceSafeHook {
  showFaithful: boolean;
  toggleFaithful: () => void;
  setFaithful: (faithful: boolean) => void;
  isLoading: boolean;
}

// Cookie utilities
const COOKIE_NAME = 'faithful-preference';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCookiePreference(): boolean {
  if (typeof document === 'undefined') return false;

  try {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split('=')[1];
    return cookieValue === 'true';
  } catch {
    return false;
  }
}

function setCookiePreference(faithful: boolean): void {
  if (typeof document === 'undefined') return;

  try {
    const value = faithful ? 'true' : 'false';
    document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=strict${
      process.env.NODE_ENV === 'production' ? '; secure' : ''
    }`;
  } catch (error) {
    console.warn('Failed to set faithful preference cookie:', error);
  }
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
