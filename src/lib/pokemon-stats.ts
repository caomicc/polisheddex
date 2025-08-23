import type { StatData } from '@/components/pokemon/stat-hexagon';

export interface PokemonStatsData {
  name: string;
  baseStats: StatData;
  faithfulBaseStats?: StatData;
  polishedBaseStats?: StatData;
  [key: string]: unknown;
}

// Cache for loaded Pokemon data
const pokemonStatsCache = new Map<string, PokemonStatsData>();

// Function to convert API stats format to StatData format
function convertApiStatsToStatData(apiStats: any): StatData {
  return {
    hp: apiStats.hp || 0,
    attack: apiStats.attack || 0,
    defense: apiStats.defense || 0,
    spatk: apiStats.specialAttack || 0,
    spdef: apiStats.specialDefense || 0,
    speed: apiStats.speed || 0,
  };
}

// Function to get Pokemon stats data
export async function getPokemonStatsData(pokemonName: string): Promise<PokemonStatsData | null> {
  if (!pokemonName) return null;

  const cacheKey = pokemonName.toLowerCase().replace(/\s+/g, '-');
  
  // Check cache first
  if (pokemonStatsCache.has(cacheKey)) {
    return pokemonStatsCache.get(cacheKey)!;
  }

  try {
    // Fetch individual Pokemon data - try multiple filename formats
    let fileName = pokemonName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let response = await fetch(`/output/pokemon/${fileName}.json`);
    
    // If first attempt fails, try with hyphens instead of underscores
    if (!response.ok) {
      fileName = pokemonName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      response = await fetch(`/output/pokemon/${fileName}.json`);
    }
    
    // If still fails, try the exact name as provided
    if (!response.ok) {
      fileName = pokemonName.toLowerCase();
      response = await fetch(`/output/pokemon/${fileName}.json`);
    }
    
    if (!response.ok) {
      console.warn(`Could not fetch stats for ${pokemonName} (tried multiple filename formats)`);
      return null;
    }

    const pokemonData = await response.json();
    
    // Get stats from detailedStats object
    const detailedStats = pokemonData.detailedStats;
    if (!detailedStats) {
      console.warn('No detailedStats found for', pokemonName);
      return null;
    }
    
    // Convert to our format - stats are nested inside detailedStats
    const statsData: PokemonStatsData = {
      name: pokemonData.name || pokemonName,
      baseStats: convertApiStatsToStatData(detailedStats.baseStats || detailedStats.polishedBaseStats),
      faithfulBaseStats: detailedStats.faithfulBaseStats 
        ? convertApiStatsToStatData(detailedStats.faithfulBaseStats)
        : undefined,
      polishedBaseStats: detailedStats.polishedBaseStats
        ? convertApiStatsToStatData(detailedStats.polishedBaseStats)
        : undefined,
    };

    // Cache the result
    pokemonStatsCache.set(cacheKey, statsData);
    
    return statsData;
  } catch (error) {
    console.error(`Error fetching Pokemon stats for ${pokemonName}:`, error);
    return null;
  }
}

// Function to clear the cache (useful for testing)
export function clearStatsCache() {
  pokemonStatsCache.clear();
}