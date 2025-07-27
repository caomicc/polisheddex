// Enhanced Pokemon data loader that works with compressed data and manifests

import { loadJsonFile } from './fileLoader';
import {
  resolveAbilities,
  loadManifest,
  type CompressedAbility,
  type ExpandedAbility,
  type AbilityManifest,
} from './manifest-resolver';

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
    catchRate: number;
    baseExp: number;
    heldItems: string[];
    genderRatio: {
      male: number;
      female: number;
    };
    hatchRate: string;
    abilities: CompressedAbility[];
    faithfulAbilities?: CompressedAbility[] | null;
    updatedAbilities?: CompressedAbility[] | null;
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
  eggMoves?: string[];
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

    // Determine which abilities to use
    const abilitiesToResolve =
      faithful && compressedData.detailedStats.faithfulAbilities
        ? compressedData.detailedStats.faithfulAbilities
        : compressedData.detailedStats.abilities;

    // Resolve abilities
    const resolvedAbilities = await resolveAbilities(abilitiesToResolve, abilitiesManifest);

    // Resolve faithful abilities if different
    let resolvedFaithfulAbilities: ExpandedAbility[] | null = null;
    if (compressedData.detailedStats.faithfulAbilities) {
      resolvedFaithfulAbilities = await resolveAbilities(
        compressedData.detailedStats.faithfulAbilities,
        abilitiesManifest,
      );
    }

    let resolvedUpdatedAbilities: ExpandedAbility[] | null = null;
    if (compressedData.detailedStats.updatedAbilities) {
      resolvedUpdatedAbilities = await resolveAbilities(
        compressedData.detailedStats.updatedAbilities,
        abilitiesManifest,
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

    // Load all Pokemon data in parallel
    const results = await Promise.all(
      pokemonNames.map(async (name) => {
        try {
          const compressedData = await loadJsonFile<CompressedPokemonData>(
            `output/pokemon/${name}.json`,
          );
          if (!compressedData) return null;

          // Resolve abilities with the preloaded manifest
          const resolvedAbilities = await resolveAbilities(
            compressedData.detailedStats.abilities,
            abilitiesManifest,
          );

          let resolvedFaithfulAbilities: ExpandedAbility[] | null = null;
          if (compressedData.detailedStats.faithfulAbilities) {
            resolvedFaithfulAbilities = await resolveAbilities(
              compressedData.detailedStats.faithfulAbilities,
              abilitiesManifest,
            );
          }

          let resolvedUpdatedAbilities: ExpandedAbility[] | null = null;
          if (compressedData.detailedStats.updatedAbilities) {
            resolvedUpdatedAbilities = await resolveAbilities(
              compressedData.detailedStats.updatedAbilities,
              abilitiesManifest,
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

export type { CompressedPokemonData, ExpandedPokemonData };
