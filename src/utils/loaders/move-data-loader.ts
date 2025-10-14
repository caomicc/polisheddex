// Additional functionality for finding Pokemon that can learn moves
import { loadPokemonFromNewManifest } from './pokemon-data-loader';
import { MovesManifest, MoveData, PokemonManifest, MoveLearner } from '@/types/new';

import { loadJsonFile } from '../fileLoader';

/**
 * Load moves data using the new manifest system with fallbacks
 * Returns a Record where keys are move IDs and values are move data
 */
export async function loadMovesData(): Promise<Record<string, any>> {
  try {
    // First try the new manifest system
    const newManifestData = await loadMovesFromNewManifest();
    console.log('Successfully loaded moves from new manifest system');
    return newManifestData;
  } catch (error) {
    console.error('Error loading moves data:', error);
    return {};
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
  // try {
  //   // Check if we're in a server environment
  //   if (typeof window === 'undefined') {
  //     // Server-side: Load the detailed move data directly
  //     const moveData = await loadJsonFile<MoveData>(`new/moves/${moveId}.json`);
  //     return (
  //       moveData || {
  //         id: moveId,
  //         versions: {},
  //       }
  //     );
  //   } else {
  //     // Client-side: Use fetch
  //     const response = await fetch(`/new/moves/${moveId}.json`);
  //     if (!response.ok) {
  //       console.error(`Failed to load detailed data for move ${moveId} on client`);
  //     }

  //     const moveData = await response.json();
  //     return moveData;
  //   }
  // } catch (error) {
  //   console.error(`Error loading detailed data for move ${moveId}:`, error);
  //   throw error;
  // }
  return {
    id: moveId,
    versions: {},
  };
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
