// Enhanced move data loader that supports both the new and old manifest systems
//
// NEW MANIFEST SYSTEM:
// - Simple manifest: new/moves_manifest.json (basic move info with hasTM flag)
// - Detailed data: new/moves/{id}.json (comprehensive data with learners, stats, versions)
//
// OLD MANIFEST SYSTEM:
// - Manifest: output/manifests/moves.json
// - Fallback: output/pokemon_move_descriptions.json
//
// The loader automatically tries the new system first, then falls back to the old system
// for backward compatibility.

import { loadJsonFile } from '../fileLoader';
import { loadManifest, type MoveManifest } from '../manifest-resolver';

/**
 * Load moves data using the new manifest system with fallbacks
 * Returns a Record where keys are move IDs and values are move data
 */
export async function loadMovesData(): Promise<Record<string, any>> {
  try {
    // First try the new manifest system
    const newManifestData = await loadMovesFromNewManifest();
    if (Object.keys(newManifestData).length > 0) {
      console.log('Successfully loaded moves from new manifest system');
      return newManifestData;
    }

    console.log('New manifest system failed, falling back to old manifest system');

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the moves manifest directly
      const movesManifest = await loadManifest<MoveManifest>('moves');
      return movesManifest;
    } else {
      // Client-side: Use fetch (fallback)
      const response = await fetch('/output/manifests/moves.json');
      if (!response.ok) {
        throw new Error('Failed to load moves manifest');
      }
      return await response.json();
    }
  } catch (error) {
    console.error('Error loading moves data:', error);
    // Final fallback to original moves data file
    try {
      const fallbackData = await loadJsonFile<Record<string, any>>(
        'output/pokemon_move_descriptions.json',
      );
      console.log('Successfully loaded fallback moves data');
      return fallbackData || {};
    } catch (fallbackError) {
      console.error('Failed to load fallback moves data:', fallbackError);
      return {};
    }
  }
}

/**
 * Load moves data from the new manifest structure (new/moves_manifest.json)
 * This function handles the new flattened array structure
 */
export async function loadMovesFromNewManifest(): Promise<Record<string, MovesManifest>> {
  try {
    console.log('Loading Moves from new manifest...');

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the new moves manifest directly
      const movesArray = await loadJsonFile<MovesManifest[]>('new/moves_manifest.json');

      if (!movesArray || !Array.isArray(movesArray)) {
        console.error('Invalid moves manifest structure or file not found');
        return {};
      }

      console.log(`Processing ${movesArray.length} Moves from manifest`);
      const baseData: Record<string, MovesManifest> = {};

      movesArray.forEach((move, index) => {
        if (!move || !move.id) {
          console.warn(`Skipping invalid Move at index ${index}`);
          return;
        }

        // Store the Move data using its ID as the key
        baseData[move.id] = move;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} Moves`);
      return baseData;
    } else {
      console.log('Client-side: Fetching new moves manifest...');
      // Client-side: Use fetch
      const response = await fetch('/new/moves_manifest.json');
      if (!response.ok) {
        console.error('Failed to load new moves manifest on client');
        return {};
      }

      const movesArray = await response.json();

      if (!Array.isArray(movesArray)) {
        console.error('Invalid moves manifest structure');
        return {};
      }

      console.log(`Processing ${movesArray.length} Moves from client manifest`);
      const baseData: Record<string, MovesManifest> = {};

      movesArray.forEach((move: MovesManifest, index: number) => {
        if (!move || !move.id) {
          console.warn(`Skipping invalid Move at index ${index}`);
          return;
        }

        // Store the Move data using its ID as the key
        baseData[move.id] = move;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} Moves on client`);
      return baseData;
    }
  } catch (error) {
    console.error('Error loading Moves from new manifest:', error);
    return {};
  }
}

/**
 * Load detailed move data from individual files (new/moves/{id}.json)
 * This contains version-specific data with learner information
 */
export async function loadDetailedMoveData(moveId: string): Promise<MoveData> {
  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the detailed move data directly
      const moveData = await loadJsonFile<MoveData>(`new/moves/${moveId}.json`);
      return moveData;
    } else {
      // Client-side: Use fetch
      const response = await fetch(`/new/moves/${moveId}.json`);
      if (!response.ok) {
        console.error(`Failed to load detailed data for move ${moveId} on client`);
      }

      const moveData = await response.json();
      return moveData;
    }
  } catch (error) {
    console.error(`Error loading detailed data for move ${moveId}:`, error);
    throw error;
  }
}

/**
 * Load multiple detailed move data efficiently
 */
