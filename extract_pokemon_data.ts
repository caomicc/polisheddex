import type { BaseData, Evolution, EvoRaw, LocationEntry, Move, PokemonDataV2, PokemonDataV3 } from './src/types/types.ts';
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
  // Accepts a file path to dex_entries.asm and returns an array of TitleCase names in order
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const names: string[] = [];

  // Keep track of Pokemon that have been processed to avoid duplicates
  const processedBaseNames = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^(\w+)PokedexEntry::/);
    if (match) {
      const nameWithPotentialForm = match[1];

      // Handle forms by extracting the base name
      // Find known form patterns using our KNOWN_FORMS constant
      const formPatterns = new RegExp(`(?:${Object.values(KNOWN_FORMS).map(form => form.charAt(0).toUpperCase() + form.slice(1)).join('|')})$`);
      const baseName = nameWithPotentialForm.replace(formPatterns, '');

      // Only add each base Pokemon once to the dex order
      if (!processedBaseNames.has(baseName)) {
        processedBaseNames.add(baseName);
        names.push(toTitleCase(baseName));
      }
    }
  }
  return names;
}

const nationalDexOrder = parseDexEntries(path.join(__dirname, 'data/pokemon/dex_entries.asm'));

// --- Type Extraction ---
const baseStatsDir = path.join(__dirname, 'data/pokemon/base_stats');
const typeMap: Record<string, string[]> = {};
const typeEnumToName: Record<string, string> = {
  'NORMAL': 'Normal', 'FIGHTING': 'Fighting', 'FLYING': 'Flying', 'POISON': 'Poison', 'GROUND': 'Ground',
  'ROCK': 'Rock', 'BUG': 'Bug', 'GHOST': 'Ghost', 'STEEL': 'Steel', 'FIRE': 'Fire', 'WATER': 'Water',
  'GRASS': 'Grass', 'ELECTRIC': 'Electric', 'PSYCHIC': 'Psychic', 'ICE': 'Ice', 'DRAGON': 'Dragon',
  'DARK': 'Dark', 'FAIRY': 'Fairy', 'SHADOW': 'Shadow', 'NONE': 'None'
};
const baseStatsFiles = fs.readdirSync(baseStatsDir).filter(f => f.endsWith('.asm'));
for (const file of baseStatsFiles) {
  const monName = toTitleCase(file.replace('.asm', ''));
  const content = fs.readFileSync(path.join(baseStatsDir, file), 'utf8');
  const typeLine = content.split(/\r?\n/).find(l => l.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/));
  if (typeLine) {
    const match = typeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
    if (match) {
      const t1 = typeEnumToName[match[1]] || 'None';
      const t2 = typeEnumToName[match[2]] || 'None';
      typeMap[monName] = [t1, t2];
    }
  }
}

const finalResult: Record<string, PokemonDataV2 & { nationalDex: number | null, types: string | string[] }> = {};
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
  // Types
  let types: string | string[] = typeMap[mon] || ['None', 'None'];
  // Remove duplicates and handle 'None'
  types = Array.from(new Set(types));
  if (types.length === 1 || types[1] === 'None') {
    types = types[0];
  }
  finalResult[mon] = { evolution, moves, nationalDex, types };
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

    // Create the entry for this Pokémon
    groupedData[baseName] = {
      ...baseForm,
      forms: {}
    };

    // Add all forms (including the default one)
    for (const [formName, formData] of Object.entries(forms)) {
      if (formName !== 'default') {
        groupedData[baseName].forms![formName] = {
          formName,
          types: formData.types,
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
  const spriteName = mon.toLowerCase().replace(/[^a-z0-9]/g, '');
  baseData[mon] = {
    name: mon,
    nationalDex: data.nationalDex,
    types: data.types,
    frontSpriteUrl: `/sprites/pokemon/${spriteName}/front_cropped.png`
  };

  // Add form-specific type data and sprite URL if available
  if (data.forms && Object.keys(data.forms).length > 0) {
    baseData[mon].forms = {};
    for (const [formName, formData] of Object.entries(data.forms)) {
      // Normalize form sprite name: base + form
      const formSpriteName = `${spriteName}_${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      baseData[mon].forms[formName] = {
        types: formData.types || 'None',
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
