// Enhanced Pokemon data loader that works with compressed data and manifests

import { Move } from '@/types/types';
import { loadJsonFile } from '../fileLoader';
import {
  resolveAbilities,
  loadManifest,
  type CompressedAbility,
  type ExpandedAbility,
  type AbilityManifest,
  type PokemonManifest,
} from '../manifest-resolver';

interface CompressedPokemonData {
  name: string;
  nationalDex: number;
  johtoDex?: number;
  types: string | string[];
  updatedTypes?: string | string[];
  frontSpriteUrl: string;
  detailedStats: {
    baseStats: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
      specialAttack: number;
      specialDefense: number;
      total: number;
    };
    faithfulBaseStats?: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
      specialAttack: number;
      specialDefense: number;
      total: number;
    };
    polishedBaseStats?: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
      specialAttack: number;
      specialDefense: number;
      total: number;
    };
    catchRate: number;
    baseExp: number;
    heldItems: string[];
    genderRatio: {
      male: number;
      female: number;
    };
    hatchRate: string;
    abilities: (CompressedAbility | ExpandedAbility)[];
    faithfulAbilities?: (CompressedAbility | ExpandedAbility)[] | null;
    updatedAbilities?: (CompressedAbility | ExpandedAbility)[] | null;
    growthRate: string;
    eggGroups: string[];
    evYield: string;
    height: number;
    weight: number;
    bodyShape: string;
    bodyColor: string;
  };
  evolution?: any;
  levelMoves?: any;
  faithfulLevelMoves?: any;
  updatedLevelMoves?: any;
  tmHmMoves?: any;
  eggMoves?: Move[];
  locations?: any;
  pokedexEntries?: any;
  forms?: Record<string, any>;
}

interface ExpandedPokemonData extends Omit<CompressedPokemonData, 'detailedStats'> {
  detailedStats: Omit<
    CompressedPokemonData['detailedStats'],
    'abilities' | 'faithfulAbilities' | 'updatedAbilities'
  > & {
    abilities: ExpandedAbility[];
    faithfulAbilities?: ExpandedAbility[] | null;
    updatedAbilities?: ExpandedAbility[] | null;
  };
}

/**
 * Load and expand a single Pokemon's data with resolved abilities
 */
export async function loadPokemonData(
  pokemonName: string,
  faithful = false,
): Promise<ExpandedPokemonData | null> {
  try {
    // Load compressed Pokemon data
    const compressedData = await loadJsonFile<CompressedPokemonData>(
      `output/pokemon/${pokemonName}.json`,
    );
    if (!compressedData) {
      return null;
    }

    // Load abilities manifest
    const abilitiesManifest = await loadManifest<AbilityManifest>('abilities');

    // Helper function to check if abilities are already expanded
    const isAbilityExpanded = (ability: any): ability is ExpandedAbility => {
      return ability && typeof ability.name === 'string' && typeof ability.description === 'string';
    };

    // Helper function to handle mixed ability formats
    const resolveAbilitiesIfNeeded = async (abilities: any[]): Promise<ExpandedAbility[]> => {
      if (!abilities || abilities.length === 0) return [];

      // Check if abilities are already expanded
      if (abilities.every(isAbilityExpanded)) {
        return abilities as ExpandedAbility[];
      }

      // If they're compressed (have 'id' field), resolve them
      if (abilities.every((ability) => ability && typeof ability.id === 'string')) {
        return await resolveAbilities(abilities as CompressedAbility[], abilitiesManifest);
      }

      // Handle mixed or invalid format - filter and convert what we can
      const expandedAbilities: ExpandedAbility[] = [];
      for (const ability of abilities) {
        if (isAbilityExpanded(ability)) {
          expandedAbilities.push(ability);
        } else if (ability && typeof ability.id === 'string') {
          const resolved = await resolveAbilities(
            [ability as CompressedAbility],
            abilitiesManifest,
          );
          expandedAbilities.push(...resolved);
        }
      }
      return expandedAbilities;
    };

    // Determine which abilities to use and resolve them
    const primaryAbilities =
      faithful && compressedData.detailedStats.faithfulAbilities
        ? compressedData.detailedStats.faithfulAbilities
        : compressedData.detailedStats.abilities;

    const resolvedAbilities = await resolveAbilitiesIfNeeded(primaryAbilities);

    // Resolve faithful abilities if different
    let resolvedFaithfulAbilities: ExpandedAbility[] | null = null;
    if (compressedData.detailedStats.faithfulAbilities) {
      resolvedFaithfulAbilities = await resolveAbilitiesIfNeeded(
        compressedData.detailedStats.faithfulAbilities,
      );
    }

    let resolvedUpdatedAbilities: ExpandedAbility[] | null = null;
    if (compressedData.detailedStats.updatedAbilities) {
      resolvedUpdatedAbilities = await resolveAbilitiesIfNeeded(
        compressedData.detailedStats.updatedAbilities,
      );
    }

    // Return expanded data
    return {
      ...compressedData,
      detailedStats: {
        ...compressedData.detailedStats,
        abilities: resolvedAbilities,
        faithfulAbilities: resolvedFaithfulAbilities,
        updatedAbilities: resolvedUpdatedAbilities,
      },
    };
  } catch (error) {
    console.error(`Error loading Pokemon data for ${pokemonName}:`, error);
    return null;
  }
}

