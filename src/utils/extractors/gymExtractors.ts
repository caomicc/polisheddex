import fs from 'node:fs';
import path from 'node:path';
import { formatMoveName } from '../stringUtils.ts';
import type { GymLeader, TrainerPokemon } from '../../../src/types/types.ts';
import { normalizeLocationKey } from '../locationUtils.ts';
import { fileURLToPath } from 'node:url';
// --- Extract Gym Leader Pokemon Parties ---
export function extractGymLeaderParties(): Record<
  string,
  { level: number; species: string; item?: string; gender?: string; moves?: string[] }[]
> {
  console.log('🏆 Extracting gym leader Pokemon parties...');
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const partiesPath = path.join(__dirname, '../../../polishedcrystal/data/trainers/parties.asm');

  if (!fs.existsSync(partiesPath)) {
    console.warn('Trainer parties file not found');
    return {};
  }

  const partiesContent = fs.readFileSync(partiesPath, 'utf8');
  const lines = partiesContent.split(/\r?\n/);
  const gymLeaderParties: Record<
    string,
    { level: number; species: string; item?: string; gender?: string; moves?: string[] }[]
  > = {};

  let currentTrainerClass: string | null = null;
  let currentTrainerNumber: number | null = null;
  let currentParty: {
    level: number;
    species: string;
    item?: string;
    gender?: string;
    moves?: string[];
  }[] = [];
  let currentPokemon: {
    level: number;
    species: string;
    item?: string;
    gender?: string;
    moves?: string[];
  } | null = null;

  // Define gym leader classes we're interested in
  const gymLeaderClasses = [
    'FALKNER',
    'BUGSY',
    'WHITNEY',
    'MORTY',
    'CHUCK',
    'JASMINE',
    'PRYCE',
    'CLAIR',
    'BROCK',
    'MISTY',
    'LT_SURGE',
    'ERIKA',
    'JANINE',
    'SABRINA',
    'BLAINE',
    'BLUE',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for trainer class definitions: def_trainer_class FALKNER
    const classMatch = line.match(/def_trainer_class\s+([A-Z_]+)/);
    if (classMatch) {
      const trainerClass = classMatch[1];
      if (gymLeaderClasses.includes(trainerClass)) {
        currentTrainerClass = trainerClass;
        console.log(`🏆 Found gym leader class: ${trainerClass}`);
      } else {
        currentTrainerClass = null;
      }
      continue;
    }

    // Only process lines if we're in a gym leader class
    if (!currentTrainerClass) continue;

    // Look for trainer definitions: def_trainer 1, "Falkner"
    const trainerMatch = line.match(/def_trainer\s+(\d+),\s*"([^"]+)"/);
    if (trainerMatch) {
      // Save previous trainer's data if we had one
      if (currentTrainerNumber !== null && currentParty.length > 0) {
        const key = `${currentTrainerClass}_${currentTrainerNumber}`;
        gymLeaderParties[key] = [...currentParty];
        console.log(`🏆 Saved party for ${key}: ${currentParty.length} Pokemon`);
      }

      currentTrainerNumber = parseInt(trainerMatch[1]);
      currentParty = [];
      currentPokemon = null;
      continue;
    }

    // Look for Pokemon definitions: tr_mon <LEVEL>, [Nickname], <SPECIES/SPECIES @ ITEM>, [GENDER+FORM]
    const pokemonMatch = line.match(
      /tr_mon\s+(\d+),\s*([^,\s]+)(?:\s*@\s*([^,\s]+))?\s*(?:,\s*(MALE|FEMALE))?/,
    );
    if (pokemonMatch) {
      // Save previous Pokemon if we had one
      if (currentPokemon) {
        currentParty.push(currentPokemon);
      }

      currentPokemon = {
        level: parseInt(pokemonMatch[1]),
        species: pokemonMatch[2].toLowerCase().replace(/-/g, '_'),
      };

      if (pokemonMatch[3]) {
        currentPokemon.item = pokemonMatch[3].toLowerCase();
      }

      if (pokemonMatch[4]) {
        currentPokemon.gender = pokemonMatch[4].toLowerCase();
      }
      continue;
    }

    // Look for moves: tr_moves MOVE1, MOVE2, MOVE3, MOVE4
    const movesMatch = line.match(/tr_moves\s+(.+)/);
    if (movesMatch && currentPokemon) {
      const moves = movesMatch[1]
        .split(',')
        .map((move) => formatMoveName(move.trim()))
        .filter((move) => move.length > 0);
      currentPokemon.moves = moves;
      continue;
    }

    // Look for end of trainer: end_trainer
    if (line === 'end_trainer') {
      // Save current Pokemon if we have one
      if (currentPokemon) {
        currentParty.push(currentPokemon);
        currentPokemon = null;
      }

      // Save current trainer's party if we have one
      if (currentTrainerNumber !== null && currentParty.length > 0) {
        const key = `${currentTrainerClass}_${currentTrainerNumber}`;
        gymLeaderParties[key] = [...currentParty];
        console.log(`🏆 Saved party for ${key}: ${currentParty.length} Pokemon`);
      }

      // Reset for next trainer (but stay in same class)
      currentTrainerNumber = null;
      currentParty = [];
      currentPokemon = null;
      continue;
    }
  }

  const totalParties = Object.keys(gymLeaderParties).length;
  console.log(`🏆 Extracted ${totalParties} gym leader parties`);

  return gymLeaderParties;
}

