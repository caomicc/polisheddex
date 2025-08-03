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
    
    // Safari Zone consolidation - all safari areas go to safari_zone
    /^(safari_zone)_(east|west|north|hub|fuchsia_gate|.*_rest_house.*)$/,  // All safari areas -> "safari_zone"
    
    // Ruins of Alph consolidation - all chambers and rooms go to ruins_of_alph
    /^(ruins_of_alph)_(.*_chamber|.*_item_room|.*_word_room|research_center|sinjoh_chamber)$/,  // All ruins areas -> "ruins_of_alph"
    
    // City building consolidation - match building types and consolidate to parent city
    /^([a-z_]+)_(mart|poke_center.*|gym.*|port|harbor|cafe|hotel.*|museum.*|dept_store.*|game_corner|train_station|lab|pharmacy|bike_shop|name_rater|happiness_rater|flower_shop|net_ball_house|band_house|honey_house|pp_speech_house|bills_house|magnet_train_station).*$/,  // Common city buildings
    
    // City house consolidation - individual houses within cities/towns  
    /^([a-z_]+)_(.*_house|.*_speech_house|.*_trade_house|.*_berry_.*_house|.*_couple_house|.*_police_station|.*_development_.*_house|.*_old_man_.*_house|.*_water_show_.*_house|.*_gym_badge_.*_house|.*_lugia_.*_house|.*_orre_.*_house|.*_rich_.*_house|.*_hitmontop_.*_house|.*_book_.*_house|charcoal_kiln|.*_evolution_.*_house|.*_nickname_.*_house|.*_onix_.*_house)$/,
    
    // Route segment patterns (expanded)
    /^(route_\d+)_(north|south|east|west|coast|gate|.*_gate|rest_house|poke_center.*|.*_speech_house|.*_berry_.*_house)$/,  // Route sub-areas
    
    // Multi-building complexes
    /^(.+_tower)_(\d+f|entrance|roof|.*_room)$/,        // Tower floors and rooms
    /^(.+_cave)_(entrance|.*_entrance|b?\d+f)$/,         // Cave areas and floors
    /^(.+_tunnel)_(entrance|west|east)$/,                // Tunnel segments
    /^(.+_islands?)_(entrance|hub|.*_area)$/,            // Island areas
    /^(.+_forest)_(entrance|.*_gate)$/,                  // Forest areas
    /^(.+_gym)_(\d+f|entrance|.*_room)$/,               // Gym floors
    /^(.+_well)_(entrance|b?\d+f)$/,                     // Well areas
    
    // Fast Ship areas
    /^(fast_ship)_(.*f|cabins_.*|entrance)$/,              // Fast ship areas -> "fast_ship"
    
    // Hotel/building room patterns (expanded)
    /^(.+)_(room\d+[a-z]?|restaurant|cafeteria|library|classroom\d*|office|pool|lobby|reception)$/,  // Building areas
    
    // Underground areas
    /^(underground)_(path_.*|warehouse)$/,                 // Underground areas -> "underground"
    
    // Pokémon League areas
    /^(pokemon_league)_(gate|entrance|.*_room)$/,        // League areas
    
    // Department store floors (catch any remaining multi-floor stores)
    /^(.+_store)_(\d+f)$/,                              // Store floors
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

  // No area found, but check if this should be mapped to a parent city
  const parentCity = getParentCityMapping(locationKey);
  if (parentCity !== locationKey) {
    // For city mappings, the original location key becomes the area ID
    return { parentLocation: parentCity, areaId: locationKey };
  }
  
  return { parentLocation: locationKey };
}

/**
 * Map building/facility names to their parent city/town
 */
