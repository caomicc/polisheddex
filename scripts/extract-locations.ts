import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  LocationData,
  LocationManifest,
  TrainerData,
  ComprehensiveTrainerData,
  TrainerManifest,
} from '../src/types/new.ts';
import {
  reduce,
  normalizeString,
  removeNumericSuffix,
  parseLineWithPrefix,
  ensureArrayExists,
  parseTrainerDefinition,
  createTrainerConstantName,
  createBaseTrainerKey,
  parsePokemonWithItem,
  countConnections,
  displayName,
  parseItemballEvent,
  parseHiddenItemEvent,
  parseFruitTreeEvent,
  parseTrainerLine,
} from '../src/lib/extract-utils.ts';
import splitFile from '@/lib/split.ts';
import { LocationItem } from '@/types/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data storage
const locations: LocationData[] = [];
const encounters: Record<string, LocationData['encounters']> = {};
const trainers: Record<string, Record<string, TrainerData[]>> = {
  polished: {},
  faithful: {},
};
const connections: Record<string, number> = {};
const items: Record<string, LocationItem[]> = {}; // Store items by location name
const locationTrainerNames: Record<string, string[]> = {}; // Store trainer names by location
const landmarks: {
  locationRefs: Set<string>;
  orderMap: Map<string, number>;
  regionMap: Map<string, string>;
} = {
  locationRefs: new Set(),
  orderMap: new Map(),
  regionMap: new Map(),
};

const specialTrainerClasses = ['GIOVANNI', 'LYRA1', 'RIVAL1', 'ARCHER', 'ARIANA'];

// File paths
const attributesASM = join(__dirname, '../polishedcrystal/data/maps/attributes.asm');
const landmarkConstantsASM = join(__dirname, '../polishedcrystal/constants/landmark_constants.asm');
const partiesASM = join(__dirname, '../polishedcrystal/data/trainers/parties.asm');
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

        // Parse encounters for morn, day, nite
        const timeSlots = ['morning', 'day', 'night'];
        let currentTimeSlot = 0;

        while (i < encounterData.length) {
          const encounterLine = encounterData[i].trim();

          if (encounterLine === endMarker) {
            break;
          }

          if (encounterLine.startsWith('wildmon ')) {
            // Parse: wildmon 12, NIDORAN_M
            const parts = parseLineWithPrefix(encounterLine, 'wildmon ').split(',');
            if (parts.length >= 2) {
              const level = parseInt(parts[0].trim());
              const pokemon = normalizeString(parts[1]);

              locationEncounters.push({
                pokemon: pokemon,
                method: encounterType,
                version: timeSlots[currentTimeSlot],
                levelRange: level.toString(),
                rate: 10, // Default rate
              });
            }
          } else if (encounterLine.includes('; day')) {
            currentTimeSlot = 1;
          } else if (encounterLine.includes('; nite')) {
            currentTimeSlot = 2;
          }

          i++;
        }
      }
    }
  }

  console.log(
    `Extracted ${encounterType} encounters for ${Object.keys(encounters).length} total locations`,
  );
};

/**
 * Extracts all items from a map file's content
 */
export const extractItemsFromMapData = (mapData: string[]): LocationItem[] => {
  const items: LocationItem[] = [];

  for (const line of mapData) {
    const trimmedLine = line.trim();

    // Parse visible items (itemball_event)
    if (trimmedLine.startsWith('itemball_event ')) {
      const item = parseItemballEvent(trimmedLine);
      if (item) items.push(item);
    }

    // Parse hidden items (bg_event with BGEVENT_ITEM)
    else if (trimmedLine.includes('BGEVENT_ITEM +')) {
      const item = parseHiddenItemEvent(trimmedLine);
      if (item) items.push(item);
    }

    // Parse fruit trees (fruittree_event)
    else if (trimmedLine.startsWith('fruittree_event ')) {
      const item = parseFruitTreeEvent(trimmedLine);
      if (item) items.push(item);
    }
  }

  return items;
};

/**
 * Extracts all items from a map file's content
 */
export const extractTrainerFromMapData = (mapData: string[]): string[] => {
  const trainers: string[] = [];

  for (const line of mapData) {
    const trimmedLine = line.trim();

    // Parse generic trainers
    if (trimmedLine.startsWith('generictrainer ')) {
      const trainer = parseTrainerLine(trimmedLine);
      if (trainer) trainers.push(trainer);
    }
    if (trimmedLine.startsWith('loadtrainer ')) {
      const trainer = parseTrainerLine(trimmedLine);
      if (trainer) trainers.push(trainer);
    }
  }

  return trainers;
};

