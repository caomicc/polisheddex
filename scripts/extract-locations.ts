import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LocationData, LocationManifest } from '../src/types/new.ts';
import {
  reduce,
  normalizeString,
  parseLineWithPrefix,
  ensureArrayExists,
  countConnections,
  displayName,
  parseTrainerLine,
} from '../src/lib/extract-utils.ts';
import splitFile from '@/lib/split.ts';
import extractTrainers from './extract-trainers.ts';
import { extractItemsFromMapData } from './extract-items.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data storage
const locations: LocationData[] = [];
const encounters: Record<string, LocationData['encounters']> = {};
const connections: Record<string, number> = {};
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

// File paths
const attributesASM = join(__dirname, '../polishedcrystal/data/maps/attributes.asm');
const landmarkConstantsASM = join(__dirname, '../polishedcrystal/constants/landmark_constants.asm');
// const partiesASM = join(__dirname, '../polishedcrystal/data/trainers/parties.asm');
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
 * Extracts all trainers from a map file's content
 */
export const extractTrainerFromMapData = (mapData: string[]): string[] => {
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
const extractMapTrainers = async () => {
  const { readdir } = await import('fs/promises');

  try {
    const mapFiles = await readdir(mapsDir);

    for (const mapFile of mapFiles) {
      if (!mapFile.endsWith('.asm')) continue;

      const mapFilePath = join(mapsDir, mapFile);
      const mapName = mapFile.replace('.asm', '');

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

// Merge all data into final location objects
const mergeLocationData = async () => {
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

    // Find items for this location by reading the map file
    let itemNames = undefined;
    try {
      const mapFilePath = join(mapsDir, `${locationKey}.asm`);
      const raw = await readFile(mapFilePath, 'utf-8');
      const mapData = splitFile(raw, false)[0] as string[];
      const locationItems = extractItemsFromMapData(mapData);
      itemNames = locationItems.length > 0 ? locationItems : undefined;
    } catch (error) {
      // Map file doesn't exist or can't be read, no items for this location
    }

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

// Main execution using Promise.all pattern for operations that don't depend on Pokemon data
await Promise.all([
  extractLandmarks(),
  extractConnections(),
  extractMapTrainers(),
  extractEncounters(grassFiles, 'grass'),
  extractEncounters(waterFiles, 'surfing'),
  extractEncounters(fishFiles, 'fishing'),
  extractEncounters(treeFiles, 'headbutt'),
]);

// Run trainer extraction after other operations since it depends on Pokemon data
await extractTrainers();

// Merge all extracted data
await mergeLocationData();

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

console.log('Location extraction complete!');

// Export function for other modules
const getLocations = () => locations;
export default getLocations;
