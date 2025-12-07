import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LocationData, LocationManifest, EventsManifest } from '@/types/new';
import {
  reduce,
  normalizeString,
  parseLineWithPrefix,
  ensureArrayExists,
  countConnections,
  displayName,
  parseTrainerLine,
  parseMapEvent,
} from '@/lib/extract-utils';
import { mapEncounterRatesToPokemon } from '@/utils/encounterRates';
import splitFile from '@/lib/split';
import extractTrainers from './extract-trainers';
import { extractItemsFromMapData, buildMoveToTmMapping } from './extract-items';
import { getMartItemCount } from './mart-items-mapping';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data storage
const locations: LocationData[] = [];
const encounters: Record<string, LocationData['encounters']> = {};
const connections: Record<string, number> = {};
const locationTrainerNames: Record<string, string[]> = {}; // Store trainer names by location
const locationEvents: Record<
  string,
  {
    name: string;
    description: string;
    type: string;
  }[]
> = {}; // Store event names by location
const locationTypes: Record<string, string[]> = {}; // Store map names by location
const locationParent: Record<string, string> = {}; // Store map names by location
const landmarks: {
  locationRefs: Set<string>;
  orderMap: Map<string, number>;
  regionMap: Map<string, string>;
} = {
  locationRefs: new Set(),
  orderMap: new Map(),
  regionMap: new Map(),
};

// Move-to-TM mapping (e.g., "attract" -> "tm45")
// Built from extract-items and used to add tmId to TM/HM items
let moveToTmMapping: Record<string, string> = {};

// Mart data storage (legacy - replaced with manual mapping)
const martConstants: Map<string, number> = new Map(); // MART_AZALEA -> 3 (index)
const martData: Map<number, string[]> = new Map(); // 3 -> ["CHARCOAL", "POKE_BALL", ...]

// File paths
const attributesASM = join(__dirname, '../polishedcrystal/data/maps/attributes.asm');
const mapsASM = join(__dirname, '../polishedcrystal/data/maps/maps.asm');
const landmarkConstantsASM = join(__dirname, '../polishedcrystal/constants/landmark_constants.asm');
const mapsDir = join(__dirname, '../polishedcrystal/maps');

// Wild encounter files
const wildDir = join(__dirname, '../polishedcrystal/data/wild');
const grassFiles = [
  join(wildDir, 'johto_grass.asm'),
  join(wildDir, 'kanto_grass.asm'),
  join(wildDir, 'orange_grass.asm'),
  join(wildDir, 'swarm_grass.asm'),
];
const waterFiles = [
  join(wildDir, 'johto_water.asm'),
  join(wildDir, 'kanto_water.asm'),
  join(wildDir, 'orange_water.asm'),
  join(wildDir, 'swarm_water.asm'),
];
const fishFiles = [join(wildDir, 'fish.asm')];
const treeFiles = [join(wildDir, 'treemons.asm')];

// Extract landmark data (order, region, landmark status)
const extractLandmarks = async () => {
  const raw = await readFile(landmarkConstantsASM, 'utf-8');
  const landmarkConstantsData = splitFile(raw, false)[0] as string[]; // Use splitFile without @ replacement

  let currentRegion = 'Johto';
  let landmarkOrder = 0;

  for (const line of landmarkConstantsData) {
    // Skip SPECIAL_MAP (const SPECIAL_MAP ; 00)
    if (line.includes('SPECIAL_MAP')) {
      continue;
    }

    // Detect region boundaries
    if (line.includes('KANTO_LANDMARK EQU')) {
      currentRegion = 'Kanto';
      continue;
    }
    if (line.includes('SHAMOUTI_LANDMARK EQU')) {
      currentRegion = 'Orange';
      continue;
    }

    // Parse landmark constants (const NEW_BARK_TOWN ; 01)
    const match = line.match(/const\s+([A-Z_][A-Z0-9_]*)\s+;\s*([0-9a-f]+)/);
    if (match) {
      const [, constantName] = match;
      landmarkOrder++;

      const locationKey = reduce(constantName);
      landmarks.locationRefs.add(locationKey);
      landmarks.orderMap.set(locationKey, landmarkOrder);
      landmarks.regionMap.set(locationKey, currentRegion);
    }
  }

  console.log(`Extracted ${landmarks.locationRefs.size} landmarks`);
};

