/**
 * Pokemon data type definitions
 */

// Import types from the original codebase to maintain compatibility
import {
  BaseData,
  DetailedStats,
  Evolution,
  EvoRaw,
  LocationEntry,
  Move,
  PokemonDataV2,
  PokemonDataV3,
  PokemonDexEntry
} from '../../src/types/types.ts';

// Re-export for use in this module
export type {
  BaseData,
  DetailedStats,
  Evolution,
  EvoRaw,
  LocationEntry,
  Move,
  PokemonDataV2,
  PokemonDataV3,
  PokemonDexEntry
};

// Additional types specific to the extraction process

export interface AbilityDescription {
  description: string;
}

export interface MoveDescription {
  description: string;
  type: string;
  pp: number;
  power: number;
  category: string;
  accuracy: number;
}

export interface WildmonEntry {
  pokemon: string;
  form: string | null;
  level: number;
  fullName?: string;
}

export interface PokemonDetailedStats {
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spatk: number;
    spdef: number;
    speed: number;
  };
  catchRate: number;
  baseExp: number;
  heldItems: string[];
  genderRatio: string;
  hatchRate: string;
  abilities: string[];
  growthRate: string;
  eggGroups: string[];
  evYield: string;
}
