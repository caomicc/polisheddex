import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LocationData, LocationManifest } from '@/types/new';
import {
  reduce,
  normalizeString,
  parseLineWithPrefix,
  ensureArrayExists,
  countConnections,
  displayName,
  toTitleCase,
  parseTrainerLine,
} from '@/lib/extract-utils';
import { mapEncounterRatesToPokemon } from '@/utils/encounterRates';
import splitFile from '@/lib/split';
import extractTrainers from './extract-trainers';
import { extractItemsFromMapData, buildMoveToTmMapping } from './extract-items';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data storage
const locations: LocationData[] = [];
const encounters: Record<string, LocationData['encounters']> = {};
const connectionCounts: Record<string, number> = {};
const connectionDetails: Record<
  string,
  Array<{ direction: string; to: string; toId: string }>
> = {}; // Store full connection data
const locationTrainerNames: Record<string, string[]> = {}; // Store trainer names by location
const locationTypes: Record<string, string[]> = {}; // Store map names by location
const locationParent: Record<string, string> = {}; // Store parent ID by location
const locationParentName: Record<string, string> = {}; // Store parent display name by location
const landmarks: {
  locationRefs: Set<string>;
  orderMap: Map<string, number>;
  regionMap: Map<string, string>;
} = {
  locationRefs: new Set(),
  orderMap: new Map(),
  regionMap: new Map(),
};

// Flyable locations (from flypoints.asm)
const flyableLocations: Set<string> = new Set();

// Hidden grotto locations (from map scripts)
const hiddenGrottoLocations: Set<string> = new Set();

// Move-to-TM mapping (e.g., "attract" -> "tm45")
// Built from extract-items and used to add tmId to TM/HM items
let moveToTmMapping: Record<string, string> = {};

// Mart data storage - maps location ID to items for sale
const martItemsByLocation: Map<string, { name: string; type: string; method: string }[]> = new Map();

// File paths
const attributesASM = join(__dirname, '../polishedcrystal/data/maps/attributes.asm');
const mapsASM = join(__dirname, '../polishedcrystal/data/maps/maps.asm');
const landmarkConstantsASM = join(__dirname, '../polishedcrystal/constants/landmark_constants.asm');
const flypointsASM = join(__dirname, '../polishedcrystal/data/maps/flypoints.asm');
const martsASM = join(__dirname, '../polishedcrystal/data/items/marts.asm');
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

// Extract flyable locations from flypoints.asm
const extractFlypoints = async () => {
  const raw = await readFile(flypointsASM, 'utf-8');
  const lines = raw.split('\n');

  for (const line of lines) {
    // Parse: db NEW_BARK_TOWN, SPAWN_NEW_BARK
    const match = line.match(/^\s*db\s+([A-Z_][A-Z0-9_]*)\s*,/);
    if (match) {
      const landmarkConstant = match[1];
      const locationKey = reduce(landmarkConstant);
      flyableLocations.add(locationKey);
    }
  }

  console.log(`Extracted ${flyableLocations.size} flyable locations`);
};

// Extract hidden grotto locations from map scripts
const extractHiddenGrottoes = async () => {
  const { readdir } = await import('fs/promises');
  const mapFiles = await readdir(mapsDir);

  for (const mapFile of mapFiles) {
    if (!mapFile.endsWith('.asm')) continue;

    const mapPath = join(mapsDir, mapFile);
    const content = await readFile(mapPath, 'utf-8');

    // Look for grotto warps or bg_events (e.g., HIDDEN_TREE_GROTTO, HIDDEN_CAVE_GROTTO, treegrotto, cavegrotto)
    if (content.includes('GROTTO') || content.includes('grotto')) {
      // Extract the location name from the filename (e.g., "Route42.asm" -> "route42")
      const locationName = mapFile.replace('.asm', '').toLowerCase();
      hiddenGrottoLocations.add(locationName);
    }
  }

  console.log(`Extracted ${hiddenGrottoLocations.size} hidden grotto locations`);
};