/**
 * Load Pokemon data in the legacy format for backward compatibility
 */
export async function loadPokemonDataLegacy(pokemonName: string): Promise<any> {
  const expandedData = await loadPokemonData(pokemonName);
  if (!expandedData) return null;

  // Convert back to legacy format if needed
  return expandedData;
}

/**
 * Load multiple Pokemon data efficiently by preloading manifests
 */
export async function loadMultiplePokemonData(
  pokemonNames: string[],
): Promise<(ExpandedPokemonData | null)[]> {
  try {
    // Preload the abilities manifest once
    const abilitiesManifest = await loadManifest<AbilityManifest>('abilities');

    // Helper function to check if abilities are already expanded
    const isAbilityExpanded = (ability: any): ability is ExpandedAbility => {
      return ability && typeof ability.name === 'string' && typeof ability.description === 'string';
    };

    // Helper function to handle mixed ability formats
    const resolveAbilitiesIfNeeded = async (abilities: any[]): Promise<ExpandedAbility[]> => {
      if (!abilities || abilities.length === 0) return [];

      // Check if abilities are already expanded
      if (abilities.every(isAbilityExpanded)) {
        return abilities as ExpandedAbility[];
      }

      // If they're compressed (have 'id' field), resolve them
      if (abilities.every((ability) => ability && typeof ability.id === 'string')) {
        return await resolveAbilities(abilities as CompressedAbility[], abilitiesManifest);
      }

      // Handle mixed or invalid format - filter and convert what we can
      const expandedAbilities: ExpandedAbility[] = [];
      for (const ability of abilities) {
        if (isAbilityExpanded(ability)) {
          expandedAbilities.push(ability);
        } else if (ability && typeof ability.id === 'string') {
          const resolved = await resolveAbilities(
            [ability as CompressedAbility],
            abilitiesManifest,
          );
          expandedAbilities.push(...resolved);
        }
      }
      return expandedAbilities;
    };

    // Load all Pokemon data in parallel
    const results = await Promise.all(
      pokemonNames.map(async (name) => {
        try {
          const compressedData = await loadJsonFile<CompressedPokemonData>(
            `output/pokemon/${name}.json`,
          );
          if (!compressedData) return null;

          // Resolve abilities with the preloaded manifest
          const resolvedAbilities = await resolveAbilitiesIfNeeded(
            compressedData.detailedStats.abilities,
          );

          let resolvedFaithfulAbilities: ExpandedAbility[] | null = null;
          if (compressedData.detailedStats.faithfulAbilities) {
            resolvedFaithfulAbilities = await resolveAbilitiesIfNeeded(
              compressedData.detailedStats.faithfulAbilities,
            );
          }

          let resolvedUpdatedAbilities: ExpandedAbility[] | null = null;
          if (compressedData.detailedStats.updatedAbilities) {
            resolvedUpdatedAbilities = await resolveAbilitiesIfNeeded(
              compressedData.detailedStats.updatedAbilities,
            );
          }

          return {
            ...compressedData,
            detailedStats: {
              ...compressedData.detailedStats,
              abilities: resolvedAbilities,
              faithfulAbilities: resolvedFaithfulAbilities,
              updatedAbilities: resolvedUpdatedAbilities,
            },
          };
        } catch (error) {
          console.error(`Error loading Pokemon data for ${name}:`, error);
          return null;
        }
      }),
    );

    return results;
  } catch (error) {
    console.error('Error loading multiple Pokemon data:', error);
    return pokemonNames.map(() => null);
  }
}

/**
 * Load all Pokemon data using the manifest system (preferred method)
 */
