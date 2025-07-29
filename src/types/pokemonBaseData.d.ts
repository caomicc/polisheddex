import { Moves } from '@/types/types';
declare module '@/output/pokemon_base_data.json' {
  export interface PokemonBaseData {
    name: string;
    moves: Moves[];
    nationalDex: number;
    johtoDex: number;
    types: string[];
    updatedTypes: string[];
    frontSpriteUrl: string;
    baseStats: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
      specialAttack: number;
      specialDefense: number;
      total: number;
    };
    faithfulAbilities: string[];
    updatedAbilities: string[];
    catchRate: number;
    baseExp: number;
    heldItems: string[];
    abilities: string[];
    growthRate: string;
    eggGroups: string[];
    genderRatio: {
      male: number;
      female: number;
    };
    hatchRate: string;
    evYield: string;
    forms?: Record<string, { types: string[]; updatedTypes: string[] }>;
  }

  const pokemonBaseData: Record<string, PokemonBaseData>;
  export default pokemonBaseData;
}
