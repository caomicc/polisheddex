import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { TrainerData, ComprehensiveTrainerData } from '../src/types/new';
import { normalizeString, parseTrainerLine } from '../src/lib/extract-utils';
import splitFile from '../src/lib/split';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseDir = join(__dirname, '..');
const outputDir = join(baseDir, 'new');
const trainerDir = join(outputDir, 'trainers');
const polishedcrystalDir = join(baseDir, 'polishedcrystal');
const mapsDir = join(polishedcrystalDir, 'maps');

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

  // Read trainer data files
  const polishedPath = join(polishedcrystalDir, 'data/trainers/parties.asm');
  const faithfulPath = join(polishedcrystalDir, 'data/trainers/parties.asm');

  const [polishedRaw, faithfulRaw] = await Promise.all([
    readFile(polishedPath, 'utf-8'),
    readFile(faithfulPath, 'utf-8'),
  ]);

  const polishedData = splitFile(polishedRaw, true)[0] as string[];
  const faithfulData = splitFile(faithfulRaw, true)[1] as string[];

  // Process both versions
  await processTrainerData(polishedData, 'polished');
  await processTrainerData(faithfulData, 'faithful');

  console.log('Trainer data extraction completed');
};

/**
 * Process trainer data for a specific version
 */
const processTrainerData = async (trainerData: string[], version: string) => {
  let currentTrainer: TrainerData | null = null;
  let currentPokemon: TrainerData['teams'][0]['pokemon'][0] | null = null;
  let currentAbility: string | null = null;
  let currentGender: string | null = null;
  let currentItem: string | null = null;
  let currentTeam: TrainerData['teams'][0] | null = null;

  for (let i = 0; i < trainerData.length; i++) {
    const line = trainerData[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith(';')) continue;

    // Trainer definition
    if (line.includes('Trainer')) {
      // Save previous trainer if exists
      if (currentTrainer && currentTeam) {
        if (currentPokemon) {
          // Add the last Pokemon to the current team
          currentTeam.pokemon.push(currentPokemon);
          currentPokemon = null;
        }
        currentTrainer.teams.push(currentTeam);

        // Store trainer
        const key = `${currentTrainer.class}_${currentTrainer.name}`;
        if (!trainers[version][key]) {
          trainers[version][key] = [];
        }
        trainers[version][key].push(currentTrainer);
      }

      // Parse trainer name and class
      const parts = line.split(/\s+/);
      const trainerName = parts[0].replace('Trainer', '');
      const [className, name] = trainerName.split(/(?=[A-Z][a-z])/);

      const trainerId = normalizeString(`${className || ''}_${name || trainerName}`);
      currentTrainer = {
        id: trainerId,
        name: normalizeString(name || trainerName),
        constantName: `${className || ''}${name || trainerName}`.toUpperCase(),
        class: normalizeString(className || ''),
        teams: [],
      };
      currentTeam = {
        matchCount: 0,
        pokemon: [],
      };
    }

    // Pokemon definition
    else if (line.includes('db') && currentTrainer && currentTeam) {
      // Save previous Pokemon if exists
      if (currentPokemon) {
        // Generate moves if empty
        if (!currentPokemon.moves || currentPokemon.moves.length === 0) {
          currentPokemon.moves = await generateMovesetForPokemon(
            currentPokemon.pokemonName,
            currentPokemon.level,
          );
        }
        currentTeam.pokemon.push(currentPokemon);
      }

      // Parse new Pokemon
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const level = parseInt(parts[0].replace('db', '').trim());
        const pokemonName = normalizeString(parts[1]);

        currentPokemon = {
          pokemonName: pokemonName,
          level: level,
          gender: currentGender || undefined,
          ability: currentAbility || undefined,
          item: currentItem || undefined,
          moves: [],
        };

        // Reset temporary values
        currentGender = null;
        currentAbility = null;
        currentItem = null;
      }
    }

    // Ability
    else if (line.includes('ability') && currentPokemon) {
      currentAbility = normalizeString(line.split('ability')[1].trim());
    }

    // Gender
    else if (line.includes('gender') && currentPokemon) {
      currentGender = line.split('gender')[1].trim().toLowerCase();
    }

    // Item
    else if (line.includes('item') && currentPokemon) {
      currentItem = normalizeString(line.split('item')[1].trim());
    }

    // Moves
    else if (line.includes('move') && currentPokemon) {
      const moveName = normalizeString(line.split('move')[1].trim());
      if (!currentPokemon.moves) currentPokemon.moves = [];
      currentPokemon.moves.push(moveName);
    }
  }

  // Save final trainer
  if (currentTrainer && currentTeam) {
    if (currentPokemon) {
      // Generate moves if empty
      if (!currentPokemon.moves || currentPokemon.moves.length === 0) {
        currentPokemon.moves = await generateMovesetForPokemon(
          currentPokemon.pokemonName,
          currentPokemon.level,
        );
      }
      currentTeam.pokemon.push(currentPokemon);
    }
    currentTrainer.teams.push(currentTeam);

    const key = `${currentTrainer.class}_${currentTrainer.name}`;
    if (!trainers[version][key]) {
      trainers[version][key] = [];
    }
    trainers[version][key].push(currentTrainer);
  }
};

