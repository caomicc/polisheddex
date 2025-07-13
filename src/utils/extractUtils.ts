import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { convertEggGroupCode, convertGenderCode, convertGrowthRateCode, convertHatchCode, normalizeMonName, normalizeMoveKey, standardizePokemonKey, toCapitalCaseWithSpaces, toTitleCase } from './stringUtils.ts';
import type { Ability, DetailedStats, EncounterDetail, LocationEntry, PokemonDexEntry, PokemonLocationData, LocationAreaData, MoveDescription } from '../types/types.ts';


import { KNOWN_FORMS, sharedDescriptionGroups } from '../data/constants.ts';
import { normalizeMoveString } from './stringNormalizer/stringNormalizer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EGG_MOVES_OUTPUT = path.join(__dirname, '../../output/pokemon_egg_moves.json');
const POKEDEX_ENTRIES_OUTPUT = path.join(__dirname, '../../output/pokemon_pokedex_entries.json');
const MOVE_DESCRIPTIONS_OUTPUT = path.join(__dirname, '../../output/pokemon_move_descriptions.json');
const ABILITY_DESCRIPTIONS_OUTPUT = path.join(__dirname, '../../output/pokemon_ability_descriptions.json');
const TM_HM_LEARNSET_PATH = path.join(__dirname, '../../output/pokemon_tm_hm_learnset.json');

const LOCATIONS_DATA_PATH = path.join(__dirname, '../../output/pokemon_locations.json');
const LOCATIONS_BY_AREA_OUTPUT = path.join(__dirname, '../../output/locations_by_area.json');

// Helper to extract the base name from a combined name with form
export function extractBasePokemonName(fullName: string): string {
  // Check if the name contains the special separator for complex forms
  if (fullName.includes('-')) {
    return fullName.split('-')[0];
  }

  // Use the KNOWN_FORMS constant for consistency
  const knownForms = Object.values(KNOWN_FORMS);
  let baseName = fullName;

  // Special handling for compound form names like "paldean_fire" and "paldean_water"
  if (fullName.toLowerCase().includes(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase())) {
    return fullName.substring(0, fullName.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase()));
  } else if (fullName.toLowerCase().includes(KNOWN_FORMS.PALDEAN_WATER.toLowerCase())) {
    return fullName.substring(0, fullName.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_WATER.toLowerCase()));
  }

  // Handle standard forms
  for (const form of knownForms) {
    if (fullName.toLowerCase().endsWith(form.toLowerCase())) {
      baseName = fullName.substring(0, fullName.length - form.length);
      break;
    }
  }

  // Trim any trailing spaces
  return baseName.trim();
}

// --- Type Chart Extraction ---
export function extractTypeChart() {
  const matchupPath = path.join(__dirname, '../../rom/data/types/type_matchups.asm');
  const typeNamesPath = path.join(__dirname, '../../rom/data/types/names.asm');
  const outputPath = path.join(__dirname, '../../output/type_chart.json');

  // Read type names in order
  const typeNamesRaw = fs.readFileSync(typeNamesPath, 'utf8');
  const typeLines = typeNamesRaw.split(/\r?\n/).filter(l => l.trim().startsWith('dr '));
  const typeNames = typeLines.map(l => l.replace('dr ', '').trim().toLowerCase());

  // Parse matchups
  const matchupRaw = fs.readFileSync(matchupPath, 'utf8');
  const lines = matchupRaw.split(/\r?\n/);
  const chart: Record<string, Record<string, number>> = {};
  for (const t of typeNames) chart[t] = {};

  const effectMap: Record<string, number> = {
    'SUPER_EFFECTIVE': 2,
    'NOT_VERY_EFFECTIVE': 0.5,
    'NO_EFFECT': 0,
  };

  for (const line of lines) {
    const m = line.match(/db ([A-Z_]+),\s*([A-Z_]+),\s*([A-Z_]+)/);
    if (m) {
      // eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
      let [_, atk, def, eff] = m;
      atk = atk.toLowerCase();
      def = def.toLowerCase();
      const effVal = effectMap[eff] ?? 1;
      if (!chart[atk]) chart[atk] = {};
      chart[atk][def] = effVal;
    }
  }
  fs.writeFileSync(outputPath, JSON.stringify(chart, null, 2));
  console.log('Type chart extracted to', outputPath);
}

export function extractPokedexEntries() {
  const pokedexEntriesPath = path.join(__dirname, '../../rom/data/pokemon/dex_entries.asm');
  const entriesData = fs.readFileSync(pokedexEntriesPath, 'utf8');
  const lines = entriesData.split(/\r?\n/);

  // Store the entries as { pokemon: { species: string, entries: string[] } }
  const pokedexEntries: Record<string, { species: string, entries: string[] }> = {};

  let currentMon: string | null = null;
  let currentSpecies: string | null = null;
  let currentEntries: string[] = [];
  let collectingEntry = false;
  let collectingSpecies = false;
  let skipConditional = false;

  for (const line of lines) {
    // Check for new Pokémon section
    const sectionMatch = line.match(/SECTION "([A-Za-z0-9]+)PokedexEntry"/);
    if (sectionMatch) {
      // Save previous entry if we were processing one
      if (currentMon && currentSpecies && currentEntries.length > 0) {
        // Convert to title case for consistency with other data files
        const standardizedMon = standardizePokemonKey(currentMon);
        pokedexEntries[standardizedMon] = {
          species: currentSpecies,
          entries: currentEntries
        };
      }

      // Start a new entry
      currentMon = sectionMatch[1];
      currentSpecies = null;
      currentEntries = [];
      collectingEntry = false;
      collectingSpecies = false;
      skipConditional = false;
      continue;
    }

    // Check for entry start
    if (line.includes('::')) {
      collectingEntry = true;
      collectingSpecies = true;
      continue;
    }

    // Handle conditional species entries (like Blastoise)
    if (collectingSpecies && line.includes('if DEF')) {
      // We're in a conditional block, get the species from the non-FAITHFUL branch if available
      skipConditional = true;
      continue;
    }

    if (skipConditional && line.includes('else')) {
      // Now we're in the else part, we can collect the species
      skipConditional = false;
      continue;
    }

    if (skipConditional && line.includes('endc')) {
      // End of conditional, go back to normal processing
      skipConditional = false;
      collectingSpecies = false;
      continue;
    }

    // Skip lines while in a conditional we want to ignore
    if (skipConditional) continue;

    // Species line (e.g., db "Seed@")
    if (collectingEntry && line.trim().startsWith('db "') && line.includes('@"')) {
      currentSpecies = line.trim().replace('db "', '').replace('@"', '');
      collectingSpecies = false;
      continue;
    }

    // Entry text lines
    if (collectingEntry && currentSpecies) {
      // Extract the text content between the quotes
      if (line.trim().startsWith('db ')) {
        const textMatch = line.match(/db\s+"([^"]+)"/);
        if (textMatch) {
          currentEntries.push(textMatch[1]);
        }
      } else if (line.trim().startsWith('next ')) {
        // Handle lines with 'next' keyword
        const nextMatch = line.match(/next\s+"([^"]+)"/);
        if (nextMatch) {
          currentEntries.push(nextMatch[1]);
        }
      } else if (line.trim().startsWith('page ')) {
        // Handle lines with 'page' keyword - indicates a new page in the Pokédex
        const pageMatch = line.match(/page\s+"([^"]+)"/);
        if (pageMatch) {
          currentEntries.push(pageMatch[1]);
        }
      }
    }
  }

  // Don't forget the last entry
  if (currentMon && currentSpecies && currentEntries.length > 0) {
    const standardizedMon = standardizePokemonKey(currentMon);
    pokedexEntries[standardizedMon] = {
      species: currentSpecies,
      entries: currentEntries
    };
  }

  // Clean up and format the entries
  const formattedEntries: Record<string, PokemonDexEntry> = {};

  for (const [mon, data] of Object.entries(pokedexEntries)) {
    // Join the entries into a single description, handling line breaks
    // We'll preserve some formatting by adding spaces between entries
    // and replacing @ with an empty string (end of entry marker)
    const description = data.entries.join(' ')
      .replace(/@/g, '')
      .replace(/\s*-\s*(?=\w)/g, '') // Remove hyphens at end of lines
      .replace(/\s+/g, ' ');        // Normalize multiple spaces

    formattedEntries[mon] = {
      species: data.species,
      description: description.trim()
    };
  }

  fs.writeFileSync(POKEDEX_ENTRIES_OUTPUT, JSON.stringify(formattedEntries, null, 2));
  console.log('Pokédex entries extracted to', POKEDEX_ENTRIES_OUTPUT);
}

