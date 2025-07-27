import { getFaithfulPreference } from '@/lib/faithful-preference';
import { FaithfulPreferenceProvider } from '@/contexts/FaithfulPreferenceContext';
import { ReactNode } from 'react';

interface ServerFaithfulPreferenceProviderProps {
  children: ReactNode;
}

/**
 * Server-side faithful preference provider that reads the initial value from cookies
 * This makes the route dynamic but ensures the correct initial state.
 * Use this only in pages that specifically need server-side cookie reading.
 * For most cases, use the client-side FaithfulPreferenceProvider directly.
 */
export default async function ServerFaithfulPreferenceProvider({
  children,
}: ServerFaithfulPreferenceProviderProps) {
  const initialFaithfulPreference = await getFaithfulPreference();

  return (
    <FaithfulPreferenceProvider initialValue={initialFaithfulPreference}>
      {children}
    </FaithfulPreferenceProvider>
  );
}
