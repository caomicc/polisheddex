/**
 * Search data loader for global search
 * Lazy-loads and caches manifest data for client-side searching
 */

export type SearchEntityType = 'pokemon' | 'move' | 'item' | 'location' | 'ability';

export interface SearchItem {
  id: string;
  polishedName: string;
  faithfulName: string;
  type: SearchEntityType;
  href: string;
}

// Module-level cache to avoid re-fetching
let cachedSearchData: SearchItem[] | null = null;
let loadPromise: Promise<SearchItem[]> | null = null;

/**
 * Load all manifest data and return a flat array of searchable items
 * Uses dynamic imports for lazy loading and caches the result
 */
export async function loadSearchData(): Promise<SearchItem[]> {
  // Return cached data if available
  if (cachedSearchData) {
    return cachedSearchData;
  }

  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Start loading
  loadPromise = (async () => {
    const searchItems: SearchItem[] = [];

    try {
      // Load all manifests in parallel
      const [pokemonData, movesData, itemsData, locationsData, abilitiesData] = await Promise.all([
        fetch('/new/pokemon_manifest.json').then((res) => res.json()),
        fetch('/new/moves_manifest.json').then((res) => res.json()),
        fetch('/new/items_manifest.json').then((res) => res.json()),
        fetch('/new/locations_manifest.json').then((res) => res.json()),
        fetch('/new/abilities_manifest.json').then((res) => res.json()),
      ]);

      // Process Pokemon
      for (const pokemon of pokemonData) {
        searchItems.push({
          id: pokemon.id,
          polishedName: pokemon.name,
          faithfulName: pokemon.name, // Pokemon names are the same in both versions
          type: 'pokemon',
          href: `/pokemon/${pokemon.id}`,
        });
      }

      // Process Moves
      for (const move of movesData) {
        const polishedName = move.versions?.polished?.name || move.id;
        const faithfulName = move.versions?.faithful?.name || polishedName;
        searchItems.push({
          id: move.id,
          polishedName,
          faithfulName,
          type: 'move',
          href: `/moves/${move.id}`,
        });
      }

      // Process Items
      for (const item of itemsData) {
        const polishedName = item.versions?.polished?.name || item.id;
        const faithfulName = item.versions?.faithful?.name || polishedName;
        searchItems.push({
          id: item.id,
          polishedName,
          faithfulName,
          type: 'item',
          href: `/items/${item.id}`,
        });
      }

      // Process Locations
      for (const location of locationsData) {
        searchItems.push({
          id: location.id,
          polishedName: location.name,
          faithfulName: location.name, // Location names are the same in both versions
          type: 'location',
          href: `/locations/${location.id}`,
        });
      }

      // Process Abilities
      for (const ability of abilitiesData) {
        searchItems.push({
          id: ability.id,
          polishedName: ability.name,
          faithfulName: ability.name, // Ability names are the same in both versions
          type: 'ability',
          href: `/abilities/${ability.id}`,
        });
      }

      // Sort alphabetically by polished name
      searchItems.sort((a, b) => a.polishedName.localeCompare(b.polishedName));

      cachedSearchData = searchItems;
      return searchItems;
    } catch (error) {
      console.error('Failed to load search data:', error);
      loadPromise = null; // Reset promise so we can retry
      return [];
    }
  })();

  return loadPromise;
}

/**
 * Filter search items by query string
 * Uses simple case-insensitive includes matching
 */
export function filterSearchItems(
  items: SearchItem[],
  query: string,
  showFaithful: boolean
): SearchItem[] {
  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();

  return items.filter((item) => {
    const name = showFaithful ? item.faithfulName : item.polishedName;
    return name.toLowerCase().includes(lowerQuery);
  });
}

/**
 * Group search results by entity type with a limit per group
 */
export function groupSearchResults(
  items: SearchItem[],
  limitPerGroup: number = 5
): Record<SearchEntityType, SearchItem[]> {
  const groups: Record<SearchEntityType, SearchItem[]> = {
    ability: [],
    item: [],
    location: [],
    move: [],
    pokemon: [],
  };

  for (const item of items) {
    if (groups[item.type].length < limitPerGroup) {
      groups[item.type].push(item);
    }
  }

  return groups;
}

/**
 * Get display label for entity type
 */
export function getEntityTypeLabel(type: SearchEntityType): string {
  const labels: Record<SearchEntityType, string> = {
    ability: 'Abilities',
    item: 'Items',
    location: 'Locations',
    move: 'Moves',
    pokemon: 'Pokémon',
  };
  return labels[type];
}
