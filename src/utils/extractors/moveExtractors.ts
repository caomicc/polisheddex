import fs from 'node:fs';
import path from 'node:path';
import { normalizeMoveKey, toCapitalCaseWithSpaces, deepReplaceMonString } from '../stringUtils.ts';
import { sharedDescriptionGroups } from '../../data/constants.ts';
import type { MoveDescription } from '../../types/types.ts';
import { extractFormInfo } from './formExtractors.ts';
import { normalizeMoveString } from '../stringNormalizer/index.ts';
import { normalizePokemonUrlKey } from '../pokemonUrlNormalizer.ts';
import { fileURLToPath } from 'node:url';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EGG_MOVES_OUTPUT = path.join(__dirname, '../../../output/pokemon_egg_moves.json');
const MOVE_DESCRIPTIONS_OUTPUT = path.join(
  __dirname,
  '../../../output/pokemon_move_descriptions.json',
);
const TM_HM_LEARNSET_PATH = path.join(__dirname, '../../../output/pokemon_tm_hm_learnset.json');
const ITEMS_DATA_PATH = path.join(__dirname, '../../../output/items_data.json');

// Helper function to get TM/HM information for a move
function getTmHmInfo(moveName: string): { tmNumber?: string; location?: any } | null {
  try {
    const itemsData = JSON.parse(fs.readFileSync(ITEMS_DATA_PATH, 'utf8'));

    // Normalize the move name for comparison
    const normalizedMoveName = moveName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Search through TM/HM items
    for (const item of Object.values(itemsData) as any[]) {
      if (item.tmNumber && item.moveName) {
        const normalizedItemMoveName = item.moveName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedItemMoveName === normalizedMoveName) {
          return {
            tmNumber: item.tmNumber,
            location: item.location,
          };
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load items data:', error);
  }

  return null;
}

export function extractMoveDescriptions() {
  const moveNamesPath = path.join(__dirname, '../../../polishedcrystal/data/moves/names.asm');
  const moveDescriptionsPath = path.join(
    __dirname,
    '../../../polishedcrystal/data/moves/descriptions.asm',
  );
  const moveStatsPath = path.join(__dirname, '../../../polishedcrystal/data/moves/moves.asm');

  const namesData = fs.readFileSync(moveNamesPath, 'utf8');
  const descData = fs.readFileSync(moveDescriptionsPath, 'utf8');
  const statsData = fs.readFileSync(moveStatsPath, 'utf8');

  // Parse move names (order matters)
  const nameLines = namesData.split(/\r?\n/).filter((l) => l.trim().startsWith('li '));
  const moveNames = nameLines.map((l) => l.match(/li "(.+?)"/)?.[1] || '').filter(Boolean);

  // Parse descriptions by label name
  const descLines = descData.split(/\r?\n/);
  console.log('Parsing move descriptions...');
  const descMap: Record<string, string> = {};
  let currentLabels: string[] = [];
  let collecting = false;
  let buffer: string[] = [];

  for (const line of descLines) {
    const labelMatch = line.match(/^([A-Za-z0-9_]+)Description:$/);
    if (labelMatch) {
      // Check if this is the start of a new group or continuation of current group
      if (line.trim().includes('text ') || buffer.length > 0) {
        // This line has both label and text, or we already have text buffer
        // Save previous group if it exists
        if (currentLabels.length && buffer.length) {
          const description = buffer.join(' ').trim();
          for (const label of currentLabels) {
            // Try multiple normalization approaches for this label
            const labelVariations = [
              label, // Original label
              label.replace(/([a-z])([A-Z])/g, '$1 $2'), // Add spaces before capitals
              label.replace(/([a-z])([A-Z])/g, '$1_$2'), // Add underscores before capitals
            ];

            for (const variation of labelVariations) {
              const normalizedKey = normalizeMoveKey(variation);
              descMap[normalizedKey] = description;
              console.log(
                `Mapped description for "${variation}" -> "${normalizedKey}": ${description.substring(0, 50)}...`,
              );
            }
          }
        }
        // Start new label group
        currentLabels = [labelMatch[1]];
        buffer = [];
        collecting = false;
      } else {
        // This is just a label line, add to current group
        if (currentLabels.length === 0) {
          // First label in a new group
          currentLabels = [labelMatch[1]];
        } else {
          // Additional label in current group
          currentLabels.push(labelMatch[1]);
        }
        console.log(`Added label to group: ${labelMatch[1]} (total: ${currentLabels.length})`);
      }
    } else if (line.trim().startsWith('text ')) {
      collecting = true;
      let text = line.replace('text ', '').replace(/"/g, '').replace(/\t/g, '');
      buffer.push(text);
    } else if (line.trim().startsWith('next ')) {
      let text = line.replace('next ', '').replace(/"/g, '').replace(/\t/g, '');
      // Check if previous line ended with hyphen for continuation
      if (buffer.length > 0 && buffer[buffer.length - 1].endsWith('-')) {
        // Remove hyphen and concatenate without space
        buffer[buffer.length - 1] = buffer[buffer.length - 1].slice(0, -1) + text;
      } else {
        buffer.push(text);
      }
    } else if (line.trim() === 'done') {
      collecting = false;
    } else if (line.trim().startsWith('if ') && collecting) {
      // Handle conditional blocks - continue collecting
      continue;
    } else if (line.trim() === 'endc' && collecting) {
      // End of conditional block - continue collecting
      continue;
    } else if (collecting && line.trim()) {
      let text = line.trim().replace(/"/g, '').replace(/\t/g, '');
      if (text.startsWith('text ')) {
        text = text.replace('text ', '');
      } else if (text.startsWith('next ')) {
        text = text.replace('next ', '');
        // Check if previous line ended with hyphen for continuation
        if (buffer.length > 0 && buffer[buffer.length - 1].endsWith('-')) {
          // Remove hyphen and concatenate without space
          buffer[buffer.length - 1] = buffer[buffer.length - 1].slice(0, -1) + text;
          continue;
        }
      }
      buffer.push(text);
    }
  }

  // Handle last label group
  if (currentLabels.length && buffer.length) {
    const description = buffer.join(' ').trim();
    for (const label of currentLabels) {
      const labelVariations = [
        label,
        label.replace(/([a-z])([A-Z])/g, '$1 $2'),
        label.replace(/([a-z])([A-Z])/g, '$1_$2'),
      ];

      for (const variation of labelVariations) {
        const normalizedKey = normalizeMoveKey(variation);
        descMap[normalizedKey] = description;
        console.log(
          `Mapped description for "${variation}" -> "${normalizedKey}": ${description.substring(0, 50)}...`,
        );
      }
    }
  }

  console.log('descMapdescMapdescMap', JSON.stringify(descMap, null, 2)); // Log first 500 chars for brevity

  // Parse move stats
  const typeEnumToName: Record<string, string> = {
    NORMAL: 'Normal',
    FIGHTING: 'Fighting',
    FLYING: 'Flying',
    POISON: 'Poison',
    GROUND: 'Ground',
    ROCK: 'Rock',
    BUG: 'Bug',
    GHOST: 'Ghost',
    STEEL: 'Steel',
    FIRE: 'Fire',
    WATER: 'Water',
    GRASS: 'Grass',
    ELECTRIC: 'Electric',
    PSYCHIC: 'Psychic',
    ICE: 'Ice',
    DRAGON: 'Dragon',
    DARK: 'Dark',
    FAIRY: 'Fairy',
    SHADOW: 'Shadow',
    NONE: 'None',
    UNKNOWN_T: 'Unknown',
  };
  const categoryEnumToName: Record<string, string> = {
    PHYSICAL: 'Physical',
    SPECIAL: 'Special',
    STATUS: 'Status',
  };
  const statsLines = statsData.split(/\r?\n/);
  // Updated regex: capture accuracy (5th argument)
  // move NAME, EFFECT, POWER, TYPE, ACCURACY, PP, PRIORITY, CATEGORY
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moveStats: Record<
    string,
    {
      faithful?: { type: string; pp: number; power: number; category: string; accuracy: any };
      updated?: { type: string; pp: number; power: number; category: string; accuracy: any };
    }
  > = {};

  // Special mappings for moves that have different names in moves.asm vs names.asm
  const moveStatsMappings: Record<string, string> = {
    DOUBLESLAP: 'DOUBLE_SLAP',
    doubleslap: 'DOUBLE_SLAP',
    double_slap: 'DOUBLE_SLAP',
    PSYCHIC: 'PSYCHIC_M',
    psychic: 'PSYCHIC_M',
    psychic_m: 'PSYCHIC_M',
    'psychic m': 'PSYCHIC_M',
    WILL_O_WISP: 'WILL_O_WISP',
    will_o_wisp: 'WILL_O_WISP',
    willow_wisp: 'WILL_O_WISP',
    DRAININGKISS: 'DRAINING_KISS',
    drainingkiss: 'DRAINING_KISS',
    draining_kiss: 'DRAINING_KISS',
  };

  let inFaithfulBlock = false;
  let faithfulBlockBuffer: any = null;

  for (let i = 0; i < statsLines.length; i++) {
    const line = statsLines[i];

    // Check for conditional blocks
    if (line.match(/^\s*if DEF\(FAITHFUL\)/)) {
      inFaithfulBlock = true;
      continue;
    }

    if (line.match(/^\s*else/) && inFaithfulBlock) {
      // Switch to updated section
      inFaithfulBlock = false;
      continue;
    }

    if (line.match(/^\s*endc/) && inFaithfulBlock) {
      inFaithfulBlock = false;
      faithfulBlockBuffer = null;
      continue;
    }

    const match = line.match(
      /^\s*move\s+([A-Z0-9_]+),\s*[A-Z0-9_]+,\s*(-?\d+),\s*([A-Z_]+),\s*(-?\d+),\s*(\d+),\s*\d+,\s*([A-Z_]+)/,
    );

    if (match) {
      const move = match[1];
      const moveKey = normalizeMoveKey(move);
      const power = parseInt(match[2], 10);
      const type = typeEnumToName[match[3]] || 'None';
      const accuracy = parseInt(match[4], 10);
      const pp = parseInt(match[5], 10);
      const category = categoryEnumToName[match[6]] || 'Unknown';

      const moveData = { type, pp, power, category, accuracy };

      if (inFaithfulBlock === true) {
        // This is the faithful version
        if (!moveStats[moveKey]) moveStats[moveKey] = {};
        moveStats[moveKey].faithful = moveData;
        faithfulBlockBuffer = { moveKey, moveData };
      } else if (inFaithfulBlock === false) {
        // This is the updated version
        if (!moveStats[moveKey]) moveStats[moveKey] = {};
        moveStats[moveKey].updated = moveData;
      } else {
        // Regular move (same for both versions)
        if (!moveStats[moveKey]) moveStats[moveKey] = {};
        moveStats[moveKey].faithful = moveData;
        moveStats[moveKey].updated = moveData;
      }

      // Also store reverse mappings for special cases
      for (const [normalizedName, constantName] of Object.entries(moveStatsMappings)) {
        if (constantName === move) {
          if (!moveStats[normalizedName]) moveStats[normalizedName] = {};
          if (inFaithfulBlock === true) {
            moveStats[normalizedName].faithful = moveData;
          } else if (inFaithfulBlock === false) {
            moveStats[normalizedName].updated = moveData;
          } else {
            moveStats[normalizedName].faithful = moveData;
            moveStats[normalizedName].updated = moveData;
          }
          console.log(`Mapped move stats: ${normalizedName} -> ${move}`);
        }
      }

      // Special case: ensure PSYCHIC gets PSYCHIC_M stats
      if (move === 'PSYCHIC_M') {
        const psychicKey = 'psychic';
        if (!moveStats[psychicKey]) moveStats[psychicKey] = {};
        if (inFaithfulBlock === true) {
          moveStats[psychicKey].faithful = moveData;
        } else if (inFaithfulBlock === false) {
          moveStats[psychicKey].updated = moveData;
        } else {
          moveStats[psychicKey].faithful = moveData;
          moveStats[psychicKey].updated = moveData;
        }
        console.log(`Mapped PSYCHIC_M stats to psychic key`);
      }
    }
  }

  // Map move names to their description by label name
  const moveDescByName: Record<
    string,
    {
      description: string;
      faithful: {
        type: string;
        pp: number;
        power: number;
        category: string;
        accuracy: number;
      };
      updated: {
        type: string;
        pp: number;
        power: number;
        category: string;
        accuracy: number;
      };
    }
  > = {};

  // Define normalized groups for shared descriptions
  // Reverse lookup for quick group membership
  const moveToGroup: Record<string, string> = {};
  for (const [group, moves] of Object.entries(sharedDescriptionGroups)) {
    for (const move of moves) {
      moveToGroup[normalizeMoveKey(move)] = group;
    }
  }

  // Special case mappings for problematic move names
  const specialMappings: Record<string, string> = {
    psychic: 'psychicm', // Psychic move uses PsychicM description (no underscore in description file!)
    psychic_m: 'psychicm',
    'psychic m': 'psychicm',
    doubleslap: 'double_slap',
    double_slap: 'double_slap',
    will_o_wisp: 'will_o_wisp',
    willow_wisp: 'will_o_wisp',
    drainingkiss: 'drain_kiss',
    draining_kiss: 'drain_kiss',
    brick_break: 'rock_smash', // Brick Break uses RockSmash description in polished mode
    brickbreak: 'rock_smash',
  };

  // Add the Psychic description directly since it's shared with other moves
  const psychicDesc = 'An attack that may lower Sp.Def.';
  descMap['psychic'] = psychicDesc;
  descMap['PSYCHIC'] = psychicDesc;
  descMap['psychicm'] = psychicDesc;
  descMap['PSYCHICM'] = psychicDesc;
  descMap['psychic_m'] = psychicDesc;
  descMap['PSYCHIC_M'] = psychicDesc;

  for (let i = 0; i < moveNames.length; i++) {
    // Normalize the move name to match the keys in descMap and moveStats
    console.log('Processing move name:', moveNames[i]);
    const moveKey = normalizeMoveKey(moveNames[i]);

    // Try to find description using multiple approaches
    let desc = '';

    // 1. Direct lookup
    desc = descMap[moveKey] || '';

    // 2. Try special mappings
    if (!desc && specialMappings[moveKey]) {
      desc = descMap[specialMappings[moveKey]] || '';
    }

    // 3. Try variations of the move name
    if (!desc) {
      const variations = [
        moveKey.replace(/_/g, ''), // Remove underscores
        moveKey.replace(/\s/g, ''), // Remove spaces
        moveNames[i].replace(/\s/g, '').toLowerCase(), // Original without spaces
        moveNames[i].replace(/\s/g, '_').toLowerCase(), // Original with underscores
      ];

      for (const variation of variations) {
        const normalizedVariation = normalizeMoveKey(variation);
        if (descMap[normalizedVariation]) {
          desc = descMap[normalizedVariation];
          console.log(
            `Found description for "${moveKey}" using variation "${normalizedVariation}"`,
          );
          break;
        }
      }
    }

    console.log('Processing move:', moveKey, 'Description:', desc.substring(0, 50) + '...');
    // If not found, try to find a description from the normalized group
    if (!desc && moveToGroup[moveKey]) {
      const group = moveToGroup[moveKey];
      const groupMoves = sharedDescriptionGroups[group];
      for (const gMove of groupMoves) {
        const gMoveKey = normalizeMoveKey(gMove);
        if (descMap[gMoveKey]) {
          desc = descMap[gMoveKey];
          break;
        }
      }
    }
    const stats = moveStats[moveKey] || {
      faithful: { type: 'None', pp: 0, power: 0, category: 'Unknown', accuracy: 0 },
      updated: { type: 'None', pp: 0, power: 0, category: 'Unknown', accuracy: 0 },
    };

    let prettyName = toCapitalCaseWithSpaces(moveKey);

    // Special cases for move name formatting
    if (prettyName === 'Doubleslap') prettyName = 'Double Slap';
    if (prettyName === 'Willow Wisp') prettyName = 'Will O Wisp';
    if (prettyName === 'Drainingkiss') prettyName = 'Draining Kiss';

    // Apply string normalization to the description
    const normalizedDesc = typeof desc === 'string' ? (deepReplaceMonString(desc) as string) : desc;

    // Get TM/HM information for this move
    const tmHmInfo = getTmHmInfo(prettyName);

    moveDescByName[prettyName] = {
      description: normalizedDesc,
      faithful: {
        type: stats.faithful?.type || 'None',
        pp: stats.faithful?.pp || 0,
        power: stats.faithful?.power || 0,
        category: stats.faithful?.category || 'Unknown',
        accuracy: stats.faithful?.accuracy === -1 ? '--' : stats.faithful?.accuracy || 0,
      },
      updated: {
        type: stats.updated?.type || 'None',
        pp: stats.updated?.pp || 0,
        power: stats.updated?.power || 0,
        category: stats.updated?.category || 'Unknown',
        accuracy: stats.updated?.accuracy === -1 ? '--' : stats.updated?.accuracy || 0,
      },
      ...(tmHmInfo && {
        tm: {
          number: tmHmInfo.tmNumber,
          location: tmHmInfo.location,
        },
      }),
    };
  }

  // --- Ensure all moves in a shared group get the same description ---
  for (const groupMoves of Object.values(sharedDescriptionGroups)) {
    console.log('Processing shared group:', groupMoves);
    // Find the first move in the group that has a description
    let groupDesc = '';
    for (const gMove of groupMoves) {
      console.log('Checking group move:', gMove);
      const gMoveKey = normalizeMoveKey(gMove);
      console.log('ABC Checking group move:', gMoveKey);
      if (descMap[gMoveKey]) {
        groupDesc = descMap[gMoveKey];
        break;
      }
    }
    if (groupDesc) {
      // Apply string normalization to the group description
      const normalizedGroupDesc =
        typeof groupDesc === 'string' ? (deepReplaceMonString(groupDesc) as string) : groupDesc;

      for (const gMove of groupMoves) {
        const prettyName = toCapitalCaseWithSpaces(normalizeMoveKey(gMove));
        if (moveDescByName[prettyName] && !moveDescByName[prettyName].description) {
          moveDescByName[prettyName].description = normalizedGroupDesc;
        }
      }
    }
  }

  // Apply final normalization to all move descriptions before writing
  const normalizedMoveDescByName = deepReplaceMonString(moveDescByName);

  fs.writeFileSync(MOVE_DESCRIPTIONS_OUTPUT, JSON.stringify(normalizedMoveDescByName, null, 2));
  console.log('Move descriptions extracted to', MOVE_DESCRIPTIONS_OUTPUT);
}

export function extractEggMoves() {
  const eggMovesPath = path.join(__dirname, '../../../polishedcrystal/data/pokemon/egg_moves.asm');
  const eggMovePointersPath = path.join(
    __dirname,
    '../../../polishedcrystal/data/pokemon/egg_move_pointers.asm',
  );

  // Parse pointers: species => EggSpeciesMoves label
  const pointerData = fs.readFileSync(eggMovePointersPath, 'utf8');
  const pointerLines = pointerData.split(/\r?\n/);
  const speciesToPointer: Record<string, string> = {};
  for (const line of pointerLines) {
    const match = line.match(/^\s*dw ([A-Za-z0-9_]+)\s*;\s*(.+)$/);

    if (match) {
      const pointer = match[1];
      // Use only the first word before any parenthesis or extra info as the species name
      const species = match[2]
        .split('(')[0]
        .split(';')[0]
        .trim()
        .replace(/\s+\(.+\)/, '')
        .replace(/\s+$/, '');
      console.log(`DEBUG: extractEggMoves: match[2] for ${species}`, match[2]);

      speciesToPointer[species] = pointer;
    }
  }

  // Parse moves: pointer label => moves array
  const data = fs.readFileSync(eggMovesPath, 'utf8');
  const lines = data.split(/\r?\n/);
  const pointerToMoves: Record<string, string[]> = {};
  let currentPointer: string | null = null;
  for (const line of lines) {
    const labelMatch = line.match(/^([A-Za-z0-9_]+)EggSpeciesMoves:/);
    if (labelMatch) {
      currentPointer = labelMatch[1] + 'EggSpeciesMoves';
      pointerToMoves[currentPointer] = [];
      continue;
    }
    if (currentPointer && line.match(/^\s*db ([A-Z0-9_]+)/)) {
      const moveMatch = line.match(/^\s*db ([A-Z0-9_]+)/);
      if (moveMatch && moveMatch[1] !== '$ff') {
        pointerToMoves[currentPointer].push(toCapitalCaseWithSpaces(moveMatch[1]));
      }
    }
    if (currentPointer && line.includes('$ff')) {
      currentPointer = null;
    }
  }

  // Assign moves to each species using the pointer mapping
  const eggMoves: Record<string, string[]> = {};
  // eslint-disable-next-line prefer-const
  for (let [species, pointer] of Object.entries(speciesToPointer)) {
    // Use normalized URL key for consistency with other data files
    const normalizedSpecies = normalizePokemonUrlKey(species);
    eggMoves[normalizedSpecies] = pointerToMoves[pointer] || [];
  }

  console.log('DEBUG: Egg moves extracted:', eggMoves);

  fs.writeFileSync(EGG_MOVES_OUTPUT, JSON.stringify(eggMoves, null, 2));
  console.log('DEBUG: Egg moves extracted to', EGG_MOVES_OUTPUT);
}

export function extractTmHmLearnset() {
  const detailedStatsDir = path.join(__dirname, '../../../polishedcrystal/data/pokemon/base_stats');
  const detailedStatsFiles = fs.readdirSync(detailedStatsDir).filter((f) => f.endsWith('.asm'));

  // Parse pointers: species => EggSpeciesMoves label
  const tmHmLearnset: Record<string, MoveDescription[]> = {};

  // Load move descriptions
  let moveDescriptions: Record<string, MoveDescription> = {};
  if (fs.existsSync(MOVE_DESCRIPTIONS_OUTPUT)) {
    moveDescriptions = JSON.parse(fs.readFileSync(MOVE_DESCRIPTIONS_OUTPUT, 'utf8'));
  } else {
    console.warn('Move descriptions file not found. Move data will be incomplete.');
  }

  for (const file of detailedStatsFiles) {
    const fileName = file.replace('.asm', '');
    const { basePokemonName, formName } = extractFormInfo(fileName);

    // Use normalized URL key for consistency with other data files
    const normalizedBaseName = normalizePokemonUrlKey(basePokemonName);
    const pokemonName = formName
      ? `${normalizedBaseName}-${formName.toLowerCase()}`
      : normalizedBaseName;

    const content = fs.readFileSync(path.join(detailedStatsDir, file), 'utf8');
    const lines = content.split(/\r?\n/);

    // Find TM/HM learnset lines: tmhm TM_MOVE_1, TM_MOVE_2, ...
    const tmhmLine = lines.find((l) => l.trim().startsWith('tmhm '));
    if (tmhmLine) {
      const moves = tmhmLine
        .replace('tmhm ', '')
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m && m !== 'NO_MOVE')
        .map((m) => toCapitalCaseWithSpaces(m));

      tmHmLearnset[pokemonName] = moves.map((name) => {
        // Check if we have move description data for this move
        let moveData = moveDescriptions[name];

        // Special handling for PSYCHIC move - try alternate names if not found
        if (!moveData && name === 'Psychic') {
          moveData = moveDescriptions['Psychic M'] || moveDescriptions['Psychic_M'];
        }

        // Get TM/HM/MT information for this move
        const tmHmInfo = getTmHmInfo(name);

        if (moveData) {
          return {
            name,
            description: moveData.description || '',
            type: moveData.updated?.type || moveData.faithful?.type || '',
            pp: moveData.updated?.pp || moveData.faithful?.pp || 0,
            power: moveData.updated?.power || moveData.faithful?.power || 0,
            category: moveData.updated?.category || moveData.faithful?.category || 'unknown',
            accuracy: moveData.updated?.accuracy || moveData.faithful?.accuracy || 0,
            effectPercent: moveData.updated?.effectPercent || moveData.faithful?.effectPercent,
            ...(tmHmInfo && {
              tmNumber: tmHmInfo.tmNumber,
              location: tmHmInfo.location,
            }),
          };
        } else {
          return {
            name,
            description: '',
            type: 'unknown',
            pp: 0,
            power: 0,
            category: 'unknown',
            accuracy: 0,
            ...(tmHmInfo && {
              tmNumber: tmHmInfo.tmNumber,
              location: tmHmInfo.location,
            }),
          };
        }
      });
    }
  }

  fs.writeFileSync(TM_HM_LEARNSET_PATH, JSON.stringify(tmHmLearnset, null, 2));
  console.log('Learnset extracted to', TM_HM_LEARNSET_PATH);
  return tmHmLearnset;
}

// --- Normalize move names in level-up moves output before writing ---
const pokemonLevelMovesPath = path.join(__dirname, '../../output/pokemon_level_moves.json');
if (fs.existsSync(pokemonLevelMovesPath)) {
  const levelMovesData = JSON.parse(fs.readFileSync(pokemonLevelMovesPath, 'utf8'));
  for (const pokemon in levelMovesData) {
    if (Array.isArray(levelMovesData[pokemon].moves)) {
      for (const move of levelMovesData[pokemon].moves) {
        if (move.name) {
          move.name = normalizeMoveString(move.name);
        }
      }
    }
  }
  fs.writeFileSync(pokemonLevelMovesPath, JSON.stringify(levelMovesData, null, 2));
  console.log('Normalized move names in pokemon_level_moves.json');
}
