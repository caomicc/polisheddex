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
    const locationPath = path.join(process.cwd(), `new/locations/${locationId}.json`);
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
export async function getMultipleLocationsData(locationIds: string[]): Promise<Record<string, LocationData>> {
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
  return allLocations.filter(location => location.region.toLowerCase() === region.toLowerCase());
}