// Legacy mart extraction functions removed - now using manual mapping

// Extract mart items from map data
const extractMartItemsFromMapData = (
  mapData: string[],
): { name: string; type: string; method: string }[] => {
  const items: { name: string; type: string; method: string }[] = [];

  for (const line of mapData) {
    const trimmed = line.trim();

    // Look for mart_clerk_event lines
    if (trimmed.startsWith('mart_clerk_event ')) {
      // Parse: mart_clerk_event  1,  3, MARTTYPE_STANDARD, MART_AZALEA
      const parts = trimmed.replace('mart_clerk_event ', '').split(',');
      if (parts.length >= 4) {
        const martConstant = parts[3].trim();
        const martIndex = martConstants.get(martConstant);

        if (martIndex !== undefined && martData.has(martIndex)) {
          const martItems = martData.get(martIndex)!;
          for (const itemId of martItems) {
            items.push({
              name: itemId,
              type: 'purchase',
              method: 'mart',
            });
          }
        }
      }
    }

    // Also look for pokemart commands (used in dept stores)
    if (trimmed.includes('pokemart ') || trimmed.includes('pokemart MARTTYPE_')) {
      // Parse: pokemart MARTTYPE_STANDARD, MART_GOLDENROD_2F_1
      // or: OBJECTTYPE_COMMAND, pokemart, MARTTYPE_STANDARD, MART_GOLDENROD_2F_1, -1
      const martMatch = trimmed.match(/MART_[A-Z0-9_]+/);
      if (martMatch) {
        const martConstant = martMatch[0];
        const martIndex = martConstants.get(martConstant);

        // Special debug for MART_GOLDENROD_3F
        if (martConstant === 'MART_GOLDENROD_3F') {
          console.log(
            `   🔍 DEBUG MART_GOLDENROD_3F: found constant index ${martIndex}, has data: ${martData.has(martIndex ?? -1)}`,
          );
          if (martIndex !== undefined) {
            console.log(
              `   🔍 DEBUG MART_GOLDENROD_3F: data = ${JSON.stringify(martData.get(martIndex))}`,
            );
          }
        }

        if (martIndex !== undefined && martData.has(martIndex)) {
          const martItems = martData.get(martIndex)!;
          for (const itemId of martItems) {
            items.push({
              name: itemId,
              type: 'purchase',
              method: 'mart',
            });
          }
        }
      }
    }
  }

  return items;
};

// Extract connection counts from map attributes
const locationConstants: Record<string, string> = {};

const extractConnections = async () => {
  const raw = await readFile(attributesASM, 'utf-8');
  const attributesData = splitFile(raw);

  let currentLocation = '';
  let connectionCount = 0;

  for (const line of attributesData[0]) {
    const trimmedLine = (line as string).trim();

    // Find map_attributes lines
    if (trimmedLine.startsWith('map_attributes ')) {
      // Save previous location if exists
      if (currentLocation) {
        connections[currentLocation] = connectionCount;
      }

      // Parse: map_attributes NewBarkTown, NEW_BARK_TOWN, $5, WEST | EAST
      const parts = trimmedLine.replace('map_attributes ', '').split(',');
      if (parts.length >= 4) {
        currentLocation = parts[0].trim();
        const constantName = parts[1].trim();
        const connectionsStr = parts[3].trim();

        // Store the constant name mapping
        locationConstants[currentLocation] = constantName;

        connectionCount = countConnections(connectionsStr);
      }
    }
  }

  // Don't forget the last location
  if (currentLocation) {
    connections[currentLocation] = connectionCount;
  }

  console.log(`Extracted connections for ${Object.keys(connections).length} locations`);
};

