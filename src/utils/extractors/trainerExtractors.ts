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
    'RIVAL',
    'LYRA',
    'WILL',
    'KAREN',
    'KOGA',
    'BRUNO',
    'CHAMPION',
  ];

  Object.entries(trainerParties).forEach(([trainerKey, trainerData]) => {
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
    trainersByLocation['_rival_no_location'] = rivalTrainersWithoutLocation;
    console.log(
      `📍 Added ${rivalTrainersWithoutLocation.length} rival trainers without location data`,
    );
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
  level: number,
  levelMovesData: Record<string, any>,
): string[] {
  const species = pokemonName.toLowerCase();
  if (!levelMovesData[species] || !levelMovesData[species].moves) {
    return [];
  }

  const moves = levelMovesData[species].moves;

  // Filter moves learned at or before the given level
  const availableMoves = moves.filter((move: any) => move.level <= level);

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
    const trainerClassMatch = line.match(/def_trainer_class\s+([A-Z_]+)/);
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
        console.log(
          `📝 Added party for ${trainerKey} ("${currentTrainerName}") with ${currentPokemon.length} pokemon`,
        );
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
        console.log(
          `📝 Added party for ${trainerKey} ("${currentTrainerName}") with ${currentPokemon.length} pokemon`,
        );
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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for trainer object events - handle multi-line format
      const objectMatch = line.match(/object_event\s+(\d+),\s*(\d+),\s*SPRITE_([A-Z_]+)/);
      if (objectMatch) {
        const x = parseInt(objectMatch[1]);
        const y = parseInt(objectMatch[2]);
        const spriteType = objectMatch[3].toLowerCase();

        // Reconstruct the full object_event line by reading ahead until we find the complete definition
        let fullObjectLine = line;
        let nextLineIdx = i + 1;

        // Keep reading lines until we have a complete object_event (ends with something recognizable)
        while (
          nextLineIdx < lines.length &&
          !fullObjectLine.includes('OBJECTTYPE_') &&
          nextLineIdx < i + 5
        ) {
          fullObjectLine += ' ' + lines[nextLineIdx].trim();
          nextLineIdx++;
        }

        // Check if this is a GENERICTRAINER object
        if (fullObjectLine.includes('OBJECTTYPE_GENERICTRAINER')) {
          // Find the GenericTrainer reference in the full line
          const genericTrainerMatch = fullObjectLine.match(/GenericTrainer([A-Za-z0-9_]+)/);
          if (genericTrainerMatch) {
            const genericTrainerRef = genericTrainerMatch[1];

            // Look ahead for the trainer definition (expanded search range for gym files)
            for (let j = nextLineIdx; j < Math.min(nextLineIdx + 100, lines.length); j++) {
              const nextLine = lines[j].trim();

              // Check if this line defines the referenced trainer
              if (nextLine.startsWith(`GenericTrainer${genericTrainerRef}:`)) {
                // Found the trainer definition, now look for the generictrainer line
                for (let k = j + 1; k < Math.min(j + 5, lines.length); k++) {
                  const trainerDefLine = lines[k].trim();
                  const trainerDefMatch = trainerDefLine.match(
                    /generictrainer\s+([A-Z_]+),\s*([A-Z0-9_]+),/,
                  );

                  if (trainerDefMatch) {
                    const trainerClass = trainerDefMatch[1];
                    const trainerId = trainerDefMatch[2];
                    const trainerPartyKey = `${trainerClass}_${trainerId}`;

                    const trainerData = trainerParties[trainerPartyKey];
                    const pokemon = trainerData?.pokemon || [];
                    const trainerName =
                      trainerData?.name ||
                      trainerId.charAt(0).toUpperCase() + trainerId.slice(1).toLowerCase();

                    const trainer: LocationTrainer = {
                      id: `${trainerClass.toLowerCase()}_${trainerId.toLowerCase()}`,
                      name: trainerName,
                      trainerClass,
                      spriteType: getSpriteType(trainerClass),
                      coordinates: { x, y },
                      pokemon: pokemon,
                    };

                    locationTrainers.push(trainer);
                    console.log(
                      `🎯 Found trainer ${trainer.name} (${trainerClass}) at ${locationKey} with ${pokemon.length} pokemon`,
                    );
                    break;
                  }
                }
                break;
              }
            }
          }
        }
      }
    }

    if (locationTrainers.length > 0) {
      trainersByLocation[locationKey] = locationTrainers;
    }
  }

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

  let level: number;
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
      level = 20 + parseInt(match[1].replace(/\s+/g, ''), 10); // Approximate badge level + modifier
    } else {
      level = 20; // Default badge level approximation
    }
  } else {
    level = parseInt(levelStr, 10);
    if (isNaN(level)) {
      return null;
    }
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
    moves: fallbackMoves.length > 0 ? fallbackMoves : undefined,
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
