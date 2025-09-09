import { readFile, writeFile, rm, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import {
  TrainerData,
  ComprehensiveTrainerData,
  ComprehensivePokemonData,
  TrainerManifest,
} from '../src/types/new';
import {
  createBaseTrainerKey,
  createTrainerConstantName,
  ensureArrayExists,
  normalizeString,
  parseLineWithPrefix,
  parsePokemonWithItem,
  parseTrainerDefinition,
  parseTrainerLine,
  reduce,
} from '../src/lib/extract-utils';
import splitFile from '../src/lib/split';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseDir = join(__dirname, '..');
const outputDir = join(baseDir, 'new');
const trainerDir = join(outputDir, 'trainers');
const polishedcrystalDir = join(baseDir, 'polishedcrystal');
const mapsDir = join(polishedcrystalDir, 'maps');

const partiesASM = join(__dirname, '../polishedcrystal/data/trainers/parties.asm');

const specialTrainerClasses = ['GIOVANNI', 'LYRA1', 'RIVAL1', 'ARCHER', 'ARIANA'];

// Data structures
const trainers: Record<string, Record<string, TrainerData[]>> = {
  polished: {},
  faithful: {},
};
const locationTrainerNames: Record<string, string[]> = {}; // Store trainer names by location

/**
 * Extract trainer names from map data
 */
const extractTrainerFromMapData = (mapData: string[]): string[] => {
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

/**
 * Extract trainer teams and generate complete movesets for Pokemon with empty move arrays
 */
const extractTrainerData = async () => {
  console.log('Starting trainer data extraction...');

  const raw = await readFile(partiesASM, 'utf-8');

  const partyFiles = splitFile(raw, false);

  // Process both versions
  await processTrainerData(partyFiles[0], 'polished');
  await processTrainerData(partyFiles[1], 'faithful');

  console.log('Trainer data extraction completed');
};

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
      if (currentTrainer) {
        // Finalize any remaining Pokemon
        if (currentPokemon && currentTeam) {
          // Generate moves if empty
          if (!currentPokemon.moves || currentPokemon.moves.length === 0) {
            currentPokemon.moves = await generateMovesetForPokemon(
              currentPokemon.pokemonName,
              currentPokemon.level,
            );
          }
          currentTeam.pokemon.push(currentPokemon);
          currentPokemon = null;
        }

        // Save any remaining team
        if (currentTeam && currentTeam.pokemon.length > 0) {
          currentTrainer.teams.push(currentTeam);
        }

        // Save the trainer (even if it has 0 teams)
        const trainerKey = reduce(`${currentTrainer.class}_${currentTrainer.name}`);
        const trainerList = ensureArrayExists(trainers[version], trainerKey);
        trainerList.push(currentTrainer);
      }

      // Parse: def_trainer 1, "Falkner"
      const parts = parseTrainerDefinition(line, 'def_trainer ');
      // console.log('Parsed trainer definition parts:', parts);
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
        currentTrainerName = reduce(trainerConstantName);

        if (currentTrainerName !== lastTrainerName) {
          currentTrainerMatchCount = 1; // Reset to 1 for new trainer
          lastTrainerName = currentTrainerName;
        } else {
          currentTrainerMatchCount++; // Increment for rematch
        }

        currentTrainer = {
          id: currentTrainerName,
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
        // Generate moves if empty
        if (!currentPokemon.moves || currentPokemon.moves.length === 0) {
          currentPokemon.moves = await generateMovesetForPokemon(
            currentPokemon.pokemonName,
            currentPokemon.level,
          );
        }
        currentTeam.pokemon.push(currentPokemon);
      }

      // Parse: tr_mon 60, MEGANIUM @ SITRUS_BERRY
      // Or: tr_mon 10, NATU
      // or: tr_mon 20, "Blossom", BELLOSSOM, FEMALE

      const parts = parseLineWithPrefix(line, 'tr_mon ').split(',');
      if (parts.length >= 2) {
        const level = parseInt(parts[0].trim());

        let pokemonPart: string;
        let nickname: string | undefined;

        // Check if this has a nickname format: level, "nickname", POKEMON, [GENDER]
        if (parts.length >= 3 && parts[1].trim().startsWith('"') && parts[1].trim().endsWith('"')) {
          nickname = parts[1].trim().replace(/"/g, '');
          pokemonPart = parts[2].trim();
        } else {
          // Standard format: level, POKEMON [@ ITEM]
          pokemonPart = parts[1].trim();
        }

        const { pokemon, item } = parsePokemonWithItem(pokemonPart);

        currentPokemon = {
          pokemonName: pokemon,
          nickname: nickname,
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
        // Generate moves if empty
        if (!currentPokemon.moves || currentPokemon.moves.length === 0) {
          currentPokemon.moves = await generateMovesetForPokemon(
            currentPokemon.pokemonName,
            currentPokemon.level,
          );
        }
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
      // Generate moves if empty
      if (!currentPokemon.moves || currentPokemon.moves.length === 0) {
        currentPokemon.moves = await generateMovesetForPokemon(
          currentPokemon.pokemonName,
          currentPokemon.level,
        );
      }
      currentTeam.pokemon.push(currentPokemon);
    }
    if (currentTeam && currentTeam.pokemon.length > 0) {
      currentTrainer.teams.push(currentTeam);
    }

    if (currentTrainer.teams.length > 0) {
      const trainerKey = reduce(`${currentTrainer.class}_${currentTrainer.name}`);
      const trainerList = ensureArrayExists(trainers[version], trainerKey);
      trainerList.push(currentTrainer);
    }
  }

  console.log(
    `Extracted ${Object.keys(trainers[version]).length} trainer definitions for version ${version}`,
  );
};
/**
 * Generate the most recent 4 moves that a Pokemon can learn at a given level
 */
const generateMovesetForPokemon = async (
  pokemonName: string,
  pokemonLevel: number,
): Promise<string[]> => {
  try {
    // Read Pokemon data to get movesets
    const pokemonDataPath = join(outputDir, 'pokemon', `${pokemonName}.json`);
    const pokemonData: ComprehensivePokemonData = JSON.parse(
      await readFile(pokemonDataPath, 'utf-8'),
    );

    // Get all moves the Pokemon can learn up to the given level
    const availableMoves: Array<{ move: string; level: number }> = [];

    // Try both polished and faithful versions, prefer polished
    // i'm only curious in level-up moves for now because thats what trainers use
    const polishedMoves = pokemonData.versions?.polished?.forms?.plain?.movesets?.levelUp;
    const faithfulMoves = pokemonData.versions?.faithful?.forms?.plain?.movesets?.levelUp;
    const levelUpMoves = polishedMoves || faithfulMoves;

    if (levelUpMoves) {
      for (const [, move] of Object.entries(levelUpMoves)) {
        const { name, level } = move;
        if (level && name && level <= pokemonLevel) {
          availableMoves.push({
            move: name,
            level: level,
          });
        }
      }
    }

    // Sort by level (newest first) and take the most recent 4
    availableMoves.sort((a, b) => b.level - a.level);
    const lastFourMoves = availableMoves.slice(0, 4).map((m) => m.move);

    // Ensure we have exactly 4 moves, pad with earlier moves if needed
    if (lastFourMoves.length < 4 && availableMoves.length > 0) {
      // Get all available moves sorted by level (oldest first)
      const allMoves = availableMoves.sort((a, b) => a.level - b.level);
      const uniqueMoves = Array.from(new Set(allMoves.map((m) => m.move)));
      return uniqueMoves.slice(-4); // Take last 4 unique moves
    }

    return lastFourMoves.length > 0 ? lastFourMoves : [];
  } catch {
    // Silently handle missing Pokemon files - this is expected for some Pokemon
    // that may not have been extracted yet
    return [];
  }
};

/**
 * Extract trainer locations from map files
 */
const extractTrainerLocations = async () => {
  console.log('Extracting trainer locations from maps...');

  const { readdir } = await import('fs/promises');
  const mapFiles = await readdir(mapsDir);
  let totalTrainersFound = 0;

  for (const mapFile of mapFiles) {
    if (!mapFile.endsWith('.asm')) continue;

    const mapName = normalizeString(mapFile.replace('.asm', ''));
    const mapFilePath = join(mapsDir, mapFile);

    try {
      const raw = await readFile(mapFilePath, 'utf-8');
      const mapData = splitFile(raw, false)[0] as string[];

      const mapTrainers = extractTrainerFromMapData(mapData);

      if (mapTrainers.length > 0) {
        locationTrainerNames[mapName] = mapTrainers;
        totalTrainersFound += mapTrainers.length;
      }
    } catch (error) {
      console.warn(`Could not read map file: ${mapFilePath}`, error);
      continue;
    }
  }

  console.log(
    `Found ${totalTrainersFound} trainer locations across ${Object.keys(locationTrainerNames).length} maps`,
  );
};

/**
 * Save trainer data and trainer-location mappings
 */
const saveTrainerData = async () => {
  console.log('Saving trainer data...');

  // Consolidate trainers across versions
  const consolidatedTrainers: Record<string, ComprehensiveTrainerData> = {};

  for (const version of ['polished', 'faithful']) {
    for (const [, trainerList] of Object.entries(trainers[version])) {
      for (const trainer of trainerList) {
        // Extract base trainer info (remove _1, _2, _3 suffixes)
        const baseTrainerName = trainer.name;
        const baseTrainerClass = trainer.class;
        const baseTrainerKey = createBaseTrainerKey(baseTrainerClass, baseTrainerName);
        const baseTrainerId = trainer.constantName;
        if (!consolidatedTrainers[baseTrainerKey]) {
          consolidatedTrainers[baseTrainerKey] = {
            id: reduce(baseTrainerId),
            name: baseTrainerName,
            class: baseTrainerClass,
            constantName: baseTrainerId,
            versions: {},
          };
        }
        // Combine all teams from all trainers with the same base key
        const allTeams = trainerList.flatMap((t) => t.teams);
        consolidatedTrainers[baseTrainerKey].versions[version] = {
          teams: allTeams,
        };
      }
    }
  }

  // Save individual trainer files
  for (const [, trainerData] of Object.entries(consolidatedTrainers)) {
    const trainerPath = join(trainerDir, `${trainerData.id.toLowerCase()}.json`);
    await writeFile(trainerPath, JSON.stringify(trainerData, null, 2));
  }

  // Consolidate trainers before writing files

  // Write individual trainer files
  const trainerManifest: TrainerManifest[] = [];

  await Promise.all(
    Object.values(consolidatedTrainers).map(async (trainer) => {
      const trainerPath = join(trainerDir, `${trainer.id.toLowerCase()}.json`);
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

  // Save trainer-location mapping
  const trainerLocationsPath = join(outputDir, 'trainer_locations.json');
  await writeFile(trainerLocationsPath, JSON.stringify(locationTrainerNames, null, 2));

  console.log(`Saved ${Object.keys(consolidatedTrainers).length} trainers`);
  console.log(`Saved trainer locations for ${Object.keys(locationTrainerNames).length} maps`);
};

/**
 * Clear and recreate the trainers directory
 */
const clearTrainersDirectory = async () => {
  try {
    await rm(trainerDir, { recursive: true, force: true });
    await mkdir(trainerDir, { recursive: true });
    console.log('Cleared trainers directory');
  } catch (error) {
    console.warn('Could not clear trainers directory:', error);
  }
};

/**
 * Main extraction function
 */
export default async function extractTrainers() {
  try {
    await clearTrainersDirectory();

    await Promise.all([extractTrainerData(), extractTrainerLocations()]);

    await saveTrainerData();

    console.log('Trainer extraction completed successfully');
  } catch (error) {
    console.error('Error during trainer extraction:', error);
    throw error;
  }
}

// Allow running this script directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  extractTrainers();
}

// Export trainer location data for use in extract-locations.ts
export const getTrainerLocationData = () => locationTrainerNames;