const extractMapGroups = async () => {
  const raw = await readFile(mapsASM, 'utf-8');
  const mapGroupsData = splitFile(raw);

  for (const line of mapGroupsData[0]) {
    const trimmedLine = (line as string).trim();

    // Find map lines
    if (trimmedLine.startsWith('map ')) {
      // Parse: map MapName, TILESET_TYPE, ENVIRONMENT, SIGN_TYPE, LANDMARK_CONSTANT, MUSIC_CONSTANT, phone_service_flag, PALETTE
      const parts = trimmedLine.replace('map ', '').split(',');

      if (parts.length >= 5) {
        const mapName = reduce(parts[0].trim()); // MapName
        const environment = reduce(parts[2].trim()); // TOWN, ROUTE, INDOOR, CAVE, etc.
        const landmark = reduce(parts[4].trim()); // The parent landmark

        // Store the type (environment) for this map
        if (!locationTypes[mapName]) {
          locationTypes[mapName] = [];
        }
        locationTypes[mapName].push(environment);

        // Store the parent landmark for this map
        locationParent[mapName] = landmark;
      }
    }
  }

  console.log(`Extracted map groups for ${Object.keys(locationTypes).length} maps`);
};

// Extract Pokemon encounters from wild data files
const extractEncounters = async (filePaths: string[], encounterType: string) => {
  const defPrefix = `def_${encounterType}_wildmons`;
  const endMarker = `end_${encounterType}_wildmons`;

  for (const filePath of filePaths) {
    const raw = await readFile(filePath, 'utf-8');
    const encounterData = splitFile(raw, false)[0] as string[]; // Use splitFile without @ replacement

    for (let i = 0; i < encounterData.length; i++) {
      const line = encounterData[i];

      // Find location definitions: def_grass_wildmons LOCATION_NAME
      if (line.startsWith(defPrefix + ' ')) {
        const locationConstant = parseLineWithPrefix(line, defPrefix + ' ');

        // Initialize or get existing encounters for this location
        const locationEncounters = ensureArrayExists(encounters, locationConstant);

        // Skip the encounter rate line
        i++;

        // Parse encounters for morn, day, nite - collect all encounters first
        const timeSlots = ['morning', 'day', 'night'];
        let currentTimeSlot = 0;
        const currentLocationEncounters: Array<{
          pokemon: string;
          method: string;
          version: string;
          levelRange: string;
          rate: number;
          formName: string;
        }> = [];

        while (i < encounterData.length) {
          const encounterLine = encounterData[i].trim();

          if (encounterLine === endMarker) {
            break;
          }

          if (encounterLine.startsWith('wildmon ')) {
            // Parse: wildmon 12, NIDORAN_M
            const parts = parseLineWithPrefix(encounterLine, 'wildmon ').split(',');
            if (parts.length >= 2) {
              const level = parts[0]
                .replace('LEVEL_FROM_BADGES', '')
                .replace('- ', '-')
                .replace('+ ', '+')
                .trim();
              const pokemon = normalizeString(parts[1]);
              const formMatch = reduce(parts[2] ? parts[2]?.replace('_FORM', '') : 'plain');

              currentLocationEncounters.push({
                pokemon: pokemon,
                method: encounterType,
                version: timeSlots[currentTimeSlot],
                levelRange: level,
                rate: 0, // Will be calculated later
                formName: formMatch, // Will be determined later
              });
            }
          } else if (encounterLine.includes('; day')) {
            currentTimeSlot = 1;
          } else if (encounterLine.includes('; nite')) {
            currentTimeSlot = 2;
          }

          i++;
        }

        // Now calculate proper encounter rates for each time slot
        const timeSlotGroups = new Map<string, typeof currentLocationEncounters>();

        // Group encounters by time slot
        for (const encounter of currentLocationEncounters) {
          const timeSlot = encounter.version;
          if (!timeSlotGroups.has(timeSlot)) {
            timeSlotGroups.set(timeSlot, []);
          }
          timeSlotGroups.get(timeSlot)!.push(encounter);
        }

        // Calculate rates for each time slot group and add to location encounters
        for (const [, timeSlotEncounters] of timeSlotGroups) {
          const pokemonNames = timeSlotEncounters.map((enc) => enc.pokemon);
          const ratedPokemon = mapEncounterRatesToPokemon(pokemonNames, encounterType);

          // Apply calculated rates to encounters and combine duplicates
          const encounterMap = new Map<string, (typeof timeSlotEncounters)[0]>();

          for (let j = 0; j < timeSlotEncounters.length; j++) {
            const encounter = timeSlotEncounters[j];
            const rate = ratedPokemon[j]?.rate || 0;

            // Create unique key for pokemon + level + method + time
            const key = `${encounter.pokemon}_${encounter.levelRange}_${encounter.method}_${encounter.version}`;

            if (encounterMap.has(key)) {
              // Add rate to existing encounter
              const existing = encounterMap.get(key)!;
              existing.rate += rate;
            } else {
              // Add new encounter with calculated rate
              encounterMap.set(key, {
                ...encounter,
                rate: rate,
              });
            }
          }

          // Add all combined encounters to location encounters
          locationEncounters.push(...encounterMap.values());
        }
      }
    }
  }

  console.log(
    `Extracted ${encounterType} encounters for ${Object.keys(encounters).length} total locations`,
  );
};

