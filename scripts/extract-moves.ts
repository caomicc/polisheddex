import { readFile, writeFile, mkdir, rm, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { displayName, parseMoveDescription, reduce, toTitleCase } from '@/lib/extract-utils';
import splitFile from '@/lib/split';
import {
  ComprehensivePokemonData,
  MoveData,
  MoveLearner,
  MovesManifest,
  MoveStats,
} from '@/types/new';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const moves: MoveData[] = [];

// File paths
const moveNamesASM = join(__dirname, '../polishedcrystal/data/moves/names.asm');
const moveDescriptionsASM = join(__dirname, '../polishedcrystal/data/moves/descriptions.asm');
const moveStatsASM = join(__dirname, '../polishedcrystal/data/moves/moves.asm');
const tmhmMovesASM = join(__dirname, '../polishedcrystal/data/moves/tmhm_moves.asm');

// Extract move names for both versions
const extractMoveNames = async () => {
  const raw = await readFile(moveNamesASM, 'utf-8');
  const [polishedData, faithfulData] = splitFile(raw, false);

  const extractNamesFromData = (data: string[]) => {
    const moveNames: string[] = [];
    for (const line of data) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('li "')) {
        const name = trimmedLine.match(/li "(.+?)"/)?.[1];
        if (name) {
          moveNames.push(name);
        }
      }
    }
    return moveNames;
  };

  const polishedNames = extractNamesFromData(polishedData as string[]);
  const faithfulNames = extractNamesFromData(faithfulData as string[]);

  console.log(
    `Extracted ${polishedNames.length} polished move names, ${faithfulNames.length} faithful move names`,
  );

  // Use faithful names as primary for root data. Rock smash and Brick Break are the same move however have different names.
  // We'll use faithful names but replace Brick Break with Rock Smash to avoid duplication as pokemon learn "ROCK_SMASH".
  return faithfulNames;
};
const extractDescriptionsFromData = (data: string[]) => {
  const descriptions: Record<string, string> = {};
  let currentLabels: string[] = [];
  let buffer: string[] = [];

  for (const line of data) {
    const trimmedLine = line.trim();
    // console.log('Processing line:', trimmedLine);

    // Find description labels (e.g., "MoveNameDescription:")
    if (trimmedLine.endsWith('Description:')) {
      // console.log('Found description label line:', trimmedLine);
      // If we already have labels but no description text yet, add this label to the group
      if (currentLabels.length > 0 && buffer.length === 0) {
        currentLabels.push(trimmedLine.replace('Description:', ''));
      } else {
        // Save previous description if exists
        if (currentLabels.length && buffer.length) {
          const description = parseMoveDescription(buffer.join(' '));
          for (const label of currentLabels) {
            console.log('Parsed description for', label, ':', description);
            const moveId = reduce(label);
            descriptions[moveId] = description;
          }
        }

        // Start new label group
        currentLabels = [trimmedLine.replace('Description:', '')];
        // console.log('Found new description label:', currentLabels);
        buffer = [];
      }
    }
    // Collect description text
    else if (trimmedLine.startsWith('text "') || trimmedLine.startsWith('next "')) {
      let text = trimmedLine.replace(/^(text|next)\s*"/, '').replace(/"$/, '');

      // Handle @ terminator
      if (text.endsWith('@')) {
        text = text.replace('@', '').trim();
        if (text) buffer.push(text);

        // Save description
        if (currentLabels.length) {
          const description = parseMoveDescription(buffer.join(' '));
          for (const label of currentLabels) {
            const moveId = reduce(label);
            descriptions[moveId] = description;
          }
        }

        currentLabels = [];
        buffer = [];
      } else {
        if (text) buffer.push(text);
      }
    } else if (trimmedLine === 'done') {
      // Save description
      if (currentLabels.length && buffer.length) {
        const description = parseMoveDescription(buffer.join(' '));
        for (const label of currentLabels) {
          const moveId = reduce(label);
          descriptions[moveId] = description;
        }
      }

      currentLabels = [];
      buffer = [];
    }
  }

  // Handle last description
  if (currentLabels.length && buffer.length) {
    const description = buffer.join(' ').trim();
    for (const label of currentLabels) {
      const moveId = reduce(label);
      descriptions[moveId] = description;
    }
  }

  return descriptions;
};

// // Extract move descriptions for both versions
// const extractMoveDescriptions = async () => {
//   const raw = await readFile(moveDescriptionsASM, 'utf-8');
//   const [polishedData, faithfulData] = splitFile(raw, false);