export async function loadAllPokemonDataFromManifest(): Promise<PokemonManifest> {
  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the pokemon manifest directly
      const pokemonManifest = await loadManifest<PokemonManifest>('pokemon');
      console.log('Loaded Pokemon manifest from server:', Object.keys(pokemonManifest).length);
      return pokemonManifest;
    } else {
      // Client-side: Use fetch
      const response = await fetch('/output/manifests/pokemon.json');
      if (!response.ok) {
        throw new Error('Failed to load pokemon manifest on client');
      }
      return await response.json();
    }
  } catch (error) {
    console.error('Error loading pokemon manifest:', error);
    try {
      const fallbackData = await loadJsonFile<Record<string, any>>('/output/pokemon/_index.json');
      return fallbackData || {};
    } catch (fallbackError) {
      console.error('Failed to load fallback pokemon data:', fallbackError);
      return {};
    }
  }
}

/**
 * Load all Pokemon data from the aggregated detailed stats file
 * This is used for the team builder and other bulk operations
 * @deprecated Use loadAllPokemonDataFromManifest() for better performance
 */
export async function loadAllPokemonData(): Promise<Record<string, any>> {
  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load directly from filesystem
      const pokemonData = await loadJsonFile<Record<string, any>>(
        'output/pokemon_detailed_stats.json',
      );
      return pokemonData || {};
    } else {
      // Client-side: Use fetch (fallback)
      const response = await fetch('/output/pokemon_detailed_stats.json');
      if (!response.ok) {
        throw new Error('Failed to load Pokemon detailed stats');
      }
      return await response.json();
    }
  } catch (error) {
    console.error('Error loading all Pokemon data:', error);
    return {};
  }
}

/**
 * Search Pokemon using the manifest system (preferred method)
 */
export async function searchPokemonFromManifest(
  query: string,
  faithful: boolean = false,
): Promise<any[]> {
  try {
    const pokemonManifest = await loadAllPokemonDataFromManifest();
    const allPokemon = Object.values(pokemonManifest);

    const queryLower = query.toLowerCase();

    return allPokemon.filter((pokemon) => {
      if (!pokemon || typeof pokemon !== 'object') return false;

      // Search in name
      if (pokemon.name && pokemon.name.toLowerCase().includes(queryLower)) {
        return true;
      }

      // Search in types based on faithful/polished preference
      const types = faithful ? pokemon.types.faithful : pokemon.types.polished;

      if (types && Array.isArray(types)) {
        if (types.some((type: string) => type.toLowerCase().includes(queryLower))) {
          return true;
        }
      }

      // Search in forms
      if (pokemon.forms && Array.isArray(pokemon.forms)) {
        if (pokemon.forms.some((form: string) => form.toLowerCase().includes(queryLower))) {
          return true;
        }
      }

      return false;
    });
  } catch (error) {
    console.error('Error searching Pokemon from manifest:', error);
    return [];
  }
}

/**
 * Search Pokemon from aggregated data by name, type, or attributes
 * @deprecated Use searchPokemonFromManifest() for better performance
 */
export async function searchAllPokemon(query: string, faithful: boolean = false): Promise<any[]> {
  try {
    const allPokemonData = await loadAllPokemonData();
    const allPokemon = Object.values(allPokemonData);

    const queryLower = query.toLowerCase();

    return allPokemon.filter((pokemon: any) => {
      if (!pokemon || typeof pokemon !== 'object') return false;

      // Search in name
      if (pokemon.name && pokemon.name.toLowerCase().includes(queryLower)) {
        return true;
      }

      // Search in types
      const types = faithful
        ? pokemon.faithfulTypes || pokemon.types
        : pokemon.updatedTypes || pokemon.types;

      if (types) {
        const typeArray = Array.isArray(types) ? types : types.split('/');
        if (typeArray.some((type: string) => type.toLowerCase().includes(queryLower))) {
          return true;
        }
      }

      return false;
    });
  } catch (error) {
    console.error('Error searching all Pokemon:', error);
    return [];
  }
}

/**
 * Get Pokemon by type using the manifest system (preferred method)
 */
export async function getPokemonByTypeFromManifest(
  type: string,
  faithful: boolean = false,
): Promise<any[]> {
  try {
    const pokemonManifest = await loadAllPokemonDataFromManifest();
    const allPokemon = Object.values(pokemonManifest);
    const typeLower = type.toLowerCase();

    return allPokemon.filter((pokemon) => {
      if (!pokemon || typeof pokemon !== 'object') return false;

      const types = faithful ? pokemon.types.faithful : pokemon.types.polished;

      if (!types || !Array.isArray(types)) return false;

      return types.some((t: string) => t.toLowerCase() === typeLower);
    });
  } catch (error) {
    console.error(`Error loading Pokemon for type ${type} from manifest:`, error);
    return [];
  }
}

