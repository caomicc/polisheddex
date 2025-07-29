import fs from 'node:fs';
import path from 'node:path';
import { normalizeMoveKey, toCapitalCaseWithSpaces } from '../stringUtils.ts';
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
    const labelMatch = line.match(/^([A-Za-z0-9_]+)Description:/);
    if (labelMatch) {
      // If we have a previous label group and collected text, save it
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
    } else if (line.match(/^([A-Za-z0-9_]+)Description:$/)) {
      // Additional labels on their own lines (part of the same group)
      const match = line.match(/^([A-Za-z0-9_]+)Description:$/);
      if (match) {
        currentLabels.push(match[1]);
        console.log(`Added label to group: ${match[1]} (total: ${currentLabels.length})`);
      }
    } else if (line.trim().startsWith('text ')) {
      collecting = true;
      buffer.push(line.replace('text ', '').replace(/"/g, ''));
    } else if (line.trim().startsWith('next ')) {
      buffer.push(line.replace('next ', '').replace(/"/g, ''));
    } else if (line.trim() === 'done') {
      collecting = false;
    } else if (collecting && line.trim()) {
      buffer.push(line.trim().replace(/"/g, ''));
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
    { type: string; pp: number; power: number; category: string; accuracy: any }
  > = {};

  // Special mappings for moves that have different names in moves.asm vs names.asm
  const moveStatsMappings: Record<string, string> = {
    DOUBLESLAP: 'DOUBLE_SLAP',
    doubleslap: 'DOUBLE_SLAP',
    double_slap: 'DOUBLE_SLAP',
    PSYCHIC: 'PSYCHIC_M',
    psychic: 'PSYCHIC_M',
    psychic_m: 'PSYCHIC_M',
    WILL_O_WISP: 'WILL_O_WISP',
    will_o_wisp: 'WILL_O_WISP',
    willow_wisp: 'WILL_O_WISP',
    DRAININGKISS: 'DRAINING_KISS',
    drainingkiss: 'DRAINING_KISS',
    draining_kiss: 'DRAINING_KISS',
  };

  for (const line of statsLines) {
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

      // Store both the original key and any mapped variations
      moveStats[moveKey] = { type, pp, power, category, accuracy };

      // Also store reverse mappings for special cases
      for (const [normalizedName, constantName] of Object.entries(moveStatsMappings)) {
        if (constantName === move) {
          moveStats[normalizedName] = { type, pp, power, category, accuracy };
          console.log(`Mapped move stats: ${normalizedName} -> ${move}`);
        }
      }
    }
  }

  // Map move names to their description by label name
  const moveDescByName: Record<
    string,
    {
      description: string;
      type: string;
      pp: number;
      power: number;
      category: string;
      accuracy: number;
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
    psychic: 'psychic_m', // Psychic move uses PsychicM description
    psychic_m: 'psychic_m',
    doubleslap: 'double_slap',
    double_slap: 'double_slap',
    will_o_wisp: 'will_o_wisp',
    willow_wisp: 'will_o_wisp',
    drainingkiss: 'draining_kiss',
    draining_kiss: 'draining_kiss',
  };

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
      type: 'None',
      pp: 0,
      power: 0,
      category: 'Unknown',
      accuracy: 0,
    };

    let prettyName = toCapitalCaseWithSpaces(moveKey);

    // Special cases for move name formatting
    if (prettyName === 'Doubleslap') prettyName = 'Double Slap';
    if (prettyName === 'Willow Wisp') prettyName = 'Will O Wisp';
    if (prettyName === 'Drainingkiss') prettyName = 'Draining Kiss';

    moveDescByName[prettyName] = {
      description: desc,
      type: stats.type,
      pp: stats.pp,
      power: stats.power,
      category: stats.category,
      accuracy: stats.accuracy === -1 ? '--' : stats.accuracy,
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
      for (const gMove of groupMoves) {
        const prettyName = toCapitalCaseWithSpaces(normalizeMoveKey(gMove));
        if (moveDescByName[prettyName] && !moveDescByName[prettyName].description) {
          moveDescByName[prettyName].description = groupDesc;
        }
      }
    }
  }
  fs.writeFileSync(MOVE_DESCRIPTIONS_OUTPUT, JSON.stringify(moveDescByName, null, 2));
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
        const moveData = moveDescriptions[name];
        if (moveData) {
          return {
            name,
            description: moveData.description || '',
            type: moveData.type || '',
            pp: moveData.pp || 0,
            power: moveData.power || 0,
            category: moveData.category || 'unknown',
            accuracy: moveData.accuracy || 0,
            effectPercent: moveData.effectPercent,
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
