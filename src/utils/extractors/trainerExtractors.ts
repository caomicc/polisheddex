import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LocationTrainer, TrainerPokemon } from '../../types/types.ts';
import { normalizeLocationKey } from '../locationUtils.ts';
import { formatMoveName } from '../stringUtils.ts';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRAINER_OUTPUT = path.join(__dirname, '../../../output/trainer_data.json');

/**
 * Extract trainer party data and map them to locations
 */
export function extractTrainerData(): Record<string, LocationTrainer[]> {
  console.log('🎯 Extracting trainer data from maps and parties...');

  const partiesPath = path.join(__dirname, '../../../polishedcrystal/data/trainers/parties.asm');
  const mapsDir = path.join(__dirname, '../../../polishedcrystal/maps');

  if (!fs.existsSync(partiesPath)) {
    console.warn('Trainer parties file not found');
    return {};
  }

  if (!fs.existsSync(mapsDir)) {
    console.warn('Maps directory not found');
    return {};
  }

  // First, extract all trainer party data
  const trainerParties = extractTrainerParties(partiesPath);

  console.log(
    `📋 Extracted ${Object.keys(trainerParties).length} trainer parties from ${partiesPath}`,
  );

  // Then, extract trainer locations from map files
  const trainersByLocation = extractTrainerLocations(mapsDir, trainerParties);

  // Now add all remaining trainers that don't have locations to a special category
  const usedTrainerKeys = new Set<string>();

  // Collect all trainer keys that were already placed in locations
  Object.values(trainersByLocation).forEach((trainers) => {
    trainers.forEach((trainer) => {
      const trainerKey = `${trainer.trainerClass}_${trainer.id.split('_').slice(1).join('_').toUpperCase()}`;
      usedTrainerKeys.add(trainerKey);
    });
  });

  // Add only rival trainers that don't have locations
  const rivalTrainersWithoutLocation: LocationTrainer[] = [];
  const rivalClasses = [
    'CAL',
    'CARRIE',
    'JACKY',
    'RIVAL0',
    'RIVAL1',
    'RIVAL2',
    'LYRA',
    'WILL',
    'KAREN',
    'KOGA',
    'BRUNO',
    'CHAMPION',
    'PROF',
  ];

  Object.entries(trainerParties).forEach(([trainerKey, trainerData]) => {
    console.log(`Processing trainer key: ${trainerKey}`);
    if (!usedTrainerKeys.has(trainerKey)) {
      const [trainerClass, ...trainerIdParts] = trainerKey.split('_');

      console.log('trainerKey:', trainerKey);
      console.log('trainerClass:', trainerClass);

      // Only include rival trainers
      if (rivalClasses.includes(trainerClass)) {
        const trainerId = trainerIdParts.join('_');

        const trainer: LocationTrainer = {
          id: `${trainerClass.toLowerCase()}_${trainerId.toLowerCase()}`,
          name: trainerData.name,
          trainerClass,
          spriteType: getSpriteType(trainerClass),
          coordinates: {
            x: -1,
            y: -1,
          }, // No location data
          pokemon: trainerData.pokemon,
        };

        console.log(
          `🎯 Found rival trainer ${trainer.name} (${trainerClass}) without location data`,
        );

        rivalTrainersWithoutLocation.push(trainer);
      }
    }
  });

  // Add rival trainers without locations to a special category if any exist
  if (rivalTrainersWithoutLocation.length > 0) {
    // Map specific rival classes to their special locations

    const rivalLocationById: Record<string, string> = {
      karen_1: 'indigo_plateau',
      karen_2: 'indigo_plateau',
      // jacky_1: 'indigo_plateau',
      // jacky_2: 'indigo_plateau',
      will_1: 'indigo_plateau',
      will_2: 'indigo_plateau',
      bruno_1: 'indigo_plateau',
      bruno_2: 'indigo_plateau',
      // cal_1: 'indigo_plateau',
      // cal_2: 'indigo_plateau',
      // carrie_1: 'indigo_plateau',
      // carrie_2: 'indigo_plateau',
      champion_lance: 'indigo_plateau',
      champion_lance2: 'indigo_plateau',
      // silver rival
      // rival0_rival0_1: 'cherrygrove_city', // Fallback for generic rival
      // rival_rival0_1: 'cherrygrove_city', // Fallback for generic rival
      // rival0_rival0_2: 'cherrygrove_city', // Fallback for generic rival
      // rival0_rival0_3: 'cherrygrove_city', // Fallback for generic rival
      // rival1_rival1_6: 'azalea_town', // Fallback for generic rival
      // rival1_rival1_4: 'azalea_town', // Fallback for generic rival
      // rival1_rival1_5: 'azalea_town', // Fallback for generic rival
      // rival1_rival1_7: 'burned_tower', // Fallback for generic rival
      // rival1_rival1_8: 'burned_tower', // Fallback for generic rival
      // rival1_rival1_9: 'burned_tower', // Fallback for generic rival
      // rival1_rival1_10: 'underground_path', // Fallback for generic rival
      // rival1_rival1_11: 'underground_path', // Fallback for generic rival
      // rival1_rival1_12: 'underground_path', // Fallback for generic rival
      // rival1_rival1_13: 'victory_road', // Fallback for generic rival
      // rival1_rival1_14: 'victory_road', // Fallback for generic rival
      // rival1_rival1_15: 'victory_road', // Fallback for generic rival
      // rival2_rival2_1: 'mount_moon', // Fallback for generic rival
      // rival2_rival2_2: 'mount_moon', // Fallback for generic rival
      // rival2_rival2_3: 'mount_moon', // Fallback for generic rival
      // rival2_rival2_4: 'mount_moon', // Fallback for generic rival
      // rival2_rival2_5: 'mount_moon', // Fallback for generic rival
      // rival2_rival2_6: 'mount_moon', // Fallback for generic rival
      // lyra
      lyra_lyra1_1: 'new_bark_town',
      lyra_lyra1_2: 'new_bark_town',
      lyra_lyra1_3: 'new_bark_town',
      lyra_lyra1_4: 'new_bark_town',
      lyra_lyra1_5: 'new_bark_town',
      lyra_lyra1_6: 'new_bark_town',
      lyra_lyra1_7: 'new_bark_town',
      lyra_lyra1_8: 'new_bark_town',
      lyra_lyra1_9: 'new_bark_town',
      lyra_lyra1_10: 'new_bark_town',
      lyra_lyra1_11: 'new_bark_town',
      lyra_lyra1_12: 'new_bark_town',
      lyra_1: 'new_bark_town', // Fallback for generic lyra
      lyra_2: 'new_bark_town', // Fallback for generic lyra
      lyra_3: 'new_bark_town', // Fallback for generic lyra
    };

    // Group trainers by their special location or fallback
    const grouped: Record<string, LocationTrainer[]> = {};

    for (const trainer of rivalTrainersWithoutLocation) {
      console.log(`Processing rival trainer: ${trainer.id} (${trainer.name})`);
      const location = rivalLocationById[trainer.id];
      if (!grouped[location]) grouped[location] = [];
      grouped[location].push(trainer);
    }

    // Add each group to trainersByLocation
    for (const [location, trainers] of Object.entries(grouped)) {
      trainersByLocation[location] = trainers;
      console.log(`📍 Added ${trainers.length} rival trainers to ${location}`);
    }
  }

  // Write trainer data to output file
  fs.writeFileSync(TRAINER_OUTPUT, JSON.stringify(trainersByLocation, null, 2));
  console.log(`✅ Extracted trainer data to ${TRAINER_OUTPUT}`);

  const totalTrainers = Object.values(trainersByLocation).reduce(
    (sum, trainers) => sum + trainers.length,
    0,
  );
  const totalLocations = Object.keys(trainersByLocation).length;
  const locationsWithTrainers = totalLocations - (rivalTrainersWithoutLocation.length > 0 ? 1 : 0);

  console.log(
    `📊 Found ${totalTrainers} trainers across ${locationsWithTrainers} locations` +
      (rivalTrainersWithoutLocation.length > 0
        ? ` (+ ${rivalTrainersWithoutLocation.length} rival trainers without location)`
        : ''),
  );

  return trainersByLocation;
}

