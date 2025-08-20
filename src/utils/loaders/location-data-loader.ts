// Enhanced location data loader with optimized data access

import { loadJsonFile } from '../fileLoader';
import { normalizeLocationKey } from '../locationUtils';
import { groupLocationsHierarchically, filterLocationsWithData } from '../locationGrouping';
import { getUniqueTrainerCount } from '../trainerGrouping';

// Import LocationData and GroupedLocation from types
import {
  LocationData as TypesLocationData,
  GroupedLocation as TypesGroupedLocation,
} from '@/types/types';

// Use the main types
type LocationData = TypesLocationData;
type GroupedLocation = TypesGroupedLocation;

interface LocationAreaData {
  pokemon: Record<
    string,
    {
      methods: Record<
        string,
        {
          times: Record<string, any[]>;
        }
      >;
    }
  >;
}

interface EnhancedLocation {
  area: string;
  urlName: string;
  displayName: string;
  types: string[];
  pokemonCount: number;
  hasHiddenGrottoes: boolean;
  hasTrainers: boolean;
  trainerCount: number;
  items?: Array<{ type: 'item' | 'hiddenItem' | 'tmHm'; name: string; details?: string }>;
  region?: 'johto' | 'kanto' | 'orange';
  flyable?: boolean;
  connections?: Array<{
    direction: string;
    targetLocation: string;
    targetLocationDisplay: string;
    offset: number;
  }>;
  coordinates?: { x: number; y: number };
}

/**
 * Load Pokemon encounter data by area (cached)
 */
let pokemonLocationDataCache: Record<string, LocationAreaData> | null = null;

export async function loadPokemonLocationData(): Promise<Record<string, LocationAreaData>> {
  if (pokemonLocationDataCache) {
    return pokemonLocationDataCache;
  }

  try {
    const data = await loadJsonFile<Record<string, LocationAreaData>>(
      'output/locations_by_area.json',
    );
    pokemonLocationDataCache = data || {};
    return pokemonLocationDataCache;
  } catch (error) {
    console.error('Error loading Pokemon location data:', error);
    pokemonLocationDataCache = {};
    return pokemonLocationDataCache;
  }
}

/**
 * Location manifest interface
 */
interface LocationManifest {
  totalLocations: number;
  regions: Record<string, number>;
  flyableLocations: number;
  landmarks: number;
  locations: Array<{
    fileName: string;
    name: string;
    displayName: string;
    region: string;
    id: number;
    flyable: boolean;
    order: number;
    trainerCount: number;
    pokemonCount: number;
    parentLocation?: string;
    locationType: string;
  }>;
}

/**
 * Load location manifest (cached)
 */
let locationManifestCache: LocationManifest | null = null;

export async function loadLocationManifest(): Promise<LocationManifest> {
  if (locationManifestCache) {
    return locationManifestCache;
  }

  try {
    const data = await loadJsonFile<LocationManifest>('output/locations/_index.json');
    locationManifestCache = data || {
      totalLocations: 0,
      regions: {},
      flyableLocations: 0,
      landmarks: 0,
      locations: [],
    };
    return locationManifestCache;
  } catch (error) {
    console.error('Error loading location manifest:', error);
    locationManifestCache = {
      totalLocations: 0,
      regions: {},
      flyableLocations: 0,
      landmarks: 0,
      locations: [],
    };
    return locationManifestCache;
  }
}

/**
 * Load specific location data by filename (cached)
 */
let individualLocationCache: Record<string, LocationData> = {};

