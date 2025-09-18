// Enhanced item data loader that works with the items manifest

import { loadJsonFile } from '../fileLoader';
import { loadManifest, type MoveManifest } from '../manifest-resolver';

/**
 * Load items data using the manifest system
 */
export async function loadMovesData(): Promise<Record<string, any>> {
  try {
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
    // Fallback to original items_data.json if manifest fails
    try {
      const fallbackData = await loadJsonFile<Record<string, any>>(
        'output/pokemon_move_descriptions.json',
      );
      return fallbackData || {};
    } catch (fallbackError) {
      console.error('Failed to load fallback moves data:', fallbackError);
      return {};
    }
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

// export interface BaseData {
//   name: string;
//   nationalDex: number;
//   johtoDex: number;
//   types: string[];
//   normalizedUrl?: string;
//   formName?: string;
// }

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
              pokemon: {
                ...basePokemon,
                normalizedUrl: pokemonKey,
              },
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
              pokemon: {
                ...basePokemon,
                normalizedUrl: pokemonKey,
              },
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
              pokemon: {
                ...basePokemon,
                normalizedUrl: pokemonKey,
              },
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

export type { MoveManifest };

/**
 * Interface for the pokemon_moves manifest
 */
export interface PokemonMovesManifest {
  [pokemonName: string]: string[];
}
