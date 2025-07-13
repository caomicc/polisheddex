import { normalizeMonName, parseDexEntries, parseWildmonLine, standardizePokemonKey, toTitleCase } from './src/utils/stringUtils.ts';
import type { BaseData, DetailedStats, Evolution, EvoRaw, LocationEntry, Move, PokemonDataV2, PokemonDataV3 } from './src/types/types.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEBUG_POKEMON, evoMap, formTypeMap, KNOWN_FORMS, preEvoMap, typeMap } from './src/data/constants.ts';
import { extractAbilityDescriptions, extractBasePokemonName, extractDetailedStats, extractEggMoves, extractFormInfo, extractHiddenGrottoes, extractMoveDescriptions, extractPokedexEntries, extractTypeChart, getFullPokemonName, addBodyDataToDetailedStats, mapEncounterRatesToPokemon, extractTmHmLearnset } from './src/utils/extractUtils.ts';
import { groupPokemonForms } from './src/utils/helpers.ts';
import type { Ability } from './src/types/types.ts';
import { normalizeMoveString } from './src/utils/stringNormalizer/stringNormalizer.ts';


// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If you still get ReferenceError: __dirname is not defined, replace all uses of __dirname with the above workaround.
// For example, instead of:
//   path.join(__dirname, 'output/pokemon_base_data.json')
// You can use:
//   path.join(path.dirname(fileURLToPath(import.meta.url)), 'output/pokemon_base_data.json')



// Output file paths
const BASE_DATA_OUTPUT = path.join(__dirname, 'output/pokemon_base_data.json');
const EVOLUTION_OUTPUT = path.join(__dirname, 'output/pokemon_evolution_data.json');
const LEVEL_MOVES_OUTPUT = path.join(__dirname, 'output/pokemon_level_moves.json');
const LOCATIONS_OUTPUT = path.join(__dirname, 'output/pokemon_locations.json');
const DETAILED_STATS_OUTPUT = path.join(__dirname, 'output/pokemon_detailed_stats.json');

const filePath = path.join(__dirname, 'rom/data/pokemon/evos_attacks.asm');

const data = fs.readFileSync(filePath, 'utf8');
const lines = data.split(/\r?\n/);

const moveDescriptionsPath = path.join(__dirname, 'output/pokemon_move_descriptions.json');


extractAbilityDescriptions();

extractMoveDescriptions();

// --- Move Description Map ---
// Read move descriptions from the generated JSON file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let moveDescriptions: Record<string, any> = {};
if (fs.existsSync(moveDescriptionsPath)) {
  moveDescriptions = JSON.parse(fs.readFileSync(moveDescriptionsPath, 'utf8'));
}

const result: Record<string, { moves: Move[] }> = {};

let currentMonV2: string | null = null;
let movesV2: Move[] = [];
let evoMethods: EvoRaw[] = [];

