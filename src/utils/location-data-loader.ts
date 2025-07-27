// Enhanced location data loader with optimized data access

import { loadJsonFile } from './fileLoader';
import { normalizeLocationKey } from './locationUtils';
import { 
  groupLocationsHierarchically, 
  filterLocationsWithData, 
  flattenGroupedLocations 
} from './locationGrouping';

// Import LocationData and GroupedLocation from types
import { LocationData as TypesLocationData, GroupedLocation as TypesGroupedLocation } from '@/types/types';

// Use the main types
type LocationData = TypesLocationData;
type GroupedLocation = TypesGroupedLocation;

interface LocationAreaData {
  pokemon: Record<string, {
    methods: Record<string, {
      times: Record<string, any[]>;
    }>;
  }>;
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
    const data = await loadJsonFile<Record<string, LocationAreaData>>('output/locations_by_area.json');
    pokemonLocationDataCache = data || {};
    return pokemonLocationDataCache;
  } catch (error) {
    console.error('Error loading Pokemon location data:', error);
    pokemonLocationDataCache = {};
    return pokemonLocationDataCache;
  }
}

/**
 * Load comprehensive location data (cached)
 */
let allLocationDataCache: Record<string, LocationData> | null = null;

export async function loadAllLocationData(): Promise<Record<string, LocationData>> {
  if (allLocationDataCache) {
    return allLocationDataCache;
  }

  try {
    const data = await loadJsonFile<Record<string, LocationData>>('output/all_locations.json');
    allLocationDataCache = data || {};
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
 * Create enhanced locations with all data aggregated
 */
export async function loadEnhancedLocations(): Promise<EnhancedLocation[]> {
  try {
    const [pokemonLocationData, groupedLocations, itemsData] = await Promise.all([
      loadPokemonLocationData(),
      loadGroupedLocationData(),
      loadItemsDataForLocations()
    ]);

    // Flatten grouped locations for processing
    const flattenedLocations = flattenGroupedLocations(groupedLocations);
    const allLocations = Object.values(flattenedLocations);

    // Create items by location mapping
    const itemsByLocation: Record<string, Array<{ type: 'item' | 'hiddenItem' | 'tmHm'; name: string; details?: string }>> = {};

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
    const normalizedPokemonData: Record<string, { originalKey: string; data: LocationAreaData }> = {};
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

          // Add trainer data
          if (subLocation.trainers && subLocation.trainers.length > 0) {
            hasTrainers = true;
            totalTrainerCount += subLocation.trainers.length;
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
    
    return enhancedLocations.find(loc => 
      normalizeLocationKey(loc.area) === normalizedName ||
      normalizeLocationKey(loc.displayName) === normalizedName
    ) || null;
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
    
    return enhancedLocations.filter(location => {
      // Search in display name
      if (location.displayName.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Search in types
      if (location.types.some(type => type.toLowerCase().includes(queryLower))) {
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
  allLocationDataCache = null;
  groupedLocationDataCache = null;
  itemsDataCache = null;
}

export type { LocationData, LocationAreaData, GroupedLocation, EnhancedLocation };