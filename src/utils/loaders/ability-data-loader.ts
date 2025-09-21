// Additional functionality for finding Pokemon that have abilities
import { AbilityData } from '@/types/new';
import { loadJsonFile } from '../fileLoader';

/**
 * Load abilities data using the manifest system
 */
export async function loadAbilitiesData(): Promise<Record<string, any>> {
  try {
    // First try the new manifest system
    const newManifestData = await loadAbilitiesFromNewManifest();
    console.log('Successfully loaded abilities from new manifest system');
    return newManifestData;
  } catch (error) {
    console.error('Error loading abilities data:', error);
    return {};
  }
}

/**
 * Load abilities data from the new manifest structure (new/abilities_manifest.json)
 * This function handles the new flattened array structure
 */
export async function loadAbilitiesFromNewManifest(): Promise<Record<string, AbilityData>> {
  try {
    console.log('Loading Abilities from new manifest...');

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the new abilities manifest directly
      const abilitiesArray = await loadJsonFile<AbilityData[]>('new/abilities_manifest.json');

      if (!abilitiesArray || !Array.isArray(abilitiesArray)) {
        console.error('Invalid abilities manifest structure or file not found');
        return {};
      }

      console.log(`Processing ${abilitiesArray.length} Abilities from manifest`);
      const baseData: Record<string, AbilityData> = {};

      abilitiesArray.forEach((ability, index) => {
        if (!ability || !ability.id) {
          console.warn(`Skipping invalid Ability at index ${index}`);
          return;
        }

        // Store the Ability data using its ID as the key
        baseData[ability.id] = ability;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} Abilities`);
      return baseData;
    } else {
      console.log('Client-side: Fetching new moves manifest...');
      // Client-side: Use fetch
      const response = await fetch('/new/abilities_manifest.json');
      if (!response.ok) {
        console.error('Failed to load new abilities manifest on client');
        return {};
      }

      const abilitiesArray = await response.json();

      if (!Array.isArray(abilitiesArray)) {
        console.error('Invalid abilities manifest structure');
        return {};
      }

      console.log(`Processing ${abilitiesArray.length} Abilities from client manifest`);
      const baseData: Record<string, AbilityData> = {};

      abilitiesArray.forEach((ability: AbilityData, index: number) => {
        if (!ability || !ability.id) {
          console.warn(`Skipping invalid Ability at index ${index}`);
          return;
        }

        // Store the Ability data using its ID as the key
        baseData[ability.id] = ability;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} Abilities on client`);
      return baseData;
    }
  } catch (error) {
    console.error('Error loading Abilities from new manifest:', error);
    return {};
  }
}

/**
 * Load detailed move data from individual files (new/moves/{id}.json)
 * This contains version-specific data with learner information
 */
export async function loadDetailedAbilityData(abilityId: string): Promise<AbilityData> {
  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the detailed ability data directly
      const abilityData = await loadJsonFile<AbilityData>(`new/abilities/${abilityId}.json`);
      return (
        abilityData || {
          id: abilityId,
          name: '',
          versions: {},
        }
      );
    } else {
      // Client-side: Use fetch
      const response = await fetch(`/new/abilities/${abilityId}.json`);
      if (!response.ok) {
        console.error(`Failed to load detailed data for ability ${abilityId} on client`);
      }

      const abilityData = await response.json();
      return abilityData;
    }
  } catch (error) {
    console.error(`Error loading detailed data for ability ${abilityId}:`, error);
    throw error;
  }
}
