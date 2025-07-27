'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getClientSideFaithfulPreference,
  setClientSideFaithfulPreference,
} from '@/lib/client-faithful-preference';

interface FaithfulPreferenceContextValue {
  showFaithful: boolean;
  toggleFaithful: () => void;
  setFaithful: (faithful: boolean) => void;
}

const FaithfulPreferenceContext = createContext<FaithfulPreferenceContextValue | undefined>(
  undefined,
);

export const useFaithfulPreference = () => {
  const context = useContext(FaithfulPreferenceContext);
  if (context === undefined) {
    throw new Error('useFaithfulPreference must be used within a FaithfulPreferenceProvider');
  }
  return context;
};

interface FaithfulPreferenceProviderProps {
  children: React.ReactNode;
  initialValue?: boolean;
}

export const FaithfulPreferenceProvider: React.FC<FaithfulPreferenceProviderProps> = ({
  children,
  initialValue,
}) => {
  const [showFaithful, setShowFaithful] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize after first render to prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true);

    // If no initial value provided, try to read from client-side cookie
    if (initialValue !== undefined) {
      setShowFaithful(initialValue);
    } else {
      // Read from client-side cookie
      const cookieValue = getClientSideFaithfulPreference();
      setShowFaithful(cookieValue);
      // If cookie is missing, set it to false (polished) by default
      if (typeof document !== 'undefined') {
        const hasCookie = document.cookie
          .split('; ')
          .some((row) => row.startsWith('faithful-preference='));
        if (!hasCookie) {
          setCookieValue(false);
        }
      }
    }
  }, [initialValue]);

  const setCookieValue = async (faithful: boolean) => {
    try {
      // Primary method: Use fetch to call our API route that sets the cookie
      await fetch('/api/faithful-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faithful }),
      });
    } catch (error) {
      console.warn(
        'Failed to save faithful preference to cookie via API, using client-side fallback:',
        error,
      );
      // Fallback: Set cookie directly on client side
      setClientSideFaithfulPreference(faithful);
    }
  };

  const setFaithful = (faithful: boolean) => {
    setShowFaithful(faithful);
    if (isHydrated) {
      setCookieValue(faithful);
    }
  };

  const toggleFaithful = () => {
    const newValue = !showFaithful;
    setFaithful(newValue);
  };

  const value: FaithfulPreferenceContextValue = {
    showFaithful,
    toggleFaithful,
    setFaithful,
  };

  return (
    <FaithfulPreferenceContext.Provider value={value}>
      {children}
    </FaithfulPreferenceContext.Provider>
  );
};
