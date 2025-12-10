/**
 * Static Pokemon data loader for loading static/gift/roaming Pokemon encounters
 * Works with public/new/static_pokemon_manifest.json
 */

import { loadJsonFile } from '../fileLoader';
import { StaticPokemon, StaticPokemonManifest } from '@/types/new';

let cachedManifest: StaticPokemonManifest | null = null;

/**
 * Load the static Pokemon manifest from public/new/static_pokemon_manifest.json
 * Caches the result for subsequent calls
 */
export async function loadStaticPokemonManifest(): Promise<StaticPokemonManifest | null> {
  if (cachedManifest) {
    return cachedManifest;
  }

  try {
    if (typeof window === 'undefined') {
      // Server-side: Load directly from file system
      const manifest = await loadJsonFile<StaticPokemonManifest>(
        'public/new/static_pokemon_manifest.json',
      );

      if (!manifest || !manifest.staticPokemon) {
        console.error('Invalid static Pokemon manifest structure');
        return null;
      }

      cachedManifest = manifest;
      return manifest;
    } else {
      // Client-side: Use fetch
      const response = await fetch('/new/static_pokemon_manifest.json');
      if (!response.ok) {
        console.error('Failed to load static Pokemon manifest on client');
        return null;
      }

      const manifest: StaticPokemonManifest = await response.json();

      if (!manifest || !manifest.staticPokemon) {
        console.error('Invalid static Pokemon manifest structure');
        return null;
      }

      cachedManifest = manifest;
      return manifest;
    }
  } catch (error) {
    console.error('Error loading static Pokemon manifest:', error);
    return null;
  }
}

/**
 * Get all static/gift/roaming Pokemon for a specific location
 * Includes roaming Pokemon if the location is in their validMaps array
 * @param locationId - The location ID to filter by (e.g., 'route29', 'elmslab')
 */
export async function getStaticPokemonForLocation(
  locationId: string,
): Promise<StaticPokemon[]> {
  const manifest = await loadStaticPokemonManifest();

  if (!manifest) {
    return [];
  }

  const normalizedLocationId = locationId.toLowerCase();

  return manifest.staticPokemon.filter((pokemon) => {
    // Match direct location
    if (pokemon.location.toLowerCase() === normalizedLocationId) {
      return true;
    }

    // Match roaming Pokemon if location is in validMaps
    if (pokemon.type === 'roaming' && pokemon.validMaps) {
      return pokemon.validMaps.some(
        (map) => map.toLowerCase() === normalizedLocationId,
      );
    }

    return false;
  });
}

/**
 * Get all static/gift/roaming Pokemon for a specific species
 * Returns all forms and encounter types for the species
 * @param species - The species ID to filter by (e.g., 'mew', 'bulbasaur')
 */
export async function getStaticPokemonForSpecies(
  species: string,
): Promise<StaticPokemon[]> {
  const manifest = await loadStaticPokemonManifest();

  if (!manifest) {
    return [];
  }

  const normalizedSpecies = species.toLowerCase();

  return manifest.staticPokemon.filter(
    (pokemon) => pokemon.species.toLowerCase() === normalizedSpecies,
  );
}

/**
 * Get all roaming Pokemon
 */
export async function getRoamingPokemon(): Promise<StaticPokemon[]> {
  const manifest = await loadStaticPokemonManifest();

  if (!manifest) {
    return [];
  }

  return manifest.staticPokemon.filter((pokemon) => pokemon.type === 'roaming');
}

/**
 * Get the list of maps where roaming Pokemon can appear
 */
export async function getRoamingMaps(): Promise<string[]> {
  const manifest = await loadStaticPokemonManifest();

  if (!manifest) {
    return [];
  }

  return manifest.roamingMaps;
}