export function extractMoveDescriptions() {
  const moveNamesPath = path.join(__dirname, '../../rom/data/moves/names.asm');
  const moveDescriptionsPath = path.join(__dirname, '../../rom/data/moves/descriptions.asm');
  const moveStatsPath = path.join(__dirname, '../../rom/data/moves/moves.asm');

  const namesData = fs.readFileSync(moveNamesPath, 'utf8');
  const descData = fs.readFileSync(moveDescriptionsPath, 'utf8');
  const statsData = fs.readFileSync(moveStatsPath, 'utf8');

  // Parse move names (order matters)
  const nameLines = namesData.split(/\r?\n/).filter(l => l.trim().startsWith('li '));
  const moveNames = nameLines.map(l => l.match(/li "(.+?)"/)?.[1] || '').filter(Boolean);

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
      if (currentLabels.length && buffer.length) {
        for (const label of currentLabels) {
          const normalizedLabel = normalizeMoveKey(label);
          descMap[normalizedLabel] = buffer.join(' ');
        }
      }
      // Start a new group of labels
      // Add space before capital letters in camelCase labels
      const normalizedLabel = labelMatch[1].replace(/([a-z])([A-Z])/g, '$1 $2');
      currentLabels = [normalizedLabel];
      buffer = [];
      collecting = false;
    } else if (line.match(/^\s*[A-Za-z0-9_]+Description:/)) {
      // Handle extra labels that might not be in the main format
      // e.g., "someMoveDescription:"
      const match = line.match(/^\s*([A-Za-z0-9_]+)Description:/);
      if (match) {
        const extraLabel = match[1];
        currentLabels.push(extraLabel);
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
  if (currentLabels.length && buffer.length) {
    for (const label of currentLabels) {
      const normalizedLabel = normalizeMoveKey(label);
      descMap[normalizedLabel] = buffer.join(' ');
    }
  }

  // Parse move stats
  const typeEnumToName: Record<string, string> = {
    'NORMAL': 'Normal', 'FIGHTING': 'Fighting', 'FLYING': 'Flying', 'POISON': 'Poison', 'GROUND': 'Ground',
    'ROCK': 'Rock', 'BUG': 'Bug', 'GHOST': 'Ghost', 'STEEL': 'Steel', 'FIRE': 'Fire', 'WATER': 'Water',
    'GRASS': 'Grass', 'ELECTRIC': 'Electric', 'PSYCHIC': 'Psychic', 'ICE': 'Ice', 'DRAGON': 'Dragon',
    'DARK': 'Dark', 'FAIRY': 'Fairy', 'SHADOW': 'Shadow', 'NONE': 'None', 'UNKNOWN_T': 'Unknown'
  };
  const categoryEnumToName: Record<string, string> = {
    'PHYSICAL': 'Physical', 'SPECIAL': 'Special', 'STATUS': 'Status'
  };
  const statsLines = statsData.split(/\r?\n/);
  // Updated regex: capture accuracy (5th argument)
  // move NAME, EFFECT, POWER, TYPE, ACCURACY, PP, PRIORITY, CATEGORY
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moveStats: Record<string, { type: string; pp: number; power: number; category: string; accuracy: any }> = {};
  for (const line of statsLines) {
    const match = line.match(/^\s*move\s+([A-Z0-9_]+),\s*[A-Z0-9_]+,\s*(-?\d+),\s*([A-Z_]+),\s*(-?\d+),\s*(\d+),\s*\d+,\s*([A-Z_]+)/);
    if (match) {
      const move = match[1];
      const moveKey = normalizeMoveKey(move);
      const power = parseInt(match[2], 10);
      const type = typeEnumToName[match[3]] || 'None';
      const accuracy = parseInt(match[4], 10);
      const pp = parseInt(match[5], 10);
      const category = categoryEnumToName[match[6]] || 'Unknown';
      moveStats[moveKey] = { type, pp, power, category, accuracy };
    }
  }

  // Map move names to their description by label name
  const moveDescByName: Record<string, { description: string; type: string; pp: number; power: number; category: string; accuracy: number }> = {};
  // Define normalized groups for shared descriptions
  // Reverse lookup for quick group membership
  const moveToGroup: Record<string, string> = {};
  for (const [group, moves] of Object.entries(sharedDescriptionGroups)) {
    for (const move of moves) {
      moveToGroup[normalizeMoveKey(move)] = group;
    }
  }
  for (let i = 0; i < moveNames.length; i++) {
    // Normalize the move name to match the keys in descMap and moveStats
    console.log('Processing move name:', moveNames[i]);
    const moveKey = normalizeMoveKey(moveNames[i]);
    let desc = descMap[moveKey] || '';
    console.log('Processing move:', moveKey, 'Description:', desc);
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
    const stats = moveStats[moveKey] || { type: 'None', pp: 0, power: 0, category: 'Unknown', accuracy: 0 };
    let prettyName = toCapitalCaseWithSpaces(moveKey);
    console.log(`Adding move description for ${prettyName} m,dhuisadhguwishdkj`, moveKey);
    if (prettyName === 'Doubleslap') prettyName = 'Double Slap'; // Special case for Double Slap
    moveDescByName[prettyName] = {
      description: desc,
      type: stats.type,
      pp: stats.pp,
      power: stats.power,
      category: stats.category,
      accuracy: stats.accuracy === -1 ? '--' : stats.accuracy
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
  const eggMovesPath = path.join(__dirname, '../../rom/data/pokemon/egg_moves.asm');
  const eggMovePointersPath = path.join(__dirname, '../../rom/data/pokemon/egg_move_pointers.asm');

  // Parse pointers: species => EggSpeciesMoves label
  const pointerData = fs.readFileSync(eggMovePointersPath, 'utf8');
  const pointerLines = pointerData.split(/\r?\n/);
  const speciesToPointer: Record<string, string> = {};
  for (const line of pointerLines) {
    const match = line.match(/^\s*dw ([A-Za-z0-9_]+)\s*;\s*(.+)$/);
    if (match) {
      const pointer = match[1];
      // Use only the first word before any parenthesis or extra info as the species name
      const species = match[2].split('(')[0].split(';')[0].trim().replace(/\s+\(.+\)/, '').replace(/\s+$/, '');
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
  for (const [species, pointer] of Object.entries(speciesToPointer)) {
    eggMoves[toTitleCase(species)] = pointerToMoves[pointer] || [];
  }

  fs.writeFileSync(EGG_MOVES_OUTPUT, JSON.stringify(eggMoves, null, 2));
  console.log('Egg moves extracted to', EGG_MOVES_OUTPUT);
}

export function extractTmHmLearnset() {
  const detailedStatsDir = path.join(__dirname, '../../rom/data/pokemon/base_stats');
  const detailedStatsFiles = fs.readdirSync(detailedStatsDir).filter(f => f.endsWith('.asm'));

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
    const pokemonName = formName ? `${basePokemonName} ${formName}` : basePokemonName;

    const content = fs.readFileSync(path.join(detailedStatsDir, file), 'utf8');
    const lines = content.split(/\r?\n/);

    // Find TM/HM learnset lines: tmhm TM_MOVE_1, TM_MOVE_2, ...
    const tmhmLine = lines.find(l => l.trim().startsWith('tmhm '));
    if (tmhmLine) {
      const moves = tmhmLine
        .replace('tmhm ', '')
        .split(',')
        .map(m => m.trim())
        .filter(m => m && m !== 'NO_MOVE')
        .map(m => toCapitalCaseWithSpaces(m));

      tmHmLearnset[pokemonName] = moves.map(name => {
        // Check if we have move description data for this move
        const moveData = moveDescriptions[name];
        if (moveData) {
          return {
            name,
            description: moveData.description || '',
            type: moveData.type || '',
            pp: moveData.pp || 0,
            power: moveData.power || 0,
            category: moveData.category || '',
            accuracy: moveData.accuracy || 0,
            effectPercent: moveData.effectPercent
          };
        } else {
          return {
            name,
            description: '',
            type: '',
            pp: 0,
            power: 0,
            category: '',
            accuracy: 0
          };
        }
      });
    }
  }

  fs.writeFileSync(TM_HM_LEARNSET_PATH, JSON.stringify(tmHmLearnset, null, 2));
  console.log('Learnset extracted to', TM_HM_LEARNSET_PATH);
  return tmHmLearnset;
}

// Helper function to extract form and base name information from a file name
export function extractFormInfo(fileName: string): { basePokemonName: string, formName: string | null } {
  // Form indicators in filenames
  const formPatterns = [
    // Place special forms before plain to ensure correct matching
    { pattern: /_alolan$/, formName: KNOWN_FORMS.ALOLAN },
    { pattern: /_galarian$/, formName: KNOWN_FORMS.GALARIAN },
    { pattern: /_hisuian$/, formName: KNOWN_FORMS.HISUIAN },
    { pattern: /_paldean_fire$/, formName: KNOWN_FORMS.PALDEAN_FIRE },
    { pattern: /_paldean_water$/, formName: KNOWN_FORMS.PALDEAN_WATER },
    { pattern: /_paldean$/, formName: KNOWN_FORMS.PALDEAN },
    { pattern: /_armored$/, formName: KNOWN_FORMS.ARMORED },
    { pattern: /_bloodmoon$/, formName: KNOWN_FORMS.BLOODMOON },
    { pattern: /_plain$/, formName: null } // Place _plain last as it's a special case
  ];

  let basePokemonName = fileName;
  let formName = null;

  for (const { pattern, formName: patternFormName } of formPatterns) {
    if (pattern.test(fileName)) {
      // Remove the form pattern from the file name to get base name
      basePokemonName = fileName.replace(pattern, '');
      formName = patternFormName;
      break;
    }
  }

  return {
    basePokemonName: toTitleCase(basePokemonName).trimEnd(),
    formName: formName ? formName.trimEnd() : null
  };
}
// --- Detailed Stats Extraction ---
export function extractDetailedStats(): Record<string, DetailedStats> {
  const detailedStatsDir = path.join(__dirname, '../../rom/data/pokemon/base_stats');
  const detailedStatsFiles = fs.readdirSync(detailedStatsDir).filter(f => f.endsWith('.asm'));

  const detailedStats: Record<string, DetailedStats> = {};

  for (const file of detailedStatsFiles) {
    const fileName = file.replace('.asm', '');

    // Debug for Pikachu
    if (fileName === 'pikachu') {
      console.log('Found pikachu.asm file');
    }

    const content = fs.readFileSync(path.join(detailedStatsDir, file), 'utf8');
    const lines = content.split(/\r?\n/);

    // Extract the Pokemon name from the file name
    const { basePokemonName, formName } = extractFormInfo(fileName);
    const pokemonName = formName ? `${basePokemonName} ${formName}`.trim() : basePokemonName.trim();

    // Debug for Pikachu
    if (pokemonName === 'Pikachu') {
      console.log('Processing Pikachu with pokemonName:', pokemonName);
      console.log('Looking for abilities_for line...');
      const abilitiesLine = lines.find(l => l.trim().startsWith('abilities_for'));
      console.log('Found abilities_for line:', abilitiesLine);
    }

    try {
      // Extract base stats (first line)
      // Format: db hp, atk, def, spe, sat, sdf ; BST
      const baseStatsLine = lines.find(l => l.trim().match(/^db\s+\d+,\s+\d+,\s+\d+,\s+\d+,\s+\d+,\s+\d+/));
      if (!baseStatsLine) continue;

      const baseStatsMatch = baseStatsLine.trim().match(/db\s+(\d+),\s+(\d+),\s+(\d+),\s+(\d+),\s+(\d+),\s+(\d+)/);
      if (!baseStatsMatch) continue;

      // Get BST from comment if available
      const bstMatch = baseStatsLine.match(/;\s*(\d+)\s*BST/);
      const bst = bstMatch ? parseInt(bstMatch[1], 10) : 0;

      const baseStats = {
        hp: parseInt(baseStatsMatch[1], 10),
        attack: parseInt(baseStatsMatch[2], 10),
        defense: parseInt(baseStatsMatch[3], 10),
        speed: parseInt(baseStatsMatch[4], 10),
        specialAttack: parseInt(baseStatsMatch[5], 10),
        specialDefense: parseInt(baseStatsMatch[6], 10),
        total: bst || 0 // Use calculated BST or 0 if not found
      };

      // Calculate the total if it wasn't provided
      if (baseStats.total === 0) {
        baseStats.total = baseStats.hp + baseStats.attack + baseStats.defense +
          baseStats.speed + baseStats.specialAttack + baseStats.specialDefense;
      }

      // Extract catch rate - Format: db NUM ; catch rate
      const catchRateLine = lines.find(l => l.trim().match(/^db\s+\d+\s*;\s*catch rate/));
      let catchRate = 255; // Default
      if (catchRateLine) {
        const catchRateMatch = catchRateLine.match(/db\s+(\d+)/);
        if (catchRateMatch) {
          catchRate = parseInt(catchRateMatch[1], 10);
        }
      }

      // Extract base exp - Format: db NUM ; base exp
      const baseExpLine = lines.find(l => l.trim().match(/^db\s+\d+\s*;\s*base exp/));
      let baseExp = 0;
      if (baseExpLine) {
        const baseExpMatch = baseExpLine.match(/db\s+(\d+)/);
        if (baseExpMatch) {
          baseExp = parseInt(baseExpMatch[1], 10);
        }
      }

      // Extract held items - Format: db ITEM1, ITEM2 ; held items
      const heldItemsLine = lines.find(l => l.trim().match(/^db.*;\s*held items/));
      const heldItems: string[] = [];
      if (heldItemsLine) {
        const heldItemsMatch = heldItemsLine.match(/db\s+([A-Z_]+)(?:,\s*([A-Z_]+))?/);
        if (heldItemsMatch) {
          if (heldItemsMatch[1] && heldItemsMatch[1] !== 'NO_ITEM') {
            heldItems.push(heldItemsMatch[1]);
          }
          if (heldItemsMatch[2] && heldItemsMatch[2] !== 'NO_ITEM') {
            heldItems.push(heldItemsMatch[2]);
          }
        }
      }

      // Extract gender ratio and hatch rate
      // Format: dn GENDER_XXX, HATCH_XXX ; gender ratio, step cycles to hatch
      const genderHatchLine = lines.find(l => l.trim().match(/^dn.*;\s*gender ratio/));
      let genderRatio = 'Unknown';
      let hatchRate = 'Unknown';

      if (genderHatchLine) {
        const genderHatchMatch = genderHatchLine.match(/dn\s+([A-Z_\d]+),\s*([A-Z_\d]+)/);
        if (genderHatchMatch) {
          // Convert gender ratio code to human-readable text
          const genderCode = genderHatchMatch[1];
          genderRatio = convertGenderCode(genderCode);

          // Convert hatch rate code to human-readable text
          const hatchCode = genderHatchMatch[2];
          hatchRate = convertHatchCode(hatchCode);
        }
      }      // Extract abilities - Format: abilities_for POKEMON, ABILITY1, ABILITY2, HIDDEN_ABILITY
      // Check for faithful vs non-faithful conditional abilities
      let faithfulAbilitiesLine: string | undefined;
      let nonFaithfulAbilitiesLine: string | undefined;
      let hasFaithfulConditional = false;
      const abilities: Array<Ability> = [];
      const faithfulAbilities: Array<Ability> = [];
      const updatedAbilities: Array<Ability> = [];

      // Debug for Pikachu
      if (pokemonName === 'Pikachu') {
        console.log('Looking for abilities for Pikachu...');
        console.log('File contains conditional blocks:', lines.some(l => l.includes('if DEF(FAITHFUL)')));
      }

      // First try to find a standard abilities_for line regardless of conditional blocks
      const standardAbilitiesLine = lines.find(l => l.trim().startsWith('abilities_for'));

      // console.log('Standard abilities line:', standardAbilitiesLine);

      // Look for conditional ability definitions
      let foundConditionalAbilities = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('if DEF(FAITHFUL)')) {
          hasFaithfulConditional = true;
          // Look for the abilities_for line within the faithful block
          for (let j = i + 1; j < lines.length; j++) {
            const innerLine = lines[j].trim();
            if (innerLine.startsWith('abilities_for')) {
              faithfulAbilitiesLine = innerLine;
              foundConditionalAbilities = true;
              if (pokemonName === 'Pikachu') {
                console.log('Found faithful abilities line:', faithfulAbilitiesLine);
              }
              break;
            }
            if (innerLine === 'else' || innerLine === 'endc') {
              break;
            }
          }
        } else if (hasFaithfulConditional && line === 'else') {
          // Look for the abilities_for line within the non-faithful block
          for (let j = i + 1; j < lines.length; j++) {
            const innerLine = lines[j].trim();
            if (innerLine.startsWith('abilities_for')) {
              nonFaithfulAbilitiesLine = innerLine;
              foundConditionalAbilities = true;
              if (pokemonName === 'Pikachu') {
                console.log('Found non-faithful abilities line:', nonFaithfulAbilitiesLine);
              }
              break;
            }
            if (innerLine === 'endc') {
              break;
            }
          }
        }
      }

      // console.log(`Found conditional abilities for ${pokemonName}:`, foundConditionalAbilities);

      // If no conditional abilities were found, use the standard abilities line
      if (!foundConditionalAbilities && standardAbilitiesLine) {
        faithfulAbilitiesLine = standardAbilitiesLine;
        nonFaithfulAbilitiesLine = standardAbilitiesLine; // Use the same line for both faithful and non-faithful abilities

        if (pokemonName === 'Pikachu') {
          console.log('Using standard abilities line:', standardAbilitiesLine);
        }
      } else if (pokemonName === 'Pikachu' && !foundConditionalAbilities && !standardAbilitiesLine) {
        console.log('No abilities line found for Pikachu');
      }// Process abilities
      if (faithfulAbilitiesLine) {
        // console.log(`Processing abilities for ${pokemonName}: ${faithfulAbilitiesLine}`);
        const faithfulMatch = faithfulAbilitiesLine.match(/abilities_for\s+([A-Z_0-9]+),\s*([A-Z_0-9]+)(?:,\s*([A-Z_0-9]+))?(?:,\s*([A-Z_0-9]+))?/);

        // Special debug for Pikachu
        if (pokemonName === "Pikachu") {
          console.log("PIKACHU DEBUG: Match result:", faithfulMatch);
        }

        if (faithfulMatch) {

          // console.log(`Faithful match found for ${pokemonName}:`, faithfulMatch);

          // Extract ability names from the faithful match - handle NO_ABILITY properly
          const faithfulPrimaryName = faithfulMatch[2] && faithfulMatch[2] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(faithfulMatch[2].trim()) : null;
          const faithfulSecondaryName = faithfulMatch[3] && faithfulMatch[3] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(faithfulMatch[3].trim()) : null;
          const faithfulHiddenName = faithfulMatch[4] && faithfulMatch[4] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(faithfulMatch[4].trim()) : null;

          // console.log(`Parsed abilities for ${pokemonName}: Primary: ${faithfulPrimaryName}, Secondary: ${faithfulSecondaryName}, Hidden: ${faithfulHiddenName}`);

          // Process non-faithful abilities if available
          let nonFaithfulPrimaryName = faithfulPrimaryName;
          let nonFaithfulSecondaryName = faithfulSecondaryName;
          let nonFaithfulHiddenName = faithfulHiddenName;

          // Check if there are actually different ability lines for faithful vs non-faithful versions
          let hasDistinctAbilities = false;

          if (nonFaithfulAbilitiesLine && nonFaithfulAbilitiesLine !== faithfulAbilitiesLine) {
            // console.log(`Processing non-faithful abilities for ${pokemonName}: ${nonFaithfulAbilitiesLine}`);
            const nonFaithfulMatch = nonFaithfulAbilitiesLine.match(/abilities_for\s+([A-Z_0-9]+),\s*([A-Z_0-9]+)(?:,\s*([A-Z_0-9]+))?(?:,\s*([A-Z_0-9]+))?/);
            if (nonFaithfulMatch) {
              nonFaithfulPrimaryName = nonFaithfulMatch[2] && nonFaithfulMatch[2] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(nonFaithfulMatch[2].trim()) : null;
              nonFaithfulSecondaryName = nonFaithfulMatch[3] && nonFaithfulMatch[3] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(nonFaithfulMatch[3].trim()) : null;
              nonFaithfulHiddenName = nonFaithfulMatch[4] && nonFaithfulMatch[4] !== 'NO_ABILITY' ? toCapitalCaseWithSpaces(nonFaithfulMatch[4].trim()) : null;

              // Check if the abilities are actually different between faithful and non-faithful versions
              hasDistinctAbilities =
                faithfulPrimaryName !== nonFaithfulPrimaryName ||
                faithfulSecondaryName !== nonFaithfulSecondaryName ||
                faithfulHiddenName !== nonFaithfulHiddenName;
            }
          }

          // Add primary ability to faithful abilities
          if (faithfulPrimaryName) {
            // console.log(`Adding faithful primary ability for ${pokemonName}: ${faithfulPrimaryName}`);
            const faithfulAbilityData: Ability = {
              name: faithfulPrimaryName,
              description: '', // Will be filled in later
              isHidden: false,
              abilityType: 'primary'
            };
            faithfulAbilities.push(faithfulAbilityData);
            abilities.push({ ...faithfulAbilityData }); // For backward compatibility
          }

          // Add secondary ability to faithful abilities
          if (faithfulSecondaryName) {
            // console.log(`Adding faithful secondary ability for ${pokemonName}: ${faithfulSecondaryName}`);
            const faithfulAbilityData: Ability = {
              name: faithfulSecondaryName,
              description: '', // Will be filled in later
              isHidden: false,
              abilityType: 'secondary'
            };
            faithfulAbilities.push(faithfulAbilityData);
            abilities.push({ ...faithfulAbilityData }); // For backward compatibility
          }

          // Add hidden ability to faithful abilities
          if (faithfulHiddenName) {
            // console.log(`Adding faithful hidden ability for ${pokemonName}: ${faithfulHiddenName}`);
            const faithfulAbilityData: Ability = {
              name: faithfulHiddenName,
              description: '', // Will be filled in later
              isHidden: true,
              abilityType: 'hidden'
            };
            faithfulAbilities.push(faithfulAbilityData);
            abilities.push({ ...faithfulAbilityData }); // For backward compatibility
          }

          // Only create separate updatedAbilities if they're actually different from faithful abilities
          if (hasDistinctAbilities) {
            // console.log(`Creating updated abilities for ${pokemonName} since they differ from faithful abilities`);
            // Add abilities to the updated abilities array since they differ from faithful
            if (nonFaithfulPrimaryName) {
              const updatedAbilityData: Ability = {
                name: nonFaithfulPrimaryName,
                description: '', // Will be filled in later
                isHidden: false,
                abilityType: 'primary'
              };
              updatedAbilities.push(updatedAbilityData);
            }

            if (nonFaithfulSecondaryName) {
              // console.log(`Adding non-faithful secondary ability for ${pokemonName}: ${nonFaithfulSecondaryName}`);
              const updatedAbilityData: Ability = {
                name: nonFaithfulSecondaryName,
                description: '', // Will be filled in later
                isHidden: false,
                abilityType: 'secondary'
              };
              updatedAbilities.push(updatedAbilityData);
            }

            if (nonFaithfulHiddenName) {
              // console.log(`Adding non-faithful hidden ability for ${pokemonName}: ${nonFaithfulHiddenName}`);
              const updatedAbilityData: Ability = {
                name: nonFaithfulHiddenName,
                description: '', // Will be filled in later
                isHidden: true,
                abilityType: 'hidden'
              };
              updatedAbilities.push(updatedAbilityData);
            }
          } else {
            // If the abilities are identical, use an empty array for updatedAbilities
            // This will signal that the updatedAbilities are the same as faithfulAbilities
            updatedAbilities.length = 0; // Clear any existing entries
          }
        }
      }

      // Extract growth rate - Format: db GROWTH_XXX ; growth rate
      const growthRateLine = lines.find(l => l.trim().match(/^db\s+GROWTH_[A-Z_]+\s*;\s*growth rate/));
      let growthRate = 'Medium';

      if (growthRateLine) {
        const growthRateMatch = growthRateLine.match(/db\s+(GROWTH_[A-Z_]+)/);
        if (growthRateMatch) {
          growthRate = convertGrowthRateCode(growthRateMatch[1]);
        }
      }

      // Extract egg groups - Format: dn EGG_GROUP1, EGG_GROUP2 ; egg groups
      const eggGroupsLine = lines.find(l => l.trim().match(/^dn.*;\s*egg groups/));
      const eggGroups: string[] = [];

      if (eggGroupsLine) {
        const eggGroupsMatch = eggGroupsLine.match(/dn\s+([A-Z_]+)(?:,\s*([A-Z_]+))?/);
        if (eggGroupsMatch) {
          if (eggGroupsMatch[1]) {
            eggGroups.push(convertEggGroupCode(eggGroupsMatch[1]));
          }
          if (eggGroupsMatch[2]) {
            eggGroups.push(convertEggGroupCode(eggGroupsMatch[2]));
          }
        }
      }

      // Extract EV yield - Format: ev_yield NUM STAT
      const evYieldLine = lines.find(l => l.trim().startsWith('ev_yield'));
      let evYield = 'None';

      if (evYieldLine) {
        const evYieldMatch = evYieldLine.match(/ev_yield\s+(\d+)\s+([A-Za-z]+)/);
        if (evYieldMatch) {
          evYield = `${evYieldMatch[1]} ${evYieldMatch[2]}`;
        }
      }

      // Add the detailed stats to our result
      // For updatedAbilities, only use fallbacks if there are distinct abilities
      detailedStats[pokemonName] = {
        baseStats,
        catchRate,
        baseExp,
        heldItems,
        genderRatio,
        hatchRate,
        abilities: abilities.length > 0 ? abilities : [],
        faithfulAbilities: faithfulAbilities.length > 0 ? faithfulAbilities : abilities.length > 0 ? abilities : [],
        // Keep updatedAbilities empty if we explicitly cleared it (meaning abilities are identical)
        updatedAbilities: updatedAbilities,
        growthRate,
        eggGroups,
        evYield
      };
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
    }
  }

  return detailedStats;
}


/**
 * Extracts body data from a line and adds it to the detailed stats object for a Pokémon.
 * @param line - The body_data line from the ASM file.
 * @param detailedStats - The detailed stats object to update.
 * @returns The updated detailed stats object with body data fields.
 */
export function addBodyDataToDetailedStats(
  line: string,
  detailedStats: DetailedStats
): DetailedStats {
  // Example line: body_data   7,   69, QUADRUPED,    GREEN  ; BULBASAUR
  const bodyDataRegex = /body_data\s+(\d+),\s*(\d+),\s*([A-Z_]+),\s*([A-Z_]+)\s*;\s*(.+)/;
  const match = line.match(bodyDataRegex);
  if (!match) return detailedStats;

  const [, height, weight, shape, color] = match;

  // Add body data to detailedStats
  return {
    ...detailedStats,
    height: Number(height),
    weight: Number(weight),
    bodyShape: toTitleCase(shape),
    bodyColor: toTitleCase(color),
  };
}

export function extractAbilityDescriptions() {
  const abilityNamesPath = path.join(__dirname, '../../rom/data/abilities/names.asm');
  const abilityDescriptionsPath = path.join(__dirname, '../../rom/data/abilities/descriptions.asm');

  const namesData = fs.readFileSync(abilityNamesPath, 'utf8');
  const descData = fs.readFileSync(abilityDescriptionsPath, 'utf8');

  console.log('Extracting ability descriptions...');

  // Parse ability names (order matters)
  // First get the ability identifiers from the table at the beginning
  console.log('Parsing ability name IDs...', namesData);
  console.log('Names data length:', namesData.length);
  const nameIds = namesData.split(/\r?\n/)
    .filter(l => l.trim().startsWith('dw '))
    .map(l => l.trim().replace(/^dw\s+/, '')) // Ensure space after 'dw'
    .map(id => id.replace(/([a-z])([A-Z])/g, '$1 $2'))
    .filter(Boolean);

  console.log('Ability name IDs found:', nameIds.length, [...nameIds]);

  // Then get the actual string names from the rawchar definitions
  const abilityNameMap: Record<string, string> = {};

  console.log('Parsing ability names...');
  const rawNameMatches = namesData.matchAll(/^(\w+):\s+rawchar\s+"([^@]+)@"/gm);
  console.log('Raw name matches found:', [...rawNameMatches].length);
  console.log('rawNameMatches', [...rawNameMatches]);

  // Debug the rawchar matching
  console.log('Raw name matches found:', [...namesData.matchAll(/^(\w+):\s+rawchar\s+"([^@]+)@"/gm)].length);

  for (const match of rawNameMatches) {
    const [, id, name] = match;
    abilityNameMap[id] = name;
  }

  console.log('Ability name map entries:', Object.keys(abilityNameMap).length);

  // Map the ids to their corresponding names
  const abilityNames = nameIds.map(id => abilityNameMap[toTitleCase(id)] || toTitleCase(id));


  console.log('Ability names parsed:', abilityNames.length, abilityNames, 'abilities');

  // Parse descriptions by label name
  const descLines = descData.split(/\r?\n/);
  console.log('Parsing ability descriptions...');
  console.log('Description lines found:', descLines.length, [...descLines.slice(0, 10)]); // Show first 10 lines for context
  const descMap: Record<string, string> = {};
  let currentLabels: string[] = [];
  let collecting = false;
  let buffer: string[] = [];
  for (const line of descLines) {
    const labelMatch = line.match(/^([A-Za-z0-9_]+)Description:/);
    console.log('Processing line:', line.trim(), labelMatch ? labelMatch[1] : null);
    if (labelMatch) {
      if (currentLabels.length && buffer.length) {
        for (const label of currentLabels) {
          const normalizedLabel = toTitleCase(label);
          descMap[normalizedLabel] = buffer.join(' ');
        }
      }
      // Start a new group of labels
      const normalizedLabel = labelMatch[1].replace(/([a-z])([A-Z])/g, '$1 $2');
      console.log('Found new label: normalizedLabel', normalizedLabel);
      currentLabels = [normalizedLabel];
      buffer = [];
      collecting = false;
    } else if (line.match(/^\s*[A-Za-z0-9_]+Description:/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)Description:/);
      if (match) {
        const extraLabel = toTitleCase(match[1]);
        currentLabels.push(extraLabel);
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
  if (currentLabels.length && buffer.length) {
    for (const label of currentLabels) {
      const normalizedLabel = toTitleCase(label);
      descMap[normalizedLabel] = buffer.join(' ');
    }
  }

  // Map ability names to their description
  const abilityDescByName: Record<string, { description: string }> = {};
  for (let i = 0; i < abilityNames.length; i++) {
    const normalizedAbilityName = toTitleCase(abilityNames[i]);
    const desc = descMap[normalizedAbilityName] || '';
    abilityDescByName[normalizedAbilityName] = {
      description: desc
    };
  }

  // Apply shared descriptions
  for (const [primary, aliasList] of Object.entries(sharedDescriptionGroups)) {
    const primaryDesc = abilityDescByName[primary];
    if (primaryDesc) {
      for (const alias of aliasList) {
        abilityDescByName[alias] = primaryDesc;
      }
    }
  }

  // Save to a JSON file for reference
  fs.writeFileSync(ABILITY_DESCRIPTIONS_OUTPUT, JSON.stringify(abilityDescByName, null, 2));
  console.log('Ability descriptions extracted to', ABILITY_DESCRIPTIONS_OUTPUT);

  return abilityDescByName;
}

// TODO: REMOVE

// Legacy function for compatibility with existing code
// Will be gradually phased out as we convert the code to use the new structure
export function getFullPokemonName(name: string, form: string | null): string {
  const { baseName, formName } = normalizeMonName(name, form);

  // For debugging special cases
  if ((name === 'TAUROS' || name === 'WOOPER') && form) {
    console.log(`Creating name for ${name} with form ${form} => ${baseName}${formName || ''}`);
  }

  // Return the combined name - use consistent format for forms
  // For the special Paldean forms, use a unique separator to make extraction easier
  if (formName === KNOWN_FORMS.PALDEAN_FIRE || formName === KNOWN_FORMS.PALDEAN_WATER) {
    return `${baseName}-${formName}`;  // Use a separator for these complex forms
  }

  return formName ? `${baseName}${formName}` : baseName;
}

// --- Hidden Grotto Extraction ---
export function extractHiddenGrottoes(): Record<string, LocationEntry[]> {
  // Result will be keyed by Pokémon name, containing location entries
  const grottoLocations: Record<string, LocationEntry[]> = {};

  // Read the grottoes.asm file
  const grottoeFilePath = path.join(__dirname, '../../rom/data/events/hidden_grottoes/grottoes.asm');
  if (!fs.existsSync(grottoeFilePath)) {
    console.warn('Hidden grottoes file not found, skipping extraction');
    return {};
  }

  const grottoeContents = fs.readFileSync(grottoeFilePath, 'utf8');
  const lines = grottoeContents.split(/\r?\n/);

  // Maps for item names and location names
  const itemNames: Record<string, string> = {
    'FIRE_STONE': 'Fire Stone',
    'WATER_STONE': 'Water Stone',
    'THUNDER_STONE': 'Thunder Stone',
    'LEAF_STONE': 'Leaf Stone',
    'MOON_STONE': 'Moon Stone',
    'SUN_STONE': 'Sun Stone',
    'SHINY_STONE': 'Shiny Stone',
    'DUSK_STONE': 'Dusk Stone',
    'ICE_STONE': 'Ice Stone',
    'EVERSTONE': 'Everstone',
  };

  // Maps for location names (from CONSTANT to human-readable name)
  const locationNames: Record<string, string> = {
    'HIDDENGROTTO_ROUTE_32': 'Route 32',
    'HIDDENGROTTO_ILEX_FOREST': 'Ilex Forest',
    'HIDDENGROTTO_ROUTE_35': 'Route 35',
    'HIDDENGROTTO_ROUTE_36': 'Route 36',
    'HIDDENGROTTO_CHERRYGROVE_BAY': 'Cherrygrove Bay',
    'HIDDENGROTTO_VIOLET_OUTSKIRTS': 'Violet Outskirts',
    'HIDDENGROTTO_ROUTE_32_COAST': 'Route 32 Coast',
    'HIDDENGROTTO_STORMY_BEACH': 'Stormy Beach',
    'HIDDENGROTTO_ROUTE_35_COAST': 'Route 35 Coast',
    'HIDDENGROTTO_RUINS_OF_ALPH': 'Ruins of Alph',
    'HIDDENGROTTO_ROUTE_47': 'Route 47',
    'HIDDENGROTTO_YELLOW_FOREST': 'Yellow Forest',
    'HIDDENGROTTO_RUGGED_ROAD_NORTH': 'Rugged Road North',
    'HIDDENGROTTO_SNOWTOP_MOUNTAIN_INSIDE': 'Snowtop Mountain Inside',
    'HIDDENGROTTO_ROUTE_42': 'Route 42',
    'HIDDENGROTTO_LAKE_OF_RAGE': 'Lake of Rage',
    'HIDDENGROTTO_BELLCHIME_TRAIL': 'Bellchime Trail',
    'HIDDENGROTTO_ROUTE_44': 'Route 44',
    'HIDDENGROTTO_ROUTE_45': 'Route 45',
    'HIDDENGROTTO_ROUTE_46': 'Route 46',
    'HIDDENGROTTO_SINJOH_RUINS': 'Sinjoh Ruins',
    'HIDDENGROTTO_SILVER_CAVE': 'Silver Cave',
  };

  let currentLocation: string | null = null;
  let rareItem: string | null = null;
  let level: string | number | null = null;
  let common1: string | null = null;
  let common2: string | null = null;
  let uncommon: string | null = null;
  let rare: string | null = null;

  // Process the file line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and table headers
    if (!line || line.startsWith('HiddenGrottoData:') || line.startsWith('table_width')) continue;

    // Parse location headers
    if (line.startsWith('; HIDDENGROTTO_') || line.match(/^;\s*HIDDENGROTTO_/)) {
      const locationMatch = line.match(/;\s*(HIDDENGROTTO_[A-Z_]+)/);
      if (locationMatch) {
        const locationKey = locationMatch[1];
        currentLocation = locationNames[locationKey] || locationKey.replace('HIDDENGROTTO_', '').replace(/_/g, ' ');
      }
      continue;
    }

    // Parse the grotto data line (db warp number, rare item, level)
    if (line.startsWith('db') && currentLocation) {
      const dataMatch = line.match(/db\s+(\d+),\s+([A-Z_]+),\s+([A-Z0-9_\+\-\s]+)/);
      if (dataMatch) {
        rareItem = itemNames[dataMatch[2]] || dataMatch[2];

        // Normalize LEVEL_FROM_BADGES to a consistent string
        if (/LEVEL_FROM_BADGES/.test(dataMatch[3])) {
          const modifierMatch = dataMatch[3].match(/LEVEL_FROM_BADGES\s*([\+\-]\s*\d+)?/);
          if (modifierMatch && modifierMatch[1]) {
            level = `Badge Level ${modifierMatch[1].replace(/\s+/g, ' ')}`;
          } else {
            level = 'Badge Level';
          }
        } else {
          level = dataMatch[3];
        }
      }
      continue;
    }

    // Parse Pokemon entries
    if (line.startsWith('dp') && currentLocation && rareItem && level !== null) {
      const pokemonMatch = line.match(/dp\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?/);
      if (pokemonMatch) {
        const pokemonName = pokemonMatch[1];
        const formName = pokemonMatch[2] || null;

        // Get the formatted Pokémon name using our normalizeMonName function
        const { baseName: baseFormattedName } = normalizeMonName(pokemonName, null);
        const { formName: normalizedFormName } = normalizeMonName(pokemonName, formName); // Extract form name
        const fullName = getFullPokemonName(pokemonName, formName); // Legacy full name for indexing

        // Determine which slot this is and set rarity
        let rarity: string;
        if (common1 === null) {
          common1 = baseFormattedName;
          rarity = 'common';
        } else if (common2 === null) {
          common2 = baseFormattedName;
          rarity = 'common';
        } else if (uncommon === null) {
          uncommon = baseFormattedName;
          rarity = 'uncommon';
        } else if (rare === null) {
          rare = baseFormattedName;
          rarity = 'rare';

          // Reset for next grotto
          common1 = null;
          common2 = null;
          uncommon = null;
          rare = null;
        } else {
          continue; // Something went wrong with the parsing
        }

        // Add this location to the Pokémon's entry
        if (!grottoLocations[fullName]) {
          grottoLocations[fullName] = [];
        }

        grottoLocations[fullName].push({
          area: currentLocation,
          method: 'hidden_grotto',
          time: rarity,
          level: String(level), // Convert to string regardless of type
          chance: rarity === 'rare' ? 5 : rarity === 'uncommon' ? 15 : 40,
          rareItem: rareItem,
          formName: normalizedFormName // Add form information
        });
      }
    }
  }

  return grottoLocations;
}


// Helper function to process locations
function processLocations(
  pokemon: string,
  locations: LocationEntry[],
  formName: string | null,
  locationsByArea: Record<string, LocationAreaData>
) {
  for (const location of locations) {
    if (!location.area) continue;

    // Format the area name to match UI component formatting
    const formattedAreaName = location.area
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    const method = location.method || 'unknown';
    const time = location.time || 'any';

    // Initialize area if it doesn't exist
    if (!locationsByArea[formattedAreaName]) {
      locationsByArea[formattedAreaName] = { pokemon: {} };
    }

    // Initialize Pokemon in this area if it doesn't exist
    if (!locationsByArea[formattedAreaName].pokemon[pokemon]) {
      locationsByArea[formattedAreaName].pokemon[pokemon] = { methods: {} };
    }

    // Initialize method if it doesn't exist
    if (!locationsByArea[formattedAreaName].pokemon[pokemon].methods[method]) {
      locationsByArea[formattedAreaName].pokemon[pokemon].methods[method] = { times: {} };
    }

    // Initialize time if it doesn't exist
    if (!locationsByArea[formattedAreaName].pokemon[pokemon].methods[method].times[time]) {
      locationsByArea[formattedAreaName].pokemon[pokemon].methods[method].times[time] = [];
    }

    // Add encounter details
    const encounterDetail: EncounterDetail = {
      level: location.level,
      chance: location.chance
    };

    // Add rareItem if present (for hidden grottoes)
    if ('rareItem' in location && location.rareItem) {
      encounterDetail.rareItem = location.rareItem;
    }

    // Add form name if present
    if (formName || ('formName' in location && location.formName)) {
      encounterDetail.formName = formName || location.formName;
    }

    locationsByArea[formattedAreaName].pokemon[pokemon].methods[method].times[time].push(encounterDetail);
  }
}


// Load the Pokemon location data
export async function extractLocationsByArea() {
  try {
    const pokemonLocationsData = JSON.parse(await fs.promises.readFile(LOCATIONS_DATA_PATH, 'utf8'));

    // Organize by area
    const locationsByArea: Record<string, LocationAreaData> = {};

    // Process each Pokemon and its locations
    for (const [pokemon, pokemonData] of Object.entries<PokemonLocationData>(pokemonLocationsData)) {
      // Process base form locations
      if (pokemonData.locations && Array.isArray(pokemonData.locations)) {
        processLocations(pokemon, pokemonData.locations, null, locationsByArea);
      }

      // Process alternate forms if they exist
      if (pokemonData.forms) {
        for (const [formName, formData] of Object.entries(pokemonData.forms)) {
          if (formData.locations && Array.isArray(formData.locations)) {
            processLocations(pokemon, formData.locations, formName, locationsByArea);
          }
        }
      }
    }

    // --- Map encounter rates to each area and method ---
    for (const [, areaData] of Object.entries(locationsByArea)) {
      // Collect all unique methods and times for this area
      const allMethods = new Set<string>();
      const allTimesByMethod: Record<string, Set<string>> = {};
      for (const pokemonData of Object.values(areaData.pokemon)) {
        for (const [method, methodData] of Object.entries(pokemonData.methods)) {
          allMethods.add(method);
          if (!allTimesByMethod[method]) allTimesByMethod[method] = new Set();
          for (const time of Object.keys(methodData.times)) {
            allTimesByMethod[method].add(time);
          }
        }
      }
      // Iterate over all methods and times
      for (const method of allMethods) {
        for (const time of allTimesByMethod[method]) {
          // Collect all Pokémon for this area/method/time in slot order
          const slotPokemon = [];
          for (const [pokemonName, pokemonData] of Object.entries(areaData.pokemon)) {
            const details = pokemonData.methods[method]?.times[time];
            if (details && details.length > 0) {
              for (let i = 0; i < details.length; i++) {
                slotPokemon.push(pokemonName);
              }
            }
          }
          // Determine encounter type
          const encounterType =
            method.toLowerCase().includes('surf') || method.toLowerCase().includes('water') ? 'surf'
              : method.toLowerCase().includes('fish') ? 'fish'
                : 'grass';
          // Use correct slot count for each type
          const maxSlots =
            encounterType === 'grass' ? 10 : encounterType === 'surf' ? 3 : 4;
          // Map canonical rates to first N slots, extras get 0
          const mappedRates = mapEncounterRatesToPokemon(slotPokemon.slice(0, maxSlots), encounterType);
          // Assign rates to EncounterDetails in slot order
          let slotIdx = 0;
          for (const [, pokemonData] of Object.entries(areaData.pokemon)) {
            const details = pokemonData.methods[method]?.times[time];
            if (details && details.length > 0) {
              for (let i = 0; i < details.length; i++) {
                if (slotIdx < maxSlots) {
                  details[i].chance = mappedRates[slotIdx]?.rate ?? 0;
                } else {
                  details[i].chance = 0;
                }
                slotIdx++;
              }
            }
          }
        }
      }
    }

    // Write to file
    await fs.promises.writeFile(
      LOCATIONS_BY_AREA_OUTPUT,
      JSON.stringify(locationsByArea, null, 2)
    );

    console.log(`Location data by area extracted to ${LOCATIONS_BY_AREA_OUTPUT}`);
  } catch (error) {
    console.error('Error extracting locations by area:', error);
  }
}

/**
 * Converts cumulative probability thresholds to individual slot percentages.
 * @param cumulative Array of cumulative values (e.g., [30, 60, 80, ...])
 * @returns Array of slot percentages (e.g., [30, 30, 20, ...])
 */
function getSlotPercentages(cumulative: number[]): number[] {
  return cumulative.map((val, idx, arr) => val - (arr[idx - 1] ?? 0));
}

/**
 * Maps encounter rates to Pokémon for a given area using the ASM probability tables.
 * @param pokemonList - Array of Pokémon names in encounter slot order.
 * @param encounterType - 'grass' | 'surf' | 'fish'
 * @returns Array of objects: { name: string, rate: number }
 */
export function mapEncounterRatesToPokemon(
  pokemonList: string[],
  encounterType: 'grass' | 'surf' | 'fish'
): Array<{ name: string; rate: number }> {
  // Probability tables from probabilities.asm (cumulative)
  const GRASS_PROBABILITIES_CUMULATIVE = [30, 60, 80, 90, 95, 98, 100];
  const SURF_PROBABILITIES_CUMULATIVE = [60, 90, 100]; // Surf: 3 slots
  const FISH_PROBABILITIES_CUMULATIVE = [70, 90, 98, 100]; // Example: 4 slots for fishing

  let probabilities: number[];
  if (encounterType === 'grass') {
    probabilities = getSlotPercentages(GRASS_PROBABILITIES_CUMULATIVE);
  } else if (encounterType === 'surf') {
    probabilities = getSlotPercentages(SURF_PROBABILITIES_CUMULATIVE);
  } else if (encounterType === 'fish') {
    probabilities = getSlotPercentages(FISH_PROBABILITIES_CUMULATIVE);
  } else {
    probabilities = [];
  }

  return pokemonList.map((name, idx) => ({
    name,
    rate: probabilities[idx] || 0 // 0 if more Pokémon than slots
  }));
}

// --- Synchronize encounter rates from locations_by_area.json to pokemon_locations.json ---
export async function synchronizeLocationChances() {
  const locationsByArea = JSON.parse(await fs.promises.readFile(LOCATIONS_BY_AREA_OUTPUT, 'utf8'));
  const pokemonLocations = JSON.parse(await fs.promises.readFile(LOCATIONS_DATA_PATH, 'utf8'));

  // Helper to normalize area names for matching
  function normalizeArea(area: string): string {
    return area
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  for (const [pokemon, rawData] of Object.entries(pokemonLocations)) {
    const data = rawData as PokemonLocationData;
    // Handle base form locations
    if (Array.isArray(data.locations)) {
      for (const loc of data.locations) {
        const areaName = normalizeArea(loc.area ?? "");
        const method = loc.method || 'unknown';
        const time = loc.time || 'any';
        const level = loc.level;
        // Find matching slot in locations_by_area.json
        const areaObj = locationsByArea[areaName]?.pokemon?.[pokemon]?.methods?.[method]?.times?.[time];
        if (areaObj) {
          // Find matching slot by level and (optionally) formName
          const match = areaObj.find(
            (slot: EncounterDetail) => String(slot.level) === String(level) && (loc.formName == null || slot.formName === loc.formName)
          );
          if (match) {
            loc.chance = match.chance;
          }
        }
      }
    }
    // Handle alternate forms
    if (data.forms) {
      for (const [, formData] of Object.entries(data.forms)) {
        if (Array.isArray(formData.locations)) {
          for (const loc of formData.locations) {
            const areaName = normalizeArea(loc.area ?? "");
            const method = loc.method || 'unknown';
            const time = loc.time || 'any';
            const level = loc.level;
            const areaObj = locationsByArea[areaName]?.pokemon?.[pokemon]?.methods?.[method]?.times?.[time];
            if (areaObj) {
              const match = areaObj.find(
                (slot: EncounterDetail) => String(slot.level) === String(level) && (loc.formName == null || slot.formName === loc.formName)
              );
              if (match) {
                loc.chance = match.chance;
              }
            }
          }
        }
      }
    }
  }

  // Write updated pokemon_locations.json
  await fs.promises.writeFile(
    LOCATIONS_DATA_PATH,
    JSON.stringify(pokemonLocations, null, 2)
  );
  console.log('Synchronized encounter rates in pokemon_locations.json');
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
