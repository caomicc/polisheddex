import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  LocationData,
  LocationManifest,
  TrainerData,
  ComprehensiveTrainerData,
  TrainerManifest,
} from '../src/types/new.ts';
import splitFile from '@/lib/split.ts';
import reduce from '@/lib/reduce.ts';
import displayName from '@/lib/displayName.ts';

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
const partiesASM = join(__dirname, '../polishedcrystal/data/trainers/parties.asm');

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
  const landmarkConstantsData = raw
    .trim()
    .split('\n')
    .map((line) => line.trim());

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

        connectionCount = 0;

        // Count each direction mentioned
        if (connectionsStr.includes('NORTH')) connectionCount++;
        if (connectionsStr.includes('SOUTH')) connectionCount++;
        if (connectionsStr.includes('EAST')) connectionCount++;
        if (connectionsStr.includes('WEST')) connectionCount++;
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
    const encounterData = raw
      .trim()
      .split('\n')
      .map((line) => line.trim());

    for (let i = 0; i < encounterData.length; i++) {
      const line = encounterData[i];

      // Find location definitions: def_grass_wildmons LOCATION_NAME
      if (line.startsWith(defPrefix + ' ')) {
        const locationConstant = line.replace(defPrefix + ' ', '').trim();

        // Initialize or get existing encounters for this location
        if (!encounters[locationConstant]) {
          encounters[locationConstant] = [];
        }
        const locationEncounters = encounters[locationConstant];

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
            const parts = encounterLine.replace('wildmon ', '').split(',');
            if (parts.length >= 2) {
              const level = parseInt(parts[0].trim());
              const pokemon = parts[1].trim().toLowerCase().replace(/_/g, '');

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
      currentTrainerClass = line.replace('def_trainer_class ', '').trim();
      continue;
    }

    // Start of a new trainer
    if (line.startsWith('def_trainer ')) {
      // Save previous trainer if exists
      if (currentTrainer) {
        // Save any remaining Pokemon and team
        if (currentPokemon && currentTeam) {
          currentTeam.pokemon.push(currentPokemon);
        }
        if (currentTeam && currentTeam.pokemon.length > 0) {
          currentTrainer.teams.push(currentTeam);
        }
        
        if (currentTrainer.teams.length > 0) {
          const trainerKey = reduce(currentTrainer.id);
          if (!trainers[version][trainerKey]) {
            trainers[version][trainerKey] = [];
          }
          trainers[version][trainerKey].push(currentTrainer);
        }
      }

      // Parse: def_trainer 1, "Falkner"
      const parts = line.replace('def_trainer ', '').split(';')[0].split(',');
      if (parts.length >= 2) {
        const trainerName = parts[1].trim().replace(/"/g, '');
        const trainerClass = currentTrainerClass;
        const trainerIdValue = parts[0].trim();

        const trainerId = parts[0].trim();

        const trainerConstantName = `${trainerClass}_${trainerIdValue}`;

        // Track trainer name changes and increment match count
        currentTrainerName = trainerName;
        if (currentTrainerName !== lastTrainerName) {
          currentTrainerMatchCount = 1; // Reset to 1 for new trainer
          lastTrainerName = currentTrainerName;
        } else {
          currentTrainerMatchCount++; // Increment for rematch
        }

        currentTrainer = {
          id: trainerId,
          name: trainerName,
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
      const parts = line.replace('tr_mon ', '').split(',');
      if (parts.length >= 2) {
        const level = parseInt(parts[0].trim());
        let pokemonPart = parts[1].trim(); // Add trim() here!
        let item: string | undefined;

        // Check for held item - format should be "NINETALES @ LEFTOVERS"
        if (pokemonPart.includes('@')) {
          const [pokemon, heldItem] = pokemonPart.split('@');
          pokemonPart = pokemon.trim();
          item = heldItem.trim().toLowerCase().replace(/_/g, '');
        }

        currentPokemon = {
          pokemonName: pokemonPart.trim().toLowerCase().replace(/_/g, ''),
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
        const movesStr = line.replace('tr_moves ', '').trim();
        const moves = movesStr
          .split(',')
          .map((move) => move.trim().toLowerCase().replace(/_/g, ''))
          .filter((move) => move.length > 0);

        currentPokemon.moves = moves;
      }
      continue;
    }

    // Parse other trainer data (for future use)
    if (line.startsWith('tr_extra ')) {
      if (currentPokemon) {
        // Parse: tr_extra [ABILITY], [NATURE], [SHINY]
        const extraData = line.replace('tr_extra ', '').trim();

        if (extraData.includes('SHINY')) {
          currentPokemon.shiny = true;
        } else {
          // Handle comma-separated format: [ABILITY], [NATURE], [SHINY]
          const parts = extraData.split(',');
          if (parts.length > 0 && parts[0].trim()) {
            currentPokemon.ability = parts[0].trim().toLowerCase().replace(/_/g, '');
          }
          if (parts.length > 1 && parts[1].trim()) {
            currentPokemon.nature = parts[1].trim().toLowerCase().replace(/_/g, '');
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
        currentPokemon.dvs = line.replace('tr_dvs ', '').trim();
      }
      continue;
    }

    if (line.startsWith('tr_evs ')) {
      if (currentPokemon) {
        currentPokemon.evs = line.replace('tr_evs ', '').trim();
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
      if (!trainers[version][trainerKey]) {
        trainers[version][trainerKey] = [];
      }
      trainers[version][trainerKey].push(currentTrainer);
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
        const baseTrainerKey = `${baseTrainerClass.toLowerCase()}_${baseTrainerName.toLowerCase().replace(/\s+/g, '')}`;

        if (!consolidatedTrainers[baseTrainerKey]) {
          consolidatedTrainers[baseTrainerKey] = {
            id: reduce(baseTrainerName),
            name: baseTrainerName,
            class: baseTrainerClass,
            constantName: trainer.constantName?.replace(/_\d+$/, ''), // Remove numeric suffix from constant name
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
    // Note: trainer-location mapping will be handled separately
    // since trainers are now organized by version

    locations.push({
      id: locationId,
      name: locationName,
      constantName: locationConstant,
      connectionCount: connectionCount,
      isLandmark: isLandmark,
      order: order,
      region: region,
      encounters: locationEncounters,
      trainers: [], // TODO: implement trainer-location mapping with versioned data
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

try {
  await mkdir(locationsDir, { recursive: true });
  await mkdir(trainersDir, { recursive: true });
  console.log('Created output directories');
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

// Write manifest file
const locationManifestPath = join(outputDir, 'locations_manifest.json');
await writeFile(locationManifestPath, JSON.stringify(locationManifest, null, 2), 'utf-8');

console.log('Location extraction complete!');

// Consolidate trainers before writing files
const consolidatedTrainers = consolidateTrainers();

// Write individual trainer files
const trainerManifest: TrainerManifest[] = [];

await Promise.all(
  Object.values(consolidatedTrainers).map(async (trainer) => {
    const trainerPath = join(
      trainersDir,
      `${trainer.class.toLowerCase()}_${trainer.id.toLowerCase()}.json`,
    );
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

// Write trainer manifest file
const trainerManifestPath = join(outputDir, 'trainer_manifest.json');
await writeFile(trainerManifestPath, JSON.stringify(trainerManifest, null, 2), 'utf-8');

console.log('Location extraction complete!');

// Export function for other modules
const getLocations = () => locations;
export default getLocations;
