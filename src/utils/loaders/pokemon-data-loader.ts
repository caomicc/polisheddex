// Enhanced Pokemon data loader that works with compressed data and manifests

import { loadJsonFile } from '../fileLoader';
import { PokemonManifest, ComprehensivePokemonData, PokemonMovesets } from '@/types/new';
import { loadDetailedMoveData } from './move-data-loader';
import { loadDetailedAbilityData } from './ability-data-loader';

/**
 * Load Pokemon data from the new manifest structure (new/pokemon_manifest.json)
 * This function handles the new flattened array structure with version-specific data
 */
export async function loadPokemonFromNewManifest(): Promise<Record<string, PokemonManifest>> {
  try {
    console.log('Loading Pokemon from new manifest...');

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the new pokemon manifest directly
      const pokemonArray = await loadJsonFile<PokemonManifest[]>('new/pokemon_manifest.json');

      if (!pokemonArray || !Array.isArray(pokemonArray)) {
        console.error('Invalid pokemon manifest structure or file not found');
        return {};
      }

      console.log(`Processing ${pokemonArray.length} Pokemon from manifest`);
      const baseData: Record<string, PokemonManifest> = {};

      pokemonArray.forEach((pokemon, index) => {
        if (!pokemon || !pokemon.id) {
          console.warn(`Skipping invalid Pokemon at index ${index}`);
          return;
        }

        // Store the Pokemon data using its ID as the key
        baseData[pokemon.id] = pokemon;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} Pokemon`);
      return baseData;
    } else {
      console.log('Client-side: Fetching new pokemon manifest...');
      // Client-side: Use fetch
      const response = await fetch('/new/pokemon_manifest.json');
      if (!response.ok) {
        console.error('Failed to load new pokemon manifest on client');
        return {};
      }

      const pokemonArray = await response.json();

      if (!Array.isArray(pokemonArray)) {
        console.error('Invalid pokemon manifest structure');
        return {};
      }

      console.log(`Processing ${pokemonArray.length} Pokemon from client manifest`);
      const baseData: Record<string, PokemonManifest> = {};

      pokemonArray.forEach((pokemon: PokemonManifest, index: number) => {
        if (!pokemon || !pokemon.id) {
          console.warn(`Skipping invalid Pokemon at index ${index}`);
          return;
        }

        // Store the Pokemon data using its ID as the key
        baseData[pokemon.id] = pokemon;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} Pokemon on client`);
      return baseData;
    }
  } catch (error) {
    console.error('Error loading Pokemon from new manifest:', error);
    return {};
  }
}

/**
 * Helper function to get Pokemon types from the new manifest structure
 */
export async function getPokemonTypes(
  pokemon: ComprehensivePokemonData,
  version: string = 'polished',
  form: string = 'plain',
): Promise<string[]> {
  const formData = pokemon.versions?.[version]?.forms?.[form];
  return formData?.types || [];
}

/**
 * Helper function to get all forms for a Pokemon
 */
export function getPokemonForms(
  pokemon: PokemonManifest,
  version: 'polished' | 'faithful' = 'polished',
): string[] {
  return Object.keys(pokemon.versions?.[version] || {});
}

/**
 * Helper function to check if a Pokemon has multiple forms
 */
export function hasMultipleForms(
  pokemon: PokemonManifest,
  version: 'polished' | 'faithful' = 'polished',
): boolean {
  const forms = getPokemonForms(pokemon, version);
  return forms.length > 1 || (forms.length === 1 && forms[0] !== 'plain');
}

/**
 * Load individual Pokemon data from new/pokemon/{pokemonId}.json
 * This function loads the complete Pokemon data including stats, moves, abilities, etc.
 */
export async function loadBasePokemonData(
  pokemonId: string,
): Promise<ComprehensivePokemonData | null> {
  try {
    console.log(`Loading individual Pokemon data for: ${pokemonId}`);

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the individual pokemon file directly
      const pokemonData = await loadJsonFile<ComprehensivePokemonData>(
        `new/pokemon/${pokemonId}.json`,
      );

      if (!pokemonData) {
        console.error(`Pokemon data not found for: ${pokemonId}`);
        return null;
      }

      console.log(`Successfully loaded Pokemon data for: ${pokemonData.name} (${pokemonData.id})`);
      return pokemonData;
    } else {
      console.log(`Client-side: Fetching Pokemon data for: ${pokemonId}`);
      // Client-side: Use fetch
      const response = await fetch(`/new/pokemon/${pokemonId}.json`);
      if (!response.ok) {
        console.error(`Failed to load Pokemon data for: ${pokemonId} (${response.status})`);
        return null;
      }

      const pokemonData = (await response.json()) as ComprehensivePokemonData;

      if (!pokemonData || !pokemonData.id) {
        console.error(`Invalid Pokemon data structure for: ${pokemonId}`);
        return null;
      }

      console.log(
        `Successfully loaded Pokemon data for: ${pokemonData.name} (${pokemonData.id}) on client`,
      );
      return pokemonData;
    }
  } catch (error) {
    console.error(`Error loading Pokemon data for ${pokemonId}:`, error);
    return null;
  }
}

/**
 * Load individual Pokemon data with enriched move and ability details
 * This function loads Pokemon data and enriches movesets with detailed move information
 * and abilities with detailed ability information
 */
