import { reduce } from '@/lib/extract-utils.ts';
// import { KNOWN_FORMS } from '../data/constants.ts';

/**
 * Special cases for Pokemon names that have hyphens as part of their actual name
 * These should NOT be converted to underscores or other URL-safe characters
 */
export const HYPHENATED_POKEMON_NAMES = [
  'Nidoran-F',
  'Nidoran-M',
  'Mr-Mime',
  'Mime-Jr',
  'Ho-Oh',
  'porygon-z',
  'Farfetch-d',
  'Sirfetch-d',
  'mr-rime',
  'Mr-Rime',
  'Jangmo-o',
  'Hakamo-o',
  'Kommo-o',
  'Tapu Koko',
  'Tapu Lele',
  'Tapu Bulu',
  'Tapu Fini',
  'farfetch-d',
  'nidoran-f',
  'nidoran-m',
  'mr-mime',
  'mime-jr',
  'ho-oh',
  'porygon-z',
  'porygon_z',
  'sirfetch-d',
  'type-null',
  'jangmo-o',
  'hakamo-o',
  'kommo-o',
];

/**
 * Normalizes a Pokemon name to a URL-safe format while preserving essential hyphens
 * and handling form variants properly.
 *
 * Rules:
 * 1. Pokemon with hyphens that are part of their name (like Nidoran-F) keep the hyphen
 * 2. Form suffixes that don't match KNOWN_FORMS are considered part of the name
 * 3. Spaces are converted to hyphens for URL safety
 * 4. All other special characters are removed or converted
 * 5. Result is lowercased for consistent file/URL naming
 *
 * @param name - The Pokemon name to normalize
 * @returns URL-safe Pokemon name suitable for use as keys and file names
 */
export function normalizePokemonUrlKey(name: string): string {
  if (!name) return '';

  // Trim whitespace
  name = name.trim();

  // Handle special cases for names without hyphens that should have them
  switch (name.toLowerCase()) {
    case 'nidoranf':
      return 'nidoran-f';
    case 'nidoranm':
      return 'nidoran-m';
    case 'mrmime':
    case 'mr.mime':
      return 'mr-mime';
    case 'mrrime':
    case 'mr.rime':
      return 'mr-rime';
    case 'mimejr':
    case 'mime.jr':
      return 'mime-jr';
    case 'farfetchd':
    case 'farfetch_d':
    case 'farfetch':
      return 'farfetch-d';
    case 'hooh':
      return 'ho-oh';
    case 'sirfetchd':
    case 'sirfetch_d':
    case 'sirfetch':
      return 'sirfetch-d';
    case 'porygonz':
    case 'porygon_z':
      return 'porygon-z';
    case 'porygon':
      return 'porygon';
    case 'porygon2':
      return 'porygon2';
    case 'taurospaldean':
      return 'tauros-paldean';
    case 'taurospaldean_fire':
    case 'taurospaldean fire':
      return 'tauros-paldean-fire';
    case 'taurospaldean_water':
    case 'taurospaldean water':
      return 'tauros-paldean-water';
  }

  // Removed console.log to reduce edge function calls

  // Check if this is a known hyphenated Pokemon name
  const isHyphenatedPokemon = HYPHENATED_POKEMON_NAMES.some(
    (hyphenated) => name.toLowerCase() === hyphenated.toLowerCase(),
  );

  if (isHyphenatedPokemon) {
    // For known hyphenated names, just convert to lowercase and preserve hyphens
    return name.toLowerCase();
  }

  // Handle form variants - check if the name contains a known form suffix
  let baseName = name;
  let formSuffix = '';

  // for (const form of Object.values(KNOWN_FORMS)) {
  //   const formPattern = new RegExp(`\\b${form}\\b$`, 'i');
  //   if (formPattern.test(name)) {
  //     baseName = name.replace(formPattern, '').trim();
  //     formSuffix = form.toLowerCase();
  //     break;
  //   }
  // }

  // Normalize the base name for URL safety
  let normalizedBase = baseName
    .toLowerCase()
    .trim()
    // Convert spaces to hyphens
    .replace(/\s+/g, '-')
    // Remove any characters that aren't letters, numbers, or hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // If there's a form suffix, append it with a hyphen
  if (formSuffix) {
    normalizedBase += `-${formSuffix}`;
  }

  return normalizedBase;
}

/**
 * Converts a URL-safe Pokemon key back to a standardized key for lookup in JSON files
 *
 * @param urlKey - The URL-safe key (from route params)
 * @returns Standardized key for JSON file lookup
 */
export function urlKeyToStandardKey(urlKey: string): string {
  if (!urlKey) return '';

  // Decode URL encoding
  const decoded = decodeURIComponent(urlKey);

  // Handle special hyphenated cases
  if (decoded.toLowerCase() === 'nidoran-f') return 'Nidoran-F';
  if (decoded.toLowerCase() === 'nidoran-m') return 'Nidoran-M';
  if (decoded.toLowerCase() === 'mr-mime') return 'Mr-Mime';
  if (decoded.toLowerCase() === 'mime-jr') return 'Mime-Jr';
  if (decoded.toLowerCase() === 'ho-oh') return 'Ho-Oh';
  if (decoded.toLowerCase() === 'porygon-z') return 'porygon-z';
  if (decoded.toLowerCase() === 'farfetch-d') return 'Farfetch-d';
  if (decoded.toLowerCase() === 'sirfetch-d') return 'Sirfetch-d';

  // For other Pokemon, convert to title case
  return decoded
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
