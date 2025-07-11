import type { BaseData, DetailedStats, Evolution, EvoRaw, LocationEntry, Move, PokemonDataV2, PokemonDataV3, PokemonDexEntry } from './src/types/types.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define all known Pokémon form types in one place for consistency
const KNOWN_FORMS = {
  ALOLAN: 'alolan',
  GALARIAN: 'galarian',
  HISUIAN: 'hisuian',
  GALAR: 'galar',
  HISUI: 'hisui',
  PLAIN: 'plain',
  RED: 'red',
  ARMORED: 'armored',
  BLOODMOON: 'bloodmoon',
  PALDEAN: 'paldean',
  PALDEAN_FIRE: 'paldean_fire',
  PALDEAN_WATER: 'paldean_water'
};

// Output file paths
const MOVE_DESCRIPTIONS_OUTPUT = path.join(__dirname, 'pokemon_move_descriptions.json');
const EGG_MOVES_OUTPUT = path.join(__dirname, 'pokemon_egg_moves.json');
const BASE_DATA_OUTPUT = path.join(__dirname, 'pokemon_base_data.json');
const EVOLUTION_OUTPUT = path.join(__dirname, 'pokemon_evolution_data.json');
const LEVEL_MOVES_OUTPUT = path.join(__dirname, 'pokemon_level_moves.json');
const LOCATIONS_OUTPUT = path.join(__dirname, 'pokemon_locations.json');
const POKEDEX_ENTRIES_OUTPUT = path.join(__dirname, 'pokemon_pokedex_entries.json');
const DETAILED_STATS_OUTPUT = path.join(__dirname, 'pokemon_detailed_stats.json');
const ABILITY_DESCRIPTIONS_OUTPUT = path.join(__dirname, 'pokemon_ability_descriptions.json');