//   const polishedDescriptions = extractDescriptionsFromData(polishedData);
//   const faithfulDescriptions = extractDescriptionsFromData(faithfulData);

//   console.log(
//     `Extracted ${Object.keys(polishedDescriptions).length} polished descriptions, ${Object.keys(faithfulDescriptions).length} faithful descriptions`,
//   );

//   // Use polished descriptions as primary (descriptions should be the same)
//   return polishedDescriptions;
// };

// Extract move stats for both versions
const extractMoveData = async () => {
  const statsFile = await readFile(moveStatsASM, 'utf-8');
  const descriptionFile = await readFile(moveDescriptionsASM, 'utf-8');
  const [polishedStatData, faithfulStatData] = splitFile(statsFile, false);
  const [polishedDescData, faithfulDescData] = splitFile(descriptionFile, false);

  const extractStatsFromData = (data: string[]) => {
    const stats: Record<string, MoveStats> = {};

    for (const line of data) {
      const trimmedLine = line.trim();

      // Look for move definitions: move MOVE_NAME, EFFECT, POWER, TYPE, ACCURACY, PP, EFFECT_CHANCE, CATEGORY
      if (trimmedLine.startsWith('move ')) {
        const parts = trimmedLine.split(/\s*,\s*/);
        if (parts.length >= 8) {
          // Extract move name (first part after 'move ')
          let moveNamePart = parts[0].replace('move ', '').trim();

          // fake brick break
          if (
            moveNamePart.toLowerCase().includes('brick_break') ||
            moveNamePart.toLowerCase().includes('rock_smash')
          ) {
            moveNamePart = 'rock_smash';
          }

          const moveId = reduce(moveNamePart);

          // Parse the stats
          const power = parseInt(parts[2].trim()) || 0;
          const type = reduce(parts[3].trim());
          const accuracy = parts[4].trim() === '-1' ? 100 : parseInt(parts[4].trim()) || 100;
          const pp = parseInt(parts[5].trim()) || 0;
          const effectChance = parseInt(parts[6].trim()) || 0;
          const category = parts[7].trim();

          stats[moveId] = {
            name: displayName(parts[0].replace('move ', '')),
            description: '',
            power,
            type: reduce(type),
            accuracy,
            pp,
            effectChance,
            category: reduce(category),
          };
        }
      }
    }

    return stats;
  };

  const polishedDescriptions = extractDescriptionsFromData(polishedDescData);
  const faithfulDescriptions = extractDescriptionsFromData(faithfulDescData);

  const polishedStats = extractStatsFromData(polishedStatData);
  const faithfulStats = extractStatsFromData(faithfulStatData);

  // Add descriptions to the stats objects
  for (const moveId of Object.keys(polishedStats)) {
    if (polishedDescriptions[moveId]) {
      polishedStats[moveId].description = polishedDescriptions[moveId];
    }
  }

  for (const moveId of Object.keys(faithfulStats)) {
    if (faithfulDescriptions[moveId]) {
      faithfulStats[moveId].description = faithfulDescriptions[moveId];
    }
  }

  console.log(
    `Extracted stats for ${Object.keys(polishedStats).length} polished moves, ${Object.keys(faithfulStats).length} faithful moves`,
  );

  // Combine stats by move ID, including both versions when they differ
  const combinedStats: Record<
    string,
    {
      polished?: MoveStats;
      faithful?: MoveStats;
    }
  > = {};

  // Get all unique move IDs from both versions
  const allMoveIds = new Set([...Object.keys(polishedStats), ...Object.keys(faithfulStats)]);

  for (const moveId of allMoveIds) {
    const polished = polishedStats[moveId];
    const faithful = faithfulStats[moveId];

    combinedStats[moveId] = {};

    if (polished) {
      combinedStats[moveId].polished = polished;
    }

    if (faithful) {
      combinedStats[moveId].faithful = faithful;
    }
  }

  return combinedStats;
};