// Mapping from mart label to location ID
const MART_LABEL_TO_LOCATION: Record<string, string> = {
  CherrygroveMart: 'cherrygrovemart',
  CherrygroveMartAfterDex: 'cherrygrovemart', // Merge with base mart
  VioletMart: 'violetmart',
  AzaleaMart: 'azaleamart',
  Goldenrod2FMart1: 'goldenroddeptstore2f',
  Goldenrod2FMart2: 'goldenroddeptstore2f',
  Goldenrod2FMart2Eevee: 'goldenroddeptstore2f',
  Goldenrod3FMart: 'goldenroddeptstore3f',
  Goldenrod4FMart: 'goldenroddeptstore4f',
  Goldenrod5FTMMart: 'goldenroddeptstore5f',
  GoldenrodHarborMart: 'goldenrodharbor',
  UndergroundMart: 'undergroundwarehouse',
  EcruteakMart: 'ecruteakmart',
  OlivineMart: 'olivinemart',
  CianwoodMart: 'cianwoodpharmacy',
  YellowForestMart: 'yellowforest',
  MahoganyMart1: 'mahoganymart1f',
  MahoganyMart2: 'mahoganymart1f',
  BlackthornMart: 'blackthornmart',
  IndigoPlateauMart: 'indigoplateaupokecenter1f',
  ViridianMart: 'viridianmart',
  PewterMart: 'pewtermart',
  MtMoonMart: 'mtmoonsquare',
  CeruleanMart: 'ceruleanmart',
  LavenderMart: 'lavendermart',
  VermilionMart: 'vermilionmart',
  Celadon2FMart1: 'celadondeptstore2f',
  Celadon2FMart2: 'celadondeptstore2f',
  Celadon3FTMMart: 'celadondeptstore3f',
  Celadon4FMart: 'celadondeptstore4f',
  Celadon5FMart1: 'celadondeptstore5f',
  Celadon5FMart2: 'celadondeptstore5f',
  SaffronMart: 'saffronmart',
  SilphCoMart: 'silphco1f',
  FuchsiaMart: 'fuchsiamart',
  ShamoutiMart1: 'shamoutiislandpokecenter1f',
  ShamoutiMart1Souvenir: 'shamoutiislandpokecenter1f',
  ShamoutiMart2: 'shamoutiislandpokecenter1f',
  BattleTowerMart1: 'battletower1f',
  BattleTowerMart2: 'battletower1f',
  BattleTowerMart3: 'battletower1f',
  BattleFactoryMart1: 'battlefactory1f',
  BattleFactoryMart2: 'battlefactory1f',
  BattleFactoryMart3: 'battlefactory1f',
};

// Extract mart items from marts.asm
const extractMartItems = async () => {
  const raw = await readFile(martsASM, 'utf-8');
  const lines = raw.split('\n');

  let currentMartLabels: string[] = []; // Support multiple labels sharing same items
  let currentItems: { name: string; type: string; method: string }[] = [];

  const saveCurrentMart = () => {
    if (currentMartLabels.length > 0 && currentItems.length > 0) {
      for (const label of currentMartLabels) {
        const locationId = MART_LABEL_TO_LOCATION[label];
        if (locationId) {
          const existing = martItemsByLocation.get(locationId) || [];
          // Add items, avoiding duplicates by name
          const existingNames = new Set(existing.map((i) => i.name));
          for (const item of currentItems) {
            if (!existingNames.has(item.name)) {
              existing.push({ ...item }); // Clone item
              existingNames.add(item.name);
            }
          }
          martItemsByLocation.set(locationId, existing);
        }
      }
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';')) continue;

    // Check for mart label (e.g., "CherrygroveMart:")
    const labelMatch = trimmed.match(/^([A-Za-z0-9_]+):$/);
    if (labelMatch) {
      // If we have items, save them for previous labels first
      if (currentItems.length > 0) {
        saveCurrentMart();
        currentMartLabels = [];
        currentItems = [];
      }

      // Add this label to current labels (supports multiple labels for same mart)
      currentMartLabels.push(labelMatch[1]);
      continue;
    }

    // Skip count lines (db 4 ; # items) and end markers (db -1)
    if (trimmed.match(/^db\s+-?[0-9]+\s*(;|$)/) || trimmed === 'db -1') continue;

    // Parse item lines: "db ITEM_NAME" or "dbw TM_NAME, PRICE" or "db ITEM_NAME, PRICE"
    const itemMatch = trimmed.match(/^db[w]?\s+([A-Z_][A-Z0-9_]*)/);
    if (itemMatch) {
      const itemConstant = itemMatch[1];
      
      // Handle TM items specially - extract move name and set type to 'tm'
      if (itemConstant.startsWith('TM_')) {
        const moveName = normalizeString(itemConstant.replace('TM_', ''));
        currentItems.push({
          name: moveName,
          type: 'tm',
          method: 'mart',
        });
      } else if (itemConstant.startsWith('HM_')) {
        const moveName = normalizeString(itemConstant.replace('HM_', ''));
        currentItems.push({
          name: moveName,
          type: 'hm',
          method: 'mart',
        });
      } else {
        const itemName = normalizeString(itemConstant);
        currentItems.push({
          name: itemName,
          type: 'purchase',
          method: 'mart',
        });
      }
    }
  }

  // Save last mart
  saveCurrentMart();

  // Debug output
  console.log('Mart items by location:');
  for (const [locId, items] of martItemsByLocation) {
    console.log(`  ${locId}: ${items.length} items`);
  }

  console.log(`Extracted mart items for ${martItemsByLocation.size} locations`);
};