function getParentCityMapping(locationKey: string): string {
  // City/town mapping for buildings that should be consolidated
  const cityMappings: Record<string, string> = {
    // Kanto cities
    'vermilion_port': 'vermilion_city',
    'vermilion_mart': 'vermilion_city',
    'vermilion_poke_center_1f': 'vermilion_city',
    'vermilion_house_digletts_cave_speech_house': 'vermilion_city',
    'vermilion_house_fishing_speech_house': 'vermilion_city',
    'vermilion_magnet_train_speech_house': 'vermilion_city',
    'vermilion_pollution_speech_house': 'vermilion_city',
    'vermilion_ss_anne_speech_house': 'vermilion_city',
    
    'cerulean_mart': 'cerulean_city',
    'cerulean_poke_center_1f': 'cerulean_city',
    'cerulean_couple_house': 'cerulean_city',
    'cerulean_berry_powder_house': 'cerulean_city',
    'cerulean_police_station': 'cerulean_city',
    'cerulean_gym_badge_speech_house': 'cerulean_city',
    'cerulean_trade_speech_house': 'cerulean_city',
    'cerulean_water_show_speech_house': 'cerulean_city',
    'cerulean_bike_shop': 'cerulean_city',
    
    'celadon_cafe': 'celadon_city',
    'celadon_chief_house': 'celadon_city', 
    'celadon_dept_store': 'celadon_city',
    'celadon_development_speech_house': 'celadon_city',
    'celadon_game_corner': 'celadon_city',
    'celadon_game_corner_prize_room': 'celadon_city',
    'celadon_home_decor_store_1f': 'celadon_city',
    'celadon_mansion': 'celadon_city',
    'celadon_old_man_speech_house': 'celadon_city',
    'celadon_poke_center_1f': 'celadon_city',
    'celadon_university': 'celadon_city',
    
    'saffron_book_speech_house': 'saffron_city',
    'saffron_hitmontop_kid_house': 'saffron_city',
    'saffron_mart': 'saffron_city',
    'saffron_orre_speech_house': 'saffron_city',
    'saffron_poke_center_1f': 'saffron_city',
    'saffron_rich_speech_house': 'saffron_city',
    'saffron_train_station': 'saffron_city',
    
    'fuchsia_bill_speech_house': 'fuchsia_city',
    'fuchsia_mart': 'fuchsia_city',
    'fuchsia_poke_center_1f': 'fuchsia_city',
    'fuchsia_safari_ball_house': 'fuchsia_city',
    
    'pewter_mart': 'pewter_city',
    'pewter_museum_of_science_1f': 'pewter_city',
    'pewter_nidoran_speech_house': 'pewter_city',
    'pewter_poke_center_1f': 'pewter_city',
    'pewter_snooze_speech_house': 'pewter_city',
    
    'lavender_mart': 'lavender_town',
    'lavender_name_rater': 'lavender_town',
    'lavender_poke_center_1f': 'lavender_town',
    'lavender_soul_house': 'lavender_town',
    'lavender_town_speech_house': 'lavender_town',
    
    'cinnabar_lab': 'cinnabar_island',
    'cinnabar_poke_center_1f': 'cinnabar_island',
    
    // Johto cities/towns
    'goldenrod_band_house': 'goldenrod_city',
    'goldenrod_bike_shop': 'goldenrod_city',
    'goldenrod_bills_house': 'goldenrod_city',
    'goldenrod_dept_store': 'goldenrod_city',
    'goldenrod_flower_shop': 'goldenrod_city',
    'goldenrod_game_corner': 'goldenrod_city',
    'goldenrod_happiness_rater': 'goldenrod_city',
    'goldenrod_harbor_gate': 'goldenrod_city',
    'goldenrod_honey_house': 'goldenrod_city',
    'goldenrod_magnet_train_station': 'goldenrod_city',
    'goldenrod_museum_1f': 'goldenrod_city',
    'goldenrod_name_rater': 'goldenrod_city',
    'goldenrod_net_ball_house': 'goldenrod_city',
    'goldenrod_pokecom_center_1f': 'goldenrod_city',
    'goldenrod_pp_speech_house': 'goldenrod_city',
    
    'cherrygrove_evolution_speech_house': 'cherrygrove_city',
    'cherrygrove_gym_speech_house': 'cherrygrove_city',
    'cherrygrove_mart': 'cherrygrove_city',
    'cherrygrove_poke_center_1f': 'cherrygrove_city',
    
    'azalea_mart': 'azalea_town',
    'azalea_poke_center_1f': 'azalea_town',
    'charcoal_kiln': 'azalea_town',
    
    'violet_mart': 'violet_city',
    'violet_nickname_speech_house': 'violet_city',
    'violet_onix_trade_house': 'violet_city',
    'violet_poke_center_1f': 'violet_city',
    
    'ecruteak_cherish_ball_house': 'ecruteak_city',
    'ecruteak_destiny_knot_house': 'ecruteak_city',
    'ecruteak_house': 'ecruteak_city',
    'ecruteak_itemfinder_house': 'ecruteak_city',
    'ecruteak_lugia_speech_house': 'ecruteak_city',
    'ecruteak_mart': 'ecruteak_city',
    'ecruteak_poke_center_1f': 'ecruteak_city',
    
    'olivine_cafe': 'olivine_city',
    'olivine_good_rod_house': 'olivine_city',
    'olivine_mart': 'olivine_city',
    'olivine_poke_center_1f': 'olivine_city',
    'olivine_port': 'olivine_city',
    'olivine_punishment_speech_house': 'olivine_city',
    'olivine_tims_house': 'olivine_city',
    
    'cianwood_city_photo_studio': 'cianwood_city',
    'cianwood_lugia_speech_house': 'cianwood_city',
    'cianwood_pharmacy': 'cianwood_city',
    'cianwood_poke_center_1f': 'cianwood_city',
    
    'mahogany_mart_1f': 'mahogany_town',
    'mahogany_poke_center_1f': 'mahogany_town',
    'mahogany_red_gyarados_speech_house': 'mahogany_town',
    
    'blackthorn_dragon_speech_house': 'blackthorn_city',
    'blackthorn_emys_house': 'blackthorn_city',
    'blackthorn_mart': 'blackthorn_city',
    'blackthorn_poke_center_1f': 'blackthorn_city',
    
    // Other consolidation targets
    'guide_gents_house': 'cherrygrove_city',
    'mr_pokemons_house': 'route_30',
    'route_30_berry_speech_house': 'route_30',
  };
  
  return cityMappings[locationKey] || locationKey;
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
