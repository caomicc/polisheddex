'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  initialValue = false,
}) => {
  const [showFaithful, setShowFaithful] = useState(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize after first render to prevent hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
    setShowFaithful(initialValue);
  }, [initialValue]);

  const setCookieValue = async (faithful: boolean) => {
    try {
      // Use fetch to call our API route that sets the cookie
      await fetch('/api/faithful-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faithful }),
      });
    } catch (error) {
      console.warn('Failed to save faithful preference to cookie:', error);
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