// --- Extract Gym Leaders ---
export function extractGymLeaders(): Record<string, GymLeader> {
  console.log('🏆 Extracting gym leaders...');
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const mapsDir = path.join(__dirname, '../../../polishedcrystal/maps');
  const gymLeadersByLocation: Record<string, GymLeader> = {};

  if (!fs.existsSync(mapsDir)) {
    console.warn('Maps directory not found');
    return {};
  }

  // Extract Pokemon party data first
  const gymLeaderParties = extractGymLeaderParties();

  // Define gym leader mapping
  const gymLeaderData: Record<
    string,
    { badge: string; speciality: string; region: 'johto' | 'kanto' }
  > = {
    FALKNER: { badge: 'ZEPHYRBADGE', speciality: 'Flying', region: 'johto' as const },
    BUGSY: { badge: 'HIVEBADGE', speciality: 'Bug', region: 'johto' as const },
    WHITNEY: { badge: 'PLAINBADGE', speciality: 'Normal', region: 'johto' as const },
    MORTY: { badge: 'FOGBADGE', speciality: 'Ghost', region: 'johto' as const },
    CHUCK: { badge: 'STORMBADGE', speciality: 'Fighting', region: 'johto' as const },
    JASMINE: { badge: 'MINERALBADGE', speciality: 'Steel', region: 'johto' as const },
    PRYCE: { badge: 'GLACIERBADGE', speciality: 'Ice', region: 'johto' as const },
    CLAIR: { badge: 'RISINGBADGE', speciality: 'Dragon', region: 'johto' as const },

    BROCK: { badge: 'BOULDERBADGE', speciality: 'Rock', region: 'kanto' as const },
    MISTY: { badge: 'CASCADEBADGE', speciality: 'Water', region: 'kanto' as const },
    LT_SURGE: { badge: 'THUNDERBADGE', speciality: 'Electric', region: 'kanto' as const },
    ERIKA: { badge: 'RAINBOWBADGE', speciality: 'Grass', region: 'kanto' as const },
    JANINE: { badge: 'SOULBADGE', speciality: 'Poison', region: 'kanto' as const },
    SABRINA: { badge: 'MARSHBADGE', speciality: 'Psychic', region: 'kanto' as const },
    BLAINE: { badge: 'VOLCANOBADGE', speciality: 'Fire', region: 'kanto' as const },
    BLUE: { badge: 'EARTHBADGE', speciality: 'Mixed', region: 'kanto' as const },
  };

  const mapFiles = fs.readdirSync(mapsDir).filter((file) => file.endsWith('Gym.asm'));

  for (const mapFile of mapFiles) {
    const locationKey = path.basename(mapFile, '.asm');
    const normalizedKey = normalizeLocationKey(locationKey);

    const mapPath = path.join(mapsDir, mapFile);
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    const lines = mapContent.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for gym leader trainer loading: loadtrainer FALKNER, 1
      const trainerMatch = line.match(/loadtrainer\s+([A-Z_]+),\s*(\d+)/);
      if (trainerMatch) {
        const trainerClass = trainerMatch[1];
        const trainerNumber = parseInt(trainerMatch[2]);

        if (gymLeaderData[trainerClass]) {
          const leaderData = gymLeaderData[trainerClass];

          // Look for coordinates from object_event - search backwards for sprite
          let coordinates: { x: number; y: number } | undefined;
          for (let j = Math.max(0, i - 50); j < i; j++) {
            const prevLine = lines[j].trim();
            const spriteMatch = prevLine.match(/object_event\s+(\d+),\s*(\d+),\s*SPRITE_([A-Z_]+)/);
            if (spriteMatch && spriteMatch[3] === trainerClass) {
              coordinates = {
                x: parseInt(spriteMatch[1]),
                y: parseInt(spriteMatch[2]),
              };
              break;
            }
          }

          // Get Pokemon party data
          const partyKey = `${trainerClass}_${trainerNumber}`;
          const partyData = gymLeaderParties[partyKey];

          let pokemon: TrainerPokemon[] | undefined;
          if (partyData) {
            pokemon = partyData.map((p) => ({
              level: p.level,
              species: p.species,
              item: p.item,
              gender: p.gender,
              moves: p.moves,
            }));
          }

          gymLeadersByLocation[normalizedKey] = {
            name:
              trainerClass.charAt(0).toUpperCase() +
              trainerClass.slice(1).toLowerCase().replace('_', ' '),
            trainerClass: trainerClass,
            badge: leaderData.badge,
            region: leaderData.region,
            speciality: leaderData.speciality,
            coordinates,
            pokemon,
          };

          console.log(
            `🏆 Found gym leader ${trainerClass} in ${normalizedKey}${pokemon ? ` with ${pokemon.length} Pokemon` : ''}`,
          );
          break;
        }
      }
    }
  }

  const totalGymLeaders = Object.keys(gymLeadersByLocation).length;
  console.log(
    `🏆 Found ${totalGymLeaders} gym leaders across ${Object.keys(gymLeadersByLocation).length} locations`,
  );

  return gymLeadersByLocation;
}
