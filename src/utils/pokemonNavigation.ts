// import fs from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';
import { urlKeyToStandardKey } from './pokemonUrlNormalizer';
import { parseDexOrder } from '@/lib/extract-utils';

export interface NavigationData {
  previous: { name: string; url: string } | null;
  next: { name: string; url: string } | null;
  current: { name: string; index: number };
}

/**
 * Convert a Pokemon name to URL-safe format for navigation
 */
function pokemonNameToUrlSafe(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get navigation data for a Pokemon in a given dex order
 */
export function getPokemonNavigation(
  currentPokemonName: string,
  currentPokemonNumber?: number,
): NavigationData {
  // Normalize the current Pokemon name to match the dex order format
  const normalizedCurrentName = urlKeyToStandardKey(currentPokemonName);

  // Find the current Pokemon's index in the dex order
  const currentIndex = currentPokemonNumber ? currentPokemonNumber - 1 : -1;

  if (currentIndex === -1) {
    // Pokemon not found in this dex order, return empty navigation
    return {
      previous: null,
      next: null,
      current: {
        name: currentPokemonName,
        index: -1,
      },
    };
  }

  const previous =
    currentIndex > 0
      ? {
          name: 'dexOrder[currentIndex - 1]',
          url: `/pokemon/${currentIndex - 1}`,
        }
      : null;

  const next = {
    name: 'dexOrder[currentIndex + 1]',
    url: `/pokemon/${currentIndex + 1}`,
  };

  return {
    previous,
    next,
    current: {
      name: currentPokemonName,
      index: currentIndex,
    },
  };
}
