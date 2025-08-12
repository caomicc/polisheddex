import type { PokemonEntry } from '@/components/pokemon-slot';
import { Ability, PokemonType } from '@/types/types';

export type PokemonBasic = {
  name: string;
  types: (PokemonType['name'] | null)[];
  abilities?: Ability[];
  fileName?: string; // Add fileName to help with fetching individual Pokemon data
  formName?: string; // Add formName to distinguish between different forms
};

// Types for the manifest structure
type PokemonManifestEntry = {
  name: string;
  johtoNumber: number | null;
  nationalNumber: number;
  spriteUrl: string;
  types: {
    faithful: string[];
    polished: string[];
  };
  forms: string[];
};

type PokemonBaseEntry = {
  name: string;
  types: string[] | string;
  [key: string]: unknown;
};

type PokemonDetailedEntry = {
  name: string;
  types?: string[] | string;
  updatedTypes?: string[] | string;
  forms?: Record<string, unknown>;
  [key: string]: unknown;
};

type SimplePokemonEntry = {
  name: string;
  nationalDex: number;
  johtoDex: number | null;
  types: string[];
  frontSpriteUrl: string;
  fileName: string;
};

// Initialize with empty array to prevent key errors
export const POKEMON_LIST: PokemonBasic[] = [];

// Initialize Pokemon data when module loads (only on client side)
if (typeof window !== 'undefined') {
  loadPokemonData().catch(console.error);
}

// Function to normalize type names to match PokemonType['name']
export function normalizeTypeName(type: string): PokemonType['name'] | null {
  const normalizedType = type.toLowerCase() as PokemonType['name'];
  const validTypes: PokemonType['name'][] = [
    'normal',
    'fire',
    'water',
    'electric',
    'grass',
    'ice',
    'fighting',
    'poison',
    'ground',
    'flying',
    'psychic',
    'bug',
    'rock',
    'ghost',
    'dragon',
    'dark',
    'steel',
    'fairy',
  ];

  return validTypes.includes(normalizedType) ? normalizedType : null;
}