// Extract items from all map files
const extractItems = async () => {
  const { readdir } = await import('fs/promises');

  try {
    const mapFiles = await readdir(mapsDir);
    let totalItemsFound = 0;

    for (const mapFile of mapFiles) {
      if (!mapFile.endsWith('.asm')) continue;

      const mapFilePath = join(mapsDir, mapFile);
      const mapName = mapFile.replace('.asm', '');

      try {
        const raw = await readFile(mapFilePath, 'utf-8');
        const mapData = splitFile(raw, false)[0] as string[]; // Don't remove @ symbols

        const mapItems = extractItemsFromMapData(mapData);
        const mapTrainers = extractTrainerFromMapData(mapData);

        if (mapItems.length > 0) {
          items[mapName] = mapItems;
          totalItemsFound += mapItems.length;
        }

        if (mapTrainers.length > 0) {
          locationTrainerNames[mapName] = mapTrainers;
        }
      } catch (error) {
        console.warn(`Could not read map file: ${mapFilePath}`, error);
        // Skip files that can't be read - some might be binary or have permissions issues
        continue;
      }
    }

    console.log(`Extracted ${totalItemsFound} items from ${Object.keys(items).length} maps`);
  } catch (error) {
    console.error('Error reading maps directory:', error);
  }
};

const extractTrainers = async () => {
  const raw = await readFile(partiesASM, 'utf-8');

  // Custom version splitting that preserves @ symbols (unlike the global splitFile)
  const splitTrainerFile = (file: string) => {
    const polished: string[] = [];
    const faithful: string[] = [];
    const data = file
      .trim()
      .split('\n')
      .map((line) => line.trim());

    for (let i = 0; i < data.length; i++) {
      const line = data[i];

      // Handle version splits like Pokemon extraction does
      if (line.toLowerCase().startsWith('if ') && line.toLowerCase().includes('faithful')) {
        i++; // Jump to next line

        // Add faithful lines until we hit 'else'
        while (i < data.length && data[i] !== 'else') {
          faithful.push(data[i]);
          i++;
        }

        i++; // Skip 'else'

        // Add polished lines until we hit 'endc'
        while (i < data.length && data[i] !== 'endc') {
          polished.push(data[i]);
          i++;
        }
      } else {
        // Add to both versions if no version split
        polished.push(line);
        faithful.push(line);
      }
    }

    return [polished, faithful];
  };

  const [polishedData, faithfulData] = splitTrainerFile(raw);

  // Process both versions
  await processTrainerData(polishedData, 'polished');
  await processTrainerData(faithfulData, 'faithful');
};