/**
 * Get Pokemon by type from aggregated data
 * @deprecated Use getPokemonByTypeFromManifest() for better performance
 */
export async function getAllPokemonByType(type: string, faithful: boolean = false): Promise<any[]> {
  try {
    const allPokemonData = await loadAllPokemonData();
    const allPokemon = Object.values(allPokemonData);
    const typeLower = type.toLowerCase();

    return allPokemon.filter((pokemon: any) => {
      if (!pokemon || typeof pokemon !== 'object') return false;

      const types = faithful
        ? pokemon.faithfulTypes || pokemon.types
        : pokemon.updatedTypes || pokemon.types;

      if (!types) return false;

      const typeArray = Array.isArray(types) ? types : types.split('/');
      return typeArray.some((t: string) => t.toLowerCase() === typeLower);
    });
  } catch (error) {
    console.error(`Error loading Pokemon for type ${type}:`, error);
    return [];
  }
}

/**
 * Load a specific Pokemon by ID from the manifest
 */
export async function loadPokemonFromManifest(pokemonId: string): Promise<any | null> {
  try {
    const pokemonManifest = await loadAllPokemonDataFromManifest();
    return pokemonManifest[pokemonId] || null;
  } catch (error) {
    console.error(`Error loading Pokemon ${pokemonId} from manifest:`, error);
    return null;
  }
}

/**
 * Load multiple Pokemon by IDs from the manifest efficiently
 */
export async function loadMultiplePokemonFromManifest(
  pokemonIds: string[],
): Promise<(any | null)[]> {
  try {
    const pokemonManifest = await loadAllPokemonDataFromManifest();
    return pokemonIds.map((id) => pokemonManifest[id] || null);
  } catch (error) {
    console.error('Error loading multiple Pokemon from manifest:', error);
    return pokemonIds.map(() => null);
  }
}

/**
 * Get all available Pokemon forms from the manifest
 */
export async function getAllPokemonForms(): Promise<Record<string, string[]>> {
  try {
    const pokemonManifest = await loadAllPokemonDataFromManifest();
    const formsData: Record<string, string[]> = {};

    Object.entries(pokemonManifest).forEach(([pokemonId, pokemon]) => {
      if (pokemon.forms && pokemon.forms.length > 1) {
        formsData[pokemonId] = pokemon.forms;
      }
    });

    return formsData;
  } catch (error) {
    console.error('Error loading Pokemon forms:', error);
    return {};
  }
}

/**
 * Get Pokemon count by generation or region
 */
export async function getPokemonCountByGeneration(): Promise<{
  johto: number;
  national: number;
  total: number;
}> {
  try {
    const pokemonManifest = await loadAllPokemonDataFromManifest();
    const allPokemon = Object.values(pokemonManifest);

    const johtoCount = allPokemon.filter((pokemon) => pokemon.johtoNumber !== null).length;
    const totalCount = allPokemon.length;

    return {
      johto: johtoCount,
      national: totalCount,
      total: totalCount,
    };
  } catch (error) {
    console.error('Error counting Pokemon:', error);
    return { johto: 0, national: 0, total: 0 };
  }
}

/**
 * Convert Pokemon manifest data to BaseData format for compatibility
 * This replaces the missing pokemon-base-data-loader functionality
 */
export async function loadPokemonBaseDataFromManifest(): Promise<Record<string, any>> {
  try {
    const pokemonManifest = await loadAllPokemonDataFromManifest();
    const baseData: Record<string, any> = {};

    Object.entries(pokemonManifest).forEach(([pokemonId, pokemon]) => {
      // Convert manifest data to BaseData format
      baseData[pokemonId] = {
        name: pokemon.name,
        nationalDex: pokemon.nationalNumber,
        johtoDex: pokemon.johtoNumber,
        // Default to polished types (this matches the original behavior)
        types: pokemon.types.polished,
        faithfulTypes: pokemon.types.faithful,
        updatedTypes: pokemon.types.polished,
        frontSpriteUrl: pokemon.spriteUrl,
        normalizedUrl: pokemonId,
        forms: pokemon.forms.length > 1 ? {} : undefined, // TODO: Could expand this if needed
      };
    });

    return baseData;
  } catch (error) {
    console.error('Error loading Pokemon base data from manifest:', error);
    return {};
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use loadPokemonBaseDataFromManifest() instead
 */
export async function loadPokemonBaseData(): Promise<Record<string, any>> {
  return loadPokemonBaseDataFromManifest();
}

export type { CompressedPokemonData, ExpandedPokemonData, PokemonManifest };
