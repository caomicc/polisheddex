import { BaseData } from '@/types/types';

let cachedBaseData: Record<string, BaseData> | null = null;

export async function loadPokemonBaseData(): Promise<Record<string, BaseData>> {
  // Return cached data if available
  if (cachedBaseData) {
    return cachedBaseData;
  }

  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the base data file directly
      const fs = await import('fs/promises');
      const path = await import('path');
      const baseDataPath = path.join(process.cwd(), 'output', 'pokemon_base_data.json');
      const data = await fs.readFile(baseDataPath, 'utf8');
      cachedBaseData = JSON.parse(data);
    } else {
      // Client-side: Use fetch
      const response = await fetch('/output/pokemon_base_data.json');
      if (!response.ok) {
        throw new Error('Failed to load base data');
      }
      cachedBaseData = await response.json();
    }

    return cachedBaseData || {};
  } catch (error) {
    console.error('Error loading base data:', error);
    return {};
  }
}

export function clearPokemonBaseDataCache() {
  cachedBaseData = null;
}