function extractAbilityDescriptions() {
  const abilityNamesPath = path.join(__dirname, 'data/abilities/names.asm');
  const abilityDescriptionsPath = path.join(__dirname, 'data/abilities/descriptions.asm');

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

extractAbilityDescriptions();


// Helper to convert move names to Capital Case with spaces
function toCapitalCaseWithSpaces(str: string) {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Helper to normalize ASM labels to move keys (e.g., BatonPass -> BATON_PASS, Psybeam -> PSY_BEAM)
function normalizeAsmLabelToMoveKey(label: string) {
  return label
    .replace(/DESCRIPTION$/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2') // lowerUpper -> lower_Upper
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // ABBRWord -> ABBR_Word
    .toUpperCase();
}

function extractMoveDescriptions() {
  const moveNamesPath = path.join(__dirname, 'data/moves/names.asm');
  const moveDescriptionsPath = path.join(__dirname, 'data/moves/descriptions.asm');
  const moveStatsPath = path.join(__dirname, 'data/moves/moves.asm');

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
    } else if (line.trim() === 'done') {
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

// --- New code for extracting move descriptions ---
extractMoveDescriptions();

const filePath = path.join(__dirname, 'data/pokemon/evos_attacks.asm');

const data = fs.readFileSync(filePath, 'utf8');
const lines = data.split(/\r?\n/);


// --- Move Description Map ---
// Read move descriptions from the generated JSON file
const moveDescriptionsPath = path.join(__dirname, 'pokemon_move_descriptions.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let moveDescriptions: Record<string, any> = {};
if (fs.existsSync(moveDescriptionsPath)) {
  moveDescriptions = JSON.parse(fs.readFileSync(moveDescriptionsPath, 'utf8'));
}

const evoMap: Record<string, EvoRaw[]> = {};
const preEvoMap: Record<string, string[]> = {};
const result: Record<string, { moves: Move[] }> = {};

let currentMonV2: string | null = null;
let movesV2: Move[] = [];
let evoMethods: EvoRaw[] = [];

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .replace(/(^|_|\s|-)([a-z])/g, (_, sep, c) => sep + c.toUpperCase())
    .replace(/_/g, '');
}

for (const lineRaw of lines) {
  const line = lineRaw.trim();
  if (line.startsWith('evos_attacks ')) {
    if (currentMonV2) {
      result[toTitleCase(currentMonV2)] = {
        moves: movesV2
      };
      if (evoMethods.length) {
        evoMap[toTitleCase(currentMonV2)] = evoMethods.map(e => ({
          ...e,
          target: toTitleCase(e.target),
          form: e.form ? toTitleCase(e.form) : undefined
        }));
        for (const evo of evoMethods) {
          const tgt = toTitleCase(evo.target);
          if (!preEvoMap[tgt]) preEvoMap[tgt] = [];
          preEvoMap[tgt].push(toTitleCase(currentMonV2));
        }
      }
    }
    currentMonV2 = line.split(' ')[1];
    movesV2 = [];
    evoMethods = [];
  } else if (line.startsWith('evo_data ')) {
    // Example: evo_data EVOLVE_LEVEL, 16, IVYSAUR
    // Or: evo_data EVOLVE_ITEM, MOON_STONE, NIDOQUEEN
    // Or: evo_data EVOLVE_ITEM, THUNDERSTONE, RAICHU, PLAIN_FORM
    const evoMatch = line.match(/evo_data (\w+), ([^,]+), ([^,\s]+)(?:, ([^,\s]+))?/);
    if (evoMatch) {
      const [, method, param, target, form] = evoMatch;
      let parsedParam: string | number = param.trim();
      if (method === 'EVOLVE_LEVEL' && /^\d+$/.test(param.trim())) {
        parsedParam = parseInt(param.trim(), 10);
      }
      evoMethods.push({
        method,
        parameter: parsedParam,
        target: target.trim(),
        ...(form ? { form: form.trim() } : {})
      });
    }
  } else if (line.startsWith('learnset ')) {
    const match = line.match(/learnset (\d+),\s*([A-Z0-9_]+)/);
    if (match) {
      const level = parseInt(match[1], 10);
      const moveKey = match[2];
      const prettyName = toCapitalCaseWithSpaces(moveKey);
      const info = moveDescriptions[prettyName]
        ? {
          description: moveDescriptions[prettyName].description,
          type: moveDescriptions[prettyName].type,
          pp: moveDescriptions[prettyName].pp,
          power: moveDescriptions[prettyName].power,
          accuracy: moveDescriptions[prettyName].accuracy,
          effectPercent: moveDescriptions[prettyName].effectPercent,
          category: moveDescriptions[prettyName].category
        }
        : undefined;
      movesV2.push({
        name: prettyName,
        level,
        ...(info ? { info } : {}),
      });
    }
  }
}
if (currentMonV2) {
  result[toTitleCase(currentMonV2)] = {
    moves: movesV2
  };
  if (evoMethods.length) {
    evoMap[toTitleCase(currentMonV2)] = evoMethods.map(e => ({
      ...e,
      target: toTitleCase(e.target),
      form: e.form ? toTitleCase(e.form) : undefined
    }));
    for (const evo of evoMethods) {
      const tgt = toTitleCase(evo.target);
      if (!preEvoMap[tgt]) preEvoMap[tgt] = [];
      preEvoMap[tgt].push(toTitleCase(currentMonV2));
    }
  }
}

// Helper to standardize Pokemon key names across the codebase
function standardizePokemonKey(name: string): string {
  // Special handling for Paldean forms that need specific treatment
  if (name.toLowerCase().includes(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase())) {
    return toTitleCase(name.substring(0, name.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase())).toLowerCase());
  } else if (name.toLowerCase().includes(KNOWN_FORMS.PALDEAN_WATER.toLowerCase())) {
    return toTitleCase(name.substring(0, name.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_WATER.toLowerCase())).toLowerCase());
  }

  // Create a regex pattern using all the known forms from our constant
  const formSuffixPattern = new RegExp(`(${Object.values(KNOWN_FORMS).join('|')})$`, 'i');

  // Remove any form suffixes
  const baseName = name.replace(formSuffixPattern, '');

  // Convert to title case and remove any case inconsistencies
  return toTitleCase(baseName.toLowerCase());
}

// Non-recursive function to build the complete evolution chain
function buildCompleteEvolutionChain(startMon: string): string[] {
  // This map will keep track of which Pokémon we've already processed
  const processedMons = new Set<string>();

  // Starting with the requested Pokémon
  const standardizedStartMon = standardizePokemonKey(startMon);
  const queue: string[] = [standardizedStartMon];
  const chain: string[] = [];

  // Also check for form variations of the starting Pokémon
  // This helps with Pokémon like "GrowlithePlain" vs "Growlithe"
  for (const key of Object.keys(evoMap)) {
    const standardKey = standardizePokemonKey(key);
    if (standardKey === standardizedStartMon && key !== standardizedStartMon) {
      queue.push(key);
    }
  }

  for (const key of Object.keys(preEvoMap)) {
    const standardKey = standardizePokemonKey(key);
    if (standardKey === standardizedStartMon && key !== standardizedStartMon) {
      queue.push(key);
    }
  }

  // Process Pokémon in breadth-first order
  while (queue.length > 0) {
    const currentMon = queue.shift()!;
    // Always standardize to remove form suffixes
    const standardMon = standardizePokemonKey(currentMon);
    const { baseName } = normalizeMonName(standardMon, null);

    // Skip if we've already processed this Pokémon
    if (processedMons.has(baseName)) continue;
    processedMons.add(baseName);

    // Add to our evolution chain if not already included
    if (!chain.includes(baseName)) {
      chain.push(baseName);
    }

    // Check for any pre-evolutions, including form variants
    // We need to check both the standardized name and possibly the original name with form
    for (const [preKey, preEvos] of Object.entries(preEvoMap)) {
      // Check if this entry matches our current Pokémon (either exact or standardized)
      const standardPreKey = standardizePokemonKey(preKey);
      if (preKey === currentMon || standardPreKey === standardMon) {
        // Add all its pre-evolutions to the queue
        for (const pre of preEvos) {
          const standardPre = standardizePokemonKey(pre);
          if (!processedMons.has(standardPre)) {
            queue.push(pre);
          }
        }
      }
    }

    // Check for any evolutions, including form variants
    for (const [evoKey, evos] of Object.entries(evoMap)) {
      // Check if this entry matches our current Pokémon (either exact or standardized)
      const standardEvoKey = standardizePokemonKey(evoKey);
      if (evoKey === currentMon || standardEvoKey === standardMon) {
        // Add all its evolutions to the queue
        for (const evo of evos) {
          const targetMon = standardizePokemonKey(evo.target);
          if (!processedMons.has(targetMon)) {
            queue.push(evo.target);
          }
        }
      }
    }
  }

  // Sort the chain to put earliest evolutions first
  return sortEvolutionChain(chain);
}

// Helper to sort the evolution chain properly
function sortEvolutionChain(chain: string[]): string[] {
  // Create a dependency graph for topological sorting
  const graph: Record<string, Set<string>> = {};

  // Initialize all nodes
  for (const mon of chain) {
    graph[mon] = new Set<string>();
  }

  // First pass: Add direct evolution connections to the graph
  for (const mon of chain) {
    const standardMon = standardizePokemonKey(mon);

    // Check all entries in evoMap for matches (considering form variations)
    for (const [evoKey, evos] of Object.entries(evoMap)) {
      const standardEvoKey = standardizePokemonKey(evoKey);

      // If this is the Pokémon we're looking at (either exact or standardized)
      if (evoKey === mon || standardEvoKey === standardMon) {
        // For each of its evolutions
        for (const evo of evos) {
          const targetMon = standardizePokemonKey(evo.target);

          // If the target is in our chain, add the dependency
          if (chain.includes(targetMon)) {
            graph[mon].add(targetMon); // mon evolves into target
          }
        }
      }
    }

    // Check all entries in preEvoMap for matches (considering form variations)
    for (const [preKey, preEvos] of Object.entries(preEvoMap)) {
      const standardPreKey = standardizePokemonKey(preKey);

      // If this is the Pokémon we're looking at (either exact or standardized)
      if (preKey === mon || standardPreKey === standardMon) {
        // For each of its pre-evolutions
        for (const pre of preEvos) {
          const standardPre = standardizePokemonKey(pre);

          // If the pre-evolution is in our chain, add the dependency
          if (chain.includes(standardPre)) {
            graph[standardPre].add(mon); // pre evolves into mon
          }
        }
      }
    }
  }

  // Manual sorting based on evolution relationships
  const sortedChain: string[] = [];
  const addedNodes = new Set<string>();

  // Helper function to add a node and all its descendants
  function addNodeAndDescendants(node: string) {
    if (addedNodes.has(node)) return;
    addedNodes.add(node);
    sortedChain.push(node);

    // Add all evolutions of this node
    for (const nextNode of graph[node]) {
      if (!addedNodes.has(nextNode)) {
        addNodeAndDescendants(nextNode);
      }
    }
  }

  // Find nodes with no incoming edges (base forms)
  const baseNodes: string[] = [];
  for (const node of chain) {
    let hasIncoming = false;
    for (const outgoingNodes of Object.values(graph)) {
      if (outgoingNodes.has(node)) {
        hasIncoming = true;
        break;
      }
    }
    if (!hasIncoming) {
      baseNodes.push(node);
    }
  }

  // Add base nodes first, followed by their evolutions
  for (const node of baseNodes) {
    addNodeAndDescendants(node);
  }

  // Add any remaining nodes that weren't connected
  for (const node of chain) {
    if (!addedNodes.has(node)) {
      sortedChain.push(node);
    }
  }

  return sortedChain;
}

function getEvolutionChain(mon: string): string[] {
  // Use the new non-recursive approach to build a complete chain
  return buildCompleteEvolutionChain(mon);
}

// --- Dex number helpers ---

function parseDexEntries(file: string): string[] {
  // Accepts a file path to a dex order file and returns an array of TitleCase names in order
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const names: string[] = [];

  // Keep track of Pokemon that have been processed to avoid duplicates
  const processedBaseNames = new Set<string>();

  // Check if this is a dp-style file (dex_order_new.asm) or a SECTION-style file (dex_entries.asm)
  const isOrderStyle = text.includes('dp ');

  for (const line of lines) {
    if (isOrderStyle) {
      // Look for lines with dp POKEMON_NAME format
      const match = line.match(/dp ([A-Z0-9_]+)/);
      if (match) {
        const name = toTitleCase(match[1]);
        if (!processedBaseNames.has(name)) {
          processedBaseNames.add(name);
          names.push(name);
        }
      }
    } else {
      // Look for lines with SECTION "PokemonNamePokedexEntry" format
      const match = line.match(/SECTION "([A-Za-z0-9_]+)PokedexEntry"/);
      if (match) {
        let name = match[1];

        // Remove form suffixes from names
        for (const form of Object.values(KNOWN_FORMS)) {
          const formCapitalized = form.charAt(0).toUpperCase() + form.slice(1);
          if (name.endsWith(formCapitalized)) {
            name = name.slice(0, name.length - formCapitalized.length);
            break;
          }
        }

        // Convert to TitleCase
        name = toTitleCase(name);

        if (!processedBaseNames.has(name)) {
          processedBaseNames.add(name);
          names.push(name);
        }
      }
    }
  }
  return names;
}

// Parse both National and Johto (New) Dex orders
const nationalDexOrder = parseDexEntries(path.join(__dirname, 'data/pokemon/dex_entries.asm'));
const johtoDexOrder = parseDexEntries(path.join(__dirname, 'data/pokemon/dex_order_new.asm'));

// Log the first few entries of each dex for verification
console.log('First 10 entries in National Dex:', nationalDexOrder.slice(0, 10));
console.log('First 10 entries in Johto Dex:', johtoDexOrder.slice(0, 10));

// --- Type Extraction ---
const baseStatsDir = path.join(__dirname, 'data/pokemon/base_stats');
const typeMap: Record<string, string[]> = {};
// Create a map to track form-specific type data
const formTypeMap: Record<string, Record<string, string[]>> = {};
const typeEnumToName: Record<string, string> = {
  'NORMAL': 'Normal', 'FIGHTING': 'Fighting', 'FLYING': 'Flying', 'POISON': 'Poison', 'GROUND': 'Ground',
  'ROCK': 'Rock', 'BUG': 'Bug', 'GHOST': 'Ghost', 'STEEL': 'Steel', 'FIRE': 'Fire', 'WATER': 'Water',
  'GRASS': 'Grass', 'ELECTRIC': 'Electric', 'PSYCHIC': 'Psychic', 'ICE': 'Ice', 'DRAGON': 'Dragon',
  'DARK': 'Dark', 'FAIRY': 'Fairy', 'SHADOW': 'Shadow', 'NONE': 'None'
};

// Helper function to extract form and base name information from a file name
function extractFormInfo(fileName: string): { basePokemonName: string, formName: string | null } {
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

// Debug flag for tracking Pokémon type processing
const DEBUG_POKEMON = ['Growlithe', 'Raichu', 'Arcanine', 'Diglett', 'Dugtrio', 'Meowth', 'Persian', 'Exeggutor', 'Marowak', 'Slowbro', 'Slowking', 'Qwilfish', 'Dudunsparce'];

// Load all base stats files
const baseStatsFiles = fs.readdirSync(baseStatsDir).filter(f => f.endsWith('.asm'));

// First pass: Process all files to extract type information
for (const file of baseStatsFiles) {
  const fileName = file.replace('.asm', '');
  const content = fs.readFileSync(path.join(baseStatsDir, file), 'utf8');

  // Extract type information from the file
  const typeLine = content.split(/\r?\n/).find(l => l.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/));
  if (!typeLine) continue;

  const match = typeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
  if (!match) continue;

  // Convert type enums to proper type names
  const t1 = typeEnumToName[match[1]] || 'None';
  const t2 = typeEnumToName[match[2]] || 'None';

  // Extract base Pokémon name and form name
  const { basePokemonName, formName } = extractFormInfo(fileName);

  // Enhanced debugging for specific Pokémon
  const isDebug = DEBUG_POKEMON.includes(basePokemonName);
  if (isDebug) {
    console.log(`DEBUG ${fileName}: basePokemonName=${basePokemonName}, formName=${formName}, types=${t1},${t2}`);
  }

  // Special handling for "_plain" files
  if (fileName.endsWith('_plain')) {
    // For "_plain" files, we want to store the type under the base name without "_plain"
    const baseNameWithoutPlain = toTitleCase(fileName.replace(/_plain$/, ''));

    typeMap[baseNameWithoutPlain] = [t1, t2];

    if (isDebug) {
      console.log(`DEBUG: Setting typeMap['${baseNameWithoutPlain}'] = [${t1}, ${t2}]`);
    }
  } else if (formName && formName !== null) {
    // This is a non-plain form (e.g., raichu_alolan.asm)
    if (!formTypeMap[basePokemonName]) {
      formTypeMap[basePokemonName] = {};
    }
    if (isDebug) {
      console.log(`DEBUG: Processing ${fileName} as special form ${formName} for ${basePokemonName}, types: ${t1}, ${t2}`);
    }
    formTypeMap[basePokemonName][formName] = [t1, t2];
  } else {
    // This is a regular base Pokémon file (e.g., raichu.asm)
    if (isDebug) {
      console.log(`DEBUG: Processing ${fileName} as base Pokémon ${basePokemonName}, types: ${t1}, ${t2}`);
    }
    typeMap[basePokemonName] = [t1, t2];
  }
}

const finalResult: Record<string, PokemonDataV2 & { nationalDex: number | null, johtoDex: number | null, types: string | string[] }> = {};
for (const mon of Object.keys(result)) {
  // Normalize move names in evolution moves
  const moves = result[mon].moves.map(m => ({
    name: m.name,
    level: m.level,
    ...(m.info ? { info: m.info } : {})
  }));
  // Standardize the Pokemon name to ensure consistent keys
  const standardMon = standardizePokemonKey(mon);

  // Every Pokémon should have an evolution object, even if it's a final evolution
  // with no further evolutions. This ensures we have a chain for all Pokémon.
  const methods = evoMap[standardMon] ? evoMap[standardMon].map(e => ({
    method: e.method,
    parameter: e.parameter,
    target: standardizePokemonKey(e.target),
    ...(e.form ? { form: e.form } : {})
  })) : [];

  // Get the evolution chain - this will work even for final evolutions
  // as it will include all pre-evolutions
  const chain = getEvolutionChain(standardMon);

  // If the chain contains only the current Pokémon and there are no methods,
  // it could be a basic Pokémon with no evolutions
  const evolution: Evolution = { methods, chain };
  // Dex numbers (1-based, null if not found)
  // First get the base name by removing any form suffixes
  const baseMonName = standardizePokemonKey(mon);
  const nationalDex = nationalDexOrder.indexOf(baseMonName) >= 0 ? nationalDexOrder.indexOf(baseMonName) + 1 : null;
  const johtoDex = johtoDexOrder.indexOf(baseMonName) >= 0 ? johtoDexOrder.indexOf(baseMonName) + 1 : null;  // Types

  // Determine if this is a form and extract the base name and form name
  let basePokemonName = baseMonName;
  let formName: string | null = null;

  // Check if this is a form by checking for known form suffixes
  for (const form of Object.values(KNOWN_FORMS)) {
    if (mon.toLowerCase().endsWith(form.toLowerCase())) {
      basePokemonName = mon.substring(0, mon.length - form.length);
      formName = form;
      break;
    }
  }

  // Get types based on whether this is a base form or a special form
  let types: string | string[];

  if (formName && formName !== KNOWN_FORMS.PLAIN) {
    // This is a special form like alolan, galarian, etc.
    if (formTypeMap[basePokemonName] && formTypeMap[basePokemonName][formName]) {
      // Use form-specific type data from formTypeMap
      types = formTypeMap[basePokemonName][formName];
      // console.log(`Using form types for ${mon} (${basePokemonName} + ${formName}): ${types.join(', ')}`);
    } else {
      // Fallback to base type if form type not found
      types = typeMap[basePokemonName] || ['None', 'None'];
      // console.log(`Form type not found for ${mon}, falling back to base type: ${types.join(', ')}`);
    }
  } else {
    // This is a base form or plain form - look up directly in typeMap
    types = typeMap[baseMonName] || ['None', 'None'];
    // console.log(`Using base type for ${mon}: ${types.join(', ')}`);
  }

  // Remove duplicates and handle 'None'
  types = Array.from(new Set(types)).filter(t => t !== 'None');

  if (types.length === 0) {
    types = 'Unknown';
  } else if (types.length === 1) {
    types = types[0];
  }

  // Create the final result with the correct types
  finalResult[mon] = { evolution, moves, nationalDex, johtoDex, types };
}

// --- Wild Pokémon Location Extraction ---
// LocationEntry type is now imported from the common types file
const wildDir = path.join(__dirname, 'data/wild');
const wildFiles = fs.readdirSync(wildDir).filter(f => f.endsWith('.asm'));

// Helper to parse wildmon lines
function parseWildmonLine(line: string): { level: string; species: string; form: string | null } | null {
  // Handles: wildmon LEVEL, SPECIES [, FORM]
  const match = line.match(/wildmon ([^,]+), ([A-Z0-9_]+)(?:, ([A-Z0-9_]+))?/);
  if (!match) return null;
  return {
    level: match[1].trim(),
    species: match[2].trim(),
    form: match[3] ? match[3].trim() : null
  };
}

// Helper to normalize Pokémon name and form
function normalizeMonName(name: string, formStr: string | null): { baseName: string; formName: string | null } {
  const baseName = toTitleCase(name);

  // Return normalized form name
  let formName: string | null = null;

  if (formStr) {
    // Convert form constants to our standardized form names
    if (formStr === 'ALOLAN_FORM') {
      formName = KNOWN_FORMS.ALOLAN;
    } else if (formStr === 'GALARIAN_FORM') {
      formName = KNOWN_FORMS.GALARIAN;
    } else if (formStr === 'HISUIAN_FORM') {
      formName = KNOWN_FORMS.HISUIAN;
    } else if (formStr === 'PALDEAN_FORM') {
      formName = KNOWN_FORMS.PALDEAN;
    } else if (formStr === 'TAUROS_PALDEAN_FIRE_FORM') {
      // Log for debugging
      console.log(`Converting TAUROS_PALDEAN_FIRE_FORM to ${KNOWN_FORMS.PALDEAN_FIRE}`);
      formName = KNOWN_FORMS.PALDEAN_FIRE;
    } else if (formStr === 'TAUROS_PALDEAN_WATER_FORM') {
      // Log for debugging
      console.log(`Converting TAUROS_PALDEAN_WATER_FORM to ${KNOWN_FORMS.PALDEAN_WATER}`);
      formName = KNOWN_FORMS.PALDEAN_WATER;
    } else if (formStr === 'PLAIN_FORM' || formStr.includes('PLAIN')) {
      // Skip adding form for plain forms
      formName = null;
    } else {
      // For other forms, use the TitleCase version
      formName = toTitleCase(formStr);
    }
  }

  // // Debug: Log when processing Diglett or if we're in Diglett's Cave
  // if (name === 'DIGLETT' || name === 'DUGTRIO') {
  //   console.log(`Processing: ${name} form: ${formStr || 'null'} -> ${baseName} (form: ${formName})`);
  // }

  return { baseName, formName };
}

// Legacy function for compatibility with existing code
// Will be gradually phased out as we convert the code to use the new structure
function getFullPokemonName(name: string, form: string | null): string {
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

// Aggregate locations by Pokémon
const locationsByMon: { [mon: string]: LocationEntry[] } = {};

console.log('Starting to process wild Pokémon locations...');
for (const file of wildFiles) {
  // console.log(`Processing wild file: ${file}`);
  const filePath = path.join(wildDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  let area: string | null = null;
  let method: string | null = null;
  let time: string | null = null;
  let inBlock = false;
  let blockType: string | null = null;
  let encounterRates: { morn: number; day: number; nite: number; eve?: number } = {
    morn: 0,
    day: 0,
    nite: 0
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Area block start
    const areaMatch = line.match(/^def_(grass|water)_wildmons ([A-Z0-9_]+)/);
    if (areaMatch) {
      area = areaMatch[2];
      method = areaMatch[1];
      inBlock = true;
      blockType = method;
      time = null;
      // Reset encounter rates for new area
      encounterRates = { morn: 0, day: 0, nite: 0 };
      // Debug for Diglett's Cave
      if (area === 'DIGLETTS_CAVE') {
        console.log(`Found DIGLETTS_CAVE area definition on line ${i + 1}`);
      }
      continue;
    }

    // Parse encounter rates line
    if (inBlock && line.match(/^\s*db\s+\d+\s+percent/)) {
      const rateMatches = line.match(/(\d+)\s+percent/g);
      if (rateMatches) {
        if (rateMatches.length >= 3) {
          // Format: db X percent, Y percent, Z percent ; encounter rates: morn/day/nite
          encounterRates.morn = parseInt(rateMatches[0].match(/(\d+)/)![1], 10);
          encounterRates.day = parseInt(rateMatches[1].match(/(\d+)/)![1], 10);
          encounterRates.nite = parseInt(rateMatches[2].match(/(\d+)/)![1], 10);
          // Handle eve if present (some files might have a 4th rate)
          if (rateMatches.length > 3) {
            encounterRates.eve = parseInt(rateMatches[3].match(/(\d+)/)![1], 10);
          }
        } else {
          // Format: db X percent ; encounter rate (for water areas typically)
          const rate = parseInt(rateMatches[0].match(/(\d+)/)![1], 10);
          encounterRates.morn = rate;
          encounterRates.day = rate;
          encounterRates.nite = rate;
          encounterRates.eve = rate;
        }
      }
      continue;
    }

    if (inBlock && line.startsWith('end_' + blockType + '_wildmons')) {
      inBlock = false;
      area = null;
      method = null;
      time = null;
      continue;
    }

    if (inBlock && line.startsWith(';')) {
      // Time of day section
      const t = line.replace(';', '').trim().toLowerCase();
      if (["morn", "day", "nite", "eve"].includes(t)) {
        time = t;
      }
      continue;
    }

    if (inBlock && line.startsWith('wildmon')) {
      const parsed = parseWildmonLine(line);
      if (parsed) {
        const { formName } = normalizeMonName(parsed.species, parsed.form); // Extract form name
        const key = getFullPokemonName(parsed.species, parsed.form); // Use legacy function for now

        if (!locationsByMon[key]) locationsByMon[key] = [];

        // Determine the encounter rate based on time of day
        let encounterRate = 0;
        if (time === 'morn') encounterRate = encounterRates.morn;
        else if (time === 'day') encounterRate = encounterRates.day;
        else if (time === 'nite') encounterRate = encounterRates.nite;
        else if (time === 'eve' && encounterRates.eve !== undefined) encounterRate = encounterRates.eve;
        else encounterRate = encounterRates.day; // Default to day rate if time is unknown

        locationsByMon[key].push({
          area,
          method,
          time,
          level: parsed.level,
          chance: encounterRate, // Use the actual encounter rate
          formName // Add the form name
        });
      }
      continue;
    }
  }
}

// Using the previously defined PokemonDataV3 type
const finalResultV3: Record<string, PokemonDataV3> = {};
for (const mon of Object.keys(finalResult)) {
  finalResultV3[mon] = {
    ...finalResult[mon],
    locations: locationsByMon[mon] || []
  };
}

// Create a grouped data structure combining forms
function groupPokemonForms(pokemonData: Record<string, PokemonDataV3>): Record<string, PokemonDataV3> {
  const groupedData: Record<string, PokemonDataV3> = {};
  const formsByBase: Record<string, Record<string, PokemonDataV3>> = {};

  // console.log('Starting to group Pokémon forms...', pokemonData);

  // Skip entries with 'plain' in the name - we'll merge these later
  const pokemonWithoutPlain: Record<string, PokemonDataV3> = {};
  const plainForms: Record<string, PokemonDataV3> = {};

  // Pre-process to identify plain forms
  for (const [name, data] of Object.entries(pokemonData)) {
    if (name.toLowerCase().endsWith(KNOWN_FORMS.PLAIN)) {
      // Store plain forms separately
      const baseName = name.substring(0, name.length - KNOWN_FORMS.PLAIN.length); // Remove 'plain' suffix
      plainForms[baseName] = data;
    } else {
      // Keep non-plain forms
      pokemonWithoutPlain[name] = data;
    }
  }

  // First pass: Group by base name and identify forms
  for (const [name, data] of Object.entries(pokemonWithoutPlain)) {
    const baseName = extractBasePokemonName(name);

    // console.log(`1 Processing ${name} with base name ${baseName}`);

    // Initialize baseName entry if it doesn't exist
    if (!formsByBase[baseName]) {
      formsByBase[baseName] = {};

      // If we have a plain form for this base name, use it as the default
      if (plainForms[baseName]) {
        formsByBase[baseName]['default'] = plainForms[baseName];
      }
    }

    // Determine form name
    let formName: string | null = null;
    if (name !== baseName) {
      formName = name.substring(baseName.length);
    }

    // Add to the forms collection
    const formKey = formName || 'default';
    formsByBase[baseName][formKey] = data;
  }

  // Add any plain forms that don't have a corresponding base form
  for (const [baseName, data] of Object.entries(plainForms)) {
    if (!formsByBase[baseName]) {
      formsByBase[baseName] = { 'default': data };
    }
  }

  // Second pass: Combine data for each base Pokémon
  for (const [baseName, forms] of Object.entries(formsByBase)) {
    // Start with the default form as the base (plain form or first form)
    const baseForm = forms['default'] || Object.values(forms)[0];

    // console.log(`Processing base form for ${baseName} with default form:`, baseForm);

    // Ensure base form has proper types
    let baseTypes = baseForm.types;

    if (!baseTypes || baseTypes === 'None' || (Array.isArray(baseTypes) && baseTypes.includes('None'))) {
      if (typeMap[baseName]) {
        const types = typeMap[baseName];
        if (types.length === 1 || (types.length === 2 && types[1] === 'None')) {
          baseTypes = types[0];
        } else {
          baseTypes = types;
        }
      }
    }

    // Create the entry for this Pokémon
    groupedData[baseName] = {
      ...baseForm,
      types: baseTypes || baseForm.types,
      forms: {}
    };

    // Add all forms (including the default one)
    for (const [formName, formData] of Object.entries(forms)) {
      if (formName !== 'default') {
        // Check if we have specific type data for this form
        let formTypes = formData.types;

        // If form types are missing or set to None, try to get them from formTypeMap
        if (!formTypes || formTypes === 'None' || (Array.isArray(formTypes) && formTypes.includes('None'))) {
          if (formTypeMap[baseName] && formTypeMap[baseName][formName]) {
            // Use the form-specific type data
            const formTypeArray = formTypeMap[baseName][formName];
            // Handle single type (remove duplicates or 'None')
            if (formTypeArray.length === 1 || (formTypeArray.length === 2 && formTypeArray[1] === 'None')) {
              formTypes = formTypeArray[0];
            } else {
              formTypes = formTypeArray;
            }
          }
        }

        groupedData[baseName].forms![formName] = {
          formName,
          types: formTypes,
          moves: formData.moves,
          locations: formData.locations
        };
      }
    }

    // If there are no non-default forms, clean up the empty forms object
    if (Object.keys(groupedData[baseName].forms!).length === 0) {
      delete groupedData[baseName].forms;
    }
  }

  return groupedData;
}

// Group all Pokemon data
const groupedPokemonData = groupPokemonForms(finalResultV3);

// Extract and save base data (dex number, types)
const baseData: Record<string, BaseData> = {};
for (const [mon, data] of Object.entries(groupedPokemonData)) {

  // Generate the front sprite URL for the base form
  const spriteName = mon.toLowerCase().replace(/[^a-z0-9]/g, '');  // Make sure we have valid type data
  let typeData = data.types;

  // console.log(`Processing ${mon} with initial types: ${typeData}`);

  if (!typeData || typeData === 'None' || (Array.isArray(typeData) && typeData.includes('None'))) {
    // Try to get type from our typeMap
    if (typeMap[mon]) {
      const types = typeMap[mon];
      // Handle single type cases
      if (types.length === 1 || (types.length === 2 && types[1] === 'None')) {
        typeData = types[0];
      } else {
        typeData = Array.from(new Set(types)).filter(t => t !== 'None'); // Remove duplicates and 'None'
        if (typeData.length === 1) {
          typeData = typeData[0]; // Convert to string if only one type
        }
      }
    }
    // Check for _plain file types if we still don't have valid type data
    else {
      console.log(`No type data found for ${mon}, checking for _plain file...`);
      // The Pokémon might only have a _plain file (like Growlithe) but no direct entry in typeMap
      // Construct the filename pattern and check for it in all processed files
      const plainFileName = `${mon.toLowerCase()}_plain`;

      // Look for any base stats files that match this pattern
      const matchingPlainFiles = baseStatsFiles.filter(f =>
        f.toLowerCase().startsWith(plainFileName) && f.endsWith('.asm')
      );

      if (matchingPlainFiles.length > 0) {
        console.log(`Found _plain file for ${mon}: ${matchingPlainFiles[0]}`);

        // Extract type information from the first matching file
        const plainContent = fs.readFileSync(path.join(baseStatsDir, matchingPlainFiles[0]), 'utf8');
        const plainTypeLine = plainContent.split(/\r?\n/).find(l =>
          l.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/)
        );

        if (plainTypeLine) {
          const plainMatch = plainTypeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
          if (plainMatch) {
            const t1 = typeEnumToName[plainMatch[1]] || 'None';
            const t2 = typeEnumToName[plainMatch[2]] || 'None';

            console.log(`Extracted types for ${mon} from _plain file: ${t1}, ${t2}`);

            // Update the type data
            if (t1 === t2 || t2 === 'None') {
              typeData = t1;
            } else {
              typeData = [t1, t2];
            }
          }
        }
      }
    }
  }

  baseData[mon] = {
    name: mon,
    nationalDex: data.nationalDex,
    johtoDex: data.johtoDex,
    types: typeData || "Unknown",
    frontSpriteUrl: `/sprites/pokemon/${spriteName}/front_cropped.png`
  };

  // Add form-specific type data and sprite URL if available
  if (data.forms && Object.keys(data.forms).length > 0) {
    baseData[mon].forms = {};
    for (const [formName, formData] of Object.entries(data.forms)) {
      // Normalize form sprite name: base + form
      const formSpriteName = `${spriteName}_${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;      // Get form type data, with fallbacks
      let formTypeData = formData.types;
      if (!formTypeData || formTypeData === 'None' || (Array.isArray(formTypeData) && formTypeData.includes('None'))) {
        // Try to get from formTypeMap
        if (formTypeMap[mon] && formTypeMap[mon][formName]) {
          const formTypes = formTypeMap[mon][formName];
          if (formTypes.length === 1 || (formTypes.length === 2 && formTypes[1] === 'None')) {
            formTypeData = formTypes[0];
          } else {
            formTypeData = formTypes;
          }
        }
        // If still not found, check directly in the ASM file
        else {
          // Construct the filename pattern for this form
          const formFileName = `${mon.toLowerCase()}_${formName.toLowerCase()}`;

          // Look for any base stats files that match this pattern
          const matchingFormFiles = baseStatsFiles.filter(f =>
            f.toLowerCase().startsWith(formFileName) && f.endsWith('.asm')
          );

          if (matchingFormFiles.length > 0) {
            console.log(`Found form file for ${mon} ${formName}: ${matchingFormFiles[0]}`);

            // Extract type information from the file
            const formContent = fs.readFileSync(path.join(baseStatsDir, matchingFormFiles[0]), 'utf8');
            const formTypeLine = formContent.split(/\r?\n/).find(l =>
              l.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/)
            );

            if (formTypeLine) {
              const formMatch = formTypeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
              if (formMatch) {
                const t1 = typeEnumToName[formMatch[1]] || 'None';
                const t2 = typeEnumToName[formMatch[2]] || 'None';

                console.log(`Extracted types for ${mon} ${formName}: ${t1}, ${t2}`);

                // Update the type data
                if (t1 === t2 || t2 === 'None') {
                  formTypeData = t1;
                } else {
                  formTypeData = [t1, t2];
                }
              }
            }
          }
        }
      }

      // Special case for Alolan Raichu
      if (mon === 'Raichu' && formName === 'alolan' && (!formTypeData || formTypeData === 'Unknown')) {
        console.log('Setting Alolan Raichu types to Electric, Psychic');
        formTypeData = ['Electric', 'Psychic'];
      }

      baseData[mon].forms[formName] = {
        types: formTypeData || 'Unknown',
        frontSpriteUrl: `/sprites/pokemon/${formSpriteName}/front_cropped.png`
      };
    }
  }
}
fs.writeFileSync(BASE_DATA_OUTPUT, JSON.stringify(baseData, null, 2));
console.log('Pokémon base data extracted to', BASE_DATA_OUTPUT);

// Extract and save evolution data
const evolutionData: Record<string, Evolution | null> = {};
for (const [mon, data] of Object.entries(groupedPokemonData)) {
  evolutionData[mon] = data.evolution;
}
fs.writeFileSync(EVOLUTION_OUTPUT, JSON.stringify(evolutionData, null, 2));
console.log('Pokémon evolution data extracted to', EVOLUTION_OUTPUT);

// Extract and save level-up moves
const levelMoves: Record<string, { moves: Move[], forms?: Record<string, { moves: Move[] }> }> = {};
for (const [mon, data] of Object.entries(groupedPokemonData)) {
  levelMoves[mon] = { moves: data.moves };

  // Add form-specific moves if available
  if (data.forms && Object.keys(data.forms).length > 0) {
    levelMoves[mon].forms = {};
    for (const [formName, formData] of Object.entries(data.forms)) {
      if (formData.moves && formData.moves.length > 0) {
        if (!levelMoves[mon].forms) levelMoves[mon].forms = {};
        levelMoves[mon].forms[formName] = {
          moves: formData.moves.map(m => ({
            name: m.name,
            level: m.level,
            ...(m.info ? { info: m.info } : {})
          }))
        };
      }
    }
  }
}
fs.writeFileSync(LEVEL_MOVES_OUTPUT, JSON.stringify(levelMoves, null, 2));
console.log('Pokémon level-up moves extracted to', LEVEL_MOVES_OUTPUT);

// --- Hidden Grotto Extraction ---
function extractHiddenGrottoes(): Record<string, LocationEntry[]> {
  // Result will be keyed by Pokémon name, containing location entries
  const grottoLocations: Record<string, LocationEntry[]> = {};

  // Read the grottoes.asm file
  const grottoeFilePath = path.join(__dirname, 'data/events/hidden_grottoes/grottoes.asm');
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

// Extract and save location data (including hidden grottoes)
const locationData: Record<string, LocationEntry[]> = {};

// Helper to extract the base name from a combined name with form
function extractBasePokemonName(fullName: string): string {
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

// Group pokemon by their base form
const formsByBaseName: Record<string, Record<string, LocationEntry[]>> = {};

// First, process wild encounter locations
for (const [mon, data] of Object.entries(finalResultV3)) {
  const baseName = extractBasePokemonName(mon);

  // Initialize the base Pokemon if needed
  if (!formsByBaseName[baseName]) {
    formsByBaseName[baseName] = {};
  }

  // Extract form name from the full name
  let formName = null;
  if (mon !== baseName) {
    formName = mon.substring(baseName.length);
  }

  // Add the locations to the appropriate form
  const formKey = formName || 'default';
  if (!formsByBaseName[baseName][formKey]) {
    formsByBaseName[baseName][formKey] = [];
  }

  // Add form name to each location entry
  const locationsWithForms = data.locations.map(loc => ({
    ...loc,
    formName: formName
  }));

  formsByBaseName[baseName][formKey].push(...locationsWithForms);
}

// Then process hidden grotto locations
const grottoLocations = extractHiddenGrottoes();
for (const [pokemonName, locations] of Object.entries(grottoLocations)) {
  const baseName = extractBasePokemonName(pokemonName);

  // Initialize the base Pokemon if needed
  if (!formsByBaseName[baseName]) {
    formsByBaseName[baseName] = {};
  }

  // Extract form name from the full name
  let formName = null;
  if (pokemonName !== baseName) {
    formName = pokemonName.substring(baseName.length);
  }

  // Add the locations to the appropriate form
  const formKey = formName || 'default';
  if (!formsByBaseName[baseName][formKey]) {
    formsByBaseName[baseName][formKey] = [];
  }

  formsByBaseName[baseName][formKey].push(...locations);
}

// Now convert the grouped data back to the format expected by the rest of the code
for (const [baseName, forms] of Object.entries(formsByBaseName)) {
  locationData[baseName] = [];

  // Start with the default form
  if (forms['default']) {
    locationData[baseName].push(...forms['default']);
  }

  // Add all other forms
  for (const [formName, locations] of Object.entries(forms)) {
    if (formName !== 'default') {
      // Add all form locations to the base Pokemon
      locationData[baseName].push(...locations);
    }
  }
}

// Process location data to group by forms
const groupedLocationData: Record<string, { locations: LocationEntry[], forms?: Record<string, { locations: LocationEntry[] }> }> = {};

for (const [mon, locations] of Object.entries(locationData)) {
  // Initialize if needed
  if (!groupedLocationData[mon]) {
    groupedLocationData[mon] = { locations: [] };
  }

  // Group locations by form
  const locationsByForm: Record<string, LocationEntry[]> = { default: [] };

  for (const loc of locations) {
    const formKey = loc.formName || 'default';
    if (!locationsByForm[formKey]) {
      locationsByForm[formKey] = [];
    }
    locationsByForm[formKey].push(loc);
  }

  // Add default locations
  groupedLocationData[mon].locations = locationsByForm.default;

  // Add form-specific locations
  for (const [formName, formLocations] of Object.entries(locationsByForm)) {
    if (formName !== 'default') {
      if (!groupedLocationData[mon].forms) {
        groupedLocationData[mon].forms = {};
      }
      groupedLocationData[mon].forms[formName] = { locations: formLocations };
    }
  }

  // Clean up empty forms object
  if (groupedLocationData[mon].forms && Object.keys(groupedLocationData[mon].forms).length === 0) {
    delete groupedLocationData[mon].forms;
  }
}

fs.writeFileSync(LOCATIONS_OUTPUT, JSON.stringify(groupedLocationData, null, 2));
console.log('Pokémon location data extracted to', LOCATIONS_OUTPUT);

// --- Egg Moves Extraction ---
function extractEggMoves() {
  const eggMovesPath = path.join(__dirname, 'data/pokemon/egg_moves.asm');
  const eggMovePointersPath = path.join(__dirname, 'data/pokemon/egg_move_pointers.asm');

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

extractEggMoves();

// --- Detailed Stats Extraction ---
function exportDetailedStats() {
  try {
    const detailedStats = extractDetailedStats();
    if (detailedStats && Object.keys(detailedStats).length > 0) {
      fs.writeFileSync(DETAILED_STATS_OUTPUT, JSON.stringify(detailedStats, null, 2));
      console.log('Detailed Pokémon stats extracted to', DETAILED_STATS_OUTPUT);
    } else {
      console.error('No detailed stats data was extracted.');
    }
  } catch (error) {
    console.error('Error extracting detailed stats:', error);
  }
}

// Execute the function to extract and export detailed stats
exportDetailedStats();

// --- Type Chart Extraction ---
function extractTypeChart() {
  const matchupPath = path.join(__dirname, 'data/types/type_matchups.asm');
  const typeNamesPath = path.join(__dirname, 'data/types/names.asm');
  const outputPath = path.join(__dirname, 'type_chart.json');

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

extractTypeChart();

/*
// Debugging helper function - uncomment when needed
function getTypeDebugInfo(pokemonName: string) {
  return {
    baseType: typeMap[pokemonName],
    formTypes: formTypeMap[pokemonName] || {}
  };
}
// Example usage:
// console.log('Raichu type debug:', getTypeDebugInfo('Raichu'));
*/

// --- Debugging for Raichu ---
// Uncomment the following line to enable debugging for Raichu's type processing
// debugPokemonProcessing('RAICHU');

// --- Pokédex Entries Extraction ---
function extractPokedexEntries() {
  const pokedexEntriesPath = path.join(__dirname, 'data/pokemon/dex_entries.asm');
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

extractPokedexEntries();

// --- Detailed Stats Extraction ---
function extractDetailedStats(): Record<string, DetailedStats> {
  const detailedStatsDir = path.join(__dirname, 'data/pokemon/base_stats');
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

// Helper functions to convert game codes to human-readable strings
function convertGenderCode(code: string): string {
  const genderCodes: Record<string, string> = {
    'GENDER_F0': '0% ♀ (Male only)',
    'GENDER_F12_5': '12.5% ♀, 87.5% ♂',
    'GENDER_F25': '25% ♀, 75% ♂',
    'GENDER_F50': '50% ♀, 50% ♂',
    'GENDER_F75': '75% ♀, 25% ♂',
    'GENDER_F100': '100% ♀ (Female only)',
    'GENDER_UNKNOWN': 'Genderless'
  };
  return genderCodes[code] || 'Unknown';
}

function convertHatchCode(code: string): string {
  const hatchCodes: Record<string, string> = {
    'HATCH_FASTEST': 'Very Fast (1,280 steps)',
    'HATCH_FASTER': 'Fast (2,560 steps)',
    'HATCH_FAST': 'Medium-Fast (5,120 steps)',
    'HATCH_MEDIUM_FAST': 'Medium-Fast (5,120 steps)',
    'HATCH_MEDIUM_SLOW': 'Medium-Slow (6,400 steps)',
    'HATCH_SLOW': 'Slow (8,960 steps)',
    'HATCH_SLOWER': 'Very Slow (10,240 steps)',
    'HATCH_SLOWEST': 'Extremely Slow (20,480 steps)'
  };
  return hatchCodes[code] || 'Unknown';
}

function convertGrowthRateCode(code: string): string {
  const growthRateCodes: Record<string, string> = {
    'GROWTH_MEDIUM_FAST': 'Medium Fast',
    'GROWTH_SLIGHTLY_FAST': 'Slightly Fast',
    'GROWTH_SLIGHTLY_SLOW': 'Slightly Slow',
    'GROWTH_MEDIUM_SLOW': 'Medium Slow',
    'GROWTH_FAST': 'Fast',
    'GROWTH_SLOW': 'Slow',
    'GROWTH_ERRATIC': 'Erratic',
    'GROWTH_FLUCTUATING': 'Fluctuating'
  };
  return growthRateCodes[code] || 'Medium Fast';
}

function convertEggGroupCode(code: string): string {
  const eggGroupCodes: Record<string, string> = {
    'EGG_MONSTER': 'Monster',
    'EGG_WATER_1': 'Water 1',
    'EGG_BUG': 'Bug',
    'EGG_FLYING': 'Flying',
    'EGG_GROUND': 'Field',
    'EGG_FAIRY': 'Fairy',
    'EGG_PLANT': 'Grass',
    'EGG_HUMANSHAPE': 'Human-Like',
    'EGG_WATER_3': 'Water 3',
    'EGG_MINERAL': 'Mineral',
    'EGG_INDETERMINATE': 'Amorphous',
    'EGG_WATER_2': 'Water 2',
    'EGG_DITTO': 'Ditto',
    'EGG_DRAGON': 'Dragon',
    'EGG_NONE': 'Undiscovered'
  };
  return eggGroupCodes[code] || 'Undiscovered';
}
