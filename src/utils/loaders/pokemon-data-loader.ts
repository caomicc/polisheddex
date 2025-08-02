// Enhanced Pokemon data loader that works with compressed data and manifests

import { Move } from '@/types/types';
import { loadJsonFile } from '../fileLoader';
import {
  resolveAbilities,
  loadManifest,
  type CompressedAbility,
  type ExpandedAbility,
  type AbilityManifest,
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
 * Load all Pokemon data from the aggregated detailed stats file
 * This is used for the team builder and other bulk operations
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
 * Search Pokemon from aggregated data by name, type, or attributes
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
 * Get Pokemon by type from aggregated data
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

export type { CompressedPokemonData, ExpandedPokemonData };
