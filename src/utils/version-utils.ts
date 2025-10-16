/**
 * Utility functions for handling version preferences (faithful vs polished)
 */

/**
 * Get version string from search params with cookie fallback
 * @param searchParams - Next.js searchParams object or URLSearchParams
 * @param cookieHeader - Optional cookie header for server-side fallback
 * @returns 'faithful' or 'polished'
 */
export function getVersionFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[]> | undefined,
  cookieHeader?: string
): 'faithful' | 'polished' {
  // First check URL parameters
  if (searchParams) {
    let urlVersion: string | null = null;
    
    if (searchParams instanceof URLSearchParams) {
      urlVersion = searchParams.get('version');
    } else {
      // Handle Next.js searchParams object
      const version = searchParams.version;
      urlVersion = Array.isArray(version) ? version[0] : version;
    }
    
    // If URL has version parameter, use that
    if (urlVersion !== null && urlVersion !== undefined) {
      return urlVersion === 'faithful' ? 'faithful' : 'polished';
    }
  }
  
  // Fallback to cookie if no URL parameter
  if (cookieHeader) {
    try {
      const cookieValue = cookieHeader
        .split('; ')
        .find((row) => row.startsWith('faithful-preference='))
        ?.split('=')[1];
      return cookieValue === 'true' ? 'faithful' : 'polished';
    } catch {
      return 'polished'; // default
    }
  }

  return 'polished'; // default
}

/**
 * Get the opposite version
 * @param version - current version
 * @returns opposite version
 */
export function getOppositeVersion(version: 'faithful' | 'polished'): 'faithful' | 'polished' {
  return version === 'faithful' ? 'polished' : 'faithful';
}

/**
 * Get display name for version
 * @param version - version string
 * @returns capitalized display name
 */
export function getVersionDisplayName(version: 'faithful' | 'polished'): string {
  return version === 'faithful' ? 'Faithful' : 'Polished';
}