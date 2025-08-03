import fs from 'fs';
import path from 'path';
import { BaseData } from '@/types/types';
import { loadManifest } from '../manifest-resolver';

let cachedBaseData: Record<string, BaseData> | null = null;

export async function loadPokemonBaseData(): Promise<Record<string, BaseData>> {
  // Return cached data if available
  if (cachedBaseData) {
    return cachedBaseData;
  }

  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the base data manifest directly
      const baseDataManifest = await loadManifest<Record<string, BaseData>>('pokemon_base_data');
      cachedBaseData = baseDataManifest;
    } else {
      // Client-side: Use fetch (fallback)
      const response = await fetch('/output/manifests/pokemon_base_data.json');
      if (!response.ok) {
        throw new Error('Failed to load base data manifest');
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
