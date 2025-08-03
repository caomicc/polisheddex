/**
 * Client-side function to format a normalized location key into a display name
 * This creates reasonable display names without requiring file system access
 * @param normalizedKey - The normalized location key (e.g., "union_cave_b_1f_south")
 * @returns A formatted display name (e.g., "Union Cave B1F South")
 */
export function getLocationDisplayName(normalizedKey: string): string {
  if (!normalizedKey) return 'Unknown Location';

  return (
    normalizedKey
      .split('_')
      .map((word) => {
        // Handle special cases
        if (word === 'b') return 'B';
        if (word.match(/^\d+f$/)) return word.toUpperCase(); // 1f -> 1F
        if (word.match(/^b\d+f$/)) return word.toUpperCase(); // b1f -> B1F
        // Handle route numbers
        if (word === 'route') return 'Route';
        // Capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      // Fix spacing issues with basement floors: "B 1F" -> "B1F"
      .replace(/\bB (\d+F)\b/g, 'B$1')
  );
}

// --- Normalize Location Key ---
/**
 * Normalize location names to consistent snake_case keys
 * This ensures all data sources (Pokemon locations, comprehensive locations, etc.) use the same keys
 */
export function normalizeLocationKey(input: string): string {
  console.log(`Normalizing location key: ${input}`);
  const normalizedKey = input
    // Convert CamelCase/PascalCase to snake_case first
    // Handle sequences like "B1FSouth" -> "B1_F_South"
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
    // Handle route numbers specifically: "route30" -> "route_30"
    .replace(/^route(\d+)(_|$)/g, 'route_$1$2')
    // Convert spaces, hyphens, and other separators to underscores
    .replace(/[\s\-\.]+/g, '_')
    // Handle basement floor patterns: "b_1_f" -> "b_1f"
    .replace(/_b(\d+)_f(?=_|$)/g, '_b_$1f')
    // Handle regular floor patterns: "tower_1_f" -> "tower_1f"
    .replace(/(\w)_?(\d+)_+f(_|$)/gi, '$1_$2f$3')
    // Pattern for standalone numbers that should be floors - but NOT for routes
    // Only add "f" to numbers that are likely floors (between words that suggest buildings/areas)
    .replace(
      /(tower|building|floor|level|gym|center|house|cave|tunnel|path|mansion)_(\d+)(_|$)/gi,
      '$1_$2f$3',
    )
    .replace(/(\w)_(\d+)_(\w+)_side(_|$)/gi, '$1_$2f_$3_side$4') // Handle "ice_path_2_blackthorn_side" -> "ice_path_2f_blackthorn_side"
    // Clean up multiple underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  console.log(`Normalized location key: ${normalizedKey}`);
  return normalizedKey;
}

console.log('🌍 Normalized location key function ready');

// Helper function to convert method names to more user-friendly format
export function formatMethod(method: string): string {
  if (method === 'grass') return 'Wild Grass';
  if (method === 'surf') return 'Surfing';
  if (method === 'fish') return 'Fishing';
  if (method === 'rock_smash') return 'Rock Smash';
  if (method === 'headbutt') return 'Headbutt';
  if (method === 'gift') return 'Gift Pokémon';
  if (method === 'event') return 'Event Pokémon';
  if (method === 'egg') return 'Egg';
  if (method === 'trade') return 'Trade';
  if (method === 'special') return 'Special Encounter';
  if (method === 'roaming') return 'Roaming Pokémon';
  if (method === 'swarm') return 'Swarm Encounter';
  if (method === 'honey_tree') return 'Honey Tree';
  if (method === 'rock') return 'Rock';
  if (method === 'cave') return 'Cave Encounter';
  if (method === 'hidden') return 'Hidden Pokémon';
  if (method === 'hidden_grotto') return 'Hidden Grotto';
  if (method === 'unknown') return 'Special Encounter';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

// Helper function to format time of day
export function formatTime(time: string): string {
  if (time === 'morn') return 'Morning';
  if (time === 'day') return 'Day';
  if (time === 'nite') return 'Night';
  if (time === 'eve') return 'Evening';
  if (time === 'any') return 'Any Time';
  // Hidden grotto rarities
  if (time === 'common') return 'Common';
  if (time === 'uncommon') return 'Uncommon';
  if (time === 'rare') return 'Rare';
  return time.charAt(0).toUpperCase() + time.slice(1);
}

// --- Consolidated Location Utilities ---

/**
 * Extract area ID from a location key that may include area information
 * @param locationKey - The location key (e.g., "celadon_dept_store_1f", "indigo_plateau")
 * @returns Object with parentLocation and areaId
 */
export function parseLocationKey(locationKey: string): { parentLocation: string; areaId?: string } {
  // Check for known consolidation patterns
  const consolidationPatterns = [
    // Multi-floor patterns (basement floors first to catch them before regular floors)
    /^(.+)_(b_\d+f)$/,            // "cave_b_1f" -> parent: "cave", area: "b_1f"
    /^(.+)_b(\d+f)$/,             // "scary_cave_b1f" -> parent: "scary_cave", area: "b_1f"
    /^(.+)_(\d+f)$/,              // "celadon_dept_store_1f" -> parent: "celadon_dept_store", area: "1f"
    /^(.+)_(basement)$/,          // "location_basement" -> parent: "location", area: "basement"
    /^(.+)_(roof)$/,              // "location_roof" -> parent: "location", area: "roof"
    /^(.+)_(outside)$/,           // "location_outside" -> parent: "location", area: "outside"
    /^(.+)_(entrance)$/,          // "location_entrance" -> parent: "location", area: "entrance"
    
    // Route segment patterns
    /^(route_\d+)_(north|south|east|west|coast)$/,  // "route_10_north" -> parent: "route_10", area: "north"
    /^(route_\d+)_(poke_center_\d+f)$/,             // "route_32_poke_center_1f" -> parent: "route_32", area: "poke_center_1f"
    
    // Hotel/building room patterns
    /^(.+)_(room\d+[a-z]?)$/,     // "celadon_hotel_room1" -> parent: "celadon_hotel", area: "room1"
    /^(.+)_(restaurant|cafeteria|library|classroom\d*|office|pool)$/,  // University/hotel areas
  ];

  for (const pattern of consolidationPatterns) {
    const match = locationKey.match(pattern);
    if (match) {
      return {
        parentLocation: match[1],
        areaId: match[2]
      };
    }
  }

  // No area found, return as parent location
  return { parentLocation: locationKey };
}

/**
 * Create a location key from parent and area ID
 * @param parentLocation - The parent location key
 * @param areaId - The area ID (optional)
 * @returns Combined location key
 */
export function createLocationKey(parentLocation: string, areaId?: string): string {
  if (!areaId || areaId === 'main') {
    return parentLocation;
  }
  return `${parentLocation}_${areaId}`;
}

/**
 * Get the consolidated location key for a given location
 * This maps old individual location keys to their consolidated parent
 * @param locationKey - Original location key
 * @returns Consolidated location key
 */
export function getConsolidatedLocationKey(locationKey: string): string {
  const { parentLocation } = parseLocationKey(locationKey);
  
  // Map known consolidation targets
  const consolidationMapping: Record<string, string> = {
    // Elite 4 rooms -> Indigo Plateau
    'brunos_room': 'indigo_plateau',
    'karens_room': 'indigo_plateau',
    'kogas_room': 'indigo_plateau',
    'lances_room': 'indigo_plateau',
    'wills_room': 'indigo_plateau',
    
    // Gym leaders -> Gyms (these should be mapped to their gym locations)
    'falkner': 'violet_gym',
    'bugsy': 'azalea_gym',
    'whitney': 'goldenrod_gym',
    'morty': 'ecruteak_gym',
    'chuck': 'cianwood_gym',
    'jasmine': 'olivine_gym',
    'pryce': 'mahogany_gym',
    'clair': 'blackthorn_gym',
    'brock': 'pewter_gym',
    'misty': 'cerulean_gym',
    'lt_surge': 'vermilion_gym',
    'erika': 'celadon_gym',
    'sabrina': 'saffron_gym',
    'janine': 'fuchsia_gym',
    'blaine': 'cinnabar_gym',
    'blue': 'viridian_gym',
    
    // Duplicate aliases
    'mt_moon': 'mount_moon',
    'mt_mortar': 'mount_mortar',
  };

  return consolidationMapping[locationKey] || parentLocation;
}

/**
 * Build URL for consolidated location with optional area
 * @param locationKey - The location key
 * @param areaId - Optional area ID for deep linking
 * @returns URL path
 */
export function buildLocationUrl(locationKey: string, areaId?: string): string {
  const consolidatedKey = getConsolidatedLocationKey(locationKey);
  const basePath = `/locations/${consolidatedKey}`;
  
  if (areaId && areaId !== 'main') {
    return `${basePath}?area=${encodeURIComponent(areaId)}`;
  }
  
  return basePath;
}

/**
 * Parse URL to extract location and area information
 * @param url - The URL path
 * @returns Object with location key and area ID
 */
export function parseLocationUrl(url: string): { locationKey: string; areaId?: string } {
  const [path, search] = url.split('?');
  const locationKey = path.replace('/locations/', '');
  
  if (search) {
    const params = new URLSearchParams(search);
    const areaId = params.get('area');
    return { locationKey, areaId: areaId || undefined };
  }
  
  return { locationKey };
}

/**
 * Create a redirect mapping for old location URLs to new consolidated URLs
 * @param oldLocationKey - The old location key
 * @returns New URL path or null if no redirect needed
 */
export function getLocationRedirect(oldLocationKey: string): string | null {
  const { parentLocation, areaId } = parseLocationKey(oldLocationKey);
  const consolidatedKey = getConsolidatedLocationKey(oldLocationKey);
  
  // If the location was consolidated, create redirect
  if (consolidatedKey !== oldLocationKey) {
    return buildLocationUrl(consolidatedKey, areaId);
  }
  
  // If it's a child location that should redirect to parent with area
  if (parentLocation !== oldLocationKey) {
    return buildLocationUrl(parentLocation, areaId);
  }
  
  return null;
}
