/**
 * Client-side utility for reading the faithful preference from cookies
 * This is used as a fallback when server-side cookie reading is not available
 */
export function getClientSideFaithfulPreference(): boolean {
  if (typeof document === 'undefined') {
    return false; // Default to false (polished mode) on server
  }

  try {
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('faithful-preference='))
      ?.split('=')[1];
    return cookieValue === 'true';
  } catch (error) {
    console.warn('Failed to read faithful preference from client-side cookies:', error);
    return false; // Default to false (polished mode)
  }
}

/**
 * Set the faithful preference cookie on the client side
 * This is used as a backup method when the API is not available
 */
export function setClientSideFaithfulPreference(faithful: boolean): void {
  if (typeof document === 'undefined') {
    return; // Can't set cookies on server
  }

  try {
    const maxAge = 60 * 60 * 24 * 365; // 1 year in seconds
    const value = faithful ? 'true' : 'false';
    document.cookie = `faithful-preference=${value}; max-age=${maxAge}; path=/; samesite=strict${
      process.env.NODE_ENV === 'production' ? '; secure' : ''
    }`;
  } catch (error) {
    console.warn('Failed to set faithful preference cookie client-side:', error);
  }
}
