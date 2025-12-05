import { promises as fs } from 'fs';
import path from 'path';

export interface LocationData {
  id: string;
  name: string;
  region: string;
  type?: string[];
  order?: number;
  connectionCount?: number;
  parent?: string;
  constantName?: string;
  items?: Array<{
    name: string;
    type: string;
    coordinates?: {
      x: number;
      y: number;
    };
  }>;
  events?: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  trainers?: string[];
}

export interface LocationsManifestItem {
  id: string;
  name: string;
  region: string;
  order?: number;
  eventCount?: number;
  itemCount?: number;
  trainerCount?: number;
}

let locationsManifest: LocationsManifestItem[] | null = null;

/**
 * Load locations manifest once and cache it (server-side only)
 */
async function loadLocationsManifest(): Promise<LocationsManifestItem[]> {
  if (locationsManifest) {
    return locationsManifest;
  }

  try {
    const manifestPath = path.join(process.cwd(), 'public/new/locations_manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf-8');
    locationsManifest = JSON.parse(manifestData);
    return locationsManifest || [];
  } catch (error) {
    console.error('Error loading locations manifest:', error);
    return [];
  }
}

/**
 * Get location data by ID from individual file (server-side only)
 */
export async function getLocationData(locationId: string): Promise<LocationData | null> {
  try {
    const locationPath = path.join(process.cwd(), `public/new/locations/${locationId}.json`);
    const locationData = await fs.readFile(locationPath, 'utf-8');
    return JSON.parse(locationData);
  } catch (error) {
    console.error(`Error loading location data for ${locationId}:`, error);
    return null;
  }
}

/**
 * Get multiple locations data at once for better performance (server-side only)
 */
export async function getMultipleLocationsData(
  locationIds: string[],
): Promise<Record<string, LocationData>> {
  const result: Record<string, LocationData> = {};

  for (const locationId of locationIds) {
    const locationData = await getLocationData(locationId);
    if (locationData) {
      result[locationId] = locationData;
    }
  }

  return result;
}

/**
 * Get all locations from manifest (server-side only)
 */
export async function getAllLocations(): Promise<LocationsManifestItem[]> {
  return await loadLocationsManifest();
}

/**
 * Get locations by region (server-side only)
 */
export async function getLocationsByRegion(region: string): Promise<LocationsManifestItem[]> {
  const allLocations = await loadLocationsManifest();
  return allLocations.filter((location) => location.region.toLowerCase() === region.toLowerCase());
}

/**
 * Encounter data for a Pokemon at a specific location
 */
export interface PokemonLocationEncounter {
  locationId: string;
  locationName: string;
  region: string;
  method: string;
  version: string; // time of day: morning, day, night
  levelRange: string;
  rate: number;
  formName?: string;
}

/**
 * Get all locations where a specific Pokemon can be found (server-side only)
 * This scans all location files for encounters with the given Pokemon
 */
export async function getLocationsForPokemon(
  pokemonId: string,
  formName?: string,
): Promise<PokemonLocationEncounter[]> {
  const encounters: PokemonLocationEncounter[] = [];
  const normalizedPokemonId = pokemonId.toLowerCase();
  const normalizedFormName = formName?.toLowerCase() || 'plain';

  try {
    const locationsDir = path.join(process.cwd(), 'public/new/locations');
    const files = await fs.readdir(locationsDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const locationPath = path.join(locationsDir, file);
        const locationData = await fs.readFile(locationPath, 'utf-8');
        const location = JSON.parse(locationData) as LocationData & {
          encounters?: Array<{
            pokemon: string;
            method: string;
            version: string;
            levelRange: string;
            rate: number;
            formName?: string;
          }>;
        };

        if (!location.encounters) continue;

        // Find encounters for this Pokemon
        const pokemonEncounters = location.encounters.filter(
          (enc) =>
            enc.pokemon.toLowerCase() === normalizedPokemonId &&
            (normalizedFormName === 'plain' || enc.formName?.toLowerCase() === normalizedFormName),
        );

        for (const enc of pokemonEncounters) {
          encounters.push({
            locationId: location.id,
            locationName: location.name,
            region: location.region,
            method: enc.method,
            version: enc.version,
            levelRange: enc.levelRange,
            rate: enc.rate,
            formName: enc.formName,
          });
        }
      } catch (error) {
        // Skip files that can't be parsed
        continue;
      }
    }
  } catch (error) {
    console.error('Error scanning locations for Pokemon:', error);
  }

  return encounters;
}
