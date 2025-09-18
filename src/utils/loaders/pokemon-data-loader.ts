// Enhanced Pokemon data loader that works with compressed data and manifests

import { loadJsonFile } from '../fileLoader';
import { PokemonManifest, PokemonManifestCollection, ComprehensivePokemonData } from '@/types/new';

/**
 * Load Pokemon data from the new manifest structure (new/pokemon_manifest.json)
 * This function handles the new flattened array structure with version-specific data
 */
export async function loadPokemonFromNewManifest(): Promise<PokemonManifestCollection> {
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
      const baseData: PokemonManifestCollection = {};

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
      const baseData: PokemonManifestCollection = {};

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
export function getPokemonTypes(
  pokemon: PokemonManifest,
  version: 'polished' | 'faithful' = 'polished',
  form: string = 'plain',
): string[] {
  return pokemon.versions?.[version]?.[form]?.types || [];
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
export async function loadPokemonData(pokemonId: string): Promise<ComprehensivePokemonData | null> {
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
 * Load multiple Pokemon data files by their IDs
 */
export async function loadMultiplePokemonData(
  pokemonIds: string[],
): Promise<{ [pokemonId: string]: ComprehensivePokemonData }> {
  try {
    console.log(`Loading ${pokemonIds.length} Pokemon data files...`);

    const results: { [pokemonId: string]: ComprehensivePokemonData } = {};

    // Load all Pokemon data in parallel
    const promises = pokemonIds.map(async (id) => {
      const data = await loadPokemonData(id);
      if (data) {
        results[id] = data;
      }
    });

    await Promise.all(promises);

    console.log(
      `Successfully loaded ${Object.keys(results).length}/${pokemonIds.length} Pokemon data files`,
    );
    return results;
  } catch (error) {
    console.error('Error loading multiple Pokemon data:', error);
    return {};
  }
}

/**
 * Helper function to get Pokemon types from comprehensive data
 */
export function getComprehensivePokemonTypes(
  pokemon: ComprehensivePokemonData,
  version: 'polished' | 'faithful' = 'polished',
  form: string = 'plain',
): string[] {
  return pokemon.versions?.[version]?.forms?.[form]?.types || [];
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