for (const lineRaw of lines) {
  const line = lineRaw.trim();
  console.log('Processing line:', line);
  if (line.startsWith('evos_attacks ')) {
    if (currentMonV2) {
      result[normalizeMoveString(currentMonV2)] = {
        moves: movesV2
      };
      if (evoMethods.length) {
        evoMap[normalizeMoveString(currentMonV2)] = evoMethods.map(e => ({
          ...e,
          target: normalizeMoveString(e.target),
          form: e.form ? normalizeMoveString(e.form) : undefined
        }));
        for (const evo of evoMethods) {
          const tgt = normalizeMoveString(evo.target);
          if (!preEvoMap[tgt]) preEvoMap[tgt] = [];
          preEvoMap[tgt].push(normalizeMoveString(currentMonV2));
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
    console.log('evoMatch', { evoMatch });
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
      const prettyName = normalizeMoveString(moveKey);
      console.log('normalizeMoveString', { prettyName, moveKey })
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

// Function to get the evolution chain for a Pokémon
function getEvolutionChain(mon: string): string[] {
  // Use the new non-recursive approach to build a complete chain
  return buildCompleteEvolutionChain(mon);
}

// Parse both National and Johto (New) Dex orders
const nationalDexOrder = parseDexEntries(path.join(__dirname, 'rom/data/pokemon/dex_entries.asm'));
const johtoDexOrder = parseDexEntries(path.join(__dirname, 'rom/data/pokemon/dex_order_new.asm'));

const baseStatsDir = path.join(__dirname, 'rom/data/pokemon/base_stats');

const typeEnumToName: Record<string, string> = {
  'NORMAL': 'Normal', 'FIGHTING': 'Fighting', 'FLYING': 'Flying', 'POISON': 'Poison', 'GROUND': 'Ground',
  'ROCK': 'Rock', 'BUG': 'Bug', 'GHOST': 'Ghost', 'STEEL': 'Steel', 'FIRE': 'Fire', 'WATER': 'Water',
  'GRASS': 'Grass', 'ELECTRIC': 'Electric', 'PSYCHIC': 'Psychic', 'ICE': 'Ice', 'DRAGON': 'Dragon',
  'DARK': 'Dark', 'FAIRY': 'Fairy', 'SHADOW': 'Shadow', 'NONE': 'None'
};

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

  // console.log(`Processing Pokémon: ${mon}`);

  // Normalize the move names to ensure consistent keys

  const moves = result[mon].moves.map(m => ({
    name: m.name,
    level: m.level,
    ...(m.info ? { info: m.info } : {})
  }));
  // Standardize the Pokemon name to ensure consistent keys
  const standardMon = standardizePokemonKey(mon);

  console.log(`Standardized Pokémon name: x${standardMon}x`);

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
    console.log(`Processing ${mon} as a special form: ${basePokemonName} + x${formName}x`,);
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

  console.log(`Final moves for ${mon}: ${moves}`);

  // Create the final result with the correct types
  finalResult[mon] = { evolution, moves, nationalDex, johtoDex, types };
}

// --- Wild Pokémon Location Extraction ---
// LocationEntry type is now imported from the common types file
const wildDir = path.join(__dirname, 'rom/data/wild');
const wildFiles = fs.readdirSync(wildDir).filter(f => f.endsWith('.asm'));

// Aggregate locations by Pokémon
const locationsByMon: { [mon: string]: LocationEntry[] } = {};

for (const file of wildFiles) {
  // console.log(`Processing wild file: ${file}`);
  const filePath = path.join(wildDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  let area: string | null = null;
  let method: string | null = null;
  let inBlock = false;
  let blockType: string | null = null;
  let encounterRates: { morn: number; day: number; nite: number; eve?: number } = {
    morn: 0,
    day: 0,
    nite: 0
  };
  // --- Group wildmon entries by time ---
  let slotEntriesByTime: Record<string, Array<{ key: string; entry: LocationEntry }>> = {};
  let currentTime: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Area block start
    const areaMatch = line.match(/^def_(grass|water)_wildmons ([A-Z0-9_]+)/);
    if (areaMatch) {
      area = areaMatch[2];
      method = areaMatch[1];
      inBlock = true;
      blockType = method;
      currentTime = null;
      slotEntriesByTime = {};
      encounterRates = { morn: 0, day: 0, nite: 0 };
      continue;
    }
    // Parse encounter rates line
    if (inBlock && line.match(/^\s*db\s+\d+\s+percent/)) {
      const rateMatches = line.match(/(\d+)\s+percent/g);
      if (rateMatches) {
        if (rateMatches.length >= 3) {
          encounterRates.morn = parseInt(rateMatches[0].match(/(\d+)/)![1], 10);
          encounterRates.day = parseInt(rateMatches[1].match(/(\d+)/)![1], 10);
          encounterRates.nite = parseInt(rateMatches[2].match(/(\d+)/)![1], 10);
          if (rateMatches.length > 3) {
            encounterRates.eve = parseInt(rateMatches[3].match(/(\d+)/)![1], 10);
          }
        } else {
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
      // For each time block, assign canonical rates
      const encounterType = (method === 'water') ? 'surf' : 'grass';
      for (const [, slotEntries] of Object.entries(slotEntriesByTime)) {
        const slotPokemon = slotEntries.map(e => e.key);
        const mappedRates = mapEncounterRatesToPokemon(slotPokemon, encounterType);
        for (let idx = 0; idx < slotEntries.length; idx++) {
          slotEntries[idx].entry.chance = mappedRates[idx]?.rate ?? 0;
          if (!locationsByMon[slotEntries[idx].key]) locationsByMon[slotEntries[idx].key] = [];
          locationsByMon[slotEntries[idx].key].push(slotEntries[idx].entry);
        }
      }
      // Reset for next block
      inBlock = false;
      area = null;
      method = null;
      slotEntriesByTime = {};
      currentTime = null;
      continue;
    }
    if (inBlock && line.startsWith(';')) {
      // Time of day section
      const t = line.replace(';', '').trim().toLowerCase();
      if (["morn", "day", "nite", "eve"].includes(t)) {
        currentTime = t;
        if (!slotEntriesByTime[currentTime]) slotEntriesByTime[currentTime] = [];
      }
      continue;
    }
    if (inBlock && line.startsWith('wildmon')) {
      const parsed = parseWildmonLine(line);
      console.log(`Parsed wildmon line: ${line} ->`, parsed);
      if (parsed) {
        console.log('parsed.species, parsed.form', parsed.species, parsed.form);
        const { formName } = normalizeMonName(parsed.species, parsed.form); // Extract form name
        const key = getFullPokemonName(parsed.species, parsed.form); // Use legacy function for now
        // Normalize LEVEL_FROM_BADGES in level value
        let normalizedLevel = parsed.level;
        if (typeof normalizedLevel === 'string' && /LEVEL_FROM_BADGES/.test(normalizedLevel)) {
          const modifierMatch = normalizedLevel.match(/LEVEL_FROM_BADGES\s*([\+\-]\s*\d+)?/);
          if (modifierMatch && modifierMatch[1]) {
            normalizedLevel = `Badge Level ${modifierMatch[1].replace(/\s+/g, ' ')}`;
          } else {
            normalizedLevel = 'Badge Level';
          }
        }
        let encounterRate = 0;
        if (currentTime === 'morn') encounterRate = encounterRates.morn;
        else if (currentTime === 'day') encounterRate = encounterRates.day;
        else if (currentTime === 'nite') encounterRate = encounterRates.nite;
        else if (currentTime === 'eve' && encounterRates.eve !== undefined) encounterRate = encounterRates.eve;
        else encounterRate = encounterRates.day;
        console.log(`DEBUG: Adding wildmon ${key} at level ${normalizedLevel} with rate ${encounterRate} in area ${area} (${method}) at time ${currentTime}`);
        if (!slotEntriesByTime[currentTime || 'day']) slotEntriesByTime[currentTime || 'day'] = [];
        slotEntriesByTime[currentTime || 'day'].push({
          key,
          entry: {
            area,
            method,
            time: currentTime,
            level: normalizedLevel,
            chance: 0, // Will be set below
            formName
          }
        });
      }
      continue;
    }
  }
}

// Using the previously defined PokemonDataV3 type
const finalResultV3: Record<string, PokemonDataV3> = {};
for (const mon of Object.keys(finalResult)) {
  console.log(`Finalizing Pokémon: ${mon}`, finalResult[mon]);

  finalResultV3[mon] = {
    ...finalResult[mon],
    locations: locationsByMon[mon] || []
  };
}

// Group all Pokemon data
const groupedPokemonData = groupPokemonForms(finalResultV3);

console.log(`Grouped Pokémon data: ${Object.keys(groupedPokemonData).length} Pokémon found.`);


// Extract and save base data (dex number, types)
const baseData: Record<string, BaseData> = {};
for (const [mon, data] of Object.entries(groupedPokemonData)) {

  console.log(`Processing base data for Pokémon: ${mon}`, data);
  // Ensure there are no trailing spaces in the Pokemon name
  let trimmedMon = mon.trim();

  if (trimmedMon === 'Ho Oh') {
    trimmedMon = 'Ho-Oh'; // Special case for Ho-Oh
  }

  console.log(`Trimmed Pokémon name: ${trimmedMon}`);

  // if (trimmedMon === 'Ho Oh') trimmedMon = 'Ho-Oh'; // Special case for Ho-Oh

  // Generate the front sprite URL for the base form
  const spriteName = trimmedMon
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '') // Remove non-alphanumerics except hyphens
    .replace(/-/g, '_'); // Replace middle hyphens with underscores
  console.log(`Sprite name for ${trimmedMon}: ${spriteName}`);
  let typeData = data.types;

  // console.log(`Processing ${trimmedMon} with initial types: ${typeData}`);

  if (!typeData || typeData === 'None' || (Array.isArray(typeData) && typeData.includes('None'))) {
    // Try to get type from our typeMap
    if (typeMap[trimmedMon]) {
      const types = typeMap[trimmedMon];
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
      console.log(`No type data found for ${trimmedMon}, checking for _plain file...`);
      // The Pokémon might only have a _plain file (like Growlithe) but no direct entry in typeMap
      // Construct the filename pattern and check for it in all processed files
      const plainFileName = `${trimmedMon.toLowerCase()}_plain`;

      // Look for any base stats files that match this pattern
      const matchingPlainFiles = baseStatsFiles.filter(f =>
        f.toLowerCase().startsWith(plainFileName) && f.endsWith('.asm')
      );

      if (matchingPlainFiles.length > 0) {
        console.log(`Found _plain file for ${trimmedMon}: ${matchingPlainFiles[0]}`);

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

            console.log(`Extracted types for ${trimmedMon} from _plain file: ${t1}, ${t2}`);

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

  console.log(`sprite info data`, `/sprites/pokemon/${spriteName}/front_cropped.png`);

  baseData[trimmedMon] = {
    name: trimmedMon,
    nationalDex: data.nationalDex,
    johtoDex: data.johtoDex,
    types: typeData || "Unknown",
    frontSpriteUrl: `/sprites/pokemon/${spriteName}/front_cropped.png`,
    baseStats: {
      hp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      specialAttack: 0,
      specialDefense: 0,
      total: 0
    },
    faithfulAbilities: [],
    updatedAbilities: [],
    catchRate: 255, // default value
    baseExp: 0, // default value
    heldItems: [], // default value
    abilities: [], // default value
    growthRate: "Medium Fast", // default value
    eggGroups: [], // default value
    genderRatio: "Unknown", // default value
    hatchRate: "Unknown", // default value
    evYield: "None", // default value
    forms: {} // Ensure forms are initialized as an empty object
  }  // Add form-specific type data and sprite URL if available

  console.log(`Base data for ${data.nationalDex}, ${data.name}:`, data.forms);
  if (data.forms && Object.keys(data.forms).length > 0) {
    // forms is already initialized as an empty object in baseData[trimmedMon]
    for (const [formName, formData] of Object.entries(data.forms)) {
      console.log(`Processing form ${formName} for ${trimmedMon}`);
      // Get form type data, with fallbacks
      let formTypeData = formData.types;
      if (!formTypeData || formTypeData === 'None' || (Array.isArray(formTypeData) && formTypeData.includes('None'))) {
        console.log(`No type data found for ${trimmedMon} ${formName}, checking typeMap...`);
        // Try to get from formTypeMap
        if (formTypeMap[trimmedMon] && formTypeMap[trimmedMon][formName]) {
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

      // Create directory-style sprite path for form variants
      const formSpritePath = `${spriteName}_${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      // Add the form data to the baseData
      // @ts-expect-error // TypeScript doesn't know about the dynamic structure of baseData[trimmedMon].forms
      baseData[trimmedMon].forms[formName] = {
        types: formTypeData || 'Unknown',
        frontSpriteUrl: `/sprites/pokemon/${formSpritePath}/front_cropped.png`,
        baseStats: {
          hp: 0,
          attack: 0,
          defense: 0,
          speed: 0,
          specialAttack: 0,
          specialDefense: 0,
          total: 0
        },
        faithfulAbilities: [],
        updatedAbilities: [],
        catchRate: 255,
        baseExp: 0,
        heldItems: [],
        abilities: [],
        growthRate: "Medium Fast",
        eggGroups: [],
        genderRatio: "Unknown",
        hatchRate: "Unknown",
        evYield: "None"
      };
    }
  }
}

console.log(`Base Pokémon data extracted:`, validatePokemonKeys(baseData));
// Validate keys before writing to ensure no trailing spaces
const validatedBaseData = validatePokemonKeys(baseData);
fs.writeFileSync(BASE_DATA_OUTPUT, JSON.stringify(validatedBaseData, null, 2));
console.log('Pokémon base data extracted to', BASE_DATA_OUTPUT);

// Extract and save evolution data
const evolutionData: Record<string, Evolution | null> = {};
for (const [mon, data] of Object.entries(groupedPokemonData)) {
  console.log(`Processing evolution data for ${mon}`, data);
  evolutionData[mon] = data.evolution;
}

const validatedEvolutionData = validatePokemonKeys(evolutionData);
fs.writeFileSync(EVOLUTION_OUTPUT, JSON.stringify(validatedEvolutionData, null, 2));
console.log('Pokémon evolution data extracted to', EVOLUTION_OUTPUT);

// Extract and save level-up moves
const levelMoves: Record<string, { moves: Move[], forms?: Record<string, { moves: Move[] }> }> = {};
for (const [mon, data] of Object.entries(groupedPokemonData)) {

  levelMoves[mon] = { moves: data.moves };

  // console.log(`Processing level-up moves for ${mon}`, data.moves);

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
const validatedLevelMoves = validatePokemonKeys(levelMoves);
fs.writeFileSync(LEVEL_MOVES_OUTPUT, JSON.stringify(validatedLevelMoves, null, 2));
console.log('Pokémon level-up moves extracted to', LEVEL_MOVES_OUTPUT);


// Extract and save location data (including hidden grottoes)
const locationData: Record<string, LocationEntry[]> = {};



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

const validatedLocationData = validatePokemonKeys(groupedLocationData);
fs.writeFileSync(LOCATIONS_OUTPUT, JSON.stringify(validatedLocationData, null, 2));
console.log('Pokémon location data extracted to', LOCATIONS_OUTPUT);

function exportDetailedStats() {
  try {
    const detailedStats: Record<string, DetailedStats> = extractDetailedStats();

    // --- Body Data Extraction ---
    const bodyDataPath = path.join(__dirname, 'rom/data/pokemon/body_data.asm');
    if (fs.existsSync(bodyDataPath)) {
      const bodyDataLines = fs.readFileSync(bodyDataPath, 'utf8').split(/\r?\n/);
      for (const line of bodyDataLines) {
        if (line.trim().startsWith('body_data')) {
          // Extract Pokémon name from comment
          const nameMatch = line.match(/;\s*([A-Z0-9_]+)/);
          if (nameMatch) {
            const monName = toTitleCase(nameMatch[1].replace(/_/g, ' '));
            if (detailedStats[monName]) {
              detailedStats[monName] = addBodyDataToDetailedStats(line, detailedStats[monName]) as DetailedStats;
            }
          }
        }
      }
    }

    // --- Ability Description Enhancement ---
    // Load ability descriptions to add them to the abilities
    const abilityDescriptionsPath = path.join(__dirname, 'output/pokemon_ability_descriptions.json');
    if (fs.existsSync(abilityDescriptionsPath)) {
      try {
        const abilityDescriptions = JSON.parse(fs.readFileSync(abilityDescriptionsPath, 'utf8'));

        // Enhance each Pokemon's ability with its description
        for (const [, stats] of Object.entries(detailedStats)) {
          // Function to enhance abilities with descriptions
          const enhanceAbilitiesWithDescriptions = (abilities: Ability[]): Ability[] => {
            if (!abilities || !Array.isArray(abilities)) return abilities;

            return abilities.map(ability => {
              if (abilityDescriptions[ability.name]) {
                return {
                  ...ability,
                  description: abilityDescriptions[ability.name].description || ''
                };
              }
              return ability;
            });
          };

          // Enhance regular abilities (for backward compatibility)
          if (stats.abilities && Array.isArray(stats.abilities)) {
            // Check if abilities are already objects with proper type
            if (stats.abilities.length > 0 && typeof stats.abilities[0] === 'object') {
              stats.abilities = enhanceAbilitiesWithDescriptions(stats.abilities as Ability[]);
            }
            // If abilities are still strings, convert them to objects
            else if (stats.abilities.length > 0 && typeof stats.abilities[0] === 'string') {
              const stringAbilities = stats.abilities as unknown as string[];
              const enhancedAbilities = stringAbilities.map((abilityName, index) => {
                const isHidden = index === 2; // Third ability is hidden
                const abilityType = index === 0 ? 'primary' as const : (index === 1 ? 'secondary' as const : 'hidden' as const);

                return {
                  name: abilityName,
                  description: abilityDescriptions[abilityName]?.description || '',
                  isHidden,
                  abilityType
                } as Ability;
              });
              stats.abilities = enhancedAbilities;
            }
          }

          // Enhance faithful abilities
          if (stats.faithfulAbilities && Array.isArray(stats.faithfulAbilities)) {
            stats.faithfulAbilities = enhanceAbilitiesWithDescriptions(stats.faithfulAbilities);
          }

          // Enhance updated abilities
          if (stats.updatedAbilities && Array.isArray(stats.updatedAbilities)) {
            stats.updatedAbilities = enhanceAbilitiesWithDescriptions(stats.updatedAbilities);
          }
        }
      } catch (error) {
        console.error('Error enhancing abilities with descriptions:', error);
      }
    }

    if (detailedStats && Object.keys(detailedStats).length > 0) {
      const validatedDetailedStats = validatePokemonKeys(detailedStats);
      fs.writeFileSync(DETAILED_STATS_OUTPUT, JSON.stringify(validatedDetailedStats, null, 2));
      console.log('Detailed Pokémon stats extracted to', DETAILED_STATS_OUTPUT);
    } else {
      console.error('No detailed stats data was extracted.');
    }
  } catch (error) {
    console.error('Error extracting detailed stats:', error);
  }
}

extractEggMoves();
// Execute the function to extract and export detailed stats
exportDetailedStats();

extractTypeChart();

extractPokedexEntries();

// Add function to validate and normalize Pokemon keys
function validatePokemonKeys<T>(jsonData: Record<string, T>): Record<string, T> {
  const validatedData: Record<string, T> = {};

  for (const [key, value] of Object.entries(jsonData)) {
    const trimmedKey = key.trim();

    console.log(`Validating Pokémon key: x${trimmedKey}x`);

    // Deep clean any nested forms objects
    if (typeof value === 'object' && value !== null) {
      const valueObj = value as Record<string, unknown>;
      if (valueObj.forms && typeof valueObj.forms === 'object') {
        const cleanedForms: Record<string, unknown> = {};
        for (const [formKey, formValue] of Object.entries(valueObj.forms as Record<string, unknown>)) {
          const trimmedFormKey = formKey.trim();
          cleanedForms[trimmedFormKey] = formValue;
        }
        valueObj.forms = cleanedForms;
      }
    }

    validatedData[trimmedKey] = value;
  }

  console.log('Validated Pokemon keys to remove trailing spaces');
  return validatedData;
}

extractTmHmLearnset()