/**
 * Load pokemon level moves data for fallback movesets
 */
function loadPokemonLevelMoves(): Record<string, any> {
  const levelMovesPath = path.join(__dirname, '../../../output/pokemon_level_moves.json');
  try {
    const content = fs.readFileSync(levelMovesPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Could not load pokemon level moves data:', error);
    return {};
  }
}

/**
 * Get the four most recent level-up moves for a Pokémon at a given level
 */
function getMostRecentMoves(
  pokemonName: string,
  level: number | string,
  levelMovesData: Record<string, any>,
): string[] {
  console.log(`🔍 Getting most recent moves for ${pokemonName} at level ${level}`);

  // For badge-based levels, use a default level of 25 for move calculation
  const numericLevel = typeof level === 'string' ? 25 : level;

  // Normalize Mr_Mime to Mr-Mime for lookup
  let species = pokemonName;
  switch (species) {
    case 'Mr_Mime':
      species = 'Mr-Mime';
      break;
    case 'Mime_Jr':
      species = 'Mime-Jr';
      break;
    case 'NidoranM':
      species = 'Nidoran-M';
      break;
    case 'NidoranF':
      species = 'Nidoran-F';
      break;
    case 'FarfetchD':
      species = 'Farfetch-d';
      break;
    case 'PorygonZ':
    case 'Porygon-Z':
    case 'Porygon_Z':
      species = 'porygon-z';
      break;
    // Add more cases here if needed for other special species
  }
  if (!levelMovesData[species] || !levelMovesData[species].moves) {
    return [];
  }

  const moves = levelMovesData[species].moves;

  // Filter moves learned at or before the given level
  const availableMoves = moves.filter((move: any) => move.level <= numericLevel);

  // Sort by level (descending) to get most recent first
  availableMoves.sort((a: any, b: any) => b.level - a.level);

  // Take the 4 most recent moves
  return availableMoves.slice(0, 4).map((move: any) => formatMoveName(move.name));
}

/**
 * Normalize move name from display format to constant format
 */
function normalizeMoveName(moveName: string): string {
  return moveName.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_').replace(/'/g, '');
}

