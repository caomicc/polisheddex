import fs from 'fs';
import path from 'path';
import { BaseData } from '@/types/types';

let cachedBaseData: Record<string, BaseData> | null = null;

export async function loadPokemonBaseData(): Promise<Record<string, BaseData>> {
  // Return cached data if available
  if (cachedBaseData) {
    return cachedBaseData;
  }

  // Load and cache the data
  const filePath = path.join(process.cwd(), 'output/pokemon_base_data.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  cachedBaseData = data as Record<string, BaseData>;
  return cachedBaseData;
}

export function clearPokemonBaseDataCache() {
  cachedBaseData = null;
}