export async function loadMultipleDetailedMoveData(
  moveIds: string[],
): Promise<(MoveData | null)[]> {
  try {
    const promises = moveIds.map((id) => loadDetailedMoveData(id));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error loading multiple detailed move data:', error);
    return moveIds.map(() => null);
  }
}

/**
 * Load a specific item by ID from the manifest
 */
export async function loadMoveById(moveId: string): Promise<any | null> {
  try {
    const movesData = await loadMovesData();
    return movesData[moveId] || null;
  } catch (error) {
    console.error(`Error loading move ${moveId}:`, error);
    return null;
  }
}

/**
 * Load multiple moves by IDs efficiently
 */
export async function loadMultipleMovesById(moveIds: string[]): Promise<(any | null)[]> {
  try {
    const movesData = await loadMovesData();
    return moveIds.map((id) => movesData[id] || null);
  } catch (error) {
    console.error('Error loading multiple moves:', error);
    return moveIds.map(() => null);
  }
}

/**
 * Search items by name, type, or attributes
 */
export async function searchMoves(query: string): Promise<any[]> {
  try {
    const movesData = await loadMovesData();
    const allMoves = Object.values(movesData);

    const queryLower = query.toLowerCase();

    return allMoves.filter((move) => {
      if (!move || typeof move !== 'object') return false;

      // Search in name
      if (
        move.name &&
        typeof move.name === 'string' &&
        move.name.toLowerCase().includes(queryLower)
      ) {
        return true;
      }

      // Search in description
      if (
        move.description &&
        typeof move.description === 'string' &&
        move.description.toLowerCase().includes(queryLower)
      ) {
        return true;
      }

      // Search in type/category
      if (
        move.category &&
        typeof move.category === 'string' &&
        move.category.toLowerCase().includes(queryLower)
      ) {
        return true;
      }

      return false;
    });
  } catch (error) {
    console.error('Error searching items:', error);
    return [];
  }
}

/**
 * Get items by category/type
 */
export async function getMovesByCategory(category: string): Promise<any[]> {
  try {
    const movesData = await loadMovesData();
    const allMoves = Object.values(movesData);

    return allMoves.filter((move) => {
      if (!move || typeof move !== 'object') return false;
      return (
        move.category === category ||
        (move.type && move.type === category) ||
        (move.attributes && move.attributes.category === category)
      );
    });
  } catch (error) {
    console.error(`Error loading moves for category ${category}:`, error);
    return [];
  }
}

// Additional functionality for finding Pokemon that can learn moves
import { loadPokemonFromNewManifest } from './pokemon-data-loader';
import { normalizePokemonUrlKey } from '../pokemonUrlNormalizer';
import { BaseData } from '@/types/types';
import { MovesManifest, MoveData, PokemonManifest, MoveLearner } from '@/types/new';

// export interface BaseData {
//   name: string;
//   nationalDex: number;
//   johtoDex: number;
//   types: string[];
//   normalizedUrl?: string;
//   formName?: string;
// }

/**
 * Helper function to convert PokemonManifest to BaseData
 */
function convertPokemonManifestToBaseData(pokemon: PokemonManifest, key: string): BaseData {
  // Get types from the first available version and form
  let types: string[] = [];
  if (pokemon.versions) {
    const versionKeys = Object.keys(pokemon.versions);
    if (versionKeys.length > 0) {
      const firstVersion = pokemon.versions[versionKeys[0]];
      if (firstVersion && typeof firstVersion === 'object') {
        const formKeys = Object.keys(firstVersion);
        if (formKeys.length > 0) {
          const firstForm = firstVersion[formKeys[0]];
          if (firstForm && firstForm.types) {
            types = firstForm.types;
          }
        }
      }
    }
  }

  return {
    name: pokemon.name,
    nationalDex: pokemon.dexNo,
    johtoDex: pokemon.dexNo, // Assuming same as national for now
    types: types,
    normalizedUrl: key,
    formName: pokemon.formName,
  };
}

export interface PokemonWithMove {
  pokemon: BaseData;
  learnMethod: 'level' | 'tm' | 'egg' | 'tutor';
  level?: number;
  faithful?: boolean;
  updated?: boolean;
}