/**
 * Extract trainer party data from parties.asm
 */
function extractTrainerParties(
  partiesPath: string,
): Record<string, { name: string; pokemon: TrainerPokemon[] }> {
  console.log('📋 Parsing trainer parties...');

  const partiesContent = fs.readFileSync(partiesPath, 'utf8');
  const lines = partiesContent.split(/\r?\n/);
  const levelMovesData = loadPokemonLevelMoves();

  const trainerParties: Record<string, { name: string; pokemon: TrainerPokemon[] }> = {};

  let currentTrainerClass: string | null = null;
  let currentTrainerId: string | null = null;
  let currentTrainerName: string | null = null;
  let currentPokemon: TrainerPokemon[] = [];
  let currentPokemonIndex = -1;
  let inTrainerSection = false;
  let isInFaithful = false;
  let faithfulNestLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith(';')) {
      continue;
    }

    // Handle if DEF(FAITHFUL) blocks
    if (line.includes('if DEF(FAITHFUL)')) {
      isInFaithful = true;
      faithfulNestLevel++;
      continue;
    }
    if (line === 'else' && faithfulNestLevel > 0) {
      isInFaithful = false;
      continue;
    }
    if (line === 'endc' && faithfulNestLevel > 0) {
      faithfulNestLevel--;
      if (faithfulNestLevel === 0) {
        isInFaithful = false;
      }
      continue;
    }

    // Parse trainer class definition: def_trainer_class TRAINER_CLASS
    const trainerClassMatch = line.match(/def_trainer_class\s+([A-Z0-9_]+)/);
    // console.log('Processing trainer trainerClassMatch:', trainerClassMatch, line);
    if (trainerClassMatch) {
      currentTrainerClass = trainerClassMatch[1];
      continue;
    }

    // Parse trainer definition: def_trainer TRAINER_ID, "TrainerName"
    const trainerMatch = line.match(/def_trainer\s+([A-Z0-9_]+),\s*"([^"]+)"/);
    if (trainerMatch) {
      // Save previous trainer if exists
      if (currentTrainerClass && currentTrainerId && currentTrainerName) {
        const trainerKey = `${currentTrainerClass}_${currentTrainerId}`;
        trainerParties[trainerKey] = {
          name: currentTrainerName,
          pokemon: [...currentPokemon],
        };
        console
          .log
          // `📝 Added party for ${trainerKey} ("${currentTrainerName}") with ${currentPokemon.length} pokemon`,
          ();
      }

      // Start new trainer
      currentTrainerId = trainerMatch[1];
      currentTrainerName = trainerMatch[2];
      currentPokemon = [];
      currentPokemonIndex = -1;
      inTrainerSection = true;
      continue;
    }

    // Parse pokemon: tr_mon LEVEL, [Nickname], SPECIES[@ITEM], [GENDER+FORM]
    const pokemonMatch = line.match(/tr_mon\s+(.+)/);
    if (pokemonMatch && inTrainerSection) {
      const pokemonData = parsePokemonLine(pokemonMatch[1], levelMovesData);
      if (pokemonData) {
        currentPokemon.push(pokemonData);
        currentPokemonIndex = currentPokemon.length - 1;
      }
      continue;
    }

    // Parse additional pokemon data
    if (inTrainerSection && currentPokemonIndex >= 0) {
      const currentPok = currentPokemon[currentPokemonIndex];

      // Parse tr_extra: [ABILITY], [NATURE], [SHINY]
      const extraMatch = line.match(/tr_extra\s+(.+)/);
      if (extraMatch) {
        parseTrainerExtra(currentPok, extraMatch[1], isInFaithful);
        continue;
      }

      // Parse tr_moves: <MOVE1>, [MOVE2], [MOVE3], [MOVE4]
      const movesMatch = line.match(/tr_moves\s+(.+)/);
      if (movesMatch) {
        parseTrainerMoves(currentPok, movesMatch[1], isInFaithful);
        continue;
      }

      // Parse tr_dvs: <SPREAD>
      const dvsMatch = line.match(/tr_dvs\s+(.+)/);
      if (dvsMatch) {
        parseTrainerDVs(currentPok, dvsMatch[1], isInFaithful);
        continue;
      }

      // Parse tr_evs: <SPREAD>
      const evsMatch = line.match(/tr_evs\s+(.+)/);
      if (evsMatch) {
        parseTrainerEVs(currentPok, evsMatch[1], isInFaithful);
        continue;
      }
    }

    // Parse trainer end
    if (line === 'end_trainer') {
      // Save the trainer when we reach end_trainer
      if (currentTrainerClass && currentTrainerId && currentTrainerName) {
        const trainerKey = `${currentTrainerClass}_${currentTrainerId}`;
        trainerParties[trainerKey] = {
          name: currentTrainerName,
          pokemon: [...currentPokemon],
        };
        // console.log(
        //   `📝 Added party for ${trainerKey} ("${currentTrainerName}") with ${currentPokemon.length} pokemon`,
        // );
      }

      inTrainerSection = false;
      currentTrainerId = null;
      currentTrainerName = null;
      currentPokemon = [];
      currentPokemonIndex = -1;
      continue;
    }
  }

  console.log(`📊 Extracted ${Object.keys(trainerParties).length} trainer parties`);
  return trainerParties;
}