// Extract connection counts from map attributes
const locationConstants: Record<string, string> = {};

const extractConnections = async () => {
  const raw = await readFile(attributesASM, 'utf-8');
  const attributesData = splitFile(raw, false)[0] as string[]; // locations don't have faithful/polished splits

  let currentLocation = '';
  let currentLocationConnections: Array<{ direction: string; to: string; toId: string }> = [];

  for (const line of attributesData) {
    const trimmedLine = line.trim();

    // Find map_attributes lines
    if (trimmedLine.startsWith('map_attributes ')) {
      // Save previous location if exists
      if (currentLocation) {
        connectionCounts[currentLocation] = currentLocationConnections.length;
        if (currentLocationConnections.length > 0) {
          connectionDetails[currentLocation] = currentLocationConnections;
        }
      }

      // Parse: map_attributes NewBarkTown, NEW_BARK_TOWN, $5, WEST | EAST
      const parts = trimmedLine.replace('map_attributes ', '').split(',');
      if (parts.length >= 4) {
        currentLocation = parts[0].trim();
        const constantName = parts[1].trim();

        // Store the constant name mapping
        locationConstants[currentLocation] = constantName;

        // Reset connections for new location
        currentLocationConnections = [];
      }
    }
    // Find connection lines: connection west, Route29, ROUTE_29, 0
    else if (trimmedLine.startsWith('connection ') && currentLocation) {
      // Parse: connection direction, MapName, MAP_CONSTANT, offset
      const parts = trimmedLine.replace('connection ', '').split(',');
      if (parts.length >= 2) {
        const direction = parts[0].trim().toLowerCase();
        const destinationMapName = parts[1].trim();
        const destinationId = reduce(destinationMapName);

        currentLocationConnections.push({
          direction: direction,
          to: displayName(destinationMapName),
          toId: destinationId,
        });
      }
    }
  }

  // Don't forget the last location
  if (currentLocation) {
    connectionCounts[currentLocation] = currentLocationConnections.length;
    if (currentLocationConnections.length > 0) {
      connectionDetails[currentLocation] = currentLocationConnections;
    }
  }

  console.log(`Extracted connections for ${Object.keys(connectionCounts).length} locations`);
  console.log(
    `Locations with connection details: ${Object.keys(connectionDetails).length}`,
  );
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
        const mapName = reduce(parts[0].trim()); // MapName (reduced for lookup)
        const environment = reduce(parts[2].trim()); // TOWN, ROUTE, INDOOR, CAVE, etc.
        const landmarkRaw = parts[4].trim(); // The parent landmark (SCREAMING_SNAKE_CASE)
        const landmark = reduce(landmarkRaw); // Reduced for ID

        // Store the type (environment) for this map
        if (!locationTypes[mapName]) {
          locationTypes[mapName] = [];
        }
        locationTypes[mapName].push(environment);

        // Store the parent landmark for this map (reduced ID)
        locationParent[mapName] = landmark;

        // Store the parent display name (convert SCREAMING_SNAKE_CASE to Title Case)
        locationParentName[mapName] = toTitleCase(landmarkRaw);
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
              const rawLevel = parts[0].trim();
              let level: string;
              if (rawLevel.includes('LEVEL_FROM_BADGES')) {
                // Format badge-relative levels as "Badge +X" or "Badge -X"
                const offset = rawLevel
                  .replace('LEVEL_FROM_BADGES', '')
                  .replace('- ', '-')
                  .replace('+ ', '+')
                  .trim();
                level = `Badge ${offset}`;
              } else {
                level = rawLevel;
              }
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

  for (const [locationKey, connectionCount] of Object.entries(connectionCounts)) {
    const locationId = reduce(locationKey);
    const locationName = displayName(locationKey);

    // Use the new order map that includes related locations
    const order = orderMap.get(locationId);
    const region =
      landmarks.regionMap.get(locationId) || landmarks.regionMap.get(locationParent[locationId]);

    // Get connection details for this location
    const locationConnectionDetails = connectionDetails[locationKey];

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

      // Get mart items from the pre-parsed mart data (use lowercase key)
      const martItems = martItemsByLocation.get(locationKey.toLowerCase()) || [];
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

    // Get parent info
    const parentId = locationParent[locationId];
    const parentName = locationParentName[locationId];

    locations.push({
      id: locationId,
      name: locationName,
      constantName: locationConstant,
      connectionCount: connectionCount,
      connections: locationConnectionDetails,
      parent: parentId,
      parentName: parentName,
      type: locationTypes[locationId],
      order: order,
      region: region,
      encounters: locationEncounters,
      items: locationId === 'playershouse2f' ? undefined : itemNames, // skip players house 2F which has debug items
      trainers: locationTrainers,
    });
  }

  // Build a set of existing location IDs for quick lookup
  const existingLocationIds = new Set(locations.map((loc) => loc.id));

  // Build children arrays - find all locations that have each location as their parent
  const childrenMap: Record<string, Array<{ id: string; name: string }>> = {};
  const orphanedParents: Record<string, { name: string; region?: string; children: Array<{ id: string; name: string }> }> = {};

  for (const loc of locations) {
    if (loc.parent && loc.parent !== loc.id) {
      // Don't include self-references as children
      if (!childrenMap[loc.parent]) {
        childrenMap[loc.parent] = [];
      }
      childrenMap[loc.parent].push({ id: loc.id, name: loc.name });

      // Track parents that don't exist as locations (orphaned parents)
      if (!existingLocationIds.has(loc.parent)) {
        if (!orphanedParents[loc.parent]) {
          orphanedParents[loc.parent] = {
            name: loc.parentName || displayName(loc.parent),
            region: loc.region,
            children: [],
          };
        }
        orphanedParents[loc.parent].children.push({ id: loc.id, name: loc.name });
      }
    }
  }

  // Create stub locations for orphaned parents (landmarks without their own map file)
  // Build a map of location data by ID for quick lookup when aggregating
  const locationById = new Map(locations.map((loc) => [loc.id, loc]));

  for (const [parentId, parentInfo] of Object.entries(orphanedParents)) {
    // Aggregate data from all child locations
    const childLocations = parentInfo.children
      .map((child) => locationById.get(child.id))
      .filter((loc): loc is LocationData => loc !== undefined);

    // Aggregate encounters from all children (dedupe by pokemon+method+version)
    const allEncounters: LocationData['encounters'] = [];
    const encounterSet = new Set<string>();
    for (const child of childLocations) {
      if (child.encounters) {
        for (const enc of child.encounters) {
          const key = `${enc.pokemon}-${enc.method}-${enc.version}-${enc.levelRange}`;
          if (!encounterSet.has(key)) {
            encounterSet.add(key);
            allEncounters.push(enc);
          }
        }
      }
    }

    // Aggregate items from all children
    const allItems: LocationData['items'] = [];
    for (const child of childLocations) {
      if (child.items) {
        for (const item of child.items) {
          allItems.push(item);
        }
      }
    }

    // Aggregate trainers from all children (dedupe)
    const allTrainers: string[] = [];
    const trainerSet = new Set<string>();
    for (const child of childLocations) {
      if (child.trainers) {
        for (const trainer of child.trainers) {
          if (!trainerSet.has(trainer)) {
            trainerSet.add(trainer);
            allTrainers.push(trainer);
          }
        }
      }
    }

    // Get order from the sequential order map (consistent with regular locations)
    const order = orderMap.get(parentId);

    const stubLocation: LocationData = {
      id: parentId,
      name: parentInfo.name,
      region: parentInfo.region,
      order: order,
      children: parentInfo.children.sort((a, b) => a.name.localeCompare(b.name)),
      encounters: allEncounters.length > 0 ? allEncounters : undefined,
      items: allItems.length > 0 ? allItems : undefined,
      trainers: allTrainers.length > 0 ? allTrainers : undefined,
    };
    locations.push(stubLocation);
    existingLocationIds.add(parentId);
  }

  console.log(`Created ${Object.keys(orphanedParents).length} stub locations for orphaned parents`);

  // Add children to each location
  for (const loc of locations) {
    const children = childrenMap[loc.id];
    if (children && children.length > 0 && !loc.children) {
      // Sort children alphabetically (only if not already set by stub creation)
      loc.children = children.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  console.log(`Created ${locations.length} complete location objects`);
  console.log(`Locations with children: ${Object.keys(childrenMap).length}`);
  locations.sort((a, b) => a.name.localeCompare(b.name));
};

// Main execution using Promise.all pattern for operations that don't depend on Pokemon data
await Promise.all([
  extractLandmarks(),
  extractFlypoints(),
  extractHiddenGrottoes(),
  extractMartItems(),
  extractConnections(),
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
      itemCount: location.items?.length || undefined,
      flyable: flyableLocations.has(location.id) || undefined,
      hasHiddenGrotto: hiddenGrottoLocations.has(location.id) || undefined,
    });
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

// Write manifest files
const locationManifestPath = join(outputDir, 'locations_manifest.json');
await writeFile(locationManifestPath, JSON.stringify(locationManifest, null, 2), 'utf-8');

console.log('Location extraction complete!');

// Export function for other modules
const getLocations = () => locations;
export default getLocations;