/**
 * Extracts all trainers from a map file's content
 */
// only looking for locations, not party information - that is handled in extract-trainers.ts
const extractTrainerFromMapData = (mapData: string[]): string[] => {
  const trainers: Set<string> = new Set();

  for (const line of mapData) {
    const trimmedLine = line.trim();

    // Parse generic trainers
    if (trimmedLine.startsWith('generictrainer ')) {
      const trainer = parseTrainerLine(trimmedLine);
      if (trainer) trainers.add(trainer);
    }
    if (trimmedLine.startsWith('loadtrainer ')) {
      const trainer = parseTrainerLine(trimmedLine);
      if (trainer) trainers.add(trainer);
    }
  }

  return Array.from(trainers);
};

// Extract trainers from all map files
// only looking for locations, not party information - that is handled in extract-trainers.ts
const extractMapTrainers = async () => {
  const { readdir } = await import('fs/promises');

  try {
    const mapFiles = await readdir(mapsDir);

    for (const mapFile of mapFiles) {
      if (!mapFile.endsWith('.asm')) continue;

      const mapFilePath = join(mapsDir, mapFile);
      const mapName = reduce(mapFile.replace('.asm', ''));

      try {
        const raw = await readFile(mapFilePath, 'utf-8');
        const mapData = splitFile(raw, false)[0] as string[]; // Don't remove @ symbols

        const mapTrainers = extractTrainerFromMapData(mapData);

        if (mapTrainers.length > 0) {
          locationTrainerNames[mapName] = mapTrainers;
        }
      } catch (error) {
        console.warn(`Could not read map file: ${mapFilePath}`, error);
        // Skip files that can't be read - some might be binary or have permissions issues
        continue;
      }
    }

    console.log(`Extracted trainers from ${Object.keys(locationTrainerNames).length} maps`);
  } catch (error) {
    console.error('Error reading maps directory:', error);
  }
};

/**
 * Extracts all events from a map file's content
 */
const extractEventFromMapData = (mapData: string[]) => {
  const events: LocationData['events'] = [];

  for (const line of mapData) {
    const trimmedLine = line.trim();

    // Parse setevent events
    if (trimmedLine.startsWith('setevent ')) {
      const event = parseMapEvent(trimmedLine);
      if (event) {
        events.push({
          name: event.name,
          description: event.description,
          type: event.type,
          item: event.item,
        });
      }
    }
  }

  return events;
};

// uses set data above
const extractMapEvents = async () => {
  const { readdir } = await import('fs/promises');

  try {
    const mapFiles = await readdir(mapsDir);

    for (const mapFile of mapFiles) {
      if (!mapFile.endsWith('.asm')) continue;
      if (mapFile.endsWith('PlayersHouse2F.asm')) continue;

      const mapFilePath = join(mapsDir, mapFile);
      const mapName = reduce(mapFile.replace('.asm', ''));

      try {
        const raw = await readFile(mapFilePath, 'utf-8');
        const mapData = splitFile(raw)[0] as string[]; // Don't remove @ symbols

        const mapEvents = extractEventFromMapData(mapData);

        if (mapEvents.length > 0) {
          locationEvents[mapName] = mapEvents;
        }
      } catch (error) {
        console.warn(`Could not read map file: ${mapFilePath}`, error);
        // Skip files that can't be read - some might be binary or have permissions issues
        continue;
      }
    }

    console.log(`Extracted events from ${Object.keys(locationEvents).length} maps`);
  } catch (error) {
    console.error('Error reading maps directory:', error);
  }
};

