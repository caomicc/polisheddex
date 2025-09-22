import { loadJsonFile } from '../fileLoader';
import { LocationManifest, LocationData } from '@/types/new';

/**
 * Load locations data using the new manifest system with fallbacks
 * Returns a Record where keys are location IDs and values are location data
 */
export async function loadLocationsData(): Promise<Record<string, any>> {
  try {
    // Use the new manifest system
    const newManifestData = await loadLocationsFromNewManifest();
    console.log('Successfully loaded locations from new manifest system');
    return newManifestData;
  } catch (error) {
    console.error('Error loading locations data:', error);
    return {};
  }
}

/**
 * Load locations data from the new manifest structure (new/locations_manifest.json)
 * This function handles the new flattened array structure
 */
export async function loadLocationsFromNewManifest(): Promise<Record<string, LocationManifest>> {
  try {
    console.log('Loading locations from new manifest...');

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the new locations manifest directly
      const locationArray = await loadJsonFile<LocationManifest[]>('new/locations_manifest.json');

      if (!locationArray || !Array.isArray(locationArray)) {
        console.error('Invalid locations manifest structure or file not found');
        return {};
      }

      console.log(`Processing ${locationArray.length} locations from manifest`);
      const baseData: Record<string, LocationManifest> = {};

      locationArray.forEach((location, index) => {
        if (!location || !location.id) {
          console.warn(`Skipping invalid Location at index ${index}`);
          return;
        }

        // Store the Location data using its ID as the key
        baseData[location.id] = location;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} locations`);
      return baseData;
    } else {
      console.log('Client-side: Fetching new locations manifest...');
      // Client-side: Use fetch
      const response = await fetch('/new/locations_manifest.json');
      if (!response.ok) {
        console.error('Failed to load new locations manifest on client');
        return {};
      }

      const locationsArray = await response.json();
      if (!Array.isArray(locationsArray)) {
        console.error('Invalid locations manifest structure');
        return {};
      }

      console.log(`Processing ${locationsArray.length} Locations from client manifest`);
      const baseData: Record<string, LocationManifest> = {};

      locationsArray.forEach((location: LocationManifest, index: number) => {
        if (!location || !location.id) {
          console.warn(`Skipping invalid Location at index ${index}`);
          return;
        }

        // Store the Location data using its ID as the key
        baseData[location.id] = location;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} locations on client`);
      return baseData;
    }
  } catch (error) {
    console.error('Error loading locations from new manifest:', error);
    return {};
  }
}

/**
 * Load detailed location data from individual files (new/locations/{id}.json)
 * This contains complete location information including encounters, items, and events
 * Returns null if the location file doesn't exist (e.g., for marts or abstract locations)
 */
export async function loadDetailedLocationData(locationId: string): Promise<LocationData | null> {
  // Check if we're in a server environment
  if (typeof window === 'undefined') {
    // Server-side: Check if file exists first to avoid fileLoader errors
    const fs = require('fs').promises;
    const path = require('path');

    const possiblePaths = [
      path.join(process.cwd(), `new/locations/${locationId}.json`),
      // path.join(process.cwd(), '..', `new/locations/${locationId}.json`),
      // path.resolve(__dirname, '..', '..', '..', `new/locations/${locationId}.json`),
    ];

    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath); // Check if file exists
        const data = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data) as LocationData;
        return parsed;
      } catch (error) {
        continue; // Try next path
      }
    }

    // File doesn't exist at any path - this is normal for marts, etc.
    return null;
  } else {
    // Client-side: Use fetch
    try {
      const response = await fetch(`/new/locations/${locationId}.json`);
      if (!response.ok) {
        return null; // File not found, normal for marts
      }

      const locationData = await response.json();
      return locationData;
    } catch (error) {
      return null; // Network error or parsing error
    }
  }
}

/**
 * Load a specific location by ID from the manifest
 */
export async function loadLocationById(locationId: string): Promise<LocationManifest | null> {
  try {
    const locationsData = await loadLocationsFromNewManifest();
    return locationsData[locationId] || null;
  } catch (error) {
    console.error(`Error loading location ${locationId}:`, error);
    return null;
  }
}

/**
 * Load multiple locations by IDs efficiently
 */
export async function loadMultipleLocationsById(
  locationIds: string[],
): Promise<(LocationManifest | null)[]> {
  try {
    const locationsData = await loadLocationsFromNewManifest();
    return locationIds.map((id) => locationsData[id] || null);
  } catch (error) {
    console.error('Error loading multiple locations:', error);
    return locationIds.map(() => null);
  }
}