export async function getPokemonThatCanLearnMove(moveName: string): Promise<PokemonWithMove[]> {
  const pokemonManifestData = await loadPokemonFromNewManifest();
  const pokemonWithMove: PokemonWithMove[] = [];

  // Normalize move name for comparison
  const normalizedMoveName = moveName.toLowerCase();

  try {
    // Load pre-computed move data files for much faster lookups
    const [tmHmData, levelMoveData, eggMoveData] = await Promise.all([
      loadJsonFile<Record<string, any[]>>('output/pokemon_tm_hm_learnset.json'),
      loadJsonFile<Record<string, { moves: any[] }>>('output/pokemon_level_moves.json'),
      loadJsonFile<Record<string, any[]>>('output/pokemon_egg_moves.json'),
    ]);

    // Check TM/HM moves
    if (tmHmData) {
      Object.entries(tmHmData).forEach(([pokemonKey, moves]) => {
        const basePokemon = pokemonManifestData[pokemonKey];
        if (!basePokemon) return;

        moves?.forEach((move) => {
          if (move.name && move.name.toLowerCase() === normalizedMoveName) {
            pokemonWithMove.push({
              pokemon: convertPokemonManifestToBaseData(basePokemon, pokemonKey),
              learnMethod: 'tm',
              faithful: true,
              updated: true,
            });
          }
        });
      });
    }

    // Check level moves
    if (levelMoveData) {
      Object.entries(levelMoveData).forEach(([pokemonName, data]) => {
        // Find Pokemon by name (not key) since level moves use display names
        const pokemonEntry = Object.entries(pokemonManifestData).find(
          ([key, pokemon]) => pokemon.name.toLowerCase() === pokemonName.toLowerCase(),
        );

        if (!pokemonEntry) return;
        const [pokemonKey, basePokemon] = pokemonEntry;

        data.moves?.forEach((move) => {
          if (move.name && move.name.toLowerCase() === normalizedMoveName) {
            pokemonWithMove.push({
              pokemon: convertPokemonManifestToBaseData(basePokemon, pokemonKey),
              learnMethod: 'level',
              level: move.level,
              faithful: true,
              updated: true,
            });
          }
        });
      });
    }

    // Check egg moves
    if (eggMoveData) {
      Object.entries(eggMoveData).forEach(([pokemonKey, moves]) => {
        const basePokemon = pokemonManifestData[pokemonKey];
        if (!basePokemon) return;

        moves?.forEach((move) => {
          if (move.name && move.name.toLowerCase() === normalizedMoveName) {
            pokemonWithMove.push({
              pokemon: convertPokemonManifestToBaseData(basePokemon, pokemonKey),
              learnMethod: 'egg',
              faithful: true,
              updated: true,
            });
          }
        });
      });
    }
  } catch (error) {
    console.error('Error loading move data from pre-computed files:', error);
    // Fallback to empty array rather than the slow file-by-file approach
    return [];
  }

  // Remove duplicates and sort by Pokemon name
  const uniquePokemon = pokemonWithMove.filter((item, index, self) => {
    return (
      index ===
      self.findIndex(
        (t) =>
          t.pokemon.name === item.pokemon.name &&
          t.learnMethod === item.learnMethod &&
          t.level === item.level,
      )
    );
  });

  return uniquePokemon.sort((a, b) => a.pokemon.name.localeCompare(b.pokemon.name));
}

/**
 * Get learners for a specific move from the detailed move data
 */
export async function getLearnersForMove(
  moveId: string,
  version: string = 'faithful',
): Promise<MoveLearner[]> {
  try {
    const moveData = await loadDetailedMoveData(moveId);
    if (!moveData || !moveData.versions || !moveData.versions[version]) {
      return [];
    }

    const versionData = moveData.versions[version];
    if (!versionData.learners) {
      return [];
    }

    return versionData.learners;
  } catch (error) {
    console.error(`Error loading learners for move ${moveId}:`, error);
    return [];
  }
}

/**
 * Get all moves by type from the new manifest
 */
export async function getMovesByType(type: string): Promise<MovesManifest[]> {
  try {
    const movesData = await loadMovesFromNewManifest();
    return Object.values(movesData).filter((move) => move.type === type);
  } catch (error) {
    console.error(`Error loading moves for type ${type}:`, error);
    return [];
  }
}

/**
 * Get all TM moves from the new manifest
 */
export async function getTMMoves(): Promise<MovesManifest[]> {
  try {
    const movesData = await loadMovesFromNewManifest();
    return Object.values(movesData).filter((move) => move.hasTM === true);
  } catch (error) {
    console.error('Error loading TM moves:', error);
    return [];
  }
}

/**
 * Find moves by name pattern (partial matching)
 */
export async function findMovesByName(namePattern: string): Promise<MovesManifest[]> {
  try {
    const movesData = await loadMovesFromNewManifest();
    const pattern = namePattern.toLowerCase();

    return Object.values(movesData).filter((move) => move.name.toLowerCase().includes(pattern));
  } catch (error) {
    console.error(`Error searching moves by name pattern ${namePattern}:`, error);
    return [];
  }
}

export type { MoveManifest };

/**
 * Interface for the pokemon_moves manifest
 */
export interface PokemonMovesManifest {
  [pokemonName: string]: string[];
}
