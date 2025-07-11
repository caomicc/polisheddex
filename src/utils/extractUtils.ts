import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { convertEggGroupCode, convertGenderCode, convertGrowthRateCode, convertHatchCode, normalizeAsmLabelToMoveKey, normalizeMonName, standardizePokemonKey, toCapitalCaseWithSpaces, toTitleCase } from './stringUtils.ts';
import type { DetailedStats, LocationEntry, PokemonDexEntry } from '../types/types.ts';
import { KNOWN_FORMS } from '../data/constants.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EGG_MOVES_OUTPUT = path.join(__dirname, '../../output/pokemon_egg_moves.json');
const POKEDEX_ENTRIES_OUTPUT = path.join(__dirname, '../../output/pokemon_pokedex_entries.json');
const MOVE_DESCRIPTIONS_OUTPUT = path.join(__dirname, '../../output/pokemon_move_descriptions.json');
const ABILITY_DESCRIPTIONS_OUTPUT = path.join(__dirname, '../../output/pokemon_ability_descriptions.json');

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

  return baseName;
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
  const descMap: Record<string, string> = {};
  let currentLabels: string[] = [];
  let collecting = false;
  let buffer: string[] = [];
  for (const line of descLines) {
    const labelMatch = line.match(/^([A-Za-z0-9_]+)Description:/);
    if (labelMatch) {
      if (currentLabels.length && buffer.length) {
        for (const label of currentLabels) {
          const normalizedLabel = normalizeAsmLabelToMoveKey(label);
          descMap[normalizedLabel] = buffer.join(' ');
        }
      }
      // Start a new group of labels
      const normalizedLabel = normalizeAsmLabelToMoveKey(labelMatch[1]);
      currentLabels = [normalizedLabel];
      buffer = [];
      collecting = false;
    } else if (line.match(/^\s*[A-Za-z0-9_]+Description:/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)Description:/);
      if (match) {
        const extraLabel = normalizeAsmLabelToMoveKey(match[1]);
        currentLabels.push(extraLabel);
      }
    } else if (line.trim().startsWith('text ')) {
      collecting = true;
      buffer.push(line.replace('text ', '').replace(/"/g, ''));
    } else if (line.trim().startsWith('next ')) {
      buffer.push(line.replace('next ', '').replace(/"/g, ''));
    } else if (line.trim().startsWith('done')) {
      collecting = false;
    } else if (collecting && line.trim()) {
      buffer.push(line.trim().replace(/"/g, ''));
    }
  }
  if (currentLabels.length && buffer.length) {
    for (const label of currentLabels) {
      const normalizedLabel = normalizeAsmLabelToMoveKey(label);
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
      const power = parseInt(match[2], 10);
      const type = typeEnumToName[match[3]] || 'None';
      const accuracy = parseInt(match[4], 10);
      const pp = parseInt(match[5], 10);
      const category = categoryEnumToName[match[6]] || 'Unknown';
      moveStats[move] = { type, pp, power, category, accuracy };
    }
  }

  // Map move names to their description by label name
  const moveDescByName: Record<string, { description: string; type: string; pp: number; power: number; category: string; accuracy: number }> = {};
  // Define normalized groups for shared descriptions
  const sharedDescriptionGroups: Record<string, string[]> = {
    paralysis: [
      'BODY_SLAM', 'THUNDER_SHOCK', 'THUNDERBOLT', 'THUNDER', 'LICK', 'SPARK'
    ],
    freeze: [
      'ICE_BEAM', 'BLIZZARD'
    ],
    confuse: [
      'PSYBEAM', 'CONFUSION', 'DIZZY_PUNCH', 'WATER_PULSE', 'HURRICANE'
    ],
    flinch: [
      'STOMP', 'HEADBUTT', 'BITE', 'WATERFALL', 'ROCK_SLIDE', 'HYPER_FANG', 'AIR_SLASH', 'IRON_HEAD', 'ZEN_HEADBUTT', 'EXTRA_SENSORY', 'DARK_PULSE', 'ASTONISH', 'ICICLE_CRASH'
    ],
    poison: [
      'POISON_STING', 'SLUDGE_BOMB', 'POISON_JAB', 'GUNK_SHOT'
    ],
    burn: [
      'EMBER', 'FLAME_THROWER', 'FIRE_BLAST', 'SACRED_FIRE', 'SCALD'
    ],
    statdown_spdef: [
      'ACID', 'PSYCHIC_M', 'SHADOW_BALL', 'BUG_BUZZ', 'EARTH_POWER', 'ENERGY_BALL', 'FLASH_CANNON', 'FOCUS_BLAST'
    ],
    statdown_def: [
      'CRUNCH', 'IRON_TAIL'
    ],
    statdown_atk: [
      'AURORA_BEAM', 'PLAY_ROUGH'
    ],
    statdown_speed: [
      'BUBBLE_BEAM', 'BULLDOZE', 'ICY_WIND'
    ],
    statdown_acc: [
      'MUD_SLAP', 'OCTAZOOKA', 'SMOKESCREEN', 'FLASH'
    ],
    confuse2: [
      'CONFUSE_RAY', 'SUPERSONIC', 'SWEET_KISS'
    ],
    sleep: [
      'SING', 'SLEEP_POWDER', 'HYPNOSIS'
    ],
    sleep2: [
      'SPORE'
    ],
    paralyze: [
      'STUN_SPORE', 'GLARE'
    ],
    burn2: [
      'WILL_O_WISP'
    ],
    poison2: [
      'POISON_POWDER'
    ],
    leveldamage: [
      'SEISMIC_TOSS', 'NIGHT_SHADE'
    ]
  };
  // Reverse lookup for quick group membership
  const moveToGroup: Record<string, string> = {};
  for (const [group, moves] of Object.entries(sharedDescriptionGroups)) {
    for (const move of moves) {
      moveToGroup[move] = group;
    }
  }
  for (let i = 0; i < moveNames.length; i++) {
    const moveKey = moveNames[i].toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    // Try direct match first
    let desc = descMap[moveKey] || '';
    // If not found, try to find a description from the normalized group
    if (!desc && moveToGroup[moveKey]) {
      const group = moveToGroup[moveKey];
      const groupMoves = sharedDescriptionGroups[group];
      for (const gMove of groupMoves) {
        if (descMap[gMove]) {
          desc = descMap[gMove];
          break;
        }
      }
    }
    const stats = moveStats[moveKey] || { type: 'None', pp: 0, power: 0, category: 'Unknown', accuracy: 0 };
    const prettyName = toCapitalCaseWithSpaces(moveKey);
    moveDescByName[prettyName] = {
      description: desc,
      type: stats.type,
      pp: stats.pp,
      power: stats.power,
      category: stats.category,
      accuracy: stats.accuracy === -1 ? '--' : stats.accuracy // -1 means always lands, show as --
    };
  }

  // --- Ensure all moves in a shared group get the same description ---
  for (const groupMoves of Object.values(sharedDescriptionGroups)) {
    // Find the first move in the group that has a description
    let groupDesc = '';
    for (const gMove of groupMoves) {
      if (descMap[gMove]) {
        groupDesc = descMap[gMove];
        break;
      }
    }
    if (groupDesc) {
      for (const gMove of groupMoves) {
        const prettyName = toCapitalCaseWithSpaces(gMove);
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
    basePokemonName: toTitleCase(basePokemonName),
    formName
  };
}
// --- Detailed Stats Extraction ---
export function extractDetailedStats(): Record<string, DetailedStats> {
  const detailedStatsDir = path.join(__dirname, '../../rom/data/pokemon/base_stats');
  const detailedStatsFiles = fs.readdirSync(detailedStatsDir).filter(f => f.endsWith('.asm'));

  const detailedStats: Record<string, DetailedStats> = {};

  for (const file of detailedStatsFiles) {
    const fileName = file.replace('.asm', '');
    const content = fs.readFileSync(path.join(detailedStatsDir, file), 'utf8');
    const lines = content.split(/\r?\n/);

    // Extract the Pokemon name from the file name
    const { basePokemonName, formName } = extractFormInfo(fileName);
    const pokemonName = formName ? `${basePokemonName}${formName}` : basePokemonName;

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
      }

      // Extract abilities - Format: abilities_for POKEMON, ABILITY1, ABILITY2, HIDDEN_ABILITY
      const abilitiesLine = lines.find(l => l.trim().startsWith('abilities_for'));
      const abilities: string[] = [];

      if (abilitiesLine) {
        // Split by commas, but skip the first part which is the Pokémon name
        const abilityParts = abilitiesLine.split(',').slice(1);
        for (const part of abilityParts) {
          const ability = part.trim();
          if (ability) {
            abilities.push(ability);
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
      detailedStats[pokemonName] = {
        baseStats,
        catchRate,
        baseExp,
        heldItems,
        genderRatio,
        hatchRate,
        abilities,
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
  detailedStats: Record<string, unknown>
): Record<string, unknown> {
  // Example line: body_data   7,   69, QUADRUPED,    GREEN  ; BULBASAUR
  const bodyDataRegex = /body_data\s+(\d+),\s*(\d+),\s*([A-Z_]+),\s*([A-Z_]+)\s*;\s*(.+)/;
  const match = line.match(bodyDataRegex);
  if (!match) return detailedStats;

  const [, height, weight, shape, color, name] = match;

  // Add body data to detailedStats
  return {
    ...detailedStats,

    height: Number(height),
    weight: Number(weight),
    bodyShape: toTitleCase(shape),
    bodyColor: toTitleCase(color),
    // Optionally add name if needed
    name,
    // name,
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
  const nameIds = namesData.split(/\r?\n/)
    .filter(l => l.trim().startsWith('dw '))
    .map(l => l.trim().replace('dw ', ''))
    .filter(Boolean);

  // Then get the actual string names from the rawchar definitions
  const abilityNameMap: Record<string, string> = {};
  const rawNameMatches = namesData.matchAll(/^(\w+):\s+rawchar\s+"([^@]+)@"/gm);

  // Debug the rawchar matching
  console.log('Raw name matches found:', [...namesData.matchAll(/^(\w+):\s+rawchar\s+"([^@]+)@"/gm)].length);

  for (const match of rawNameMatches) {
    const [, id, name] = match;
    abilityNameMap[id] = name;
  }

  console.log('Ability name map entries:', Object.keys(abilityNameMap).length);

  // Map the ids to their corresponding names
  const abilityNames = nameIds.map(id => abilityNameMap[id] || id);

  console.log('Ability names parsed:', abilityNames.length, 'abilities');

  // Parse descriptions by label name
  const descLines = descData.split(/\r?\n/);
  const descMap: Record<string, string> = {};
  let currentLabels: string[] = [];
  let collecting = false;
  let buffer: string[] = [];
  for (const line of descLines) {
    const labelMatch = line.match(/^([A-Za-z0-9_]+)Description:/);
    if (labelMatch) {
      if (currentLabels.length && buffer.length) {
        for (const label of currentLabels) {
          const normalizedLabel = label.toUpperCase();
          descMap[normalizedLabel] = buffer.join(' ');
        }
      }
      // Start a new group of labels
      const normalizedLabel = labelMatch[1].toUpperCase();
      currentLabels = [normalizedLabel];
      buffer = [];
      collecting = false;
    } else if (line.match(/^\s*[A-Za-z0-9_]+Description:/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)Description:/);
      if (match) {
        const extraLabel = match[1].toUpperCase();
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
      const normalizedLabel = label.toUpperCase();
      descMap[normalizedLabel] = buffer.join(' ');
    }
  }

  // Map ability names to their description
  const abilityDescByName: Record<string, { description: string }> = {};
  for (let i = 0; i < abilityNames.length; i++) {
    const abilityKey = abilityNames[i].toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const desc = descMap[abilityKey] || '';
    const prettyName = toCapitalCaseWithSpaces(abilityKey);
    abilityDescByName[prettyName] = {
      description: desc
    };
  }

  // Handle special cases where descriptions are shared
  const sharedDescriptionGroups: Record<string, string[]> = {
    'Battle Armor': ['Shell Armor'],
    'Cloud Nine': ['Air Lock'],
    'Insomnia': ['Vital Spirit'],
    'Immunity': ['Pastel Veil'],
    'Clear Body': ['White Smoke'],
    'Filter': ['Solid Rock'],
  };

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

        // Handle level values
        if (dataMatch[3].includes('LEVEL_FROM_BADGES')) {
          const modifier = dataMatch[3].match(/LEVEL_FROM_BADGES\s*([\+\-]\s*\d+)?/);
          if (modifier && modifier[1]) {
            level = `Level from badges ${modifier[1].trim()}`;
          } else {
            level = 'Level from badges';
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