// Function to format Pokemon names for display (kebab-case to Title Case)
function formatPokemonDisplayName(name: string): string {
  // Handle special cases and convert kebab-case to title case
  return name
    .split('-')
    .map((word) => {
      // Handle special cases
      if (word === 'jr') return 'Jr.';
      if (word === 'mr') return 'Mr.';
      if (word === 'mime') return 'Mime';
      if (word === 'f') return '♀';
      if (word === 'm') return '♂';
      if (word === 'ho' && name.includes('ho-oh')) return 'Ho';
      if (word === 'oh' && name.includes('ho-oh')) return 'Oh';

      // Standard title case
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Function to load real Pokemon data using client-side fetch
export async function loadPokemonData(): Promise<PokemonBasic[]> {
  try {
    // First try to load from the simple pokemon.json file (fastest and most reliable)
    const simpleResponse = await fetch('/pokemon.json');
    if (simpleResponse.ok) {
      const data = (await simpleResponse.json()) as { pokemon: SimplePokemonEntry[] };

      // Create a list that will include both base Pokemon and their forms
      const pokemonList: PokemonBasic[] = [];

      for (const pokemon of data.pokemon) {
        // Add the base Pokemon entry
        let typeArray: (PokemonType['name'] | null)[] = [];

        if (Array.isArray(pokemon.types)) {
          typeArray = pokemon.types.map((t: string) => normalizeTypeName(t)).slice(0, 2);
        }

        // Ensure we always have exactly 2 elements
        while (typeArray.length < 2) {
          typeArray.push(null);
        }

        const basePokemon: PokemonBasic = {
          name: formatPokemonDisplayName(pokemon.name),
          types: [typeArray[0], typeArray[1]],
          abilities: undefined, // Abilities loaded separately when needed
          fileName: pokemon.fileName, // Include fileName for easier fetching
        };

        pokemonList.push(basePokemon);

        // Now check if this Pokemon has additional forms by loading its individual file
        try {
          const pokemonDetailResponse = await fetch(`/output/pokemon/${pokemon.fileName}`);
          if (pokemonDetailResponse.ok) {
            const pokemonDetail = await pokemonDetailResponse.json();

            // Check if it has forms other than 'plain'
            if (pokemonDetail.forms && typeof pokemonDetail.forms === 'object') {
              const formNames = Object.keys(pokemonDetail.forms);

              for (const formName of formNames) {
                if (formName !== 'plain') {
                  // Skip the plain form as it's the base
                  const formData = pokemonDetail.forms[formName];

                  // Get types for this form
                  const formTypes =
                    formData.updatedTypes || formData.types || formData.faithfulTypes || [];
                  let formTypeArray: (PokemonType['name'] | null)[] = [];

                  if (Array.isArray(formTypes)) {
                    formTypeArray = formTypes.map((t: string) => normalizeTypeName(t)).slice(0, 2);
                  } else if (typeof formTypes === 'string') {
                    formTypeArray = [normalizeTypeName(formTypes), null];
                  }

                  // Ensure we always have exactly 2 elements
                  while (formTypeArray.length < 2) {
                    formTypeArray.push(null);
                  }

                  // Create form entry with a descriptive name
                  const formDisplayName = `${formatPokemonDisplayName(pokemon.name)} (${formatPokemonDisplayName(formName)})`;

                  const formPokemon: PokemonBasic = {
                    name: formDisplayName,
                    types: [formTypeArray[0], formTypeArray[1]],
                    abilities: undefined,
                    fileName: pokemon.fileName,
                    formName: formName, // Add formName to distinguish forms
                  };

                  pokemonList.push(formPokemon);
                }
              }
            }
          }
        } catch (error) {
          // If we can't load individual Pokemon data, just continue with base entry
          console.warn(`Could not load forms for ${pokemon.name}:`, error);
        }
      }

      // Sort alphabetically
      pokemonList.sort((a, b) => a.name.localeCompare(b.name));

      // Update the exported list
      POKEMON_LIST.splice(0, POKEMON_LIST.length, ...pokemonList);

      return pokemonList;
    }
    // First try to load from the Pokemon manifest (preferred method)
    const manifestResponse = await fetch('/output/manifests/pokemon.json');
    if (manifestResponse.ok) {
      const pokemonManifest = (await manifestResponse.json()) as Record<
        string,
        PokemonManifestEntry
      >;

      const pokemonList: PokemonBasic[] = Object.entries(pokemonManifest).map(([key, pokemon]) => {
        // Get types - prefer polished types for UI display, but keep faithful as fallback
        const typesData = pokemon.types?.polished || pokemon.types?.faithful || [];

        let typeArray: (PokemonType['name'] | null)[] = [];

        if (Array.isArray(typesData)) {
          typeArray = typesData.map((t: string) => normalizeTypeName(t)).slice(0, 2);
        }

        // Ensure we always have exactly 2 elements
        while (typeArray.length < 2) {
          typeArray.push(null);
        }

        // For abilities, we'll rely on individual Pokemon files when needed
        // The manifest doesn't include full ability data to keep it lightweight
        const abilities: Ability[] = [];

        return {
          name: pokemon.name || key.charAt(0).toUpperCase() + key.slice(1),
          types: [typeArray[0], typeArray[1]],
          abilities: abilities.length > 0 ? abilities : undefined,
        };
      });

      // Sort alphabetically
      pokemonList.sort((a, b) => a.name.localeCompare(b.name));

      // Update the exported list
      POKEMON_LIST.splice(0, POKEMON_LIST.length, ...pokemonList);

      return pokemonList;
    }

    // Fallback to base data if manifest fails
    const baseResponse = await fetch('/output/pokemon_base_data.json');
    if (baseResponse.ok) {
      const baseData = (await baseResponse.json()) as Record<string, PokemonBaseEntry>;
      const pokemonList: PokemonBasic[] = Object.entries(baseData).map(([key, pokemon]) => {
        let typeArray: (PokemonType['name'] | null)[] = [];

        if (Array.isArray(pokemon.types)) {
          typeArray = pokemon.types.map((t: string) => normalizeTypeName(t)).slice(0, 2);
        } else if (pokemon.types && typeof pokemon.types === 'string') {
          typeArray = pokemon.types
            .split('/')
            .map((t: string) => normalizeTypeName(t.trim()))
            .slice(0, 2);
        }

        // Ensure we always have exactly 2 elements
        while (typeArray.length < 2) {
          typeArray.push(null);
        }

        return {
          name: pokemon.name || key.charAt(0).toUpperCase() + key.slice(1),
          types: [typeArray[0], typeArray[1]],
          abilities: undefined, // Abilities loaded separately when needed
        };
      });

      pokemonList.sort((a, b) => a.name.localeCompare(b.name));
      POKEMON_LIST.splice(0, POKEMON_LIST.length, ...pokemonList);
      return pokemonList;
    }

    // Final fallback to detailed stats
    const detailedResponse = await fetch('/output/pokemon_detailed_stats.json');
    if (detailedResponse.ok) {
      const pokemonData = (await detailedResponse.json()) as Record<string, PokemonDetailedEntry>;

      const pokemonList: PokemonBasic[] = Object.entries(pokemonData).map(([key, pokemon]) => {
        // Get the default form data (usually 'plain' form)
        const formData =
          pokemon.forms && typeof pokemon.forms === 'object'
            ? (Object.values(pokemon.forms)[0] as PokemonDetailedEntry)
            : pokemon;

        // Get types - prefer updated types, fall back to faithful/base types
        const types =
          formData.updatedTypes || formData.types || pokemon.updatedTypes || pokemon.types;

        let typeArray: (PokemonType['name'] | null)[] = [];

        if (Array.isArray(types)) {
          typeArray = types.map((t: string) => normalizeTypeName(t)).slice(0, 2);
        } else if (types && typeof types === 'string') {
          typeArray = types
            .split('/')
            .map((t: string) => normalizeTypeName(t.trim()))
            .slice(0, 2);
        }

        // Ensure we always have exactly 2 elements
        while (typeArray.length < 2) {
          typeArray.push(null);
        }

        return {
          name: pokemon.name || key.charAt(0).toUpperCase() + key.slice(1),
          types: [typeArray[0], typeArray[1]],
          abilities: undefined, // Abilities loaded separately when needed
        };
      });

      // Sort alphabetically
      pokemonList.sort((a, b) => a.name.localeCompare(b.name));

      // Update the exported list
      POKEMON_LIST.splice(0, POKEMON_LIST.length, ...pokemonList);

      return pokemonList;
    }

    throw new Error('Failed to load Pokemon data from all sources');
  } catch (error) {
    console.error('Failed to load Pokemon data:', error);
    return [];
  }
}

export const emptyPokemonEntry: PokemonEntry = {
  name: '',
  types: [], // Empty array instead of nulls - the component will handle this
  ability: '',
  nature: undefined,
  item: undefined,
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
