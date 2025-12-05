import { promises as fs } from 'fs';
import path from 'path';

export interface AbilityData {
  id: string;
  name: string;
  description: string;
}

export interface AbilitiesManifestItem {
  id: string;
  name: string;
  versions: {
    faithful: {
      description: string;
    };
    polished: {
      description: string;
    };
  };
}

let abilitiesManifest: AbilitiesManifestItem[] | null = null;

/**
 * Load abilities manifest once and cache it (server-side only)
 */
async function loadAbilitiesManifest(): Promise<AbilitiesManifestItem[]> {
  if (abilitiesManifest) {
    return abilitiesManifest;
  }

  try {
    const manifestPath = path.join(process.cwd(), 'public/new/abilities_manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf-8');
    abilitiesManifest = JSON.parse(manifestData);
    return abilitiesManifest || [];
  } catch (error) {
    console.error('Error loading abilities manifest:', error);
    return [];
  }
}

/**
 * Get ability data by ID and version from manifest (server-side only)
 */
export async function getAbilityData(abilityId: string, version: 'faithful' | 'polished' = 'polished'): Promise<AbilityData | null> {
  const manifest = await loadAbilitiesManifest();
  const abilityItem = manifest.find(item => item.id === abilityId);
  
  if (!abilityItem || !abilityItem.versions[version]) {
    return null;
  }

  return {
    id: abilityItem.id,
    name: abilityItem.name,
    description: abilityItem.versions[version].description,
  };
}

/**
 * Get multiple abilities data at once for better performance (server-side only)
 */
export async function getMultipleAbilitiesData(abilityIds: string[], version: 'faithful' | 'polished' = 'polished'): Promise<Record<string, AbilityData>> {
  const manifest = await loadAbilitiesManifest();
  const result: Record<string, AbilityData> = {};

  for (const abilityId of abilityIds) {
    const abilityItem = manifest.find(item => item.id === abilityId);
    if (abilityItem && abilityItem.versions[version]) {
      result[abilityId] = {
        id: abilityItem.id,
        name: abilityItem.name,
        description: abilityItem.versions[version].description,
      };
    }
  }

  return result;
}