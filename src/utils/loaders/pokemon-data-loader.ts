// Enhanced Pokemon data loader that works with compressed data and manifests

import { loadJsonFile } from '../fileLoader';
import { PokemonManifest, ComprehensivePokemonData, PokemonMovesets } from '@/types/new';
import { getMoveData } from '../move-data-server';
import { getAbilityData } from '../ability-data-server';
import { getPokemonFileName } from '@/lib/extract-utils';
import { loadDetailedItemData } from './item-data-loader';

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
      const pokemonArray = await loadJsonFile<PokemonManifest[]>(
        'public/new/pokemon_manifest.json',
      );

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
    // Normalize the pokemon ID to get the correct filename
    const fileName = getPokemonFileName(pokemonId);

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the individual pokemon file directly
      const pokemonData = await loadJsonFile<ComprehensivePokemonData>(
        `public/new/pokemon/${fileName}`,
      );

      if (!pokemonData) {
        console.error(`Pokemon data not found for: ${pokemonId} (${fileName})`);
        return null;
      }

      return pokemonData;
    } else {
      // Client-side: Use fetch
      const response = await fetch(`/new/pokemon/${fileName}`);
      if (!response.ok) {
        console.error(
          `Failed to load Pokemon data for: ${pokemonId} (${fileName}) - ${response.status}`,
        );
        return null;
      }

      const pokemonData = (await response.json()) as ComprehensivePokemonData;

      if (!pokemonData || !pokemonData.id) {
        console.error(`Invalid Pokemon data structure for: ${pokemonId} (${fileName})`);
        return null;
      }

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

        // Enrich held items
        const enrichedHeldItems = formData.heldItems
          ? await enrichHeldItems(formData.heldItems as HeldItem[], versionName)
          : undefined;

        enrichedForms[formName] = {
          ...formData,
          movesets: enrichedMovesets,
          abilities: enrichedAbilities,
          heldItems: enrichedHeldItems,
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
              const moveData = await getMoveData(move, versionName as 'faithful' | 'polished');

              if (moveData) {
                // Create enriched move object
                return {
                  name: moveData.name,
                  type: moveData.type,
                  power: moveData.power,
                  accuracy: moveData.accuracy,
                  pp: moveData.pp,
                  effectChance: moveData.effectChance,
                  category: moveData.category,
                  description: moveData.description,
                };
              }
              return { name: move }; // Fallback if move data not found
            } else if (move && typeof move === 'object' && (move.id || move.name)) {
              // Move with additional properties (like level-up moves)
              // Support both 'id' and 'name' fields for move lookup
              const moveId = move.id || move.name;
              const moveData = await getMoveData(moveId, versionName as 'faithful' | 'polished');

              if (moveData) {
                return {
                  id: moveId,
                  name: moveData.name,
                  level: move.level, // Preserve level if present
                  type: moveData.type,
                  power: moveData.power,
                  accuracy: moveData.accuracy,
                  pp: moveData.pp,
                  effectChance: moveData.effectChance,
                  category: moveData.category,
                  description: moveData.description,
                };
              }

              // Fallback if move data not found
              return {
                id: moveId,
                name: moveId,
                level: move.level,
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
        const abilityData = await getAbilityData(
          abilityName,
          versionName as 'faithful' | 'polished',
        );

        if (abilityData) {
          return {
            id: abilityData.id,
            name: abilityData.name,
            description: abilityData.description,
          };
        } else {
          // Return basic ability info if ability data not found
          return {
            id: abilityName,
            name: abilityName,
            description: '',
          };
        }
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

interface HeldItem {
  id: string;
  rarity: 'common' | 'rare' | 'always';
}

interface EnrichedHeldItem extends HeldItem {
  name: string;
}

/**
 * Helper function to enrich held items with display names
 */
async function enrichHeldItems(
  heldItems: HeldItem[],
  versionName: string,
): Promise<EnrichedHeldItem[]> {
  return await Promise.all(
    heldItems.map(async (item) => {
      try {
        const itemData = await loadDetailedItemData(item.id);
        const versionData = itemData?.versions?.[versionName];

        if (versionData?.name) {
          return {
            ...item,
            name: versionData.name,
          };
        } else {
          // Fallback: format the ID as a readable name
          return {
            ...item,
            name: item.id
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/_/g, ' ')
              .split(' ')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
          };
        }
      } catch (error) {
        console.warn(`Failed to load item data for: ${item.id}`, error);
        // Fallback: format the ID as a readable name
        return {
          ...item,
          name: item.id
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
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
