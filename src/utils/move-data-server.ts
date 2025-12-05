import { promises as fs } from 'fs';
import path from 'path';

export interface MoveData {
  id: string;
  name: string;
  description: string;
  power: number;
  type: string;
  accuracy: number;
  pp: number;
  effectChance: number;
  category: string;
}

export interface MovesManifestItem {
  id: string;
  versions: {
    faithful: MoveData;
    polished: MoveData;
  };
}

let movesManifest: MovesManifestItem[] | null = null;

/**
 * Load moves manifest once and cache it (server-side only)
 */
async function loadMovesManifest(): Promise<MovesManifestItem[]> {
  if (movesManifest) {
    return movesManifest;
  }

  try {
    const manifestPath = path.join(process.cwd(), 'public/new/moves_manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf-8');
    movesManifest = JSON.parse(manifestData);
    return movesManifest || [];
  } catch (error) {
    console.error('Error loading moves manifest:', error);
    return [];
  }
}

/**
 * Get move data by ID and version from manifest (server-side only)
 */
export async function getMoveData(moveId: string, version: 'faithful' | 'polished' = 'polished'): Promise<MoveData | null> {
  const manifest = await loadMovesManifest();
  const moveItem = manifest.find(item => item.id === moveId);
  
  if (!moveItem || !moveItem.versions[version]) {
    return null;
  }

  return moveItem.versions[version];
}

/**
 * Get multiple moves data at once for better performance (server-side only)
 */
export async function getMultipleMovesData(moveIds: string[], version: 'faithful' | 'polished' = 'polished'): Promise<Record<string, MoveData>> {
  const manifest = await loadMovesManifest();
  const result: Record<string, MoveData> = {};

  for (const moveId of moveIds) {
    const moveItem = manifest.find(item => item.id === moveId);
    if (moveItem && moveItem.versions[version]) {
      result[moveId] = moveItem.versions[version];
    }
  }

  return result;
}