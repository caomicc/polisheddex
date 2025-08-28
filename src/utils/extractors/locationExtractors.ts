import fs from 'node:fs';
import type {
  EncounterDetail,
  LocationAreaData,
  LocationEntry,
  PokemonLocationData,
  LocationData,
  LocationConnection,
} from '../../types/types.ts';
import path from 'node:path';
import { normalizeMonName } from '../stringUtils.ts';
import { getFullPokemonName } from './pokedexExtractors.ts';
import { parseFishGroups, parseFishLocationMappings, processLocations } from '../helpers.ts';
import { fileURLToPath } from 'node:url';
import { normalizePokemonUrlKey } from '../pokemonUrlNormalizer.ts';
import { normalizeLocationKey } from '../locationUtils.ts';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCATIONS_DATA_PATH = path.join(__dirname, '../../../output/pokemon_locations.json');
const LOCATIONS_BY_AREA_OUTPUT = path.join(__dirname, '../../../output/locations_by_area.json');

/**
 * Normalizes location display names, handling floor abbreviations
 */
export function normalizeLocationDisplayName(locationKey: string): string {
  return locationKey
    .split('_')
    .map((word, index, words) => {
      // Handle floor abbreviations (e.g., "2F" -> "Second Floor")
      if (word.match(/^\d+f$/i)) {
        const floorNumber = word.replace(/f$/i, '');
        const floorNames = [
          '',
          'First',
          'Second',
          'Third',
          'Fourth',
          'Fifth',
          'Sixth',
          'Seventh',
          'Eighth',
          'Ninth',
          'Tenth',
        ];
        const num = parseInt(floorNumber);
        if (num > 0 && num < floorNames.length) {
          return `${floorNames[num]} Floor`;
        }
        return `${floorNumber} Floor`;
      }

      // Handle room abbreviations (e.g., "room3" -> "Room 3")
      if (word.match(/^room\d+$/i)) {
        const roomNumber = word.replace(/^room/i, '');
        return `Room ${roomNumber}`;
      }

      // Handle individual digit + letter f pattern (e.g., "2", "f" -> "Second Floor")
      if (
        !isNaN(parseInt(word)) &&
        index < words.length - 1 &&
        words[index + 1].toLowerCase() === 'f'
      ) {
        const floorNames = [
          '',
          'First',
          'Second',
          'Third',
          'Fourth',
          'Fifth',
          'Sixth',
          'Seventh',
          'Eighth',
          'Ninth',
          'Tenth',
        ];
        const num = parseInt(word);
        if (num > 0 && num < floorNames.length) {
          return `${floorNames[num]} Floor`;
        }
        return `${word} Floor`;
      }

      // Handle individual "room" + number pattern (e.g., "room", "3" -> "Room 3")
      if (
        word.toLowerCase() === 'room' &&
        index < words.length - 1 &&
        !isNaN(parseInt(words[index + 1]))
      ) {
        return 'Room';
      }

      // Skip standalone number that comes after "room" (handled above)
      if (!isNaN(parseInt(word)) && index > 0 && words[index - 1].toLowerCase() === 'room') {
        return word; // Return the number to be joined with "Room"
      }

      // Skip standalone "f" that comes after a number (handled above)
      if (word.toLowerCase() === 'f' && index > 0 && !isNaN(parseInt(words[index - 1]))) {
        return null; // Mark for removal
      }

      // Handle "B" followed by floor number (e.g., "B", "2F" -> "B Second Floor")
      if (
        word.toLowerCase() === 'b' &&
        index < words.length - 1 &&
        words[index + 1].match(/^\d+f$/i)
      ) {
        return 'B';
      }

      // Skip processing floor numbers that come after "B" (they'll be handled above)
      if (index > 0 && words[index - 1].toLowerCase() === 'b' && word.match(/^\d+f$/i)) {
        const floorNumber = word.replace(/f$/i, '');
        const floorNames = [
          '',
          'First',
          'Second',
          'Third',
          'Fourth',
          'Fifth',
          'Sixth',
          'Seventh',
          'Eighth',
          'Ninth',
          'Tenth',
        ];
        const num = parseInt(floorNumber);
        if (num > 0 && num < floorNames.length) {
          return `${floorNames[num]} Floor`;
        }
        return `${floorNumber} Floor`;
      }

      // Regular word capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .filter((word) => word !== null && word !== '') // Remove null/empty entries
    .join(' ');
}

// --- Hidden Grotto Extraction ---
export function extractHiddenGrottoes(): Record<string, LocationEntry[]> {
  // Result will be keyed by Pokémon name, containing location entries
  const grottoLocations: Record<string, LocationEntry[]> = {};

  // Read the grottoes.asm file
  const grottoeFilePath = path.join(
    __dirname,
    '../../../polishedcrystal/data/events/hidden_grottoes/grottoes.asm',
  );
  if (!fs.existsSync(grottoeFilePath)) {
    console.warn('Hidden grottoes file not found, skipping extraction');
    return {};
  }

  const grottoeContents = fs.readFileSync(grottoeFilePath, 'utf8');
  const lines = grottoeContents.split(/\r?\n/);

  // Maps for item names and location names
  const itemNames: Record<string, string> = {
    FIRE_STONE: 'Fire Stone',
    WATER_STONE: 'Water Stone',
    THUNDER_STONE: 'Thunder Stone',
    LEAF_STONE: 'Leaf Stone',
    MOON_STONE: 'Moon Stone',
    SUN_STONE: 'Sun Stone',
    SHINY_STONE: 'Shiny Stone',
    DUSK_STONE: 'Dusk Stone',
    ICE_STONE: 'Ice Stone',
    EVERSTONE: 'Everstone',
  };

  // Maps for location names (from CONSTANT to human-readable name)
  const locationNames: Record<string, string> = {
    HIDDENGROTTO_ROUTE_32: 'Route 32',
    HIDDENGROTTO_ILEX_FOREST: 'Ilex Forest',
    HIDDENGROTTO_ROUTE_35: 'Route 35',
    HIDDENGROTTO_ROUTE_36: 'Route 36',
    HIDDENGROTTO_CHERRYGROVE_BAY: 'Cherrygrove Bay',
    HIDDENGROTTO_VIOLET_OUTSKIRTS: 'Violet Outskirts',
    HIDDENGROTTO_ROUTE_32_COAST: 'Route 32 Coast',
    HIDDENGROTTO_STORMY_BEACH: 'Stormy Beach',
    HIDDENGROTTO_ROUTE_35_COAST: 'Route 35 Coast',
    HIDDENGROTTO_RUINS_OF_ALPH: 'Ruins of Alph',
    HIDDENGROTTO_ROUTE_47: 'Route 47',
    HIDDENGROTTO_YELLOW_FOREST: 'Yellow Forest',
    HIDDENGROTTO_RUGGED_ROAD_NORTH: 'Rugged Road North',
    HIDDENGROTTO_SNOWTOP_MOUNTAIN_INSIDE: 'Snowtop Mountain Inside',
    HIDDENGROTTO_ROUTE_42: 'Route 42',
    HIDDENGROTTO_LAKE_OF_RAGE: 'Lake of Rage',
    HIDDENGROTTO_BELLCHIME_TRAIL: 'Bellchime Trail',
    HIDDENGROTTO_ROUTE_44: 'Route 44',
    HIDDENGROTTO_ROUTE_45: 'Route 45',
    HIDDENGROTTO_ROUTE_46: 'Route 46',
    HIDDENGROTTO_SINJOH_RUINS: 'Sinjoh Ruins',
    HIDDENGROTTO_SILVER_CAVE: 'Silver Cave',
  };

  let currentLocation: string | null = null;
  let rareItem: string | null = null;
  let level: string | number | null = null;
  let common1: string | null = null;
  let common2: string | null = null;
  let uncommon: string | null = null;
  let rare: string | null = null;

  // Process the file line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and table headers
    if (!line || line.startsWith('HiddenGrottoData:') || line.startsWith('table_width')) continue;

    // Parse location headers
    if (line.startsWith('; HIDDENGROTTO_') || line.match(/^;\s*HIDDENGROTTO_/)) {
      const locationMatch = line.match(/;\s*(HIDDENGROTTO_[A-Z_]+)/);
      if (locationMatch) {
        const locationKey = locationMatch[1];
        currentLocation =
          locationNames[locationKey] || locationKey.replace('HIDDENGROTTO_', '').replace(/_/g, ' ');
      }
      continue;
    }

    // Parse the grotto data line (db warp number, rare item, level)
    if (line.startsWith('db') && currentLocation) {
      const dataMatch = line.match(/db\s+(\d+),\s+([A-Z_]+),\s+([A-Z0-9_\+\-\s]+)/);
      if (dataMatch) {
        rareItem = itemNames[dataMatch[2]] || dataMatch[2];

        // Normalize LEVEL_FROM_BADGES to a consistent string
        if (/LEVEL_FROM_BADGES/.test(dataMatch[3])) {
          const modifierMatch = dataMatch[3].match(/LEVEL_FROM_BADGES\s*([\+\-]\s*\d+)?/);
          if (modifierMatch && modifierMatch[1]) {
            level = `Badge Level ${modifierMatch[1].replace(/\s+/g, ' ')}`;
          } else {
            level = 'Badge Level';
          }
        } else {
          level = dataMatch[3];
        }
      }
      continue;
    }

    // Parse Pokemon entries
    if (line.startsWith('dp') && currentLocation && rareItem && level !== null) {
      const pokemonMatch = line.match(/dp\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?/);
      if (pokemonMatch) {
        const pokemonName = pokemonMatch[1];
        const formName = pokemonMatch[2] || null;

        // Get the formatted Pokémon name using our normalizeMonName function
        const { baseName: baseFormattedName } = normalizeMonName(pokemonName, null);
        const { formName: normalizedFormName } = normalizeMonName(pokemonName, formName); // Extract form name
        const fullName = getFullPokemonName(pokemonName, formName); // Legacy full name for indexing

        // Determine which slot this is and set rarity
        let rarity: string;
        if (common1 === null) {
          common1 = baseFormattedName;
          rarity = 'common';
        } else if (common2 === null) {
          common2 = baseFormattedName;
          rarity = 'common';
        } else if (uncommon === null) {
          uncommon = baseFormattedName;
          rarity = 'uncommon';
        } else if (rare === null) {
          rare = baseFormattedName;
          rarity = 'rare';

          // Reset for next grotto
          common1 = null;
          common2 = null;
          uncommon = null;
          rare = null;
        } else {
          continue; // Something went wrong with the parsing
        }

        // Add this location to the Pokémon's entry
        if (!grottoLocations[fullName]) {
          grottoLocations[fullName] = [];
        }

        grottoLocations[fullName].push({
          area: currentLocation,
          method: 'hidden_grotto',
          time: rarity,
          level: String(level), // Convert to string regardless of type
          chance: rarity === 'rare' ? 5 : rarity === 'uncommon' ? 15 : 40,
          rareItem: rareItem,
          formName: normalizedFormName, // Add form information
        });
      }
    }
  }

  return grottoLocations;
}

// Load the Pokemon location data
export async function extractLocationsByArea() {
  try {
    const pokemonLocationsData = JSON.parse(
      await fs.promises.readFile(LOCATIONS_DATA_PATH, 'utf8'),
    );

    // Organize by area
    const locationsByArea: Record<string, LocationAreaData> = {};

    // Process each Pokemon and its locations
    for (const [pokemon, pokemonData] of Object.entries<PokemonLocationData>(
      pokemonLocationsData,
    )) {
      // Process base form locations
      if (pokemonData.locations && Array.isArray(pokemonData.locations)) {
        processLocations(pokemon, pokemonData.locations, null, locationsByArea);
      }

      // Process alternate forms if they exist
      if (pokemonData.forms) {
        for (const [formName, formData] of Object.entries(pokemonData.forms)) {
          if (formData.locations && Array.isArray(formData.locations)) {
            processLocations(pokemon, formData.locations, formName, locationsByArea);
          }
        }
      }
    }

    // --- The encounter rates are already correct from the ROM parsing ---
    // No need to recalculate them, just use what's already in the LocationEntry data
    // The processLocations function preserves the original encounter rates

    // Write to file
    await fs.promises.writeFile(LOCATIONS_BY_AREA_OUTPUT, JSON.stringify(locationsByArea, null, 2));

    console.log(`Location data by area extracted to ${LOCATIONS_BY_AREA_OUTPUT}`);
  } catch (error) {
    console.error('Error extracting locations by area:', error);
  }
}

/**
 * Converts cumulative probability thresholds to individual slot percentages.
 * @param cumulative Array of cumulative values (e.g., [30, 60, 80, ...])
 * @returns Array of slot percentages (e.g., [30, 30, 20, ...])
 */
function getSlotPercentages(cumulative: number[]): number[] {
  return cumulative.map((val, idx, arr) => val - (arr[idx - 1] ?? 0));
}

/**
 * Maps encounter rates to Pokémon for a given area using the ASM probability tables.
 * @param pokemonList - Array of Pokémon names in encounter slot order.
 * @param encounterType - 'grass' | 'surf' | 'fish'
 * @returns Array of objects: { name: string, rate: number }
 */
export function mapEncounterRatesToPokemon(
  pokemonList: string[],
  encounterType: 'grass' | 'surf' | 'fish',
): Array<{ name: string; rate: number }> {
  // Probability tables from probabilities.asm (cumulative)
  const GRASS_PROBABILITIES_CUMULATIVE = [30, 60, 80, 90, 95, 98, 100];
  const SURF_PROBABILITIES_CUMULATIVE = [60, 90, 100]; // Surf: 3 slots
  const FISH_PROBABILITIES_CUMULATIVE = [70, 90, 98, 100]; // Example: 4 slots for fishing

  let probabilities: number[];
  if (encounterType === 'grass') {
    probabilities = getSlotPercentages(GRASS_PROBABILITIES_CUMULATIVE);
  } else if (encounterType === 'surf') {
    probabilities = getSlotPercentages(SURF_PROBABILITIES_CUMULATIVE);
  } else if (encounterType === 'fish') {
    probabilities = getSlotPercentages(FISH_PROBABILITIES_CUMULATIVE);
  } else {
    probabilities = [];
  }

  return pokemonList.map((name, idx) => ({
    name,
    rate: probabilities[idx] || 0, // 0 if more Pokémon than slots
  }));
}

// --- Synchronize encounter rates from locations_by_area.json to pokemon_locations.json ---
export async function synchronizeLocationChances() {
  const locationsByArea = JSON.parse(await fs.promises.readFile(LOCATIONS_BY_AREA_OUTPUT, 'utf8'));
  const pokemonLocations = JSON.parse(await fs.promises.readFile(LOCATIONS_DATA_PATH, 'utf8'));

  // Helper to normalize area names for matching
  function normalizeArea(area: string): string {
    return area
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  for (const [pokemon, rawData] of Object.entries(pokemonLocations)) {
    const data = rawData as PokemonLocationData;
    // Handle base form locations
    if (Array.isArray(data.locations)) {
      for (const loc of data.locations) {
        const areaName = normalizeArea(loc.area ?? '');
        const method = loc.method || 'unknown';
        const time = loc.time || 'any';
        const level = loc.level;
        // Find matching slot in locations_by_area.json
        const areaObj =
          locationsByArea[areaName]?.pokemon?.[pokemon]?.methods?.[method]?.times?.[time];
        if (areaObj) {
          // Find matching slot by level and (optionally) formName
          const match = areaObj.find(
            (slot: EncounterDetail) =>
              String(slot.level) === String(level) &&
              (loc.formName == null || slot.formName === loc.formName),
          );
          if (match) {
            loc.chance = match.chance;
          }
        }
      }
    }
    // Handle alternate forms
    if (data.forms) {
      for (const [, formData] of Object.entries(data.forms)) {
        if (Array.isArray(formData.locations)) {
          for (const loc of formData.locations) {
            const areaName = normalizeArea(loc.area ?? '');
            const method = loc.method || 'unknown';
            const time = loc.time || 'any';
            const level = loc.level;
            const areaObj =
              locationsByArea[areaName]?.pokemon?.[pokemon]?.methods?.[method]?.times?.[time];
            if (areaObj) {
              const match = areaObj.find(
                (slot: EncounterDetail) =>
                  String(slot.level) === String(level) &&
                  (loc.formName == null || slot.formName === loc.formName),
              );
              if (match) {
                loc.chance = match.chance;
              }
            }
          }
        }
      }
    }
  }

  // Write updated pokemon_locations.json
  await fs.promises.writeFile(LOCATIONS_DATA_PATH, JSON.stringify(pokemonLocations, null, 2));
  console.log('Synchronized encounter rates in pokemon_locations.json');
}

// --- Comprehensive Location Extraction ---
export function extractAllLocations(): Record<string, LocationData> {
  console.log('🗺️  Extracting all locations from landmarks and flypoints...');

  const locations: Record<string, LocationData> = {};

  // Read landmark constants to get the mapping of names to IDs
  const landmarkConstantsPath = path.join(
    __dirname,
    '../../../polishedcrystal/constants/landmark_constants.asm',
  );
  const landmarksPath = path.join(__dirname, '../../../polishedcrystal/data/maps/landmarks.asm');
  const flyPointsPath = path.join(__dirname, '../../../polishedcrystal/data/maps/flypoints.asm');

  if (!fs.existsSync(landmarkConstantsPath) || !fs.existsSync(landmarksPath)) {
    console.warn('Landmark files not found, skipping comprehensive location extraction');
    return {};
  }

  // Parse landmark constants to get ID mapping
  const constantsContent = fs.readFileSync(landmarkConstantsPath, 'utf8');
  const landmarkIdMap: Record<string, number> = {};
  const landmarkRegionMap: Record<string, 'johto' | 'kanto' | 'orange'> = {};

  const constantsLines = constantsContent.split(/\r?\n/);
  let currentValue = 0;
  let currentRegion: 'johto' | 'kanto' | 'orange' = 'johto';

  for (const line of constantsLines) {
    const trimmedLine = line.trim();

    if (trimmedLine.includes('const_def')) {
      currentValue = 0;
      continue;
    }

    if (trimmedLine.includes('KANTO_LANDMARK EQU')) {
      currentRegion = 'kanto';
      continue;
    }

    if (trimmedLine.includes('SHAMOUTI_LANDMARK EQU')) {
      currentRegion = 'orange';
      continue;
    }

    const constMatch = trimmedLine.match(/^\s*const\s+([A-Z_]+)/);
    if (constMatch) {
      const constantName = constMatch[1];
      landmarkIdMap[constantName] = currentValue;
      landmarkRegionMap[constantName] = currentRegion;
      currentValue++;
    }
  }

  // Parse landmarks.asm to get coordinates and display names
  const landmarksContent = fs.readFileSync(landmarksPath, 'utf8');
  const landmarkLines = landmarksContent.split(/\r?\n/);

  let landmarkIndex = 0;
  const displayNameMap: Record<string, string> = {};

  for (const line of landmarkLines) {
    const trimmedLine = line.trim();

    // Parse landmark macro calls
    const landmarkMatch = trimmedLine.match(/^\s*landmark\s+(-?\d+),\s*(-?\d+),\s*(\w+)/);
    if (landmarkMatch) {
      const x = parseInt(landmarkMatch[1]);
      const y = parseInt(landmarkMatch[2]);
      const nameConstant = landmarkMatch[3];

      // Find the landmark constant name for this index
      const landmarkConstantName = Object.keys(landmarkIdMap).find(
        (name) => landmarkIdMap[name] === landmarkIndex,
      );

      if (landmarkConstantName && landmarkConstantName !== 'SPECIAL_MAP') {
        const region = landmarkRegionMap[landmarkConstantName] || 'johto';

        locations[landmarkConstantName.toLowerCase()] = {
          id: landmarkIndex,
          name: landmarkConstantName.toLowerCase(),
          displayName: '', // Will be filled from display names
          region,
          x,
          y,
          flyable: false, // Will be updated from flypoints
          connections: [], // Will be filled from map attributes
        };
      }

      landmarkIndex++;
    }

    // Parse display name definitions
    const nameMatch = trimmedLine.match(/^(\w+):\s*rawchar\s*"([^@]+)@"/);
    if (nameMatch) {
      const nameConstant = nameMatch[1];
      let displayName = nameMatch[2];

      // Clean up display name (remove ¯ characters used for line breaks)
      displayName = displayName.replace(/¯/g, ' ');

      // Apply location display name normalization to ROM text as well
      displayName = normalizeLocationDisplayName(displayName.toLowerCase().replace(/\s+/g, '_'));

      displayNameMap[nameConstant] = displayName;
    }
  }

  // Map display names to locations
  for (const [locationKey, locationData] of Object.entries(locations)) {
    // Try to find matching display name
    const nameConstant = Object.keys(displayNameMap).find(
      (name) =>
        name.toLowerCase().replace('name', '') === locationKey ||
        name.toLowerCase() === locationKey + 'name',
    );

    if (nameConstant) {
      let displayName = displayNameMap[nameConstant];
      // Debug: show what ROM text looks like
      if (locationKey.includes('gym') || locationKey.includes('rocket')) {
        console.log(`🔍 ROM text for ${locationKey}: "${displayName}"`);
      }
      // Always normalize display names, regardless of source
      if (displayName.match(/\b\d+\s+f\b/i)) {
        displayName = normalizeLocationDisplayName(displayName.toLowerCase().replace(/\s+/g, '_'));
        console.log(
          `🔧 Normalizing ROM text for ${locationKey}: "${displayNameMap[nameConstant]}" → "${displayName}"`,
        );
      }
      locationData.displayName = displayName;
    } else {
      // Fallback: convert constant name to readable format
      const normalizedName = normalizeLocationDisplayName(locationKey);
      console.log(`🔧 Normalizing fallback for ${locationKey}: "${normalizedName}"`);
      locationData.displayName = normalizedName;
    }
  }

  // Parse flypoints to determine which locations are flyable
  if (fs.existsSync(flyPointsPath)) {
    const flyPointsContent = fs.readFileSync(flyPointsPath, 'utf8');
    const flyPointsLines = flyPointsContent.split(/\r?\n/);

    for (const line of flyPointsLines) {
      const trimmedLine = line.trim();
      const flyPointMatch = trimmedLine.match(/^\s*db\s+([A-Z_]+),\s*([A-Z_]+)/);

      if (flyPointMatch) {
        const landmarkConstant = flyPointMatch[1];
        const spawnPoint = flyPointMatch[2];
        const locationKey = landmarkConstant.toLowerCase();

        if (locations[locationKey]) {
          locations[locationKey].flyable = true;
          locations[locationKey].spawnPoint = spawnPoint;
        }
      }
    }
  }

  // Parse map attributes to get connections
  const mapAttributesPath = path.join(
    __dirname,
    '../../../polishedcrystal/data/maps/attributes.asm',
  );
  if (fs.existsSync(mapAttributesPath)) {
    console.log('🔗 Parsing map connections...');
    const mapAttributesContent = fs.readFileSync(mapAttributesPath, 'utf8');
    const mapLines = mapAttributesContent.split(/\r?\n/);

    let currentMapName: string | null = null;
    let currentConnections: LocationConnection[] = [];

    for (let i = 0; i < mapLines.length; i++) {
      const line = mapLines[i].trim();

      // Parse map_attributes macro calls to identify current map
      const mapAttributesMatch = line.match(
        /^\s*map_attributes\s+(\w+),\s*([A-Z_0-9_]+),\s*\$[0-9a-fA-F]+,\s*(.*)/,
      );
      if (mapAttributesMatch) {
        // Save connections for the previous map
        if (currentMapName && currentConnections.length > 0) {
          const locationKey = currentMapName.toLowerCase();
          if (locations[locationKey]) {
            locations[locationKey].connections = [...currentConnections];
          }
        }

        // Start processing new map
        currentMapName = mapAttributesMatch[2]; // Use the constant name (e.g., NEW_BARK_TOWN)
        currentConnections = [];
        continue;
      }

      // Parse connection lines
      const connectionMatch = line.match(
        /^\s*connection\s+(north|south|east|west),\s*(\w+),\s*([A-Z_0-9_]+),\s*(-?\d+)/,
      );
      if (connectionMatch && currentMapName) {
        const direction = connectionMatch[1] as 'north' | 'south' | 'east' | 'west';
        const targetMapLabel = connectionMatch[2]; // e.g., Route29
        const targetMapConstant = connectionMatch[3]; // e.g., ROUTE_29
        const offset = parseInt(connectionMatch[4]);

        // Find the target location's display name
        const targetLocationKey = targetMapConstant.toLowerCase();
        let targetDisplayName = targetMapConstant
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        // Try to get the actual display name if the target location exists
        if (locations[targetLocationKey]) {
          targetDisplayName = locations[targetLocationKey].displayName || targetDisplayName;
          // Normalize target location display name as well
          if (targetDisplayName.match(/\b\d+\s+f\b/i)) {
            targetDisplayName = normalizeLocationDisplayName(
              targetDisplayName.toLowerCase().replace(/\s+/g, '_'),
            );
          }
        }

        currentConnections.push({
          direction,
          targetLocation: targetLocationKey,
          targetLocationDisplay: targetDisplayName,
          offset,
        });
      }
    }

    // Don't forget to save connections for the last map
    if (currentMapName && currentConnections.length > 0) {
      const locationKey = currentMapName.toLowerCase();
      if (locations[locationKey]) {
        locations[locationKey].connections = [...currentConnections];
      }
    }

    const totalConnections = Object.values(locations).reduce(
      (sum, loc) => sum + loc.connections.length,
      0,
    );
    console.log(
      `🔗 Parsed ${totalConnections} map connections across ${Object.keys(locations).length} locations`,
    );
  }

  console.log(
    `✅ Extracted ${Object.keys(locations).length} locations (${Object.values(locations).filter((l) => l.flyable).length} flyable)`,
  );
  return locations;
}

// --- Export all locations to JSON ---
export async function exportAllLocations() {
  try {
    const allLocations = extractAllLocations();

    // Sort locations by region and then by ID
    const sortedLocations = Object.entries(allLocations)
      .sort(([, a], [, b]) => {
        // First sort by region (johto, kanto, orange)
        const regionOrder: Record<string, number> = { johto: 0, kanto: 1, orange: 2 };
        if (regionOrder[a.region] !== regionOrder[b.region]) {
          return regionOrder[a.region] - regionOrder[b.region];
        }
        // Then sort by ID within region
        return a.id - b.id;
      })
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, LocationData>,
      );

    const outputPath = path.join(__dirname, '../../../output/all_locations.json');
    await fs.promises.writeFile(outputPath, JSON.stringify(sortedLocations, null, 2));

    console.log(`📍 Exported ${Object.keys(sortedLocations).length} locations to ${outputPath}`);

    // Also create a summary by region
    const locationsByRegion = {
      johto: Object.values(sortedLocations).filter((l) => l.region === 'johto'),
      kanto: Object.values(sortedLocations).filter((l) => l.region === 'kanto'),
      orange: Object.values(sortedLocations).filter((l) => l.region === 'orange'),
    };

    const summaryPath = path.join(__dirname, '../../../output/locations_by_region.json');
    await fs.promises.writeFile(
      summaryPath,
      JSON.stringify(
        {
          summary: {
            total: Object.keys(sortedLocations).length,
            flyable: Object.values(sortedLocations).filter((l) => l.flyable).length,
            johto: locationsByRegion.johto.length,
            kanto: locationsByRegion.kanto.length,
            orange: locationsByRegion.orange.length,
          },
          locations: locationsByRegion,
        },
        null,
        2,
      ),
    );

    console.log(`📊 Exported location summary to ${summaryPath}`);

    return sortedLocations;
  } catch (error) {
    console.error('❌ Error exporting locations:', error);
    throw error;
  }
}

// Add treemon extraction functions
export function extractTreemonLocations(): Record<string, LocationEntry[]> {
  const treemonLocationsByMon: Record<string, LocationEntry[]> = {};

  // Read treemon maps file
  const treemonMapsPath = path.join(
    __dirname,
    '../../../polishedcrystal/data/wild/treemon_maps.asm',
  );
  const treemonMapsData = fs.readFileSync(treemonMapsPath, 'utf8');

  // Read treemons file
  const treemonsPath = path.join(__dirname, '../../../polishedcrystal/data/wild/treemons.asm');
  const treemonsData = fs.readFileSync(treemonsPath, 'utf8');

  // Parse treemon maps to get location -> treemon set mapping
  const locationToTreemonSet: Record<string, string> = {};
  const treemonMapLines = treemonMapsData.split(/\r?\n/);

  for (const line of treemonMapLines) {
    const mapMatch = line.match(/treemon_map\s+([A-Z0-9_]+),\s+([A-Z0-9_]+)/);
    if (mapMatch) {
      const [, locationId, treemonSetId] = mapMatch;
      locationToTreemonSet[locationId] = treemonSetId;
    }
  }

  // Parse treemon sets and Pokemon
  const treemonLines = treemonsData.split(/\r?\n/);
  const treemonSets: Record<string, { normal: any[]; rare: any[] }> = {};

  let currentSet: string | null = null;
  let currentTable: 'normal' | 'rare' = 'normal';
  let inTreeMon = false;

  for (let i = 0; i < treemonLines.length; i++) {
    const line = treemonLines[i].trim();

    // Check for treemon set start
    const setMatch = line.match(/^TreeMonSet_([A-Za-z0-9_]+):$/);
    if (setMatch) {
      currentSet = `TREEMON_SET_${setMatch[1].toUpperCase()}`;
      treemonSets[currentSet] = { normal: [], rare: [] };
      currentTable = 'normal';
      inTreeMon = true;
      continue;
    }

    // Check for rare table marker (comment with "rare")
    if (line.includes('; rare')) {
      currentTable = 'rare';
      continue;
    }

    // Parse tree_mon entries
    if (inTreeMon && currentSet && line.startsWith('tree_mon')) {
      const treeMonMatch = line.match(
        /tree_mon\s+(\d+),\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?,\s+(.+)/,
      );
      if (treeMonMatch) {
        const [, rate, species, form, level] = treeMonMatch;

        const pokemonKey = getFullPokemonName(species, form || null);
        const normalizedKey = normalizePokemonUrlKey(pokemonKey);

        treemonSets[currentSet][currentTable].push({
          species: normalizedKey,
          rate: parseInt(rate),
          level,
          form: form || null,
        });
      }
    }

    // Check for end of treemon set
    if (line === 'db -1') {
      if (currentTable === 'normal') {
        currentTable = 'rare';
      } else {
        inTreeMon = false;
        currentSet = null;
      }
    }
  }

  // Map locations to Pokemon encounters
  for (const [locationId, treemonSetId] of Object.entries(locationToTreemonSet)) {
    const normalizedLocation = normalizeLocationKey(locationId);
    const treemonSet = treemonSets[treemonSetId];

    if (!treemonSet) continue;

    // Process both normal and rare encounters
    const processEncounters = (encounters: any[], method: string) => {
      for (const encounter of encounters) {
        const { species, rate, level, form } = encounter;

        if (!treemonLocationsByMon[species]) {
          treemonLocationsByMon[species] = [];
        }

        treemonLocationsByMon[species].push({
          area: normalizedLocation,
          method,
          time: 'any', // Treemon encounters are generally available all day
          level: level.toString(),
          chance: rate,
          formName: form,
        });
      }
    };

    // Determine method based on treemon set type
    const isRockSmash = treemonSetId === 'TREEMON_SET_ROCK';
    const method = isRockSmash ? 'rocksmash' : 'headbutt';

    processEncounters(treemonSet.normal, method);
    processEncounters(treemonSet.rare, `${method}_rare`);
  }

  console.log(
    `Extracted treemon locations for ${Object.keys(treemonLocationsByMon).length} Pokemon`,
  );
  return treemonLocationsByMon;
}

// Add swarm extraction function
// --- Fishing Encounters Extraction ---
export function extractFishingEncounters(): Record<string, LocationEntry[]> {
  const fishingLocations: Record<string, LocationEntry[]> = {};

  // Read fish.asm for encounter data
  const fishPath = path.join(__dirname, '../../../polishedcrystal/data/wild/fish.asm');
  const fishMapPath = path.join(__dirname, '../../../polishedcrystal/data/wild/fishmon_maps.asm');

  if (!fs.existsSync(fishPath) || !fs.existsSync(fishMapPath)) {
    console.warn('Fishing data files not found, skipping fishing extraction');
    return {};
  }

  // Parse fish.asm to get fish group encounters
  const fishContent = fs.readFileSync(fishPath, 'utf8');
  const fishGroups = parseFishGroups(fishContent);

  // Parse fishmon_maps.asm to get location to fish group mappings
  const fishMapContent = fs.readFileSync(fishMapPath, 'utf8');
  const locationToFishGroup = parseFishLocationMappings(fishMapContent);

  // Combine data to create location entries with combination logic
  for (const [location, fishGroupName] of Object.entries(locationToFishGroup)) {
    const fishGroup = fishGroups[fishGroupName];
    if (!fishGroup) continue;

    const normalizedLocation = normalizeLocationKey(location);

    // Process each rod type
    for (const [rodType, encounters] of Object.entries(fishGroup)) {
      // Group encounters by Pokemon for combination
      const encountersByPokemon: Record<string, Array<{ entry: LocationEntry; rate: number }>> = {};

      for (const encounter of encounters) {
        const pokemonKey = encounter.species.toLowerCase(); // Ensure species is in lowercase
        const encounterRate = encounter.chance;

        const entry: LocationEntry = {
          area: normalizedLocation,
          method: `fish_${rodType}`,
          time: 'all',
          level: encounter.level.toString(),
          chance: encounterRate,
          formName: encounter.form || null,
        };

        if (!encountersByPokemon[pokemonKey]) {
          encountersByPokemon[pokemonKey] = [];
        }

        encountersByPokemon[pokemonKey].push({ entry, rate: encounterRate });
      }

      // For each pokemon, combine identical encounters (same area, method, time, level, formName)
      for (const [pokemonKey, encounters] of Object.entries(encountersByPokemon)) {
        if (!fishingLocations[pokemonKey]) {
          fishingLocations[pokemonKey] = [];
        }

        // Group by encounter characteristics (excluding chance)
        const encounterGroups: Record<string, { combinedEntry: LocationEntry; totalRate: number }> =
          {};

        for (const { entry, rate } of encounters) {
          // Create a key that uniquely identifies identical encounters (excluding chance)
          const encounterKey = JSON.stringify({
            area: entry.area,
            method: entry.method,
            time: entry.time,
            level: entry.level,
            formName: entry.formName,
          });

          if (!encounterGroups[encounterKey]) {
            encounterGroups[encounterKey] = {
              combinedEntry: { ...entry, chance: 0 }, // Start with 0, will be set below
              totalRate: 0,
            };
          }

          // Add this encounter's rate to the total
          encounterGroups[encounterKey].totalRate += rate;
        }

        // Add the combined encounters to fishingLocations
        for (const { combinedEntry, totalRate } of Object.values(encounterGroups)) {
          combinedEntry.chance = totalRate;
          fishingLocations[pokemonKey].push(combinedEntry);
        }
      }
    }
  }

  console.log(`Extracted fishing locations for ${Object.keys(fishingLocations).length} Pokemon`);
  return fishingLocations;
}

export function extractSwarmLocations(): Record<string, LocationEntry[]> {
  const swarmLocationsByMon: Record<string, LocationEntry[]> = {};

  const swarmGrassPath = path.join(__dirname, '../../../polishedcrystal/data/wild/swarm_grass.asm');
  if (!fs.existsSync(swarmGrassPath)) {
    console.log('Swarm grass file not found, skipping swarm extraction');
    return swarmLocationsByMon;
  }

  const swarmData = fs.readFileSync(swarmGrassPath, 'utf8');
  const lines = swarmData.split(/\r?\n/);

  let currentArea: string | null = null;
  let currentTime: string | null = null;
  let inSwarmBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for swarm area start
    const areaMatch = trimmedLine.match(/def_grass_wildmons\s+([A-Z0-9_]+)/);
    if (areaMatch) {
      currentArea = normalizeLocationKey(areaMatch[1]);
      inSwarmBlock = true;
      continue;
    }

    // Skip encounter rates line
    if (trimmedLine.match(/db\s+\d+\s+percent/)) {
      continue;
    }

    // Check for time sections
    if (inSwarmBlock && trimmedLine.match(/^;\s*(morn|day|nite)$/)) {
      currentTime = trimmedLine.replace(';', '').trim();
      continue;
    }

    // Parse wildmon entries
    if (inSwarmBlock && currentArea && currentTime && trimmedLine.startsWith('wildmon')) {
      const wildmonMatch = trimmedLine.match(
        /wildmon\s+(\d+|\w+),\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?/,
      );
      if (wildmonMatch) {
        const [, level, species, form] = wildmonMatch;

        const pokemonKey = getFullPokemonName(species, form || null);
        const normalizedKey = normalizePokemonUrlKey(pokemonKey);

        if (!swarmLocationsByMon[normalizedKey]) {
          swarmLocationsByMon[normalizedKey] = [];
        }

        swarmLocationsByMon[normalizedKey].push({
          area: currentArea,
          method: 'swarm',
          time: currentTime,
          level: level.toString(),
          chance: 100, // Swarms typically have high encounter rates
          formName: form || null,
        });
      }
    }

    // Check for end of swarm block
    if (trimmedLine === 'end_grass_wildmons') {
      inSwarmBlock = false;
      currentArea = null;
      currentTime = null;
    }
  }

  console.log(`Extracted swarm locations for ${Object.keys(swarmLocationsByMon).length} Pokemon`);
  return swarmLocationsByMon;
}