// Extract TM/HM information
const extractTMHMInfo = async () => {
  const raw = await readFile(tmhmMovesASM, 'utf-8');
  const tmhmFiles = splitFile(raw, false);
  // Use polished version for TM/HM info since it should be the same for both versions
  const tmhmData = tmhmFiles[0] as string[];

  const tmhmInfo: Record<string, { number: string; location?: string }> = {};

  for (const line of tmhmData) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('db ')) {
      const parts = trimmedLine.split(';');
      if (parts.length > 1) {
        const moveName = parts[0].replace('db ', '').trim();
        const moveId = reduce(moveName);
        const commentPart = parts[1].trim();

        // Extract TM/HM number and location
        const tmMatch = commentPart.match(/(TM|HM)(\d+)/);
        if (tmMatch) {
          const tmNumber = `${tmMatch[1]}${tmMatch[2].padStart(2, '0')}`;
          const locationMatch = commentPart.match(/\(([^)]+)\)/);

          tmhmInfo[moveId] = {
            number: reduce(tmNumber),
            location: locationMatch ? reduce(locationMatch[1]) : undefined,
          };
        }
      }
    }
  }

  console.log(`Extracted TM/HM info for ${Object.keys(tmhmInfo).length} moves`);
  return tmhmInfo;
};

// Extract Pokemon that can learn each move
const extractPokemonLearners = async () => {
  const pokemonDir = join(__dirname, '..', 'new', 'pokemon');
  const moveLearners: Record<string, Record<string, Record<string, MoveLearner>>> = {
    polished: {},
    faithful: {},
  };

  try {
    const pokemonFiles = await readdir(pokemonDir);

    for (const pokemonFile of pokemonFiles) {
      if (!pokemonFile.endsWith('.json')) continue;

      const pokemonPath = join(pokemonDir, pokemonFile);
      const pokemonRaw = await readFile(pokemonPath, 'utf-8');
      const pokemonData: ComprehensivePokemonData = JSON.parse(pokemonRaw);

      // Process both versions
      for (const version of ['polished', 'faithful'] as const) {
        const versionData = pokemonData.versions?.[version];
        if (!versionData) continue;

        // Process all forms of this Pokemon
        const forms = versionData.forms || {};
        for (const [formName, formData] of Object.entries(forms)) {
          const movesets = formData?.movesets;
          if (!movesets) continue;

          // Process level-up moves
          if (movesets.levelUp && Array.isArray(movesets.levelUp)) {
            for (const move of movesets.levelUp) {
              if (!move || !move.name) continue; // Skip invalid moves

              const moveId = move.name;
              if (!moveLearners[version][moveId]) {
                moveLearners[version][moveId] = {};
              }

              const learnerKey = `${pokemonData.id}_${formName || 'plain'}`;
              if (!moveLearners[version][moveId][learnerKey]) {
                moveLearners[version][moveId][learnerKey] = {
                  id: pokemonData.id,
                  name: pokemonData.name,
                  form: formName || 'plain',
                  types: formData?.types || [],
                  methods: [],
                };
              }

              moveLearners[version][moveId][learnerKey].methods.push({
                method: 'levelUp',
                level: move.level || 1,
              });
            }
          } else if (movesets.levelUp) {
            console.warn(
              `Invalid levelUp movesets for ${pokemonData.name}: not an array`,
              typeof movesets.levelUp,
            );
          }

          // Process TM moves
          if (movesets.tm && Array.isArray(movesets.tm)) {
            for (const tmMove of movesets.tm) {
              // TM moves are stored as strings
              const moveId = tmMove;
              if (!moveId) continue; // Skip invalid moves

              if (!moveLearners[version][moveId]) {
                moveLearners[version][moveId] = {};
              }

              const learnerKey = `${pokemonData.id}_${formName || 'plain'}`;
              if (!moveLearners[version][moveId][learnerKey]) {
                moveLearners[version][moveId][learnerKey] = {
                  id: pokemonData.id,
                  name: pokemonData.name,
                  form: formName || 'plain',
                  types: formData?.types || [],
                  methods: [],
                };
              }

              moveLearners[version][moveId][learnerKey].methods.push({
                method: 'tm',
              });
            }
          }

          // Process egg moves
          if (movesets.eggMoves && Array.isArray(movesets.eggMoves)) {
            for (const eggMove of movesets.eggMoves) {
              // Egg moves are stored as strings
              const moveId = eggMove;
              if (!moveId) continue; // Skip invalid moves

              if (!moveLearners[version][moveId]) {
                moveLearners[version][moveId] = {};
              }

              const learnerKey = `${pokemonData.id}_${formName || 'plain'}`;
              if (!moveLearners[version][moveId][learnerKey]) {
                moveLearners[version][moveId][learnerKey] = {
                  id: pokemonData.id,
                  name: pokemonData.name,
                  form: formName || 'plain',
                  types: formData?.types || [],
                  methods: [],
                };
              }

              moveLearners[version][moveId][learnerKey].methods.push({
                method: 'eggMove',
              });
            }
          }
        }
      }
    }

    console.log(`Extracted Pokemon learners for moves from ${pokemonFiles.length} Pokemon files`);
    return moveLearners;
  } catch (error) {
    console.warn('Could not extract Pokemon learners:', error);
    return { polished: {}, faithful: {} };
  }
}; // Main extraction
const extractMovesData = async () => {
  console.log('Starting move extraction...');

  const [moveNames, moveStats, tmhmInfo, pokemonLearners] = await Promise.all([
    extractMoveNames(),
    // extractMoveDescriptions(),
    extractMoveData(),
    extractTMHMInfo(),
    extractPokemonLearners(),
  ]);

  // Process each move
  for (const moveName of moveNames) {
    const moveId = reduce(moveName);
    const stats = moveStats[moveId] || {};

    // Get Pokemon learners for this move
    const learnersData: Record<
      string,
      Array<{
        id: string;
        methods: Array<{ method: 'levelUp' | 'tm' | 'eggMove'; level?: number }>;
      }>
    > = {};

    for (const version of ['polished', 'faithful'] as const) {
      const versionLearners = pokemonLearners[version][moveId];
      if (versionLearners) {
        learnersData[version] = Object.entries(versionLearners).map(([, data]) => ({
          id: data.id,
          name: data.name,
          form: data.form,
          methods: data.methods,
          types: data.types,
        }));
      }
    }

    // Build versions object with TM and learners data included in each version
    const versions: Record<
      string,
      MoveStats & {
        tm?: { number: string; location?: string };
        learners?: MoveLearner[];
      }
    > = {};

    if (stats.faithful) {
      versions.faithful = {
        ...stats.faithful,
        ...(learnersData.faithful && { learners: learnersData.faithful }),
      };
    }

    if (stats.polished) {
      versions.polished = {
        ...stats.polished,
        ...(learnersData.polished && { learners: learnersData.polished }),
      };
    }

    moves.push({
      id: moveId,
      name: moveName,
      versions,
      ...(tmhmInfo[moveId] && { tm: tmhmInfo[moveId] }),
    });
  }

  console.log(`Processed ${moves.length} moves`);
};

