'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
 * Uses cookie fallback and only reads URL after hydration
 */
export function useFaithfulPreferenceSafe(): FaithfulPreferenceSafeHook {
  const [showFaithful, setShowFaithful] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  
  // Always call useSearchParams, but handle errors in effects
  const searchParams = useSearchParams();

  // Initialize from cookie first, then check URL after hydration
  useEffect(() => {
    if (!isHydrated) {
      // First, read from cookie
      const cookiePreference = getCookiePreference();
      setShowFaithful(cookiePreference);
      setIsHydrated(true);
    }
  }, [isHydrated]);

  // After hydration, check URL and potentially update
  useEffect(() => {
    if (isHydrated) {
      try {
        const urlVersion = searchParams.get('version');
        const hasUrlVersion = urlVersion !== null;
        const urlShowsFaithful = urlVersion === 'faithful';
        
        if (hasUrlVersion) {
          // URL parameter overrides cookie
          setShowFaithful(urlShowsFaithful);
        } else {
          // No URL parameter, apply cookie preference to URL if needed
          const cookiePreference = getCookiePreference();
          if (cookiePreference && !urlShowsFaithful) {
            const params = new URLSearchParams(searchParams);
            params.set('version', 'faithful');
            router.replace(`${pathname}?${params.toString()}`);
          }
        }
        setIsLoading(false);
      } catch (error) {
        // If there's an error with search params, just use cookie preference
        console.warn('Error reading search params:', error);
        setIsLoading(false);
      }
    }
  }, [isHydrated, searchParams, router, pathname]);

  const updateUrl = useCallback((faithful: boolean) => {
    try {
      const params = new URLSearchParams(searchParams);
      
      if (faithful) {
        params.set('version', 'faithful');
      } else {
        params.delete('version');
      }
      
      // Update cookie to remember user preference
      setCookiePreference(faithful);
      
      // Navigate to the same page with updated params
      router.push(`${pathname}?${params.toString()}`);
    } catch (error) {
      // If URL update fails, at least save to cookie
      console.warn('Error updating URL:', error);
      setCookiePreference(faithful);
    }
  }, [searchParams, router, pathname]);

  const setFaithful = useCallback((faithful: boolean) => {
    setShowFaithful(faithful);
    updateUrl(faithful);
  }, [updateUrl]);

  const toggleFaithful = useCallback(() => {
    const newValue = !showFaithful;
    setShowFaithful(newValue);
    updateUrl(newValue);
  }, [showFaithful, updateUrl]);

  return {
    showFaithful,
    toggleFaithful,
    setFaithful,
    isLoading: isLoading || !isHydrated,
  };
}