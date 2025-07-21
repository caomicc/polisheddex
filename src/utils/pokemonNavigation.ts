import { getPokemonFileName, urlKeyToStandardKey } from './pokemonUrlNormalizer';
import { loadJsonFile } from './fileLoader';

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
  try {
    console.log('Loading dex orders...');

    const [nationalData, johtoData] = await Promise.all([
      loadJsonFile<string[]>('/output/national_dex_order.json'),
      loadJsonFile<string[]>('/output/johto_dex_order.json')
    ]);

    const result = {
      national: nationalData || [],
      johto: johtoData || []
    };

    console.log('Dex orders loaded:', {
      nationalCount: result.national.length,
      johtoCount: result.johto.length
    });

    return result;
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

  console.log('getDexOrderToUse called with:', {
    pokemonData,
    nationalOrder,
    johtoOrder
  });

  // If we don't have any order data, return empty arrays but still indicate the preferred type
  if (nationalOrder.length === 0 && johtoOrder.length === 0) {
    console.warn('No dex order data available');
    const preferJohto = pokemonData.johtoDex && pokemonData.johtoDex > 0;
    return {
      order: [],
      type: preferJohto ? 'johto' : 'national'
    };
  }

  // Prefer Johto dex if the Pokemon has a Johto dex number and we have johto data
  if (pokemonData.johtoDex && pokemonData.johtoDex > 0 && johtoOrder.length > 0) {
    return { order: johtoOrder, type: 'johto' };
  }

  // Otherwise use national dex if available
  if (nationalOrder.length > 0) {
    return { order: nationalOrder, type: 'national' };
  }

  // Fallback to johto if national is empty but johto has data
  return { order: johtoOrder, type: 'johto' };
}
