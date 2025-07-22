import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LocationTrainer, TrainerPokemon } from '../../types/types.ts';
import { normalizeLocationKey } from '../../../extract_locations.ts';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRAINER_OUTPUT = path.join(__dirname, '../../../output/trainer_data.json');

/**
 * Extract trainer party data and map them to locations
 */
export function extractTrainerData(): Record<string, LocationTrainer[]> {
  console.log('🎯 Extracting trainer data from maps and parties...');

  const partiesPath = path.join(__dirname, '../../../rom/data/trainers/parties.asm');
  const mapsDir = path.join(__dirname, '../../../rom/maps');

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

  // Write trainer data to output file
  fs.writeFileSync(TRAINER_OUTPUT, JSON.stringify(trainersByLocation, null, 2));
  console.log(`✅ Extracted trainer data to ${TRAINER_OUTPUT}`);

  const totalTrainers = Object.values(trainersByLocation).reduce((sum, trainers) => sum + trainers.length, 0);
  console.log(`📊 Found ${totalTrainers} trainers across ${Object.keys(trainersByLocation).length} locations`);

  return trainersByLocation;
}

/**
 * Extract trainer party data from parties.asm
 */
function extractTrainerParties(partiesPath: string): Record<string, TrainerPokemon[]> {
  console.log('📋 Parsing trainer parties...');

  const partiesContent = fs.readFileSync(partiesPath, 'utf8');
  const lines = partiesContent.split(/\r?\n/);

  const trainerParties: Record<string, TrainerPokemon[]> = {};

  let currentTrainerClass: string | null = null;
  let currentTrainerName: string | null = null;
  let currentPokemon: TrainerPokemon[] = [];
  let inTrainerSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith(';')) {
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
      if (currentTrainerClass && currentTrainerName) {
        const trainerId = `${currentTrainerClass}_${trainerMatch[1]}`;
        trainerParties[trainerId] = [...currentPokemon];
        console.log(`📝 Added party for ${trainerId} with ${currentPokemon.length} pokemon`);
      }

      // Start new trainer
      currentTrainerName = trainerMatch[2];
      currentPokemon = [];
      inTrainerSection = true;
      continue;
    }

    // Parse pokemon: tr_mon LEVEL, [Nickname], SPECIES[@ITEM], [GENDER+FORM]
    const pokemonMatch = line.match(/tr_mon\s+(.+)/);
    if (pokemonMatch && inTrainerSection) {
      const pokemonData = parsePokemonLine(pokemonMatch[1]);
      if (pokemonData) {
        currentPokemon.push(pokemonData);
      }
      continue;
    }

    // Parse trainer end
    if (line === 'end_trainer') {
      inTrainerSection = false;
      continue;
    }
  }

  // Don't forget the last trainer
  if (currentTrainerClass && currentTrainerName) {
    const lastTrainerId = `${currentTrainerClass}_${currentTrainerName.toUpperCase()}`;
    trainerParties[lastTrainerId] = [...currentPokemon];
    console.log(`📝 Added final party for ${lastTrainerId} with ${currentPokemon.length} pokemon`);
  }

  console.log(`📊 Extracted ${Object.keys(trainerParties).length} trainer parties`);
  return trainerParties;
}

/**
 * Extract trainer locations from map files
 */
