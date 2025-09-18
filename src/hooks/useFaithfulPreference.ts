'use client';

import { useState, useEffect, useCallback } from 'react';

// Constants
const COOKIE_NAME = 'faithful-preference';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

export interface FaithfulPreferenceHook {
  showFaithful: boolean;
  toggleFaithful: () => void;
  setFaithful: (faithful: boolean) => void;
  isLoading: boolean;
}

/**
 * Read faithful preference from document cookies
 */
function getClientSideFaithfulPreference(): boolean {
  if (typeof document === 'undefined') {
    return false; // Default to false (polished mode) on server
  }

  try {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split('=')[1];
    return cookieValue === 'true';
  } catch (error) {
    console.warn('Failed to read faithful preference from client-side cookies:', error);
    return false; // Default to false (polished mode)
  }
}

/**
 * Set faithful preference cookie on the client side
 */
function setClientSideFaithfulPreference(faithful: boolean): void {
  if (typeof document === 'undefined') {
    return; // Can't set cookies on server
  }

  try {
    const value = faithful ? 'true' : 'false';
    document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=strict${
      process.env.NODE_ENV === 'production' ? '; secure' : ''
    }`;
  } catch (error) {
    console.warn('Failed to set faithful preference cookie client-side:', error);
  }
}

/**
 * Hook to manage faithful preference using cookies directly
 * This is a replacement for the Context-based useFaithfulPreference
 * 
 * @param initialValue - Optional initial value to use before hydration
 * @returns FaithfulPreferenceHook object with state and setters
 */
export function useFaithfulPreference(initialValue?: boolean): FaithfulPreferenceHook {
  const [showFaithful, setShowFaithful] = useState<boolean>(initialValue ?? false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from cookies after hydration
  useEffect(() => {
    // Only read from cookies if no initial value was provided
    if (initialValue === undefined) {
      const cookieValue = getClientSideFaithfulPreference();
      setShowFaithful(cookieValue);
    }
    setIsLoading(false);
  }, [initialValue]);

  // Set faithful preference and update cookie
  const setFaithful = useCallback((faithful: boolean) => {
    setShowFaithful(faithful);
    
    // Don't set cookie during SSR or while still loading
    if (!isLoading && typeof window !== 'undefined') {
      setClientSideFaithfulPreference(faithful);
    }
  }, [isLoading]);

  // Toggle faithful preference
  const toggleFaithful = useCallback(() => {
    setShowFaithful(prev => {
      const newValue = !prev;
      // Don't set cookie during SSR or while still loading
      if (!isLoading && typeof window !== 'undefined') {
        setClientSideFaithfulPreference(newValue);
      }
      return newValue;
    });
  }, [isLoading]);

  return {
    showFaithful,
    toggleFaithful,
    setFaithful,
    isLoading,
  };
}

/**
 * Server-side function to read faithful preference from cookies
 * Use this in server components or API routes
 */
export function getServerSideFaithfulPreference(cookieHeader?: string): boolean {
  if (!cookieHeader) {
    return false; // Default to false (polished mode)
  }

  try {
    const cookieValue = cookieHeader
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split('=')[1];
    return cookieValue === 'true';
  } catch (error) {
    console.warn('Failed to read faithful preference from server-side cookies:', error);
    return false; // Default to false (polished mode)
  }
}