/**
 * Extract trainer locations from map files
 */
function extractTrainerLocations(
  mapsDir: string,
  trainerParties: Record<string, { name: string; pokemon: TrainerPokemon[] }>,
): Record<string, LocationTrainer[]> {
  console.log('🗺️  Parsing trainer locations from maps...');

  const trainersByLocation: Record<string, LocationTrainer[]> = {};
  const mapFiles = fs.readdirSync(mapsDir).filter((file) => file.endsWith('.asm'));

  for (const mapFile of mapFiles) {
    const locationKey = normalizeLocationKey(path.basename(mapFile, '.asm'));
    const mapPath = path.join(mapsDir, mapFile);
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    const lines = mapContent.split(/\r?\n/);

    const locationTrainers: LocationTrainer[] = [];

    // Simply search for all loadtrainer commands in the file
    const loadTrainerMatches = findAllTrainerCommands(lines, locationKey);

    for (const trainerInfo of loadTrainerMatches) {
      const trainerPartyKey = `${trainerInfo.trainerClass}_${trainerInfo.trainerId}`;
      const trainerData = trainerParties[trainerPartyKey];
      const pokemon = trainerData?.pokemon || [];
      const trainerName =
        trainerData?.name ||
        trainerInfo.trainerId.charAt(0).toUpperCase() +
          trainerInfo.trainerId.slice(1).toLowerCase();

      const trainer: LocationTrainer = {
        id: `${trainerInfo.trainerClass.toLowerCase()}_${trainerInfo.trainerId.toLowerCase()}`,
        name: trainerName,
        trainerClass: trainerInfo.trainerClass,
        spriteType: getSpriteType(trainerInfo.trainerClass),
        coordinates: trainerInfo.coordinates,
        pokemon: pokemon,
        rematchable: trainerInfo.rematchable,
      };

      locationTrainers.push(trainer);
      // console.log(
      //   `🎯 Found trainer ${trainer.name} (${trainerInfo.trainerClass}) at ${locationKey} (${trainerInfo.coordinates.x}, ${trainerInfo.coordinates.y}) with ${pokemon.length} pokemon${trainerInfo.rematchable ? ' [REMATCHABLE]' : ''}`,
      // );
    }

    if (locationTrainers.length > 0) {
      trainersByLocation[locationKey] = locationTrainers;
    }
  }

  console.log(`📍 Found ${Object.keys(trainersByLocation).length} locations with trainers`);
  // console.log(JSON.stringify(trainersByLocation, null, 2)); // Log first 500 chars for brevity

  return trainersByLocation;
}

