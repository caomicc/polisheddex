// Enhanced item data loader that works with the items manifest

import { loadJsonFile } from './fileLoader';
import { loadManifest, type MoveManifest } from './manifest-resolver';

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

export type { MoveManifest };
