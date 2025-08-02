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
import { BaseData } from '@/types/types';
import { loadPokemonBaseData } from './pokemon-base-data-loader';

export interface PokemonWithMove {
  pokemon: BaseData;
  learnMethod: 'level' | 'tm' | 'egg' | 'tutor';
  level?: number;
  faithful?: boolean;
  updated?: boolean;
}

export async function getPokemonThatCanLearnMove(moveName: string): Promise<PokemonWithMove[]> {
  const pokemonBaseData = await loadPokemonBaseData();
  const pokemonWithMove: PokemonWithMove[] = [];

  // Normalize move name for comparison
  const normalizedMoveName = moveName.toLowerCase();

  // Load individual Pokemon files to get full move data
  for (const [pokemonKey, basePokemon] of Object.entries(pokemonBaseData)) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Try to load the individual Pokemon file
      const pokemonFileName = pokemonKey.toLowerCase();
      const pokemonFilePath = path.join(process.cwd(), `output/pokemon/${pokemonFileName}.json`);
      
      if (!fs.existsSync(pokemonFilePath)) {
        continue; // Skip if individual file doesn't exist
      }
      
      const pokemonData = JSON.parse(fs.readFileSync(pokemonFilePath, 'utf8'));
      const pokemon = { ...basePokemon, ...pokemonData };

      // Check level moves (faithful and updated)
      const checkLevelMoves = (moves: any[], version: 'faithful' | 'updated') => {
        moves?.forEach((move) => {
          if (move.name && move.name.toLowerCase() === normalizedMoveName) {
            pokemonWithMove.push({
              pokemon,
              learnMethod: 'level',
              level: move.level,
              [version]: true,
            });
          }
        });
      };

      // Check main level moves (for backward compatibility)
      if (pokemon.levelMoves) {
        checkLevelMoves(pokemon.levelMoves, 'updated');
      }

      // Check faithful level moves
      if (pokemon.faithfulLevelMoves) {
        checkLevelMoves(pokemon.faithfulLevelMoves, 'faithful');
      }

      // Check updated level moves
      if (pokemon.updatedLevelMoves) {
        checkLevelMoves(pokemon.updatedLevelMoves, 'updated');
      }

      // Check TM/HM moves (try both property names)
      const tmMoves = (pokemon as any).tmHmMoves || pokemon.tmHmLearnset;
      tmMoves?.forEach((move: any) => {
        if (move.name && move.name.toLowerCase() === normalizedMoveName) {
          pokemonWithMove.push({
            pokemon,
            learnMethod: 'tm',
            faithful: true,
            updated: true,
          });
        }
      });

      // Check egg moves
      pokemon.eggMoves?.forEach((move: any) => {
        if (move.name && move.name.toLowerCase() === normalizedMoveName) {
          pokemonWithMove.push({
            pokemon,
            learnMethod: 'egg',
            faithful: true,
            updated: true,
          });
        }
      });

      // Check forms if they exist
      if (pokemon.forms) {
        Object.entries(pokemon.forms).forEach(([formName, formData]) => {
          // Check form level moves
          const checkFormLevelMoves = (moves: any[], version: 'faithful' | 'updated') => {
            moves?.forEach((move) => {
              if (move.name && move.name.toLowerCase() === normalizedMoveName) {
                pokemonWithMove.push({
                  pokemon: {
                    ...pokemon,
                    name: `${pokemon.name} (${formName})`,
                    formName,
                  },
                  learnMethod: 'level',
                  level: move.level,
                  [version]: true,
                });
              }
            });
          };

          // Check main level moves for form (for backward compatibility)
          if ((formData as any).levelMoves) {
            checkFormLevelMoves((formData as any).levelMoves, 'updated');
          }

          if ((formData as any).faithfulLevelMoves) {
            checkFormLevelMoves((formData as any).faithfulLevelMoves, 'faithful');
          }

          if ((formData as any).updatedLevelMoves) {
            checkFormLevelMoves((formData as any).updatedLevelMoves, 'updated');
          }
        });
      }
    } catch (error: any) {
      // Skip Pokemon if there's an error loading their data
      console.warn(`Error loading data for ${pokemonKey}:`, error.message);
      continue;
    }
  }

  // Remove duplicates and sort by Pokemon name
  const uniquePokemon = pokemonWithMove.filter((item, index, self) => {
    return index === self.findIndex((t) => 
      t.pokemon.name === item.pokemon.name && 
      t.learnMethod === item.learnMethod &&
      t.level === item.level
    );
  });

  return uniquePokemon.sort((a, b) => a.pokemon.name.localeCompare(b.pokemon.name));
}

export type { MoveManifest };