/**
 * Parse a pokemon line from tr_mon directive
 */
function parsePokemonLine(
  pokemonData: string,
  levelMovesData: Record<string, any>,
): TrainerPokemon | null {
  // Handle various formats:
  // LEVEL, SPECIES
  // LEVEL, SPECIES @ ITEM
  // LEVEL, "Nickname", SPECIES
  // LEVEL, SPECIES, GENDER+FORM
  // etc.

  const parts = pokemonData.split(',').map((p) => p.trim());

  if (parts.length < 2) {
    return null;
  }

  let level: number | string;
  let species: string;
  let nickname: string | undefined;
  let item: string | undefined;
  let gender: string | undefined;
  let form: string | undefined;
  let partIndex = 0;

  // Parse level (could be a number or LEVEL_FROM_BADGES expression)
  const levelStr = parts[partIndex++];
  if (levelStr.includes('LEVEL_FROM_BADGES')) {
    // Handle expressions like "LEVEL_FROM_BADGES + 4"
    const match = levelStr.match(/LEVEL_FROM_BADGES\s*([\+\-]\s*\d+)?/);
    if (match && match[1]) {
      const modifier = match[1].replace(/\s+/g, '');
      level = `Badge Level ${modifier}`; // Use descriptive string like "Badge Level + 4"
    } else {
      level = 'Badge Level'; // Default badge level description
    }
  } else {
    const parsedLevel = parseInt(levelStr, 10);
    if (isNaN(parsedLevel)) {
      return null;
    }
    level = parsedLevel;
  }

  // Check if next part is a nickname (starts with quote)
  if (parts[partIndex] && parts[partIndex].startsWith('"')) {
    nickname = parts[partIndex].replace(/"/g, '');
    partIndex++;
  }

  // Parse species and optional item
  const speciesStr = parts[partIndex++];
  if (speciesStr.includes('@')) {
    const speciesParts = speciesStr.split('@').map((s) => s.trim());
    species = normalizeSpeciesName(speciesParts[0]);
    item = normalizeItemName(speciesParts[1]);
  } else {
    species = normalizeSpeciesName(speciesStr);
  }

  // Parse gender and form from remaining parts
  if (partIndex < parts.length) {
    const genderFormStr = parts[partIndex];
    if (genderFormStr.includes('MALE')) {
      gender = 'male';
    } else if (genderFormStr.includes('FEMALE')) {
      gender = 'female';
    } else if (genderFormStr.includes('GENDERLESS')) {
      gender = 'genderless';
    }

    // Extract form information
    if (genderFormStr.includes('_FORM')) {
      const formMatch = genderFormStr.match(/([A-Z_]+_FORM)/);
      if (formMatch) {
        form = formMatch[1].toLowerCase().replace(/_/g, ' ');
      }
    }
  }

  // Generate fallback moveset if no moves are specified
  const fallbackMoves = getMostRecentMoves(species, level, levelMovesData);

  const pokemon: TrainerPokemon = {
    level,
    species,
    ...(nickname && { nickname }),
    ...(item && { item }),
    ...(gender && { gender }),
    ...(form && { form }),
    // Initialize with fallback moveset - will be overridden if tr_moves is specified
    moves: fallbackMoves,
    // Initialize faithful/polished versions
    faithful: {},
    polished: {},
  };

  return pokemon;
}

/**
 * Normalize species name from constant to display format
 */
function normalizeSpeciesName(species: string): string {
  // Convert from SPECIES_NAME to proper capitalized format
  return species
    .toLowerCase()
    .replace(/^([a-z])/, (match) => match.toUpperCase()) // Capitalize first letter
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()); // Remove underscores and capitalize next letter
}

/**
 * Normalize item name from constant to display format
 */
