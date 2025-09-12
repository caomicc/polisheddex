import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseMoveDescription, reduce } from '@/lib/extract-utils';
import splitFile from '@/lib/split';
import { MoveData, MovesManifest, MoveStats } from '@/types/new';

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

  // Use polished as the master list (should be the same anyway)
  return polishedNames;
};
const extractDescriptionsFromData = (data: string[]) => {
  const descriptions: Record<string, string> = {};
  let currentLabels: string[] = [];
  let buffer: string[] = [];

  for (const line of data) {
    const trimmedLine = line.trim();

    // Find description labels (e.g., "MoveNameDescription:")
    if (trimmedLine.endsWith('Description:')) {
      // If we already have labels but no description text yet, add this label to the group
      if (currentLabels.length > 0 && buffer.length === 0) {
        currentLabels.push(trimmedLine.replace('Description:', ''));
      } else {
        // Save previous description if exists
        if (currentLabels.length && buffer.length) {
          const description = parseMoveDescription(buffer.join(' '));
          for (const label of currentLabels) {
            const moveId = reduce(label);
            descriptions[moveId] = description;
          }
        }

        // Start new label group
        currentLabels = [trimmedLine.replace('Description:', '')];
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

// Extract move descriptions for both versions
const extractMoveDescriptions = async () => {
  const raw = await readFile(moveDescriptionsASM, 'utf-8');
  const [polishedData, faithfulData] = splitFile(raw, false);

  const polishedDescriptions = extractDescriptionsFromData(polishedData);
  const faithfulDescriptions = extractDescriptionsFromData(faithfulData);

  console.log(
    `Extracted ${Object.keys(polishedDescriptions).length} polished descriptions, ${Object.keys(faithfulDescriptions).length} faithful descriptions`,
  );

  // Use polished descriptions as primary (descriptions should be the same)
  return polishedDescriptions;
};

// Extract move stats for both versions
const extractMoveStats = async () => {
  const raw = await readFile(moveStatsASM, 'utf-8');
  const [polishedStatData, faithfulStatData] = splitFile(raw, false);

  const extractStatsFromData = (data: string[]) => {
    const stats: Record<string, MoveStats> = {};

    for (const line of data) {
      const trimmedLine = line.trim();

      // Look for move definitions: move MOVE_NAME, EFFECT, POWER, TYPE, ACCURACY, PP, EFFECT_CHANCE, CATEGORY
      if (trimmedLine.startsWith('move ')) {
        const parts = trimmedLine.split(/\s*,\s*/);
        if (parts.length >= 8) {
          // Extract move name (first part after 'move ')
          const moveNamePart = parts[0].replace('move ', '').trim();
          const moveId = reduce(moveNamePart);

          // Parse the stats
          const power = parseInt(parts[2].trim()) || 0;
          const type = reduce(parts[3].trim());
          const accuracy = parts[4].trim() === '-1' ? 100 : parseInt(parts[4].trim()) || 100;
          const pp = parseInt(parts[5].trim()) || 0;
          const effectChance = parseInt(parts[6].trim()) || 0;
          const category = parts[7].trim();

          stats[moveId] = {
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

  const polishedStats = extractStatsFromData(polishedStatData as string[]);
  const faithfulStats = extractStatsFromData(faithfulStatData as string[]);

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

// Main extraction
const extractMovesData = async () => {
  console.log('Starting move extraction...');

  const [moveNames, descriptions, moveStats, tmhmInfo] = await Promise.all([
    extractMoveNames(),
    extractMoveDescriptions(),
    extractMoveStats(),
    extractTMHMInfo(),
  ]);

  // Process each move
  for (const moveName of moveNames) {
    const moveId = reduce(moveName);
    const stats = moveStats[moveId] || {};

    // Use polished stats as default, fall back to faithful
    moves.push({
      id: moveId,
      name: moveName,
      description: descriptions[moveId] || 'No description available.',
      versions: {
        ...(stats.faithful && { faithful: stats.faithful }),
        ...(stats.polished && { polished: stats.polished }),
      },
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
    const primaryVersion = move.versions.polished || move.versions.faithful;

    return {
      id: move.id,
      name: move.name,
      type: primaryVersion?.type || 'None',
      category: primaryVersion?.category || 'Unknown',
      description: move.description,
      hasTM: !!move.tm,
    };
  });

  // Sort manifest alphabetically
  movesManifest.sort((a, b) => a.name.localeCompare(b.name));

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
