/**
 * Utility functions for text processing and normalization
 */

/**
 * Normalizes text by removing accents and converting to lowercase
 * This allows accent-insensitive search (e.g., "é" matches "e")
 *
 * @param text - The text to normalize
 * @returns Normalized text without accents and in lowercase
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase();
}

/**
 * Performs accent-insensitive substring search
 *
 * @param text - The text to search in
 * @param searchTerm - The search term
 * @returns True if the search term is found (accent-insensitive)
 */
export function accentInsensitiveIncludes(text: string, searchTerm: string): boolean {
  return normalizeText(text).includes(normalizeText(searchTerm));
}