function normalizeItemName(item: string): string {
  return item
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get the sprite type for a trainer class
 */
function getSpriteType(trainerClass: string): string {
  const spriteMap: Record<string, string> = {
    BUG_CATCHER: 'bug_catcher',
    YOUNGSTER: 'youngster',
    LASS: 'lass',
    CAMPER: 'camper',
    PICNICKER: 'picnicker',
    HIKER: 'hiker',
    FISHERMAN: 'fisherman',
    SWIMMER_M: 'swimmer_m',
    SWIMMER_F: 'swimmer_f',
    SAILOR: 'sailor',
    OFFICER: 'officer',
    GUITARIST: 'guitarist',
    JUGGLER: 'juggler',
    PSYCHIC_T: 'psychic',
    SAGE: 'sage',
    MEDIUM: 'medium',
    BOARDER: 'boarder',
    SKIER: 'skier',
    BLACKBELT_T: 'blackbelt',
    FIREBREATHER: 'firebreather',
    COOLTRAINERM: 'ace_trainer_m',
    COOLTRAINERF: 'ace_trainer_f',
    BEAUTY: 'beauty',
    POKEMANIAC: 'pokemaniac',
    GRUNTM: 'team_rocket_grunt_m',
    GRUNTF: 'team_rocket_grunt_f',
    GENTLEMAN: 'gentleman',
    SCIENTIST: 'scientist',
    ROCKET: 'team_rocket_grunt_m',
    EXECUTIVE: 'team_rocket_executive',
    LEADER: 'gym_leader',
    CHAMPION: 'champion',
    SR_AND_JR: 'sr_and_jr',
  };

  return spriteMap[trainerClass] || trainerClass.toLowerCase();
}

/**
 * Parse tr_extra line: [ABILITY], [NATURE], [SHINY]
 */
function parseTrainerExtra(
  pokemon: TrainerPokemon,
  extraData: string,
  isInFaithful: boolean,
): void {
  const parts = extraData.split(',').map((p) => p.trim());

  for (const part of parts) {
    if (part === 'SHINY') {
      pokemon.shiny = true;
    } else if (part.includes('_UP_') && part.includes('_DOWN')) {
      // Nature format: ATK_UP_SATK_DOWN
      const nature = parseNature(part);
      if (isInFaithful) {
        if (!pokemon.faithful) pokemon.faithful = {};
        pokemon.faithful.nature = nature;
      } else {
        if (!pokemon.polished) pokemon.polished = {};
        pokemon.polished.nature = nature;
      }
      // Also set base nature if not already set
      if (!pokemon.nature) {
        pokemon.nature = nature;
      }
    } else {
      // Assume it's an ability
      const ability = normalizeAbilityName(part);
      if (isInFaithful) {
        if (!pokemon.faithful) pokemon.faithful = {};
        pokemon.faithful.ability = ability;
      } else {
        if (!pokemon.polished) pokemon.polished = {};
        pokemon.polished.ability = ability;
      }
      // Also set base ability if not already set
      if (!pokemon.ability) {
        pokemon.ability = ability;
      }
    }
  }
}

/**
 * Parse tr_moves line: <MOVE1>, [MOVE2], [MOVE3], [MOVE4]
 */
function parseTrainerMoves(
  pokemon: TrainerPokemon,
  movesData: string,
  isInFaithful: boolean,
): void {
  const moves = movesData.split(',').map((move) => formatMoveName(move.trim()));

  console.log(
    `📝 Setting moves for ${pokemon.species} (${pokemon.level}) - Moves: ${moves.join(', ')}`,
  );

  if (isInFaithful) {
    if (!pokemon.faithful) pokemon.faithful = {};
    pokemon.faithful.moves = moves;
  } else {
    if (!pokemon.polished) pokemon.polished = {};
    pokemon.polished.moves = moves;
  }

  // Always set base moves to formatted moves for consistency
  pokemon.moves = moves;
}

/**
 * Parse tr_dvs line: <SPREAD>
 */
function parseTrainerDVs(pokemon: TrainerPokemon, dvsData: string, isInFaithful: boolean): void {
  const dvs = parseStatSpread(dvsData, 15); // DVs default to 15

  if (isInFaithful) {
    if (!pokemon.faithful) pokemon.faithful = {};
    pokemon.faithful.dvs = dvs;
  } else {
    if (!pokemon.polished) pokemon.polished = {};
    pokemon.polished.dvs = dvs;
  }

  // Also set base DVs if not already set
  if (!pokemon.dvs) {
    pokemon.dvs = dvs;
  }
}

/**
 * Parse tr_evs line: <SPREAD>
 */
function parseTrainerEVs(pokemon: TrainerPokemon, evsData: string, isInFaithful: boolean): void {
  const evs = parseStatSpread(evsData, 0); // EVs default to 0

  if (isInFaithful) {
    if (!pokemon.faithful) pokemon.faithful = {};
    pokemon.faithful.evs = evs;
  } else {
    if (!pokemon.polished) pokemon.polished = {};
    pokemon.polished.evs = evs;
  }

  // Also set base EVs if not already set
  if (!pokemon.evs) {
    pokemon.evs = evs;
  }
}

/**
 * Parse stat spread string like "4 Atk, 64 SDf" or "15 All"
 */
function parseStatSpread(
  spreadData: string,
  defaultValue: number,
): {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
} {
  const stats = {
    hp: defaultValue,
    attack: defaultValue,
    defense: defaultValue,
    speed: defaultValue,
    special: defaultValue,
  };

  const parts = spreadData.split(',').map((p) => p.trim());

  for (const part of parts) {
    const match = part.match(/(\d+)\s+([A-Za-z]+)/);
    if (match) {
      const value = parseInt(match[1], 10);
      const statName = match[2].toLowerCase();

      switch (statName) {
        case 'hp':
          stats.hp = value;
          break;
        case 'atk':
        case 'attack':
          stats.attack = value;
          break;
        case 'def':
        case 'defense':
          stats.defense = value;
          break;
        case 'spe':
        case 'speed':
          stats.speed = value;
          break;
        case 'sat':
        case 'sdef':
        case 'sdf':
        case 'special':
          stats.special = value;
          break;
        case 'all':
          stats.hp = stats.attack = stats.defense = stats.speed = stats.special = value;
          break;
      }
    }
  }

  return stats;
}

/**
 * Parse nature from format like "ATK_UP_SATK_DOWN"
 */
function parseNature(natureStr: string): string {
  // Convert from constant format to display format
  return natureStr
    .toLowerCase()
    .replace(/_up_/, ' +')
    .replace(/_down/, ' -')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalize ability name from constant to display format
 */
function normalizeAbilityName(ability: string): string {
  return ability
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Find all trainer commands (loadtrainer and generictrainer) in a map file and determine their coordinates and rematchability
 */
function findAllTrainerCommands(
  lines: string[],
  locationKey: string,
): Array<{
  trainerClass: string;
  trainerId: string;
  coordinates: { x: number; y: number };
  rematchable: boolean;
}> {
  const trainers: Array<{
    trainerClass: string;
    trainerId: string;
    coordinates: { x: number; y: number };
    rematchable: boolean;
  }> = [];

  // Build a map of script names to their coordinates and object types
  const scriptToCoordinates: Record<string, { x: number; y: number; rematchable: boolean }> = {};

  // First pass: collect all object_events and coord_events with their coordinates
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for coord_events
    const coordMatch = line.match(/coord_event\s+(\d+),\s*(\d+),\s*\d+,\s*([A-Za-z0-9_]+)/);
    if (coordMatch) {
      const x = parseInt(coordMatch[1]);
      const y = parseInt(coordMatch[2]);
      const scriptName = coordMatch[3];
      scriptToCoordinates[scriptName] = { x, y, rematchable: false };
    }

    // Look for object_events
    const objectMatch = line.match(/object_event\s+(\d+),\s*(\d+),\s*SPRITE_([A-Z_]+)/);
    if (objectMatch) {
      const x = parseInt(objectMatch[1]);
      const y = parseInt(objectMatch[2]);

      // Read ahead to get the full object_event line
      let fullObjectLine = line;
      let nextLineIdx = i + 1;
      while (
        nextLineIdx < lines.length &&
        !fullObjectLine.includes('OBJECTTYPE_') &&
        nextLineIdx < i + 5
      ) {
        fullObjectLine += ' ' + lines[nextLineIdx].trim();
        nextLineIdx++;
      }

      // Extract script name and determine if it's rematchable
      let scriptName = '';
      let isRematchable = false;

      if (fullObjectLine.includes('OBJECTTYPE_GENERICTRAINER')) {
        const genericMatch = fullObjectLine.match(
          /OBJECTTYPE_GENERICTRAINER,\s*\d+,\s*([A-Za-z0-9_]+)/,
        );
        if (genericMatch) {
          scriptName = genericMatch[1];
          isRematchable = false;
        }
      } else if (fullObjectLine.includes('OBJECTTYPE_TRAINER')) {
        const trainerMatch = fullObjectLine.match(/OBJECTTYPE_TRAINER,\s*\d+,\s*([A-Za-z0-9_]+)/);
        if (trainerMatch) {
          scriptName = trainerMatch[1];
          isRematchable = true;
        }
      } else if (fullObjectLine.includes('OBJECTTYPE_SCRIPT')) {
        const scriptMatch = fullObjectLine.match(/OBJECTTYPE_SCRIPT,\s*\d+,\s*([A-Za-z0-9_]+)/);
        if (scriptMatch) {
          scriptName = scriptMatch[1];
          isRematchable = false;
        }
      }

      if (scriptName) {
        scriptToCoordinates[scriptName] = { x, y, rematchable: isRematchable };
      }
    }
  }

  // Second pass: find all trainer commands (loadtrainer and generictrainer) and match them to coordinates
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for loadtrainer command (rematchable trainers)
    const loadTrainerMatch = line.match(/loadtrainer\s+([A-Z0-9_]+),\s*([A-Z0-9_]+)/);
    if (loadTrainerMatch) {
      const trainerClass = loadTrainerMatch[1];
      const trainerId = loadTrainerMatch[2];

      console.log(`🔍 Found loadtrainer command: ${trainerClass} ${trainerId} at ${locationKey}`);

      // Find the script this loadtrainer belongs to by working backwards
      let scriptName = '';
      let coordinates = { x: -1, y: -1 };
      let rematchable = false;

      // Look backwards for the script definition
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = lines[j].trim();

        // Stop at another script definition or section
        if (prevLine.endsWith(':') && !prevLine.startsWith('.') && prevLine !== 'end') {
          // Extract script name (remove trailing colon)
          const potentialScriptName = prevLine.slice(0, -1);

          // Check if this script has coordinates
          if (scriptToCoordinates[potentialScriptName]) {
            scriptName = potentialScriptName;
            coordinates = {
              x: scriptToCoordinates[potentialScriptName].x,
              y: scriptToCoordinates[potentialScriptName].y,
            };
            rematchable = scriptToCoordinates[potentialScriptName].rematchable;
          }
          break;
        }
      }

      // Check if this trainer script has phone number logic (additional rematch indicator)
      if (!rematchable && scriptName) {
        // Look ahead in the script for phone number logic
        for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
          const nextLine = lines[j].trim();

          // Stop at another script
          if (nextLine.endsWith(':') && !nextLine.startsWith('.') && nextLine !== 'end') {
            break;
          }

          // Check for phone number related commands
          if (
            nextLine.includes('askforphonenumber') ||
            nextLine.includes('PHONE_') ||
            nextLine.includes('checkcellnum')
          ) {
            rematchable = true;
            break;
          }
        }
      }

      // console.log(
      //   `🔍 Found loadtrainer ${trainerClass} ${trainerId} in script ${scriptName} at ${locationKey} (${coordinates.x}, ${coordinates.y}) - ${rematchable ? 'Rematchable' : 'Non-rematchable'}`,
      // );

      trainers.push({
        trainerClass,
        trainerId,
        coordinates,
        rematchable,
      });
      console.log(
        `🎯 Added trainer ${trainerClass} ${trainerId} at ${locationKey} (${coordinates.x}, ${coordinates.y}) - Rematchable: ${rematchable}`,
      );
    }

    // Check for generictrainer command (non-rematchable trainers)
    const genericTrainerMatch = line.match(/generictrainer\s+([A-Z0-9_]+),\s*([A-Z0-9_]+)/);
    if (genericTrainerMatch) {
      const trainerClass = genericTrainerMatch[1];
      const trainerId = genericTrainerMatch[2];

      // Find the script this generictrainer belongs to by working backwards
      let scriptName = '';
      let coordinates = { x: -1, y: -1 };

      // Look backwards for the script definition
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = lines[j].trim();

        // Stop at another script definition or section
        if (prevLine.endsWith(':') && !prevLine.startsWith('.') && prevLine !== 'end') {
          // Extract script name (remove trailing colon)
          const potentialScriptName = prevLine.slice(0, -1);

          // Check if this script has coordinates
          if (scriptToCoordinates[potentialScriptName]) {
            scriptName = potentialScriptName;
            coordinates = {
              x: scriptToCoordinates[potentialScriptName].x,
              y: scriptToCoordinates[potentialScriptName].y,
            };
          }
          break;
        }
      }

      console.log(
        `🔍 Found generictrainer ${trainerClass} ${trainerId} in script ${scriptName} at ${locationKey} (${coordinates.x}, ${coordinates.y}) - Non-rematchable`,
      );

      trainers.push({
        trainerClass,
        trainerId,
        coordinates,
        rematchable: false, // generictrainer commands are never rematchable
      });
    }
  }

  return trainers;
}
