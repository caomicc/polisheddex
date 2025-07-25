import type { LocationData, GroupedLocation, LocationHierarchy } from '../types/types.ts';

/**
 * Determine the parent location and type for a given location
 */
export function determineLocationHierarchy(locationKey: string): LocationHierarchy {
  // Floor patterns (1f, 2f, b1f, etc.)
  if (/_\d+f$|_b\d+f$/.test(locationKey)) {
    // Find the parent by removing the floor suffix
    const parent = locationKey.replace(/_\d+f$|_b\d+f$/, '');
    return { parent, type: 'floor' };
  }

  // House patterns - check for houses that are sub-locations
  if (locationKey.includes('_house') && !locationKey.endsWith('_house')) {
    const parent = locationKey.split('_house')[0];
    return { parent, type: 'house' };
  }

  // Specific house patterns in towns
  const housePatterns = [
    /_house_\d+f$/,
    /_lugia_speech_house$/,
    /_pharmacy$/,
    /_shop$/,
    /_speech_house$/,
  ];

  for (const pattern of housePatterns) {
    if (pattern.test(locationKey)) {
      // Extract town name (everything before the specific building type)
      const parts = locationKey.split('_');
      if (parts.length > 2) {
        const parent = parts[0]; // First part is usually the town name
        return { parent, type: 'house' };
      }
    }
  }

  // Gym patterns
  if (locationKey.includes('_gym')) {
    const parent = locationKey.replace('_gym', '');
    return { parent, type: 'gym' };
  }

  // Tower/building patterns
  if (locationKey.includes('_tower') || locationKey.includes('_building')) {
    const parent = locationKey.split('_tower')[0] || locationKey.split('_building')[0];
    return { parent, type: 'tower' };
  }

  // Cave sub-areas (like quiet_cave_1f -> quiet_cave)
  if (locationKey.includes('_cave_') && !locationKey.endsWith('_cave')) {
    const parent = locationKey.split('_cave')[0] + '_cave';
    return { parent, type: 'cave' };
  }

  // Buildings/facilities within towns
  const townBuildings = [
    'pokecenter',
    'mart',
    'dept_store',
    'game_corner',
    'hotel',
    'museum',
    'lab',
    'pharmacy',
    'cafe',
    'port',
    'harbor',
  ];

  for (const building of townBuildings) {
    if (locationKey.includes(`_${building}`)) {
      // Extract town name (everything before the building type)
      const parts = locationKey.split(`_${building}`)[0];
      return { parent: parts, type: 'building' };
    }
  }

  // Route patterns
  if (locationKey.startsWith('route_')) {
    return { type: 'route' };
  }

  // Island patterns
  if (locationKey.includes('_island')) {
    return { type: 'island' };
  }

  // Gate patterns (usually belong to routes or areas)
  if (locationKey.includes('_gate')) {
    // Try to find the parent route/area
    const parts = locationKey.replace('_gate', '').split('_');
    if (parts.length > 0) {
      return { parent: parts.join('_'), type: 'building' };
    }
  }

  // Default to landmark for top-level locations
  return { type: 'landmark' };
}

/**
 * Groups locations hierarchically based on parent-child relationships
 */
export function groupLocationsHierarchically(
  locations: Record<string, LocationData>,
): Record<string, GroupedLocation> {
  const grouped: Record<string, GroupedLocation> = {};
  const childrenByParent: Record<string, string[]> = {};

  // First pass: identify all parent-child relationships
  for (const [key, location] of Object.entries(locations)) {
    if (location.parent) {
      if (!childrenByParent[location.parent]) {
        childrenByParent[location.parent] = [];
      }
      childrenByParent[location.parent].push(key);
    }
  }

  // Second pass: create grouped structure
  for (const [key, location] of Object.entries(locations)) {
    const groupedLocation: GroupedLocation = {
      ...location,
      hasData: hasLocationData(location),
    };

    // Add children if this location is a parent
    if (childrenByParent[key]) {
      groupedLocation.children = childrenByParent[key]
        .map((childKey) => ({
          ...locations[childKey],
          hasData: hasLocationData(locations[childKey]),
        }))
        .sort((a, b) => sortLocationsByType(a, b));
    }

    // Only add top-level locations (those without parents) to the main grouped object
    if (!location.parent) {
      grouped[key] = groupedLocation;
    }
  }

  return grouped;
}

/**
 * Checks if a location has any meaningful data (Pokemon, items, trainers, etc.)
 */
function hasLocationData(location: LocationData): boolean {
  return !!(
    (location.npcTrades && location.npcTrades.length > 0) ||
    (location.events && location.events.length > 0) ||
    (location.items && location.items.length > 0) ||
    (location.tmhms && location.tmhms.length > 0) ||
    (location.trainers && location.trainers.length > 0) ||
    location.gymLeader ||
    location.flyable ||
    location.pokemonCount ||
    location.hasHiddenGrottoes
  );
}

/**
 * Sort locations by type priority for better UI organization
 */
function sortLocationsByType(a: LocationData, b: LocationData): number {
  const typePriority: Record<string, number> = {
    gym: 0,
    building: 1,
    house: 2,
    tower: 3,
    floor: 4,
    cave: 5,
  };

  const aPriority = typePriority[a.type || ''] || 999;
  const bPriority = typePriority[b.type || ''] || 999;

  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }

  // If same type, sort by name
  return a.name.localeCompare(b.name);
}

/**
 * Filters locations to show only those with meaningful data
 */
export function filterLocationsWithData(
  locations: Record<string, GroupedLocation>,
): Record<string, GroupedLocation> {
  const filtered: Record<string, GroupedLocation> = {};

  for (const [key, location] of Object.entries(locations)) {
    // Check if this location or any of its children have data
    const hasDataInTree =
      location.hasData || (location.children && location.children.some((child) => child.hasData));

    if (hasDataInTree) {
      // If location has data in tree, include it but filter children
      const filteredLocation = { ...location };

      if (location.children) {
        filteredLocation.children = location.children.filter((child) => child.hasData);
      }

      filtered[key] = filteredLocation;
    }
  }

  return filtered;
}

/**
 * Gets only landmark locations (those with id >= 0)
 */
export function getLandmarkLocations(
  locations: Record<string, GroupedLocation>,
): Record<string, GroupedLocation> {
  const landmarks: Record<string, GroupedLocation> = {};

  for (const [key, location] of Object.entries(locations)) {
    if (location.id >= 0) {
      landmarks[key] = location;
    }
  }

  return landmarks;
}

/**
 * Creates a flat list of all locations including children for search/filtering
 */
export function flattenGroupedLocations(
  locations: Record<string, GroupedLocation>,
): Record<string, GroupedLocation> {
  const flattened: Record<string, GroupedLocation> = {};

  for (const [key, location] of Object.entries(locations)) {
    // Add the parent location
    flattened[key] = { ...location };
    delete flattened[key].children; // Remove children from flattened version

    // Add all children as separate entries
    if (location.children) {
      for (const child of location.children) {
        flattened[child.name] = { ...child };
      }
    }
  }

  return flattened;
}