/**
 * Generate the most recent 4 moves that a Pokemon can learn at a given level
 */
const generateMovesetForPokemon = async (pokemonName: string, level: number): Promise<string[]> => {
  try {
    // Read Pokemon data to get movesets
    const pokemonDataPath = join(outputDir, 'pokemon', `${pokemonName}.json`);
    const pokemonData = JSON.parse(await readFile(pokemonDataPath, 'utf-8'));

    // Get all moves the Pokemon can learn up to the given level
    const availableMoves: Array<{ move: string; level: number }> = [];

    // Add level-up moves
    if (pokemonData.moves?.levelUp) {
      for (const [moveLevel, moves] of Object.entries(pokemonData.moves.levelUp)) {
        const moveNum = parseInt(moveLevel);
        if (moveNum <= level && Array.isArray(moves)) {
          moves.forEach((move: string) => {
            availableMoves.push({ move: normalizeString(move), level: moveNum });
          });
        }
      }
    }

    // Sort by level (newest first) and take the most recent 4
    availableMoves.sort((a, b) => b.level - a.level);
    return availableMoves.slice(0, 4).map((m) => m.move);
  } catch (error) {
    console.warn(`Could not generate moveset for ${pokemonName}:`, error);
    // Return some default moves if we can't load Pokemon data
    return ['tackle', 'growl', 'scratch', 'leer'];
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
    for (const [trainerKey, trainerList] of Object.entries(trainers[version])) {
      if (!consolidatedTrainers[trainerKey]) {
        consolidatedTrainers[trainerKey] = {
          id: trainerKey,
          class: trainerList[0].class,
          name: trainerList[0].name,
          constantName: trainerList[0].constantName,
          versions: {},
        };
      }
      consolidatedTrainers[trainerKey].versions[version] = {
        teams: trainerList[0].teams,
      };
    }
  }

  // Save individual trainer files
  for (const [trainerKey, trainerData] of Object.entries(consolidatedTrainers)) {
    const filePath = join(trainerDir, `${trainerKey}.json`);
    await writeFile(filePath, JSON.stringify(trainerData, null, 2));
  }

  // Save trainer manifest
  const trainerManifestPath = join(outputDir, 'trainer_manifest.json');
  await writeFile(trainerManifestPath, JSON.stringify(consolidatedTrainers, null, 2));

  // Save trainer-location mapping
  const trainerLocationsPath = join(outputDir, 'trainer_locations.json');
  await writeFile(trainerLocationsPath, JSON.stringify(locationTrainerNames, null, 2));

  console.log(`Saved ${Object.keys(consolidatedTrainers).length} trainers`);
  console.log(`Saved trainer locations for ${Object.keys(locationTrainerNames).length} maps`);
};

/**
 * Main extraction function
 */
export default async function extractTrainers() {
  try {
    await Promise.all([extractTrainerData(), extractTrainerLocations()]);

    await saveTrainerData();

    console.log('Trainer extraction completed successfully');
  } catch (error) {
    console.error('Error during trainer extraction:', error);
    throw error;
  }
}

// Export trainer location data for use in extract-locations.ts
export const getTrainerLocationData = () => locationTrainerNames;
