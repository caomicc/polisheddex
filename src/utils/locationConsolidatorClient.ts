import type { LocationData } from '../types/types';

/**
 * Client-side safe location consolidation utilities
 * This file contains only the logic needed on the client side without Node.js dependencies
 */

/**
 * Check if a location is consolidated based on its data structure
 */
export function isConsolidatedLocation(locationData: LocationData): boolean {
  // A location is considered consolidated if it has areas
  return !!(locationData.areas && locationData.areas.length > 0);
}

/**
 * Check if a location has Elite Four data (specific to Indigo Plateau)
 */
export function hasEliteFour(locationData: LocationData): boolean {
  return !!(locationData.eliteFour && locationData.eliteFour.length > 0);
}

/**
 * Get the display name for an area within a consolidated location
 */
export function getAreaDisplayName(areaId: string): string {
  // Convert area IDs to readable display names
  const areaDisplayNames: Record<string, string> = {
    '1f': 'First Floor',
    '2f': 'Second Floor', 
    '3f': 'Third Floor',
    '4f': 'Fourth Floor',
    '5f': 'Fifth Floor',
    '6f': 'Sixth Floor',
    'b_1f': 'Basement 1F',
    'b_2f': 'Basement 2F',
    'b_3f': 'Basement 3F',
    'b_4f': 'Basement 4F',
    'roof': 'Roof',
    'outside': 'Outside',
    'inside': 'Inside',
    'entrance': 'Entrance',
    'main': 'Main Area',
    'office': 'Office',
    'restaurant': 'Restaurant',
    'pool': 'Pool',
    'room1': 'Room 1',
    'room2': 'Room 2', 
    'room3': 'Room 3',
    'room2_a': 'Room 2A',
    'room2_b': 'Room 2B',
    'room3_b': 'Room 3B',
    'room3_c': 'Room 3C',
    'north': 'North',
    'south': 'South',
    'east': 'East',
    'west': 'West',
    'northeast': 'Northeast',
    'northwest': 'Northwest',
    'southeast': 'Southeast',
    'southwest': 'Southwest',
  };

  return areaDisplayNames[areaId] || areaId.charAt(0).toUpperCase() + areaId.slice(1);
}

/**
 * Extract the area ID from a URL parameter
 */
export function extractAreaFromUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get('area');
}

/**
 * Get the default area for a consolidated location
 */
export function getDefaultArea(locationData: LocationData): string {
  if (!locationData.areas || locationData.areas.length === 0) {
    return 'main';
  }
  
  // Return the first area as default
  return locationData.areas[0].id;
}

/**
 * Get a specific area from a consolidated location by ID
 */
export function getLocationArea(locationData: LocationData, areaId: string) {
  if (!locationData.areas) {
    return null;
  }
  
  return locationData.areas.find(area => area.id === areaId) || null;
}