export async function loadLocationByFileName(fileName: string): Promise<LocationData | null> {
  if (individualLocationCache[fileName]) {
    return individualLocationCache[fileName];
  }

  try {
    const data = await loadJsonFile<LocationData>(`output/locations/${fileName}`);
    if (data) {
      individualLocationCache[fileName] = data;
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error loading location file ${fileName}:`, error);
    return null;
  }
}

/**
 * Interface for comprehensive location manifest
 */
interface ComprehensiveLocationManifest {
  metadata: {
    totalLocations: number;
    regions: Record<string, number>;
    flyableLocations: number;
    landmarks: number;
    lastUpdated: string;
  };
  locations: Record<string, LocationData>;
}

/**
 * Interface for optimized location manifest with summary data only
 */
interface OptimizedLocationManifest {
  metadata: {
    totalLocations: number;
    regions: Record<string, number>;
    flyableLocations: number;
    landmarks: number;
    lastUpdated: string;
  };
  locations: Record<string, {
    name: string;
    displayName: string;
    region: string;
    flyable: boolean;
    locationType: string;
    pokemonCount: number;
    trainerCount: number;
    itemCount: number;
    connectionCount: number;
    eventCount: number;
    hasHiddenGrottoes: boolean;
    coordinates?: { x: number; y: number };
  }>;
}

/**
 * Load optimized location manifest (cached)
 */
let optimizedLocationManifestCache: OptimizedLocationManifest | null = null;

export async function loadOptimizedLocationManifest(): Promise<OptimizedLocationManifest> {
  if (optimizedLocationManifestCache) {
    return optimizedLocationManifestCache;
  }

  try {
    const data = await loadJsonFile<OptimizedLocationManifest>('output/manifests/locations.json');
    optimizedLocationManifestCache = data || {
      metadata: {
        totalLocations: 0,
        regions: {},
        flyableLocations: 0,
        landmarks: 0,
        lastUpdated: new Date().toISOString(),
      },
      locations: {},
    };
    return optimizedLocationManifestCache;
  } catch (error) {
    console.error('Error loading optimized location manifest:', error);
    // Fallback to loading individual files if manifest doesn't exist
    return loadAllLocationDataFallbackOptimized();
  }
}

/**
 * Load comprehensive location manifest (cached) - kept for backward compatibility
 */
let comprehensiveLocationManifestCache: ComprehensiveLocationManifest | null = null;

export async function loadComprehensiveLocationManifest(): Promise<ComprehensiveLocationManifest> {
  if (comprehensiveLocationManifestCache) {
    return comprehensiveLocationManifestCache;
  }

  try {
    const data = await loadJsonFile<ComprehensiveLocationManifest>('output/manifests/locations.json');
    comprehensiveLocationManifestCache = data || {
      metadata: {
        totalLocations: 0,
        regions: {},
        flyableLocations: 0,
        landmarks: 0,
        lastUpdated: new Date().toISOString(),
      },
      locations: {},
    };
    return comprehensiveLocationManifestCache;
  } catch (error) {
    console.error('Error loading comprehensive location manifest:', error);
    // Fallback to loading individual files if manifest doesn't exist
    return loadAllLocationDataFallback();
  }
}

/**
 * Fallback function to load individual location files and create optimized manifest
 */
async function loadAllLocationDataFallbackOptimized(): Promise<OptimizedLocationManifest> {
  try {
    const manifest = await loadLocationManifest();
    const optimizedLocationData: Record<string, any> = {};

    // Load only the locations we need based on the manifest
    await Promise.all(
      manifest.locations.map(async (locationInfo) => {
        const data = await loadLocationByFileName(locationInfo.fileName);
        if (data) {
          // Create summary data instead of full data
          optimizedLocationData[locationInfo.name] = {
            name: locationInfo.name,
            displayName: locationInfo.displayName,
            region: locationInfo.region,
            flyable: locationInfo.flyable,
            locationType: locationInfo.locationType,
            pokemonCount: 0, // Individual location files don't contain Pokemon data
            trainerCount: data.trainers ? data.trainers.length : 0,
            itemCount: data.items ? data.items.length : 0,
            connectionCount: data.connections ? data.connections.length : 0,
            eventCount: data.events ? data.events.length : 0,
            hasHiddenGrottoes: false, // Individual location files don't contain Pokemon data
            coordinates: (data.x >= 0 && data.y >= 0) ? 
              { x: data.x, y: data.y } : undefined,
          };
        }
      }),
    );

    return {
      metadata: {
        totalLocations: manifest.totalLocations,
        regions: manifest.regions,
        flyableLocations: manifest.flyableLocations,
        landmarks: manifest.landmarks,
        lastUpdated: new Date().toISOString(),
      },
      locations: optimizedLocationData,
    };
  } catch (error) {
    console.error('Error in fallback optimized location data loading:', error);
    return {
      metadata: {
        totalLocations: 0,
        regions: {},
        flyableLocations: 0,
        landmarks: 0,
        lastUpdated: new Date().toISOString(),
      },
      locations: {},
    };
  }
}

/**
 * Fallback function to load individual location files (for backward compatibility)
 */
async function loadAllLocationDataFallback(): Promise<ComprehensiveLocationManifest> {
  try {
    const manifest = await loadLocationManifest();
    const locationData: Record<string, LocationData> = {};

    // Load only the locations we need based on the manifest
    await Promise.all(
      manifest.locations.map(async (locationInfo) => {
        const data = await loadLocationByFileName(locationInfo.fileName);
        if (data) {
          locationData[locationInfo.name] = data;
        }
      }),
    );

    return {
      metadata: {
        totalLocations: manifest.totalLocations,
        regions: manifest.regions,
        flyableLocations: manifest.flyableLocations,
        landmarks: manifest.landmarks,
        lastUpdated: new Date().toISOString(),
      },
      locations: locationData,
    };
  } catch (error) {
    console.error('Error in fallback location data loading:', error);
    return {
      metadata: {
        totalLocations: 0,
        regions: {},
        flyableLocations: 0,
        landmarks: 0,
        lastUpdated: new Date().toISOString(),
      },
      locations: {},
    };
  }
}

/**
 * Load comprehensive location data using manifest (cached)
 */
let allLocationDataCache: Record<string, LocationData> | null = null;

export async function loadAllLocationData(): Promise<Record<string, LocationData>> {
  if (allLocationDataCache) {
    return allLocationDataCache;
  }

  try {
    const comprehensiveManifest = await loadComprehensiveLocationManifest();
    allLocationDataCache = comprehensiveManifest.locations;
    return allLocationDataCache;
  } catch (error) {
    console.error('Error loading all location data:', error);
    allLocationDataCache = {};
    return allLocationDataCache;
  }
}

/**
 * Load grouped location data with hierarchical structure (cached)
 */
let groupedLocationDataCache: Record<string, GroupedLocation> | null = null;

export async function loadGroupedLocationData(): Promise<Record<string, GroupedLocation>> {
  if (groupedLocationDataCache) {
    return groupedLocationDataCache;
  }

  try {
    const allLocationData = await loadAllLocationData();

    // Group locations hierarchically
    const groupedLocations = groupLocationsHierarchically(allLocationData);

    // Filter to only show locations with meaningful data
    const locationsWithData = filterLocationsWithData(groupedLocations);

    groupedLocationDataCache = locationsWithData;
    return groupedLocationDataCache;
  } catch (error) {
    console.error('Error loading and grouping location data:', error);
    groupedLocationDataCache = {};
    return groupedLocationDataCache;
  }
}

/**
 * Load items data for location mapping (cached)
 */
let itemsDataCache: Record<string, any> | null = null;

export async function loadItemsDataForLocations(): Promise<Record<string, any>> {
  if (itemsDataCache) {
    return itemsDataCache;
  }

  try {
    // Try to load from manifest first, then fallback to items_data.json
    const manifestData = await loadJsonFile<Record<string, any>>('output/manifests/items.json');
    if (manifestData) {
      itemsDataCache = manifestData;
      return itemsDataCache;
    }
  } catch (manifestError) {
    console.log('Items manifest not found, trying fallback...');
  }

  try {
    const fallbackData = await loadJsonFile<Record<string, any>>('output/items_data.json');
    itemsDataCache = fallbackData || {};
    return itemsDataCache;
  } catch (error) {
    console.error('Error loading items data for locations:', error);
    itemsDataCache = {};
    return itemsDataCache;
  }
}

/**
 * Get location types based on name heuristics
 */
function getLocationTypes(locationName: string): string[] {
  if (locationName.includes('Forest') || locationName.includes('Woods')) {
    return ['Grass'];
  } else if (locationName.includes('Cave') || locationName.includes('Mountain')) {
    return ['Rock'];
  } else if (
    locationName.includes('Lake') ||
    locationName.includes('Sea') ||
    locationName.includes('Ocean')
  ) {
    return ['Water'];
  } else if (locationName.includes('Tower') || locationName.includes('Ruins')) {
    return ['Ghost'];
  } else if (locationName.includes('Power Plant')) {
    return ['Electric'];
  } else if (locationName.includes('Desert') || locationName.includes('Sand')) {
    return ['Ground'];
  } else if (locationName.includes('Volcano') || locationName.includes('Lava')) {
    return ['Fire'];
  } else if (locationName.includes('Route')) {
    return ['Grass'];
  } else if (locationName.includes('City') || locationName.includes('Town')) {
    return ['Normal'];
  }
  return ['Normal'];
}

/**
 * Create enhanced locations using optimized manifest (for performance)
 */
export async function loadEnhancedLocationsOptimized(): Promise<EnhancedLocation[]> {
  try {
    const [optimizedManifest, pokemonLocationData, itemsData] = await Promise.all([
      loadOptimizedLocationManifest(),
      loadPokemonLocationData(),
      loadItemsDataForLocations(),
    ]);

    // Create items by location mapping
    const itemsByLocation: Record<
      string,
      Array<{ type: 'item' | 'hiddenItem' | 'tmHm'; name: string; details?: string }>
    > = {};

    if (itemsData && typeof itemsData === 'object') {
      Object.values(itemsData).forEach((item: any) => {
        if (item && item.locations && Array.isArray(item.locations)) {
          item.locations.forEach((location: any) => {
            if (location && location.area && location.details) {
              if (location.area.toLowerCase() === 'pickup') {
                return;
              }

              const normalizedLocationKey = normalizeLocationKey(location.area);
              if (!itemsByLocation[normalizedLocationKey]) {
                itemsByLocation[normalizedLocationKey] = [];
              }

              let itemType: 'item' | 'hiddenItem' | 'tmHm' = 'item';
              if (location.details && location.details.toLowerCase().includes('hidden')) {
                itemType = 'hiddenItem';
              } else if (item.name && (item.name.startsWith('TM') || item.name.startsWith('HM'))) {
                itemType = 'tmHm';
              }

              itemsByLocation[normalizedLocationKey].push({
                type: itemType,
                name: item.name,
                details: location.details,
              });
            }
          });
        }
      });
    }

    // Create normalized Pokemon location map for additional Pokemon data
    const normalizedPokemonData: Record<string, { originalKey: string; data: LocationAreaData }> = {};
    Object.keys(pokemonLocationData).forEach((originalKey) => {
      const normalizedKey = normalizeLocationKey(originalKey);
      normalizedPokemonData[normalizedKey] = {
        originalKey,
        data: pokemonLocationData[originalKey],
      };
    });

    // Convert optimized location summaries to EnhancedLocation format
    const enhancedLocations: EnhancedLocation[] = Object.entries(optimizedManifest.locations).map(
      ([locationKey, locationSummary]) => {
        const normalizedKey = normalizeLocationKey(locationSummary.name);
        
        // Get additional Pokemon data from Pokemon locations if available
        let additionalPokemonCount = 0;
        let hasHiddenGrottoes = locationSummary.hasHiddenGrottoes;
        
        if (normalizedPokemonData[normalizedKey]) {
          const pokemonData = normalizedPokemonData[normalizedKey].data;
          additionalPokemonCount = Object.keys(pokemonData.pokemon).length;
          
          if (!hasHiddenGrottoes) {
            hasHiddenGrottoes = Object.values(pokemonData.pokemon).some(
              (pokemon: any) =>
                pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
            );
          }
        }

        // Use the higher Pokemon count between manifest and Pokemon location data
        const finalPokemonCount = Math.max(locationSummary.pokemonCount, additionalPokemonCount);

        // Get items for this location
        const locationItems = itemsByLocation[normalizedKey] || [];

        return {
          area: locationKey,
          urlName: locationKey,
          displayName: locationSummary.displayName,
          types: getLocationTypes(locationSummary.displayName),
          pokemonCount: finalPokemonCount,
          hasHiddenGrottoes,
          hasTrainers: locationSummary.trainerCount > 0,
          trainerCount: locationSummary.trainerCount,
          items: locationItems,
          region: locationSummary.region as 'johto' | 'kanto' | 'orange',
          flyable: locationSummary.flyable,
          coordinates: locationSummary.coordinates,
        };
      },
    );

    return enhancedLocations;
  } catch (error) {
    console.error('Error loading optimized enhanced locations:', error);
    return [];
  }
}

/**
 * Create enhanced locations with all data aggregated (full version)
 */
export async function loadEnhancedLocations(): Promise<EnhancedLocation[]> {
  try {
    const [pokemonLocationData, groupedLocations, itemsData] = await Promise.all([
      loadPokemonLocationData(),
      loadGroupedLocationData(),
      loadItemsDataForLocations(),
    ]);

    // Process grouped locations directly

    // Create items by location mapping
    const itemsByLocation: Record<
      string,
      Array<{ type: 'item' | 'hiddenItem' | 'tmHm'; name: string; details?: string }>
    > = {};

    if (itemsData && typeof itemsData === 'object') {
      Object.values(itemsData).forEach((item: any) => {
        if (item && item.locations && Array.isArray(item.locations)) {
          item.locations.forEach((location: any) => {
            if (location && location.area && location.details) {
              // Skip non-location items like "Pickup"
              if (location.area.toLowerCase() === 'pickup') {
                return;
              }

              const normalizedLocationKey = normalizeLocationKey(location.area);

              if (!itemsByLocation[normalizedLocationKey]) {
                itemsByLocation[normalizedLocationKey] = [];
              }

              let itemType: 'item' | 'hiddenItem' | 'tmHm' = 'item';
              if (location.details && location.details.toLowerCase().includes('hidden')) {
                itemType = 'hiddenItem';
              } else if (item.name && (item.name.startsWith('TM') || item.name.startsWith('HM'))) {
                itemType = 'tmHm';
              }

              itemsByLocation[normalizedLocationKey].push({
                type: itemType,
                name: item.name,
                details: location.details,
              });
            }
          });
        }
      });
    }

    // Create normalized Pokemon location map
    const normalizedPokemonData: Record<string, { originalKey: string; data: LocationAreaData }> =
      {};
    Object.keys(pokemonLocationData).forEach((originalKey) => {
      const normalizedKey = normalizeLocationKey(originalKey);
      normalizedPokemonData[normalizedKey] = {
        originalKey,
        data: pokemonLocationData[originalKey],
      };
    });

    // Convert grouped locations to EnhancedLocation format
    const enhancedLocations: EnhancedLocation[] = Object.entries(groupedLocations).map(
      ([locationKey, groupedLocation]) => {
        // Aggregate data from parent and all children
        const allSubLocations = [groupedLocation, ...(groupedLocation.children || [])];

        let totalPokemonCount = 0;
        let hasHiddenGrottoes = false;
        let totalTrainerCount = 0;
        let hasTrainers = false;
        const combinedItems: Array<{
          type: 'item' | 'hiddenItem' | 'tmHm';
          name: string;
          details?: string;
        }> = [];

        allSubLocations.forEach((subLocation) => {
          const normalizedKey = normalizeLocationKey(subLocation.name);

          // Add Pokemon data if available
          if (normalizedPokemonData[normalizedKey]) {
            const pokemonData = normalizedPokemonData[normalizedKey].data;
            totalPokemonCount += Object.keys(pokemonData.pokemon).length;

            if (
              Object.values(pokemonData.pokemon).some(
                (pokemon: any) =>
                  pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
              )
            ) {
              hasHiddenGrottoes = true;
            }
          }

          // Add trainer data using grouped count
          if (subLocation.trainers && subLocation.trainers.length > 0) {
            hasTrainers = true;
            totalTrainerCount += getUniqueTrainerCount(subLocation.trainers);
          }

          // Add items from comprehensive location data
          if (subLocation.items) {
            subLocation.items.forEach((item: any) => {
              combinedItems.push({
                type: (item.type as 'item' | 'hiddenItem' | 'tmHm') || 'item',
                name: item.name,
                details: item.coordinates
                  ? `Found at coordinates (${item.coordinates.x}, ${item.coordinates.y})`
                  : undefined,
              });
            });
          }

          // Add items from items data
          const itemsFromItemsData = itemsByLocation[normalizedKey] || [];
          combinedItems.push(...itemsFromItemsData);
        });

        return {
          area: locationKey,
          urlName: locationKey,
          displayName: groupedLocation.displayName,
          types: getLocationTypes(groupedLocation.displayName),
          pokemonCount: totalPokemonCount,
          hasHiddenGrottoes,
          hasTrainers,
          trainerCount: totalTrainerCount,
          items: combinedItems,
          region: groupedLocation.region,
          flyable: groupedLocation.flyable,
          connections: groupedLocation.connections,
          coordinates:
            groupedLocation.x >= 0 && groupedLocation.y >= 0
              ? { x: groupedLocation.x, y: groupedLocation.y }
              : undefined,
        };
      },
    );

    return enhancedLocations;
  } catch (error) {
    console.error('Error loading enhanced locations:', error);
    return [];
  }
}

/**
 * Load a specific location by name
 */
export async function loadLocationByName(locationName: string): Promise<EnhancedLocation | null> {
  try {
    const enhancedLocations = await loadEnhancedLocations();
    const normalizedName = normalizeLocationKey(locationName);

    return (
      enhancedLocations.find(
        (loc) =>
          normalizeLocationKey(loc.area) === normalizedName ||
          normalizeLocationKey(loc.displayName) === normalizedName,
      ) || null
    );
  } catch (error) {
    console.error(`Error loading location ${locationName}:`, error);
    return null;
  }
}

/**
 * Search locations by name, type, or features
 */
export async function searchLocations(query: string): Promise<EnhancedLocation[]> {
  try {
    const enhancedLocations = await loadEnhancedLocations();
    const queryLower = query.toLowerCase();

    return enhancedLocations.filter((location) => {
      // Search in display name
      if (location.displayName.toLowerCase().includes(queryLower)) {
        return true;
      }

      // Search in types
      if (location.types.some((type) => type.toLowerCase().includes(queryLower))) {
        return true;
      }

      // Search in region
      if (location.region && location.region.toLowerCase().includes(queryLower)) {
        return true;
      }

      return false;
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

/**
 * Clear all caches (useful for development)
 */
export function clearLocationCaches(): void {
  pokemonLocationDataCache = null;
  locationManifestCache = null;
  optimizedLocationManifestCache = null;
  comprehensiveLocationManifestCache = null;
  individualLocationCache = {};
  allLocationDataCache = null;
  groupedLocationDataCache = null;
  itemsDataCache = null;
}

/**
 * Load Pokemon location data from pokemon_locations.json and invert it by area
 */
let invertedPokemonLocationDataCache: Record<string, LocationAreaData> | null = null;

export async function loadInvertedPokemonLocationData(): Promise<Record<string, LocationAreaData>> {
  if (invertedPokemonLocationDataCache) {
    return invertedPokemonLocationDataCache;
  }

  try {
    const pokemonLocationsData = await loadJsonFile<
      Record<
        string,
        {
          locations: Array<{
            area: string;
            method: string;
            time: string;
            level: string;
            chance: number;
            formName?: string | null;
          }>;
        }
      >
    >('output/pokemon_locations.json');

    const invertedData: Record<string, LocationAreaData> = {};

    // Invert the data structure: from pokemon -> locations to area -> pokemon
    Object.entries(pokemonLocationsData || {}).forEach(([pokemonName, pokemonData]) => {
      pokemonData.locations?.forEach((location) => {
        const { area, method, time, level, chance, formName } = location;

        // Initialize area if not exists
        if (!invertedData[area]) {
          invertedData[area] = { pokemon: {} };
        }

        // Initialize pokemon if not exists
        if (!invertedData[area].pokemon[pokemonName]) {
          invertedData[area].pokemon[pokemonName] = { methods: {} };
        }

        // Initialize method if not exists
        if (!invertedData[area].pokemon[pokemonName].methods[method]) {
          invertedData[area].pokemon[pokemonName].methods[method] = { times: {} };
        }

        // Initialize time if not exists
        if (!invertedData[area].pokemon[pokemonName].methods[method].times[time]) {
          invertedData[area].pokemon[pokemonName].methods[method].times[time] = [];
        }

        // Add the encounter
        invertedData[area].pokemon[pokemonName].methods[method].times[time].push({
          level,
          chance,
          ...(formName && { formName }),
        });
      });
    });

    invertedPokemonLocationDataCache = invertedData;
    return invertedPokemonLocationDataCache;
  } catch (error) {
    console.error('Error loading inverted Pokemon location data:', error);
    invertedPokemonLocationDataCache = {};
    return invertedPokemonLocationDataCache;
  }
}

/**
 * Load and merge both Pokemon location datasets
 */
export async function loadMergedPokemonLocationData(): Promise<Record<string, LocationAreaData>> {
  const [originalData, invertedData] = await Promise.all([
    loadPokemonLocationData(),
    loadInvertedPokemonLocationData(),
  ]);

  const mergedData: Record<string, LocationAreaData> = { ...originalData };

  // Merge the inverted data into the original data
  Object.entries(invertedData).forEach(([area, areaData]) => {
    if (!mergedData[area]) {
      mergedData[area] = { pokemon: {} };
    }

    Object.entries(areaData.pokemon).forEach(([pokemonName, pokemonData]) => {
      if (!mergedData[area].pokemon[pokemonName]) {
        mergedData[area].pokemon[pokemonName] = { methods: {} };
      }

      Object.entries(pokemonData.methods).forEach(([method, methodData]) => {
        if (!mergedData[area].pokemon[pokemonName].methods[method]) {
          mergedData[area].pokemon[pokemonName].methods[method] = { times: {} };
        }

        Object.entries(methodData.times).forEach(([time, encounters]) => {
          if (!mergedData[area].pokemon[pokemonName].methods[method].times[time]) {
            mergedData[area].pokemon[pokemonName].methods[method].times[time] = [];
          }

          // Add encounters, avoiding duplicates
          encounters.forEach((encounter) => {
            const existingEncounter = mergedData[area].pokemon[pokemonName].methods[method].times[
              time
            ].find(
              (existing: any) =>
                existing.level === encounter.level && existing.chance === encounter.chance,
            );

            if (!existingEncounter) {
              mergedData[area].pokemon[pokemonName].methods[method].times[time].push(encounter);
            }
          });
        });
      });
    });
  });

  return mergedData;
}
export type { LocationData, LocationAreaData, GroupedLocation, EnhancedLocation, ComprehensiveLocationManifest, OptimizedLocationManifest };
