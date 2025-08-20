import { normalizePokemonUrlKey } from './pokemonUrlNormalizer';

/**
 * Creates a properly normalized Pokemon URL path
 * This ensures all Pokemon links use lowercase normalized names
 *
 * @param pokemonName - The Pokemon name in any case/format
 * @returns Lowercase normalized URL path for the Pokemon page
 */
export function createPokemonUrl(pokemonName: string): string {
  if (!pokemonName) return '/pokemon';

  const normalizedName = normalizePokemonUrlKey(pokemonName);
  return `/pokemon/${normalizedName}`;
}

/**
 * Creates a properly normalized Pokemon link for Next.js Link component
 * This ensures all Pokemon links use lowercase normalized names
 *
 * @param pokemonName - The Pokemon name in any case/format
 * @returns Object with href for Next.js Link component
 */
export function createPokemonLinkProps(pokemonName: string) {
  return {
    href: createPokemonUrl(pokemonName),
  };
}

/**
 * Validates if a Pokemon URL is properly normalized
 *
 * @param url - The Pokemon URL to check
 * @returns True if the URL is properly normalized (lowercase)
 */
export function isPokemonUrlNormalized(url: string): boolean {
  if (!url.startsWith('/pokemon/')) return true;

  const pokemonName = url.split('/pokemon/')[1];
  if (!pokemonName) return true;

  const decodedName = decodeURIComponent(pokemonName);
  const normalizedName = normalizePokemonUrlKey(decodedName);

  return normalizedName === decodedName;
}

/**
 * Gets the normalized Pokemon name from a URL
 *
 * @param url - The Pokemon URL
 * @returns Normalized Pokemon name or null if invalid URL
 */
export function getPokemonNameFromUrl(url: string): string | null {
  if (!url.startsWith('/pokemon/')) return null;

  const pokemonName = url.split('/pokemon/')[1];
  if (!pokemonName) return null;

  return decodeURIComponent(pokemonName);
}
