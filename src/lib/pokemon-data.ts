import type { PokemonEntry } from '@/components/pokemon-slot';
import { Ability, DetailedStats } from '@/types/types';

export type PokemonBasic = {
  name: string;
  types: (string | null)[];
  abilities?: Ability[];
};

// Initialize with empty array to prevent key errors
export const POKEMON_LIST: PokemonBasic[] = [];

// Function to load real Pokemon data
export async function loadPokemonData(): Promise<PokemonBasic[]> {
  try {
    const response = await fetch('/output/pokemon_detailed_stats.json');
    const pokemonData: Record<string, DetailedStats> = await response.json();

    const pokemonList: PokemonBasic[] = Object.entries(pokemonData).map(([key, pokemon]) => {
      // Get the default form data (usually 'plain' form)
      const formData = pokemon.forms ? pokemon.forms[Object.keys(pokemon.forms)[0]] : pokemon;

      // Get types - prefer updated types, fall back to faithful/base types
      const types =
        formData.updatedTypes || formData.types || pokemon.updatedTypes || pokemon.types;

      console.log('Types:', types);

      const typeArray = Array.isArray(types)
        ? types.map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
        : typeof types === 'string'
          ? types.split('/').map((t) => t.trim().charAt(0).toUpperCase() + t.slice(1).toLowerCase())
          : ['Normal'];

      console.log('typeArray:', typeArray, typeof typeArray, [
        typeArray[0] || null,
        typeArray[1] || null,
      ]);

      // Get abilities - prefer updated abilities, fall back to faithful/base abilities
      const abilities =
        formData.updatedAbilities ||
        formData.abilities ||
        pokemon.updatedAbilities ||
        pokemon.abilities;
      // Ensure abilities is an array of Ability objects
      const abilityObjects: Ability[] =
        abilities?.filter(
          (ability): ability is Ability => typeof ability === 'object' && ability !== null,
        ) || [];

      return {
        name: pokemon.name || key.charAt(0).toUpperCase() + key.slice(1),
        types: [typeArray[0] || null, typeArray[1] || null],
        abilities: abilityObjects.length > 0 ? abilityObjects : undefined,
      };
    });

    // Sort alphabetically
    pokemonList.sort((a, b) => a.name.localeCompare(b.name));

    // Update the exported list
    POKEMON_LIST.splice(0, POKEMON_LIST.length, ...pokemonList);

    return pokemonList;
  } catch (error) {
    console.error('Failed to load Pokemon data:', error);
    // Return empty array as fallback
    return [];
  }
}

export const emptyPokemonEntry: PokemonEntry = {
  name: '',
  types: [null, null],
  ability: '',
  moves: [
    { name: '', type: null },
    { name: '', type: null },
    { name: '', type: null },
    { name: '', type: null },
  ],
};

export const DEFAULT_TEAM: PokemonEntry[] = new Array(6)
  .fill(0)
  .map(() => ({ ...emptyPokemonEntry }));
