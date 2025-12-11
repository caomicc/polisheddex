/**
 * Shared cookie utilities for faithful preference
 * Used by useFaithfulPreferenceSafe hook and GlobalSearch component
 */

export const COOKIE_NAME = 'faithful-preference';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Read the faithful preference from document.cookie
 * Returns false (polished mode) as default if not set or on server
 */
export function getCookiePreference(): boolean {
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

/**
 * Set the faithful preference cookie
 */
export function setCookiePreference(faithful: boolean): void {
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