// Main execution function for export
export default async function extractMoves() {
  await extractMovesData();

  // Create output directories
  const outputDir = join(__dirname, '..', 'new');
  const movesDir = join(outputDir, 'moves');
  const movesManifestPath = join(outputDir, 'moves_manifest.json');

  // Clear and recreate moves directory and delete manifest
  try {
    await rm(movesDir, { recursive: true, force: true });
    await rm(movesManifestPath, { force: true });
    await mkdir(movesDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    console.log('Cleared moves directory and deleted moves manifest');
  } catch (error) {
    if (error) {
      throw error;
    }
  }

  // Write individual move files
  await Promise.all(
    moves.map(async (move) => {
      const movePath = join(movesDir, `${move.id}.json`);
      await writeFile(movePath, JSON.stringify(move, null, 2), 'utf-8');
    }),
  );

  // Create moves manifest
  const movesManifest: MovesManifest[] = moves.map((move) => {
    // Use polished version for manifest, fall back to faithful
    // const primaryVersion = move.versions.polished || move.versions.faithful;
    return {
      id: move.id,
      versions:
        Object.fromEntries(
          Object.entries(move.versions).map(([versionName, stats]) => [
            versionName,
            {
              name: toTitleCase(stats.name || move.name || 'Unknown'),
              type: stats.type || 'None',
              power: stats.power || 0,
              accuracy: stats.accuracy || 100,
              pp: stats.pp || 0,
              effectChance: stats.effectChance || 0,
              category: stats.category || 'Unknown',
              description: stats.description || '',
            },
          ]),
        ) || {},
      tm: move.tm ? { ...move.tm } : undefined,
    };
  });

  // Sort manifest alphabetically by id
  movesManifest.sort((a, b) => a.id.localeCompare(b.id));

  // Write moves manifest file
  await writeFile(movesManifestPath, JSON.stringify(movesManifest, null, 2), 'utf-8');

  console.log('✅ Moves extraction completed successfully!');
  console.log(`   • ${moves.length} moves extracted`);
  console.log(`   • Individual files written to ${movesDir}`);
  console.log(`   • Manifest with ${movesManifest.length} moves written to ${movesManifestPath}`);
}

// Allow running this script directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  extractMoves();
}