// Extract trainer processing into separate function
const processTrainerData = async (trainerData: string[], version: string) => {
  let currentTrainer: TrainerData | null = null;
  let currentPokemon: TrainerData['teams'][0]['pokemon'][0] | null = null;
  let currentTrainerClass = 'TRAINER'; // Track the current trainer class
  let currentTrainerMatchCount = 1;
  let currentTrainerName = '';
  let lastTrainerName = '';
  let currentTeam: TrainerData['teams'][0] | null = null;

  for (let i = 0; i < trainerData.length; i++) {
    const line = trainerData[i].trim();

    // Set trainer class (applies to subsequent trainers)
    if (line.startsWith('def_trainer_class ')) {
      currentTrainerClass = parseLineWithPrefix(line, 'def_trainer_class ');
      continue;
    }

    // Start of a new trainer
    if (line.startsWith('def_trainer ')) {
      // Save previous trainer if exists
      if (currentTrainer && currentTrainer.teams.length > 0) {
        // Save any remaining team
        if (currentTeam && currentTeam.pokemon.length > 0) {
          currentTrainer.teams.push(currentTeam);
        }

        const trainerKey = reduce(currentTrainer.id);
        const trainerList = ensureArrayExists(trainers[version], trainerKey);
        trainerList.push(currentTrainer);
      }

      // Parse: def_trainer 1, "Falkner"
      const parts = parseTrainerDefinition(line, 'def_trainer ');
      if (parts.length >= 2) {
        const trainerName = parts[1].trim().replace(/"/g, '');
        const trainerClass = currentTrainerClass;
        const trainerIdPart = parts[0].trim();

        const trainerConstantName = createTrainerConstantName(
          trainerClass,
          trainerIdPart,
          specialTrainerClasses,
        );

        // Track trainer name changes and increment match count
        currentTrainerName = trainerName;
        if (currentTrainerName !== lastTrainerName) {
          currentTrainerMatchCount = 1; // Reset to 1 for new trainer
          lastTrainerName = currentTrainerName;
        } else {
          currentTrainerMatchCount++; // Increment for rematch
        }

        currentTrainer = {
          id: trainerIdPart,
          name: trainerName, // changes file name
          constantName: trainerConstantName,
          class: trainerClass, // Use the current trainer class
          teams: [],
        };

        // Start first team for this trainer
        currentTeam = {
          matchCount: currentTrainerMatchCount,
          pokemon: [],
        };
      }
      continue;
    }

    // New Pokemon in the trainer's team
    if (line.startsWith('tr_mon ')) {
      // Save previous pokemon if exists
      if (currentPokemon && currentTeam) {
        currentTeam.pokemon.push(currentPokemon);
      }

      // Parse: tr_mon 60, MEGANIUM @ SITRUS_BERRY
      // Or: tr_mon 10, NATU
      const parts = parseLineWithPrefix(line, 'tr_mon ').split(',');
      if (parts.length >= 2) {
        const level = parseInt(parts[0].trim());
        const pokemonPart = parts[1].trim();

        const { pokemon, item } = parsePokemonWithItem(pokemonPart);

        currentPokemon = {
          pokemonName: pokemon,
          level: level,
          item: item,
          moves: [],
        };
      }
      continue;
    }

    // Parse move data
    if (line.startsWith('tr_moves ')) {
      if (currentPokemon) {
        const movesStr = parseLineWithPrefix(line, 'tr_moves ');
        const moves = movesStr
          .split(',')
          .map((move) => normalizeString(move))
          .filter((move) => move.length > 0);

        currentPokemon.moves = moves;
      }
      continue;
    }

    // Parse other trainer data (for future use)
    if (line.startsWith('tr_extra ')) {
      if (currentPokemon) {
        // Parse: tr_extra [ABILITY], [NATURE], [SHINY]
        const extraData = parseLineWithPrefix(line, 'tr_extra ');

        if (extraData.includes('SHINY')) {
          currentPokemon.shiny = true;
        } else {
          // Handle comma-separated format: [ABILITY], [NATURE], [SHINY]
          const parts = extraData.split(',');
          if (parts.length > 0 && parts[0].trim()) {
            currentPokemon.ability = normalizeString(parts[0]);
          }
          if (parts.length > 1 && parts[1].trim()) {
            currentPokemon.nature = normalizeString(parts[1]);
          }
          if (parts.length > 2 && parts[2].trim()) {
            currentPokemon.shiny = parts[2].trim().toLowerCase() === 'shiny';
          }
        }
      }
      continue;
    }

    if (line.startsWith('tr_dvs ')) {
      if (currentPokemon) {
        currentPokemon.dvs = parseLineWithPrefix(line, 'tr_dvs ');
      }
      continue;
    }

    if (line.startsWith('tr_evs ')) {
      if (currentPokemon) {
        currentPokemon.evs = parseLineWithPrefix(line, 'tr_evs ');
      }
      continue;
    }

    // End of trainer definition
    if (line === 'end_trainer') {
      if (currentPokemon && currentTeam) {
        currentTeam.pokemon.push(currentPokemon);
        currentPokemon = null;
      }
      if (currentTeam && currentTrainer && currentTeam.pokemon.length > 0) {
        currentTrainer.teams.push(currentTeam);
        currentTeam = null;
      }
      continue;
    }
  }

  // Don't forget the last trainer
  if (currentTrainer) {
    // Save any remaining Pokemon and team
    if (currentPokemon && currentTeam) {
      currentTeam.pokemon.push(currentPokemon);
    }
    if (currentTeam && currentTeam.pokemon.length > 0) {
      currentTrainer.teams.push(currentTeam);
    }

    if (currentTrainer.teams.length > 0) {
      const trainerKey = currentTrainer.class.toLowerCase() + '_' + currentTrainer.id;
      const trainerList = ensureArrayExists(trainers[version], trainerKey);
      trainerList.push(currentTrainer);
    }
  }

  console.log(
    `Extracted ${Object.keys(trainers[version]).length} trainer definitions for version ${version}`,
  );
};

// Consolidate rematchable trainers into single trainer objects
const consolidateTrainers = () => {
  const consolidatedTrainers: Record<string, ComprehensiveTrainerData> = {};

  // Process both versions
  for (const version of ['polished', 'faithful'] as const) {
    // Group trainers by base name (remove numeric suffix)
    for (const [, trainerList] of Object.entries(trainers[version])) {
      for (const trainer of trainerList) {
        // Extract base trainer info (remove _1, _2, _3 suffixes)
        const baseTrainerName = trainer.name;
        const baseTrainerClass = trainer.class;
        const baseTrainerKey = createBaseTrainerKey(
          baseTrainerClass,
          baseTrainerName,
          specialTrainerClasses,
        );

        if (!consolidatedTrainers[baseTrainerKey]) {
          const cleanConstantName = removeNumericSuffix(trainer.constantName || '');
          consolidatedTrainers[baseTrainerKey] = {
            id: reduce(cleanConstantName),
            name: baseTrainerName,
            class: baseTrainerClass,
            constantName: cleanConstantName,
            versions: {
              polished: { teams: [] },
              faithful: { teams: [] },
            },
          };
        }

        // Add this trainer's teams to the correct version
        consolidatedTrainers[baseTrainerKey].versions[version].teams.push(...trainer.teams);
      }
    }
  }

  return consolidatedTrainers;
};
// Merge all data into final location objects
const mergeLocationData = () => {
  for (const [locationKey, connectionCount] of Object.entries(connections)) {
    const locationId = reduce(locationKey);
    const locationName = displayName(locationKey);

    // Check landmark data
    const isLandmark = landmarks.locationRefs.has(locationId);
    const order = landmarks.orderMap.get(locationId);
    const region = landmarks.regionMap.get(locationId);

    // Find encounters for this location using the actual constant name
    const locationConstant = locationConstants[locationKey];
    const locationEncounters = encounters[locationConstant];

    // Find items for this location
    const locationItems = items[locationKey];
    const itemNames = locationItems?.map((item) => item) || undefined;

    // Find trainers for this location
    const locationTrainers = locationTrainerNames[locationKey] || undefined;

    locations.push({
      id: locationId,
      name: locationName,
      constantName: locationConstant,
      connectionCount: connectionCount,
      isLandmark: isLandmark,
      order: order,
      region: region,
      encounters: locationEncounters,
      items: itemNames,
      trainers: locationTrainers,
    });
  }

  console.log(`Created ${locations.length} complete location objects`);
  locations.sort((a, b) => a.name.localeCompare(b.name));
};

// Main execution using Promise.all pattern
await Promise.all([
  extractLandmarks(),
  extractConnections(),
  extractTrainers(),
  extractItems(),
  extractEncounters(grassFiles, 'grass'),
  extractEncounters(waterFiles, 'surfing'),
  extractEncounters(fishFiles, 'fishing'),
  extractEncounters(treeFiles, 'headbutt'),
]);

// Merge all extracted data
mergeLocationData();

// Create output directories
const locationsDir = join(__dirname, '..', 'new', 'locations');
const trainersDir = join(__dirname, '..', 'new', 'trainers');
const outputDir = join(__dirname, '..', 'new');

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
      constantName: location.constantName || '',
      name: location.name,
      isLandmark: location.isLandmark || false,
      region: location.region,
      order: location.order,
      connections: location.connectionCount,
      encounterCount: location.encounters?.length || 0,
      trainerCount: location.trainers?.length || 0,
    });
  }),
);

