import { cookies } from 'next/headers';

/**
 * Get the faithful preference from cookies on the server side
 * @returns boolean indicating if faithful mode is enabled
 */
export async function getFaithfulPreference(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const faithfulPreference = cookieStore.get('faithful-preference');
    return faithfulPreference?.value === 'true';
  } catch (error) {
    console.warn('Failed to read faithful preference from cookies:', error);
    return false; // Default to false (polished mode)
  }
}