export async function loadEnrichedPokemonData(
  pokemonId: string,
): Promise<ComprehensivePokemonData | null> {
  try {
    console.log(`Loading Pokemon data with move and ability details for: ${pokemonId}`);

    // First load the basic Pokemon data
    const pokemonData = await loadBasePokemonData(pokemonId);
    if (!pokemonData) {
      return null;
    }

    // Enrich the Pokemon data with detailed move and ability information
    const enrichedVersions: ComprehensivePokemonData['versions'] = {};

    for (const [versionName, versionData] of Object.entries(pokemonData.versions)) {
      console.log(
        `Enriching moves and abilities for ${pokemonData.name} in version: ${versionName}`,
      );

      const enrichedForms: typeof versionData.forms = {};

      for (const [formName, formData] of Object.entries(versionData.forms || {})) {
        // Enrich movesets
        const enrichedMovesets = formData.movesets
          ? await enrichMovesets(formData.movesets, versionName)
          : undefined;

        // Enrich abilities
        const enrichedAbilities = formData.abilities
          ? await enrichAbilities(formData.abilities, versionName)
          : undefined;

        enrichedForms[formName] = {
          ...formData,
          movesets: enrichedMovesets,
          abilities: enrichedAbilities,
        };
      }

      enrichedVersions[versionName] = {
        ...versionData,
        forms: enrichedForms,
      };
    }

    const result = {
      ...pokemonData,
      versions: enrichedVersions,
    };

    console.log(
      `Successfully enriched Pokemon data with moves and abilities for: ${pokemonData.name}`,
    );
    return result;
  } catch (error) {
    console.error(`Error loading Pokemon data with moves and abilities for ${pokemonId}:`, error);
    return null;
  }
}

/**
 * Helper function to enrich movesets with detailed move data
 */
async function enrichMovesets(movesets: any, versionName: string): Promise<any> {
  const enrichedMovesets: Record<string, any> = {};

  for (const [movesetType, moves] of Object.entries(movesets)) {
    if (Array.isArray(moves)) {
      // Handle different types of moves
      enrichedMovesets[movesetType] = await Promise.all(
        moves.map(async (move: any) => {
          try {
            if (typeof move === 'string') {
              const moveData = await loadDetailedMoveData(move);
              const versionData = moveData.versions?.[versionName] || {};

              // Create enriched move object, excluding learners and ensuring name is preserved
              const { learners, name, ...moveStats } = versionData;
              return {
                name, // Preserve original move name
                ...moveStats, // All other move data (power, accuracy, etc.)
              };
            } else if (move && typeof move === 'object' && move.name) {
              // Move with additional properties (like level-up moves)
              const moveData = await loadDetailedMoveData(move.name);
              const versionData = moveData.versions?.[versionName] || {};

              // Create enriched move object, excluding learners and preserving original data
              const { learners, name, ...moveStats } = versionData;

              console.log(`Enriched move data for ${move.name}:`, versionData);
              return {
                name, // Preserve original move name
                level: move.level, // Preserve level if present
                ...moveStats, // Move stats (power, accuracy, etc.)
              };
            } else {
              // Invalid move data, return as-is
              console.warn(`Invalid move data:`, move);
              return move;
            }
          } catch (error) {
            console.warn(`Failed to load move data for:`, move, error);
            return move; // Return original data if enrichment fails
          }
        }),
      );
    } else {
      // Non-array movesets, keep as-is
      enrichedMovesets[movesetType] = moves;
    }
  }

  return enrichedMovesets;
}

/**
 * Helper function to enrich abilities with detailed ability data
 */
async function enrichAbilities(abilities: string[], versionName: string): Promise<any[]> {
  console.log(`Enriching ${abilities.length} abilities for version: ${versionName}`);

  return await Promise.all(
    abilities.map(async (abilityName: string) => {
      try {
        console.log(`Loading detailed data for ability: ${abilityName}`);
        const abilityData = await loadDetailedAbilityData(abilityName);
        const versionData = abilityData.versions?.[versionName] || {};

        // Extract description and other data, avoiding duplicates
        const { description, pokemon, ...otherVersionData } = versionData;

        return {
          id: abilityName,
          name: abilityData.name || abilityName,
          description: description || '',
          // Include any other version-specific data except pokemon (to avoid circular references)
          ...otherVersionData,
        };
      } catch (error) {
        console.warn(`Failed to load ability data for: ${abilityName}`, error);
        // Return basic ability info if enrichment fails
        return {
          id: abilityName,
          name: abilityName,
          description: '',
        };
      }
    }),
  );
}

/**
 * Helper function to get all forms for a Pokemon from comprehensive data
 */
export function getComprehensivePokemonForms(
  pokemon: ComprehensivePokemonData,
  version: 'polished' | 'faithful' = 'polished',
): string[] {
  return Object.keys(pokemon.versions?.[version]?.forms || {});
}

/**
 * Helper function to get Pokemon abilities from comprehensive data
 */
export function getComprehensivePokemonAbilities(
  pokemon: ComprehensivePokemonData,
  version: 'polished' | 'faithful' = 'polished',
  form: string = 'plain',
): string[] {
  return pokemon.versions?.[version]?.forms?.[form]?.abilities || [];
}

/**
 * Helper function to get Pokemon base stats from comprehensive data
 */
export function getComprehensivePokemonBaseStats(
  pokemon: ComprehensivePokemonData,
  version: 'polished' | 'faithful' = 'polished',
  form: string = 'plain',
) {
  return pokemon.versions?.[version]?.forms?.[form]?.baseStats || null;
}

/**
 * Helper function to get Pokemon movesets from comprehensive data
 */
export function getComprehensivePokemonMovesets(
  pokemon: ComprehensivePokemonData,
  version: 'polished' | 'faithful' = 'polished',
  form: string = 'plain',
) {
  return pokemon.versions?.[version]?.forms?.[form]?.movesets || null;
}
