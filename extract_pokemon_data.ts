import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output file paths
const MOVE_DESCRIPTIONS_OUTPUT = path.join(__dirname, 'pokemon_move_descriptions.json');
const EVO_MOVES_OUTPUT = path.join(__dirname, 'pokemon_evo_moves.json');
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
  const moveStats: Record<string, { type: string; pp: number; power: number; category: string }> = {};
  for (const line of statsLines) {
    const match = line.match(/^\s*move\s+([A-Z0-9_]+),\s*[A-Z0-9_]+,\s*(-?\d+),\s*([A-Z_]+),\s*-?\d+,\s*(\d+),\s*\d+,\s*([A-Z_]+)/);
    if (match) {
      const move = match[1];
      const power = parseInt(match[2], 10);
      const type = typeEnumToName[match[3]] || 'None';
      const pp = parseInt(match[4], 10);
      const category = categoryEnumToName[match[5]] || 'Unknown';
      moveStats[move] = { type, pp, power, category };
    }
  }

  // Map move names to their description by label name
  const moveDescByName: Record<string, { description: string; type: string; pp: number; power: number; category: string }> = {};
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
    const stats = moveStats[moveKey] || { type: 'None', pp: 0, power: 0, category: 'Unknown' };
    const prettyName = toCapitalCaseWithSpaces(moveKey);
    moveDescByName[prettyName] = {
      description: desc,
      type: stats.type,
      pp: stats.pp,
      power: stats.power,
      category: stats.category
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

// --- Evolution parsing ---
type Move = { level: number; move: string };
type EvolutionMethod = {
  method: string;
  parameter: string | number | null;
  target: string;
  form?: string;
};
type Evolution = {
  methods: EvolutionMethod[];
  chain: string[];
};
type PokemonDataV2 = { evolution: Evolution | null; moves: Move[] };

interface EvoRaw {
  method: string;
  parameter: string | number | null;
  target: string;
  form?: string;
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
      movesV2.push({
        level: parseInt(match[1], 10),
        move: match[2]
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

function getEvolutionChain(mon: string, visited = new Set<string>()): string[] {
  mon = toTitleCase(mon);
  if (visited.has(mon)) return [];
  visited.add(mon);
  // Go backwards
  const chain = preEvoMap[mon]?.flatMap(pre => getEvolutionChain(pre, visited)) || [];
  const withSelf = [...chain, mon];
  // Go forwards
  let fullChain = withSelf;
  if (evoMap[mon]) {
    for (const evo of evoMap[mon]) {
      fullChain = fullChain.concat(getEvolutionChain(evo.target, visited));
    }
  }
  // Remove duplicates, preserve order
  return [...new Set(fullChain)];
}

// --- Dex number helpers ---

function parseDexEntries(file: string): string[] {
  // Accepts a file path to dex_entries.asm and returns an array of TitleCase names in order
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const names: string[] = [];
  for (const line of lines) {
    const match = line.match(/^(\w+)PokedexEntry::/);
    if (match) {
      // Remove trailing 'Plain', 'Alolan', etc. for forms, keep as is for unique forms
      const name = match[1];
      names.push(toTitleCase(name));
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
    level: m.level,
    move: toCapitalCaseWithSpaces(m.move)
  }));
  let evolution: Evolution | null = null;
  if (evoMap[mon] || preEvoMap[mon]) {
    const methods = evoMap[mon] ? evoMap[mon].map(e => ({
      method: e.method,
      parameter: e.parameter,
      target: e.target,
      ...(e.form ? { form: e.form } : {})
    })) : [];
    const chain = getEvolutionChain(mon);
    evolution = { methods, chain };
  }
  // Dex numbers (1-based, null if not found)
  const nationalDex = nationalDexOrder.indexOf(mon) >= 0 ? nationalDexOrder.indexOf(mon) + 1 : null;
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
type LocationEntry = {
  area: string | null;
  method: string | null;
  time: string | null;
  level: string;
  chance: number; // Percentage chance of encounter
  rareItem?: string; // For hidden grottoes
};

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

// Helper to normalize Pokémon name (TitleCase)
function normalizeMonName(name: string, form: string | null): string {
  let n = toTitleCase(name);
  if (form) n += toTitleCase(form);
  return n;
}

// Aggregate locations by Pokémon
const locationsByMon: { [mon: string]: LocationEntry[] } = {};

for (const file of wildFiles) {
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
        const mon = normalizeMonName(parsed.species, parsed.form);
        if (!locationsByMon[mon]) locationsByMon[mon] = [];

        // Determine the encounter rate based on time of day
        let encounterRate = 0;
        if (time === 'morn') encounterRate = encounterRates.morn;
        else if (time === 'day') encounterRate = encounterRates.day;
        else if (time === 'nite') encounterRate = encounterRates.nite;
        else if (time === 'eve' && encounterRates.eve !== undefined) encounterRate = encounterRates.eve;
        else encounterRate = encounterRates.day; // Default to day rate if time is unknown

        locationsByMon[mon].push({
          area,
          method,
          time,
          level: parsed.level,
          chance: encounterRate // Use the actual encounter rate
        });
      }
      continue;
    }
  }
}

type PokemonDataV3 = PokemonDataV2 & { nationalDex: number | null, types: string | string[], locations: LocationEntry[] };
const finalResultV3: Record<string, PokemonDataV3> = {};
for (const mon of Object.keys(finalResult)) {
  finalResultV3[mon] = {
    ...finalResult[mon],
    locations: locationsByMon[mon] || []
  };
}

// Extract and save base data (dex number, types)
const baseData: Record<string, { nationalDex: number | null, types: string | string[] }> = {};
for (const [mon, data] of Object.entries(finalResultV3)) {
  baseData[mon] = {
    nationalDex: data.nationalDex,
    types: data.types
  };
}
fs.writeFileSync(BASE_DATA_OUTPUT, JSON.stringify(baseData, null, 2));
console.log('Pokémon base data extracted to', BASE_DATA_OUTPUT);

// Extract and save evolution data
const evolutionData: Record<string, Evolution | null> = {};
for (const [mon, data] of Object.entries(finalResultV3)) {
  evolutionData[mon] = data.evolution;
}
fs.writeFileSync(EVOLUTION_OUTPUT, JSON.stringify(evolutionData, null, 2));
console.log('Pokémon evolution data extracted to', EVOLUTION_OUTPUT);

// Extract and save level-up moves
const levelMoves: Record<string, Move[]> = {};
for (const [mon, data] of Object.entries(finalResultV3)) {
  levelMoves[mon] = data.moves;
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

        // Get the formatted Pokémon name using our existing naming function
        const formattedName = toTitleCase(pokemonName);
        const formattedFullName = formName ? formattedName + toTitleCase(formName) : formattedName;

        // Determine which slot this is and set rarity
        let rarity: string;
        if (common1 === null) {
          common1 = formattedName;
          rarity = 'common';
        } else if (common2 === null) {
          common2 = formattedName;
          rarity = 'common';
        } else if (uncommon === null) {
          const formattedUncommon = formName ? formattedName + toTitleCase(formName) : formattedName;
          uncommon = formattedUncommon; // Store the formatted name
          rarity = 'uncommon';
        } else if (rare === null) {
          rare = formattedName;
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
        if (!grottoLocations[formattedFullName]) {
          grottoLocations[formattedFullName] = [];
        }

        grottoLocations[formattedFullName].push({
          area: currentLocation,
          method: 'hidden_grotto',
          time: rarity,
          level: String(level), // Convert to string regardless of type
          chance: rarity === 'rare' ? 5 : rarity === 'uncommon' ? 15 : 40,
          rareItem: rareItem
        });
      }
    }
  }

  return grottoLocations;
}

// Extract and save location data (including hidden grottoes)
const locationData: Record<string, LocationEntry[]> = {};

// First, add wild encounter locations
for (const [mon, data] of Object.entries(finalResultV3)) {
  locationData[mon] = data.locations;
}

// Then extract and add hidden grotto locations
const grottoLocations = extractHiddenGrottoes();
for (const [pokemonName, locations] of Object.entries(grottoLocations)) {
  if (!locationData[pokemonName]) {
    locationData[pokemonName] = [];
  }
  locationData[pokemonName].push(...locations);
}

fs.writeFileSync(LOCATIONS_OUTPUT, JSON.stringify(locationData, null, 2));
console.log('Pokémon location data extracted to', LOCATIONS_OUTPUT);

// Save the combined data for backward compatibility
fs.writeFileSync(EVO_MOVES_OUTPUT, JSON.stringify(finalResultV3, null, 2));
console.log('Full Pokémon data extracted to', EVO_MOVES_OUTPUT);

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
