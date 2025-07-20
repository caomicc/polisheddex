import { getPokemonFileName, urlKeyToStandardKey } from './pokemonUrlNormalizer';

export interface NavigationData {
  previous: { name: string; url: string } | null;
  next: { name: string; url: string } | null;
  current: { name: string; index: number; total: number };
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
  dexOrder: string[]
): NavigationData {
  // Normalize the current Pokemon name to match the dex order format
  const normalizedCurrentName = urlKeyToStandardKey(currentPokemonName);

  // Find the current Pokemon's index in the dex order
  const currentIndex = dexOrder.findIndex(name =>
    urlKeyToStandardKey(name) === normalizedCurrentName
  );

  if (currentIndex === -1) {
    // Pokemon not found in this dex order, return empty navigation
    return {
      previous: null,
      next: null,
      current: {
        name: currentPokemonName,
        index: -1,
        total: dexOrder.length
      }
    };
  }

  const previous = currentIndex > 0 ? {
    name: dexOrder[currentIndex - 1],
    url: `/pokemon/${pokemonNameToUrlSafe(dexOrder[currentIndex - 1])}`
  } : null;

  const next = currentIndex < dexOrder.length - 1 ? {
    name: dexOrder[currentIndex + 1],
    url: `/pokemon/${pokemonNameToUrlSafe(dexOrder[currentIndex + 1])}`
  } : null;

  return {
    previous,
    next,
    current: {
      name: currentPokemonName,
      index: currentIndex + 1, // 1-based indexing for display
      total: dexOrder.length
    }
  };
}

/**
 * Load dex order data from JSON files
 */
export async function loadDexOrders(): Promise<{
  national: string[];
  johto: string[];
}> {
  const fs = await import('fs');
  const path = await import('path');

  try {
    const nationalPath = path.join(process.cwd(), 'output/national_dex_order.json');
    const johtoPath = path.join(process.cwd(), 'output/johto_dex_order.json');

    const [nationalData, johtoData] = await Promise.all([
      fs.promises.readFile(nationalPath, 'utf8').then(data => JSON.parse(data) as string[]),
      fs.promises.readFile(johtoPath, 'utf8').then(data => JSON.parse(data) as string[])
    ]);

    return {
      national: nationalData,
      johto: johtoData
    };
  } catch (error) {
    console.error('Error loading dex orders:', error);
    return {
      national: [],
      johto: []
    };
  }
}

/**
 * Determine which dex order to use based on Pokemon data
 */
export function getDexOrderToUse(
  pokemonData: { nationalDex?: number | null; johtoDex?: number | null },
  nationalOrder: string[],
  johtoOrder: string[]
): { order: string[]; type: 'national' | 'johto' } {
  // Prefer Johto dex if the Pokemon has a Johto dex number
  if (pokemonData.johtoDex && pokemonData.johtoDex > 0) {
    return { order: johtoOrder, type: 'johto' };
  }

  // Otherwise use national dex
  return { order: nationalOrder, type: 'national' };
}