// Create ordered locations array similar to old implementation
const createOrderedLocations = () => {
  const orderedLocationIds: string[] = [];

  // First, add all landmarks in order
  const landmarksByOrder = Array.from(landmarks.orderMap.entries()).sort(
    ([, orderA], [, orderB]) => orderA - orderB,
  );

  for (const [landmarkId] of landmarksByOrder) {
    orderedLocationIds.push(landmarkId);

    // Add related locations for this landmark (gym, mart, pokecenter, etc.)
    const relatedLocations: string[] = [];

    // Look for locations that have this landmark as their parent
    for (const [mapId, parentId] of Object.entries(locationParent)) {
      if (parentId === landmarkId && mapId !== landmarkId) {
        relatedLocations.push(mapId);
      }
    }

    // Sort related locations by name to ensure consistent ordering
    relatedLocations.sort();
    orderedLocationIds.push(...relatedLocations);
  }

  return orderedLocationIds;
};

// Merge all data into final location objects
const mergeLocationData = async () => {
  const orderedLocationIds = createOrderedLocations();
  const orderMap = new Map<string, number>();

  // Create order map with sequential numbering
  orderedLocationIds.forEach((locationId, index) => {
    orderMap.set(locationId, index + 1);
  });

  for (const [locationKey, connectionCount] of Object.entries(connections)) {
    const locationId = reduce(locationKey);
    const locationName = displayName(locationKey);

    // Use the new order map that includes related locations
    const order = orderMap.get(locationId);
    const region =
      landmarks.regionMap.get(locationId) || landmarks.regionMap.get(locationParent[locationId]);

    // Find encounters for this location using the actual constant name
    const locationConstant = locationConstants[locationKey];
    const locationEncounters = encounters[locationConstant];

    // Find items for this location by reading the map file
    let itemNames = undefined;

    try {
      // prevent issues with special characters in filenames
      const mapFilePath = join(mapsDir, `${locationKey.replace('é', 'e')}.asm`);

      // Debug logging for mart locations
      const isMart =
        locationKey.toLowerCase().includes('mart') ||
        locationKey.toLowerCase().includes('deptstore');
      if (isMart) {
        console.log(`🏪 Processing mart: ${locationKey}`);
        console.log(`   Map file path: ${mapFilePath}`);
      }

      const raw = await readFile(mapFilePath, 'utf-8');
      const mapData = splitFile(raw, false)[0] as string[];

      // if (isMart) {
      //   console.log(`   Map file found, ${mapData.length} lines`);
      //   // Show first 20 lines to see structure
      //   console.log(`   First 20 lines:`);
      //   mapData.slice(0, 20).forEach((line, idx) => {
      //     console.log(`     ${idx + 1}: ${line}`);
      //   });
      // }

      const locationItems = extractItemsFromMapData(mapData);

      // Also check for mart items
      const martItems = extractMartItemsFromMapData(mapData);
      const allItems = [...locationItems, ...martItems];

      // Add tmId for TM/HM items using the move-to-TM mapping
      const itemsWithTmId = allItems.map((item) => {
        if ((item.type === 'tm' || item.type === 'hm') && item.name) {
          const tmId = moveToTmMapping[item.name.toLowerCase()];
          if (tmId) {
            return { ...item, tmId };
          }
        }
        return item;
      });

      if (isMart) {
        console.log(`   Extracted ${locationItems.length} regular items:`, locationItems);
        console.log(`   Extracted ${martItems.length} mart items:`, martItems);
        console.log(`   Total ${itemsWithTmId.length} items:`, itemsWithTmId);
      }

      itemNames = itemsWithTmId.length > 0 ? itemsWithTmId : undefined;
      if (isMart && itemNames) {
        console.log(`   Final item names for ${locationKey}:`, itemNames);
      } else if (isMart && !itemNames) {
        console.log(`   No items found for ${locationKey}`);
      }
    } catch (error) {
      console.warn(`Could not read map file for items: ${locationKey}.asm`, error);
      // Map file doesn't exist or can't be read, no items for this location
    }

    // Find trainers for this location
    const locationTrainers = locationTrainerNames[locationId] || undefined;

    // Find events for this location
    const mapEvents = locationEvents[locationId] || undefined;

    locations.push({
      id: locationId,
      name: locationName,
      constantName: locationConstant,
      connectionCount: connectionCount,
      parent: locationParent[locationId],
      type: locationTypes[locationId],
      order: order,
      region: region,
      encounters: locationEncounters,
      items: locationId === 'playershouse2f' ? undefined : itemNames, // skip players house 2F which has debug items
      trainers: locationTrainers,
      events: mapEvents,
    });
  }

  console.log(`Created ${locations.length} complete location objects`);
  locations.sort((a, b) => a.name.localeCompare(b.name));
};

