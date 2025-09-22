// Additional functionality for finding Pokemon that have abilities
import { AbilityData } from '@/types/new';
import { loadJsonFile } from '../fileLoader';
import { getPokemonTypes, loadBasePokemonData } from './pokemon-data-loader';

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
      console.log('Client-side: Fetching new abilities manifest...');
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
 * Load detailed ability data from individual files (new/abilities/{id}.json)
 * This contains version-specific data with Pokemon information enriched with types
 */
export async function loadDetailedAbilityData(abilityId: string): Promise<AbilityData> {
  try {
    let abilityData: AbilityData;

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the detailed ability data directly
      const rawAbilityData = await loadJsonFile<AbilityData>(`new/abilities/${abilityId}.json`);
      abilityData = rawAbilityData || {
        id: abilityId,
        name: '',
        versions: {},
      };
    } else {
      // Client-side: Use fetch
      const response = await fetch(`/new/abilities/${abilityId}.json`);
      if (!response.ok) {
        console.error(`Failed to load detailed data for ability ${abilityId} on client`);
        return {
          id: abilityId,
          name: '',
          versions: {},
        };
      }

      abilityData = await response.json();
    }

    // Enrich ability data with Pokemon types
    const enrichedVersions: AbilityData['versions'] = {};

    for (const [versionName, versionData] of Object.entries(abilityData.versions)) {
      enrichedVersions[versionName] = {
        ...versionData,
        pokemon: await Promise.all(
          (versionData.pokemon || []).map(async (pokemon) => {
            console.log(
              `Processing ${versionData.pokemon?.length || 0} Pokemon for ability ${abilityId} in version ${versionName}`,
            );

            // Validate that Pokemon has required properties
            if (!pokemon.name) {
              console.warn(`Skipping Pokemon with missing name in ability ${abilityId}`);
              return pokemon;
            }

            try {
              // Pokemon objects in abilities use 'name' property, but loadBasePokemonData expects 'id'
              // The pokemon name should match the pokemon id in most cases
              const pokemonId = pokemon.name.toLowerCase();
              console.log(`Loading Pokemon data for: ${pokemon.name} (ID: ${pokemonId})`);

              const pokemonData = await loadBasePokemonData(pokemonId);

              if (pokemonData) {
                console.log(`Loaded Pokemon data for ${pokemon.name}:`, pokemonData);

                const types = await getPokemonTypes(
                  pokemonData,
                  versionName,
                  pokemon.form || 'plain',
                );

                console.log(`Enriched ${pokemon.name} with types: ${types?.join(', ')}`);

                return {
                  ...pokemon,
                  types: types,
                };
              }
            } catch (error) {
              console.warn(`Failed to load Pokemon data for ${pokemon.name}:`, error);
            }

            // If Pokemon not found or failed to load, return original data
            console.log(`Using original data for ${pokemon.name} (no enrichment)`);
            return pokemon;
          }),
        ),
      };
    }

    return {
      ...abilityData,
      versions: enrichedVersions,
    };
  } catch (error) {
    console.error(`Error loading detailed data for ability ${abilityId}:`, error);
    throw error;
  }
}