function extractTrainerLocations(mapsDir: string, trainerParties: Record<string, TrainerPokemon[]>): Record<string, LocationTrainer[]> {
  console.log('🗺️  Parsing trainer locations from maps...');

  const trainersByLocation: Record<string, LocationTrainer[]> = {};
  const mapFiles = fs.readdirSync(mapsDir).filter(file => file.endsWith('.asm'));

  for (const mapFile of mapFiles) {
    const locationKey = normalizeLocationKey(path.basename(mapFile, '.asm'));
    const mapPath = path.join(mapsDir, mapFile);
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    const lines = mapContent.split(/\r?\n/);

    const locationTrainers: LocationTrainer[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for trainer object events
      const objectMatch = line.match(/object_event\s+(\d+),\s*(\d+),\s*SPRITE_([A-Z_]+),.*OBJECTTYPE_GENERICTRAINER.*GenericTrainer([A-Za-z0-9_]+)/);
      if (objectMatch) {
        const x = parseInt(objectMatch[1]);
        const y = parseInt(objectMatch[2]);
        const spriteType = objectMatch[3].toLowerCase();

        // Look ahead for the trainer definition
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          const nextLine = lines[j].trim();
          const trainerDefMatch = nextLine.match(/generictrainer\s+([A-Z_]+),\s*([A-Z0-9_]+),/);

          if (trainerDefMatch) {
            const trainerClass = trainerDefMatch[1];
            const trainerId = trainerDefMatch[2];
            const trainerPartyKey = `${trainerClass}_${trainerId}`;

            const pokemon = trainerParties[trainerPartyKey] || [];

            const trainer: LocationTrainer = {
              id: `${trainerClass.toLowerCase()}_${trainerId.toLowerCase()}`,
              name: trainerId.charAt(0).toUpperCase() + trainerId.slice(1).toLowerCase(),
              trainerClass,
              spriteType: getSpriteType(trainerClass),
              coordinates: { x, y },
              pokemon: pokemon,
            };

            locationTrainers.push(trainer);
            console.log(`� Found trainer ${trainer.name} (${trainerClass}) at ${locationKey} with ${pokemon.length} pokemon`);
            break;
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
function parsePokemonLine(pokemonData: string): TrainerPokemon | null {
  // Handle various formats:
  // LEVEL, SPECIES
  // LEVEL, SPECIES @ ITEM
  // LEVEL, "Nickname", SPECIES
  // LEVEL, SPECIES, GENDER+FORM
  // etc.

  const parts = pokemonData.split(',').map(p => p.trim());

  if (parts.length < 2) {
    return null;
  }

  let level: number;
  let species: string;
  let nickname: string | undefined;
  let item: string | undefined;
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
    const speciesParts = speciesStr.split('@').map(s => s.trim());
    species = normalizeSpeciesName(speciesParts[0]);
    item = normalizeItemName(speciesParts[1]);
  } else {
    species = normalizeSpeciesName(speciesStr);
  }

  // TODO: Parse additional data like gender, form, etc. from remaining parts

  return {
    level,
    species,
    ...(nickname && { nickname }),
    ...(item && { item }),
  };
}

/**
 * Normalize species name from constant to display format
 */
function normalizeSpeciesName(species: string): string {
  // Convert from SPECIES_NAME to Species Name format
  return species
    .toLowerCase()
    .replace(/_/g, '-')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-')
    .replace(/^Nidoran-M/, 'Nidoran-M')
    .replace(/^Nidoran-F/, 'Nidoran-F')
    .replace(/^Mr-Mime/, 'Mr-Mime')
    .replace(/^Mime-Jr/, 'Mime-Jr');
}

/**
 * Normalize item name from constant to display format
 */
function normalizeItemName(item: string): string {
  return item
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get the sprite type for a trainer class
 */
function getSpriteType(trainerClass: string): string {
  const spriteMap: Record<string, string> = {
    'BUG_CATCHER': 'bug_catcher',
    'YOUNGSTER': 'youngster',
    'LASS': 'lass',
    'CAMPER': 'camper',
    'PICNICKER': 'picnicker',
    'HIKER': 'hiker',
    'FISHERMAN': 'fisherman',
    'SWIMMER_M': 'swimmer_m',
    'SWIMMER_F': 'swimmer_f',
    'SAILOR': 'sailor',
    'OFFICER': 'officer',
    'GUITARIST': 'guitarist',
    'JUGGLER': 'juggler',
    'PSYCHIC_T': 'psychic',
    'SAGE': 'sage',
    'MEDIUM': 'medium',
    'BOARDER': 'boarder',
    'SKIER': 'skier',
    'BLACKBELT_T': 'blackbelt',
    'FIREBREATHER': 'firebreather',
    'COOLTRAINERM': 'ace_trainer_m',
    'COOLTRAINERF': 'ace_trainer_f',
    'BEAUTY': 'beauty',
    'POKEMANIAC': 'pokemaniac',
    'GRUNTM': 'team_rocket_grunt_m',
    'GRUNTF': 'team_rocket_grunt_f',
    'GENTLEMAN': 'gentleman',
    'SCIENTIST': 'scientist',
    'ROCKET': 'team_rocket_grunt_m',
    'EXECUTIVE': 'team_rocket_executive',
    'LEADER': 'gym_leader',
    'CHAMPION': 'champion',
  };

  return spriteMap[trainerClass] || trainerClass.toLowerCase();
}

/**
 * Normalize trainer key for location matching
 */
function normalizeTrainerKey(trainerId: string): string {
  return trainerId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}