locationManifest.sort((a, b) => a.name.localeCompare(b.name));

// Write manifest file
const locationManifestPath = join(outputDir, 'locations_manifest.json');
await writeFile(locationManifestPath, JSON.stringify(locationManifest, null, 2), 'utf-8');

// Consolidate trainers before writing files
const consolidatedTrainers = consolidateTrainers();

// Write individual trainer files
const trainerManifest: TrainerManifest[] = [];

await Promise.all(
  Object.values(consolidatedTrainers).map(async (trainer) => {
    const trainerPath = join(trainersDir, `${trainer.id.toLowerCase()}.json`);
    // Write the full consolidated trainer data to individual files
    await writeFile(trainerPath, JSON.stringify(trainer, null, 2), 'utf-8');

    // Add to manifest
    trainerManifest.push({
      id: trainer.id,
      name: trainer.name,
      class: trainer.class,
      constantName: trainer.constantName,
    });
  }),
);

trainerManifest.sort((a, b) => a.name.localeCompare(b.name));

// Write trainer manifest file
const trainerManifestPath = join(outputDir, 'trainer_manifest.json');
await writeFile(trainerManifestPath, JSON.stringify(trainerManifest, null, 2), 'utf-8');

console.log('Location extraction complete!');

// Export function for other modules
const getLocations = () => locations;
export default getLocations;