// Main execution using Promise.all pattern for operations that don't depend on Pokemon data
await Promise.all([
  extractLandmarks(),
  // Mart extraction replaced with manual mapping
  // extractMartConstants(),
  // extractMartData(),
  extractConnections(),
  extractMapEvents(),
  extractMapTrainers(),
  extractEncounters(grassFiles, 'grass'),
  extractEncounters(waterFiles, 'surfing'),
  extractEncounters(fishFiles, 'fishing'),
  extractEncounters(treeFiles, 'headbutt'),
  extractMapGroups(),
]);

// Run trainer extraction after other operations since it depends on Pokemon data
await extractTrainers();

// Build move-to-TM mapping before merging location data
// We use 'polished' version as default since that's the primary version
moveToTmMapping = await buildMoveToTmMapping('polished');
console.log(`Built move-to-TM mapping with ${Object.keys(moveToTmMapping).length} entries`);

// Merge all extracted data
await mergeLocationData();

// Create output directories
const locationsDir = join(__dirname, '..', 'public', 'new', 'locations');
const trainersDir = join(__dirname, '..', 'public', 'new', 'trainers');
const outputDir = join(__dirname, '..', 'public', 'new');

// Clear and recreate locations directory
try {
  await rm(locationsDir, { recursive: true, force: true });
  await mkdir(locationsDir, { recursive: true });
  await mkdir(trainersDir, { recursive: true });
  console.log('Cleared and created output directories');
} catch (error) {
  if (error) {
    throw error;
  }
}

// Write individual location files
const locationManifest: LocationManifest[] = [];
const eventsManifest: EventsManifest[] = [];

await Promise.all(
  locations.map(async (location) => {
    const locationPath = join(locationsDir, `${location.id}.json`);
    // Write the full location data including trainerData to individual files
    await writeFile(locationPath, JSON.stringify(location, null, 2), 'utf-8');

    // Add to manifest (excluding trainerData, only including trainer names)
    locationManifest.push({
      id: location.id,
      name: location.name,
      // constantName: location.constantName,
      // type: location.type,
      region: location.region,
      order: location.order,
      // connections: location.connectionCount,
      encounterCount:
        location.encounters && location.encounters.length > 0
          ? new Set(location.encounters.map((e) => e.pokemon)).size
          : undefined,
      trainerCount: location.trainers?.length,
      eventCount: location.events?.length,
      itemCount: (location.items?.length || 0) + getMartItemCount(location.id),
    });

    // Add events to events manifest if location has events
    if (location.events && location.events.length > 0) {
      location.events.forEach((event) => {
        eventsManifest.push({
          id: event.name,
          location: location.id,
          ...event,
        });
      });
    }
  }),
);

// Sort locations by travel order (order field), with undefined orders at the end
locationManifest.sort((a, b) => {
  // If both have order, sort by order
  if (a.order !== undefined && b.order !== undefined) {
    return a.order - b.order;
  }
  // If only one has order, put the one with order first
  if (a.order !== undefined && b.order === undefined) {
    return -1;
  }
  if (a.order === undefined && b.order !== undefined) {
    return 1;
  }
  // If neither has order, sort alphabetically
  return a.name.localeCompare(b.name);
});

eventsManifest.sort((a, b) => a.id.localeCompare(b.id));

// Write manifest files
const locationManifestPath = join(outputDir, 'locations_manifest.json');
await writeFile(locationManifestPath, JSON.stringify(locationManifest, null, 2), 'utf-8');

const eventsManifestPath = join(outputDir, 'events_manifest.json');
await writeFile(eventsManifestPath, JSON.stringify(eventsManifest, null, 2), 'utf-8');

console.log('Location extraction complete!');

// Export function for other modules
const getLocations = () => locations;
export default getLocations;
