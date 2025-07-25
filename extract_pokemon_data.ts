import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEBUG_POKEMON,
  evoMap,
  formTypeMap,
  KNOWN_FORMS,
  preEvoMap,
  typeMap,
} from './src/data/constants.ts';
import {
  extractTypeChart,
  extractHiddenGrottoes,
  mapEncounterRatesToPokemon,
  extractEggMoves,
  extractFormInfo,
  extractMoveDescriptions,
  extractTmHmLearnset,
  addBodyDataToDetailedStats,
  extractAbilityDescriptions,
  extractDetailedStats,
  extractPokedexEntries,
  getFullPokemonName,
  extractItemData,
  extractTmHmItems,
  extractLocationsByArea,
  exportAllLocations,
} from './src/utils/extractors/index.ts';
import { groupPokemonForms, validatePokemonKeys } from './src/utils/helpers.ts';
import { normalizeMoveString } from './src/utils/stringNormalizer/stringNormalizer.ts';
import {
  deepReplaceMonString,
  normalizeMonName,
  parseDexEntries,
  parseWildmonLine,
  replaceMonString,
  standardizePokemonKey,
  toTitleCase,
  typeEnumToName,
} from './src/utils/stringUtils.ts';
import {
  normalizePokemonUrlKey,
  normalizePokemonDisplayName,
  getPokemonFileName,
  validatePokemonHyphenation,
} from './src/utils/pokemonUrlNormalizer.ts';
import type {
  Ability,
  BaseData,
  DetailedStats,
  Evolution,
  EvolutionMethod,
  EvoRaw,
  LocationEntry,
  Move,
  PokemonDataV3,
  PokemonDexEntry,
} from './src/types/types.ts';
import { normalizeLocationKey } from './src/utils/locationUtils.ts';

/**
 * Robust function to check if a Pokémon name matches any name in the DEBUG_POKEMON list
 * Handles various edge cases and name formats
 */
export function isDebugPokemon(pokemonName: string): boolean {
  if (!pokemonName) return false;

  // Normalize the input name by removing common variations
  const normalizedInput = standardizePokemonKey(pokemonName);

  // Also try with the original name and some common transformations
  const namesToCheck = [
    pokemonName,
    normalizedInput,
    toTitleCase(pokemonName),
    pokemonName.replace(/_/g, ''),
    pokemonName.replace(/([a-z])([A-Z])/g, '$1$2'), // Remove internal caps
    pokemonName.toLowerCase(),
    pokemonName.toUpperCase(),
  ];

  // Remove duplicates
  const uniqueNames = [...new Set(namesToCheck)];

  // Check each variation against the debug list
  for (const name of uniqueNames) {
    if (DEBUG_POKEMON.includes(name)) {
      return true;
    }
    // Also check if any debug Pokemon is a substring match (for partial matches)
    if (
      DEBUG_POKEMON.some(
        (debugName) =>
          name.toLowerCase().includes(debugName.toLowerCase()) ||
          debugName.toLowerCase().includes(name.toLowerCase()),
      )
    ) {
      return true;
    }
  }

  return false;
}

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output file paths
const BASE_DATA_OUTPUT = path.join(__dirname, 'output/pokemon_base_data.json');
const EVOLUTION_OUTPUT = path.join(__dirname, 'output/pokemon_evolution_data.json');
const LEVEL_MOVES_OUTPUT = path.join(__dirname, 'output/pokemon_level_moves.json');
const LOCATIONS_OUTPUT = path.join(__dirname, 'output/pokemon_locations.json');
const DETAILED_STATS_OUTPUT = path.join(__dirname, 'output/pokemon_detailed_stats.json');
const MOVE_DESCRIPTIONS_OUTPUT = path.join(__dirname, 'output/pokemon_move_descriptions.json');

const EVO_ATTACK_FILE = path.join(__dirname, 'polishedcrystal/data/pokemon/evos_attacks.asm');

const data = fs.readFileSync(EVO_ATTACK_FILE, 'utf8');
const lines = data.split(/\r?\n/);

const BASE_STATS_DIR = path.join(__dirname, 'polishedcrystal/data/pokemon/base_stats');

// Parse both National and Johto (New) Dex orders
// Extract National and Johto Dex orders and write to JSON files
const nationalDexOrder = parseDexEntries(
  path.join(__dirname, 'polishedcrystal/data/pokemon/dex_entries.asm'),
);
const johtoDexOrder = parseDexEntries(
  path.join(__dirname, 'polishedcrystal/data/pokemon/dex_order_new.asm'),
);

// Write dex orders to JSON files for reuse
const NATIONAL_DEX_ORDER_OUTPUT = path.join(__dirname, 'output/national_dex_order.json');
const JOHTO_DEX_ORDER_OUTPUT = path.join(__dirname, 'output/johto_dex_order.json');

fs.writeFileSync(
  NATIONAL_DEX_ORDER_OUTPUT,
  JSON.stringify(
    nationalDexOrder.map((k: string) => k.toLowerCase()),
    null,
    2,
  ),
);
fs.writeFileSync(
  JOHTO_DEX_ORDER_OUTPUT,
  JSON.stringify(
    johtoDexOrder.map((k: string) => k.toLowerCase()),
    null,
    2,
  ),
);

extractAbilityDescriptions();

extractMoveDescriptions();

extractEggMoves();

extractTypeChart();

extractPokedexEntries();

extractTmHmLearnset();

// Extract item data
extractItemData();

// Extract TM/HM items data
extractTmHmItems();

// exportDetailedStats() moved later after finalResultV3 is initialized

// --- Move Description Map ---
// Read move descriptions from the generated JSON file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let moveDescriptions: Record<string, any> = {};

if (fs.existsSync(MOVE_DESCRIPTIONS_OUTPUT)) {
  moveDescriptions = JSON.parse(fs.readFileSync(MOVE_DESCRIPTIONS_OUTPUT, 'utf8'));
}

const result: Record<
  string,
  {
    moves: Move[];
    faithfulMoves?: Move[];
    updatedMoves?: Move[];
    forms?: Record<
      string,
      {
        moves: Move[];
        faithfulMoves?: Move[];
        updatedMoves?: Move[];
      }
    >;
  }
> = {};

let currentMonV2: string | null = null;
let movesV2: Move[] = [];
let faithfulMovesV2: Move[] = [];
let updatedMovesV2: Move[] = [];
let evoMethods: EvoRaw[] = [];

// Helper function to extract base Pokemon name and form from evos_attacks entries
function parseFormName(pokemonName: string): { baseName: string; formName: string | null } {
  // Directly check for Porygon-Z and similar cases that need special handling
  if (
    pokemonName.toLowerCase() === 'porygonz' ||
    pokemonName.toLowerCase() === 'porygon z' ||
    pokemonName.toLowerCase() === 'porygon-z'
  ) {
    return { baseName: 'porygon-z', formName: null };
  }

  // If the pokemon name is 'porygon' with something that looks like a Z suffix
  // but it should be Porygon-Z, handle it correctly
  if (
    pokemonName.toLowerCase().startsWith('porygon') &&
    (pokemonName.toLowerCase().endsWith('z') ||
      pokemonName.toLowerCase().includes(' z') ||
      pokemonName.toLowerCase().includes('-z'))
  ) {
    console.log(`DEBUG: Special handling for Porygon-Z variant: ${pokemonName}`);
    // If it's actually meant to be Porygon-Z, return as a distinct Pokemon, not a form
    return { baseName: 'porygon-z', formName: null };
  }

  // List of special Pokémon with hyphens in their base names
  const SPECIAL_HYPHENATED_POKEMON = [
    'farfetch-d',
    'nidoran-f',
    'nidoran-m',
    'mr-mime',
    'mime-jr',
    'ho-oh',
    'porygon-z',
    'sirfetch-d',
    'type-null',
    'jangmo-o',
    'hakamo-o',
    'kommo-o',
  ];

  // Form patterns for detecting variants
  const formPatterns = [
    { suffix: 'Plain', form: null }, // Plain forms are considered base forms
    { suffix: 'Hisuian', form: 'hisuian' },
    { suffix: 'Galarian', form: 'galarian' },
    { suffix: 'Alolan', form: 'alolan' },
    { suffix: 'Paldean', form: 'paldean' },
    { suffix: 'PaldeanFire', form: 'paldean-fire' },
    { suffix: 'PaldeanWater', form: 'paldean-water' },
    { suffix: 'Armored', form: 'armored' },
    { suffix: 'BloodMoon', form: 'bloodmoon' },
    { suffix: 'plain', form: null },
    { suffix: 'hisui', form: 'hisui' },
    { suffix: 'galarian', form: 'galarian' },
    { suffix: 'alolan', form: 'alolan' },
    { suffix: 'paldean', form: 'paldean' },
    { suffix: 'galar', form: 'galar' },
    { suffix: 'hisui', form: 'hisui' },
    { suffix: 'red', form: 'red' },
    { suffix: 'bloodmoon', form: 'bloodmoon' },
    { suffix: 'paldean_fire', form: 'paldean-fire' },
    { suffix: 'paldean_water', form: 'paldean-water' },
  ];

  // Handle special hyphenated Pokémon first
  const lowerName = pokemonName.toLowerCase();
  for (const specialName of SPECIAL_HYPHENATED_POKEMON) {
    if (lowerName === specialName || lowerName.startsWith(specialName)) {
      // Check if there's a form suffix after the special name
      const formPart = lowerName.slice(specialName.length);
      if (!formPart) {
        return { baseName: specialName, formName: null };
      }

      // Check if the remaining part matches a known form pattern
      for (const pattern of formPatterns) {
        if (formPart.toLowerCase() === pattern.suffix.toLowerCase()) {
          return { baseName: specialName, formName: pattern.form };
        }
      }

      return { baseName: specialName, formName: null };
    }
  }

  // Handle patterns like TyphlosionHisuian, TyphlosionPlain, MrMimeGalarian, etc.
  for (const pattern of formPatterns) {
    if (pokemonName.endsWith(pattern.suffix)) {
      const baseName = pokemonName.slice(0, -pattern.suffix.length);
      console.log(
        `DEBUG: parseFormName - ${pokemonName} -> baseName: ${baseName}, formName: ${pattern.form}`,
      );
      return { baseName: normalizeMoveString(baseName), formName: pattern.form };
    }
  }

  // No form pattern found, treat as base form
  return { baseName: normalizeMoveString(pokemonName), formName: null };
}

// Enhanced moveset parsing with faithful/updated support
function parseMovesetWithFaithfulSupport(lines: string[]): Record<
  string,
  {
    moves: Move[];
    faithfulMoves?: Move[];
    updatedMoves?: Move[];
    forms?: Record<
      string,
      {
        moves: Move[];
        faithfulMoves?: Move[];
        updatedMoves?: Move[];
      }
    >;
  }
> {
  const movesetResult: Record<
    string,
    {
      moves: Move[];
      faithfulMoves?: Move[];
      updatedMoves?: Move[];
      forms?: Record<
        string,
        {
          moves: Move[];
          faithfulMoves?: Move[];
          updatedMoves?: Move[];
        }
      >;
    }
  > = {};

  let currentMonV2: string | null = null;
  let movesV2: Move[] = [];
  let faithfulMovesV2: Move[] = [];
  let updatedMovesV2: Move[] = [];
  let evoMethods: EvoRaw[] = [];
  let isInFaithfulBlock = false;
  let isInUpdatedBlock = false;
  let faithfulBlockDepth = 0;

  function createMoveFromMatch(level: number, moveKey: string): Move {
    const prettyName = normalizeMoveString(moveKey);
    const info = moveDescriptions[prettyName]
      ? {
          description: moveDescriptions[prettyName].description,
          type: moveDescriptions[prettyName].type,
          pp: moveDescriptions[prettyName].pp,
          power: moveDescriptions[prettyName].power,
          accuracy: moveDescriptions[prettyName].accuracy,
          effectPercent: moveDescriptions[prettyName].effectPercent,
          category: moveDescriptions[prettyName].category,
        }
      : undefined;

    let fixedInfo = info;
    if (info) {
      fixedInfo = { ...info };
      for (const key of Object.keys(fixedInfo)) {
        if (typeof (fixedInfo as any)[key] === 'string') {
          (fixedInfo as any)[key] = replaceMonString((fixedInfo as any)[key]);
        }
      }
    }

    return {
      name: replaceMonString(prettyName),
      level,
      ...(fixedInfo ? { info: fixedInfo } : {}),
    };
  }

  function storeMovesetData() {
    if (!currentMonV2) return;

    console.log(`DEBUG: Processing evos_attacks for: ${currentMonV2}`);
    const { baseName, formName } = parseFormName(currentMonV2);

    // For the main moves array, only include moves that are not in conditional blocks
    // This prevents duplication between moves and faithfulMoves/updatedMoves
    const combinedMoves = [...movesV2];
    // Sort by level
    combinedMoves.sort((a, b) => Number(a.level) - Number(b.level));

    if (formName) {
      // This is a form-specific moveset
      if (!movesetResult[baseName]) {
        movesetResult[baseName] = { moves: [] };
      }
      if (!movesetResult[baseName].forms) {
        movesetResult[baseName].forms = {};
      }
      console.log(
        `DEBUG: Storing form ${formName} moves for ${baseName}:`,
        combinedMoves.slice(0, 3),
      );
      movesetResult[baseName].forms[formName] = {
        moves: combinedMoves,
        ...(faithfulMovesV2.length > 0 ? { faithfulMoves: faithfulMovesV2 } : {}),
        ...(updatedMovesV2.length > 0 ? { updatedMoves: updatedMovesV2 } : {}),
      };
    } else {
      // This is a base form moveset
      movesetResult[baseName] = {
        moves: combinedMoves,
        ...(faithfulMovesV2.length > 0 ? { faithfulMoves: faithfulMovesV2 } : {}),
        ...(updatedMovesV2.length > 0 ? { updatedMoves: updatedMovesV2 } : {}),
        ...(movesetResult[baseName]?.forms ? { forms: movesetResult[baseName].forms } : {}),
      };
    }

    if (evoMethods.length) {
      evoMap[normalizeMoveString(currentMonV2)] = evoMethods.map((e) => ({
        ...e,
        target: normalizeMoveString(e.target),
        form: e.form ? normalizeMoveString(e.form) : undefined,
      }));
      for (const evo of evoMethods) {
        const tgt = normalizeMoveString(evo.target);
        if (!preEvoMap[tgt]) preEvoMap[tgt] = [];
        preEvoMap[tgt].push(normalizeMoveString(currentMonV2));
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Handle conditional blocks
    if (line.startsWith('if DEF(FAITHFUL)')) {
      isInFaithfulBlock = true;
      faithfulBlockDepth++;
      continue;
    } else if (line.startsWith('if !DEF(FAITHFUL)')) {
      isInUpdatedBlock = true;
      faithfulBlockDepth++;
      continue;
    } else if (line === 'else' && (isInFaithfulBlock || isInUpdatedBlock)) {
      // Switch the block type
      if (isInFaithfulBlock) {
        isInFaithfulBlock = false;
        isInUpdatedBlock = true;
      } else if (isInUpdatedBlock) {
        isInUpdatedBlock = false;
        isInFaithfulBlock = true;
      }
      continue;
    } else if (line === 'endc') {
      if (faithfulBlockDepth > 0) {
        faithfulBlockDepth--;
        if (faithfulBlockDepth === 0) {
          isInFaithfulBlock = false;
          isInUpdatedBlock = false;
        }
      }
      continue;
    }

    if (line.startsWith('evos_attacks ') || line.match(/^[A-Za-z]+EvosAttacks:$/)) {
      if (currentMonV2) {
        storeMovesetData();
      }

      // Handle both formats: "evos_attacks PokemonName" and "PokemonNameEvosAttacks:"
      if (line.startsWith('evos_attacks ')) {
        currentMonV2 = line.split(' ')[1];
      } else if (line.match(/^[A-Za-z]+EvosAttacks:$/)) {
        // Extract pokemon name from "PokemonNameEvosAttacks:" format
        currentMonV2 = line.replace('EvosAttacks:', '');
      }

      movesV2 = [];
      faithfulMovesV2 = [];
      updatedMovesV2 = [];
      evoMethods = [];
      isInFaithfulBlock = false;
      isInUpdatedBlock = false;
      faithfulBlockDepth = 0;
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
          ...(form ? { form: form.trim() } : {}),
        });
      }
    } else if (line.startsWith('learnset ')) {
      const match = line.match(/learnset (\d+),\s*([A-Z0-9_]+)/);
      if (match) {
        const level = parseInt(match[1], 10);
        const moveKey = match[2];
        const move = createMoveFromMatch(level, moveKey);

        // Add to appropriate move list based on current context
        if (isInFaithfulBlock) {
          faithfulMovesV2.push(move);
        } else if (isInUpdatedBlock) {
          updatedMovesV2.push(move);
        } else if (faithfulBlockDepth > 0) {
          // We're in an else block - determine which type based on the current state
          if (isInFaithfulBlock) {
            faithfulMovesV2.push(move);
          } else {
            updatedMovesV2.push(move);
          }
        } else {
          // Regular move (no conditional block) - should be available in both versions
          movesV2.push(move);
          faithfulMovesV2.push(move);
          updatedMovesV2.push(move);
        }
      }
    }
  }

  // Handle the last Pokemon
  if (currentMonV2) {
    storeMovesetData();
  }

  return movesetResult;
}

// Use the new parsing function
const movesetData = parseMovesetWithFaithfulSupport(lines);
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
          const normalizedTargetName = normalizePokemonDisplayName(targetMon);

          // If the target is in our chain, add the dependency
          if (chain.includes(normalizedTargetName)) {
            graph[mon].add(normalizedTargetName); // mon evolves into target
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
          const normalizedPreName = normalizePokemonDisplayName(standardPre);

          // If the pre-evolution is in our chain, add the dependency
          if (chain.includes(normalizedPreName)) {
            graph[normalizedPreName].add(mon); // pre evolves into mon
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

// Non-recursive function to build the complete evolution chain with methods
function buildCompleteEvolutionChain(startMon: string): {
  chain: string[];
  methodsByPokemon: Record<string, EvolutionMethod[]>;
} {
  // This map will keep track of which Pokémon we've already processed
  const processedMons = new Set<string>();
  // This map will store evolution methods for each Pokémon in the chain
  const methodsByPokemon: Record<string, EvolutionMethod[]> = {};

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
    // Apply URL-safe normalization to get the proper display name
    const normalizedDisplayName = normalizePokemonDisplayName(baseName);

    // Skip if we've already processed this Pokémon
    if (processedMons.has(normalizedDisplayName)) continue;
    processedMons.add(normalizedDisplayName);

    // Add to our evolution chain if not already included
    if (!chain.includes(normalizedDisplayName)) {
      chain.push(normalizedDisplayName);
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
        // Store evolution methods for this Pokémon
        if (!methodsByPokemon[normalizedDisplayName]) {
          methodsByPokemon[normalizedDisplayName] = [];
        }

        // Add all its evolutions to the queue and collect their methods
        for (const evo of evos) {
          const targetMon = standardizePokemonKey(evo.target);
          const normalizedTargetName = normalizePokemonDisplayName(targetMon);

          // may need this for special cases like porygon-z

          // Store evolution method information      // Fix inconsistent naming issues for special cases like porygon-z
          // let fixedTargetName = normalizedTargetName;

          // // Special case for porygon-z
          // if (normalizedTargetName === 'Porygon Z' ||
          //   normalizedTargetName.toLowerCase() === 'porygon z' ||
          //   normalizedTargetName.toLowerCase() === 'porygonz') {
          //   fixedTargetName = 'porygon-z';
          // }

          methodsByPokemon[normalizedDisplayName].push({
            method: evo.method,
            parameter: evo.parameter,
            target: normalizedTargetName,
            ...(evo.form ? { form: evo.form } : {}),
          });

          if (!processedMons.has(normalizedTargetName)) {
            queue.push(evo.target);
          }
        }
      }
    }
  }

  // Sort the chain to put earliest evolutions first
  const sortedChain = sortEvolutionChain(chain);

  // Create a new methodsByPokemon object with the sorted Pokémon names
  const sortedMethodsByPokemon: Record<string, EvolutionMethod[]> = {};
  for (const pokemon of sortedChain) {
    sortedMethodsByPokemon[pokemon] = methodsByPokemon[pokemon] || [];
  }

  return {
    chain: sortedChain,
    methodsByPokemon: sortedMethodsByPokemon,
  };
}

// Function to get the evolution chain and methods for a Pokémon
function getEvolutionChain(mon: string): {
  chain: string[];
  methodsByPokemon: Record<string, EvolutionMethod[]>;
} {
  // Use the non-recursive approach to build a complete chain with methods
  return buildCompleteEvolutionChain(mon);
}

// Load all base stats files
const baseStatsFiles = fs.readdirSync(BASE_STATS_DIR).filter((f) => f.endsWith('.asm'));

// First pass: Process all files to extract type information
for (const file of baseStatsFiles) {
  const fileName = file.replace('.asm', '');
  const content = fs.readFileSync(path.join(BASE_STATS_DIR, file), 'utf8');

  // Extract base Pokémon name and form name
  const { basePokemonName, formName } = extractFormInfo(fileName);

  // Enhanced debugging for specific Pokémon
  const isDebug = isDebugPokemon(basePokemonName);

  // Initialize variables for both faithful and updated types
  let faithfulTypes: [string, string] | null = null;
  let updatedTypes: [string, string] | null = null;
  let hasConditionalTypes = false;

  // First check if there are conditional types based on FAITHFUL
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (isDebug) {
      console.log(
        `DEBUG: for loop for conditional types, extract_pokemon_data  Line ${i}: "${line}"`,
      );
    }
    if (line.startsWith('if DEF(FAITHFUL)')) {
      if (isDebug) {
        console.log(`DEBUG: line considered faithful: "${line}"`);
      }
      // Look for type definition within the conditional block
      for (let j = i + 1; j < lines.length && !lines[j].trim().startsWith('else'); j++) {
        const typeLine = lines[j].trim();
        if (typeLine.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/)) {
          const match = typeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
          if (match) {
            // Convert type enums to proper type names for faithful version
            faithfulTypes = [
              typeEnumToName[match[1]] || 'None',
              typeEnumToName[match[2]] || 'None',
            ];
            hasConditionalTypes = true;
          }
          break;
        }
      }

      // Look for the else block with updated types
      let foundElse = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (isDebug) {
          console.log(
            `DEBUG: Checking for else block, extract_pokemon_data  Line ${j}: "${lines[j]}"`,
          );
        }
        if (lines[j].trim() === 'else') {
          if (isDebug) {
            console.log(`DEBUG: Found else block for ${basePokemonName} in ${fileName}`);
          }
          foundElse = true;
          // Look for type definition in the else block
          for (let k = j + 1; k < lines.length && !lines[k].trim().startsWith('endc'); k++) {
            const typeLine = lines[k].trim();
            if (isDebug) {
              console.log(
                `DEBUG: Checking type line in else block, extract_pokemon_data  Line ${k}: "${typeLine}"`,
              );
            }
            if (typeLine.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/)) {
              const match = typeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
              if (isDebug) {
                console.log(`DEBUG: Match found in else block: ${match}`);
                console.log(`DEBUG: Match details: ${JSON.stringify(match)}`);
              }
              if (match) {
                // Convert type enums to proper type names for updated version
                updatedTypes = [
                  typeEnumToName[match[1]] || 'None',
                  typeEnumToName[match[2]] || 'None',
                ];
                if (isDebug) {
                  console.log(`DEBUG: Match details: ${JSON.stringify(match)}`);
                }
              }
              break;
            }
          }
        }
        if (foundElse && lines[j].trim().startsWith('endc')) {
          break;
        }
      }

      break; // We've found and processed the conditional block
    }
  }

  // If no conditional types were found, look for a standard type declaration
  if (!hasConditionalTypes) {
    // Find all type lines outside of any conditional blocks
    const typeLines = lines.filter((l) => l.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/));
    // Use the first type line as faithful, second (if exists) as updated
    if (typeLines.length > 0) {
      // Faithful types from the first type line
      const matchFaithful = typeLines[0].match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
      if (matchFaithful) {
        const t1 = typeEnumToName[matchFaithful[1]] || 'None';
        const t2 = typeEnumToName[matchFaithful[2]] || 'None';
        faithfulTypes = [t1, t2];
      }
      // Updated types from the second type line, if present
      if (typeLines.length > 1) {
        const matchUpdated = typeLines[1].match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
        if (matchUpdated) {
          const t1 = typeEnumToName[matchUpdated[1]] || 'None';
          const t2 = typeEnumToName[matchUpdated[2]] || 'None';
          updatedTypes = [t1, t2];
        }
      } else {
        updatedTypes = faithfulTypes;
      }
    } else {
      continue; // Skip this file if no type info found
    }
  }

  if (isDebug) {
    console.log(`DEBUG: Processing types in ${fileName} for ${basePokemonName}`);
    console.log(`DEBUG: Has conditional types: ${hasConditionalTypes}`);
    console.log(`DEBUG: Faithful types: ${faithfulTypes ? faithfulTypes.join(', ') : 'None'}`);
    console.log(`DEBUG: Updated types: ${updatedTypes ? updatedTypes.join(', ') : 'None'}`);
    console.log(`DEBUG: All lines in file:`, lines.slice(0, 25));
  }

  // Special handling for "_plain" files
  if (fileName.endsWith('_plain')) {
    // Handle plain form types
    const baseTypeName = toTitleCase(basePokemonName);
    typeMap[baseTypeName] = {
      types: faithfulTypes || ['None', 'None'],
      updatedTypes: updatedTypes || ['None', 'None'], // Don't fall back to faithfulTypes
    };
  } else if (formName && formName !== null) {
    // Handle form-specific types
    const baseTypeName = toTitleCase(basePokemonName);
    const formTypeName = toTitleCase(formName);

    // If the base type doesn't exist in the map yet, initialize it
    if (!formTypeMap[baseTypeName]) {
      formTypeMap[baseTypeName] = {};
    }

    // Add form-specific types
    formTypeMap[baseTypeName][formTypeName] = {
      types: faithfulTypes || ['None', 'None'],
      updatedTypes: updatedTypes || ['None', 'None'], // Don't fall back to faithfulTypes
    };

    if (isDebug) {
      console.log(
        `DEBUG: Processing types for ${fileName} as special form ${formName} for ${basePokemonName}`,
      );
      console.log(`DEBUG: Faithful types: ${faithfulTypes?.join(', ')}`);
      console.log(`DEBUG: Updated types: ${updatedTypes?.join(', ')}`);
    }
  } else {
    // Handle regular Pokémon types
    const typeName = toTitleCase(basePokemonName);
    typeMap[typeName] = {
      types: faithfulTypes || ['None', 'None'],
      updatedTypes: updatedTypes || ['None', 'None'], // Don't fall back to faithfulTypes
    };

    if (isDebug) {
      console.log(
        `DEBUG: Processing (regular) ${typeName} for ${fileName} as base Pokémon ${basePokemonName}`,
      );
      console.log(`DEBUG: Faithful types: ${faithfulTypes?.join(', ')}`);
      console.log(`DEBUG: Updated types: ${updatedTypes?.join(', ')}`);
    }
  }
}
const finalResult: Record<string, PokemonDataV3> = {};

for (const mon of Object.keys(movesetData)) {
  const isDebug = isDebugPokemon(mon);

  const moves = movesetData[mon].moves.map((m) => {
    let fixedInfo = m.info;
    if (m.info) {
      fixedInfo = { ...m.info };
      for (const key of Object.keys(fixedInfo)) {
        if (typeof (fixedInfo as any)[key] === 'string') {
          (fixedInfo as any)[key] = replaceMonString((fixedInfo as any)[key]);
        }
      }
    }
    return {
      name: replaceMonString(m.name),
      level: m.level,
      ...(fixedInfo ? { info: fixedInfo } : {}),
    };
  });

  // Process faithful moves if they exist
  const faithfulMoves = movesetData[mon].faithfulMoves?.map((m) => {
    let fixedInfo = m.info;
    if (m.info) {
      fixedInfo = { ...m.info };
      for (const key of Object.keys(fixedInfo)) {
        if (typeof (fixedInfo as any)[key] === 'string') {
          (fixedInfo as any)[key] = replaceMonString((fixedInfo as any)[key]);
        }
      }
    }
    return {
      name: replaceMonString(m.name),
      level: m.level,
      ...(fixedInfo ? { info: fixedInfo } : {}),
    };
  });

  // Process updated moves if they exist
  const updatedMoves = movesetData[mon].updatedMoves?.map((m) => {
    let fixedInfo = m.info;
    if (m.info) {
      fixedInfo = { ...m.info };
      for (const key of Object.keys(fixedInfo)) {
        if (typeof (fixedInfo as any)[key] === 'string') {
          (fixedInfo as any)[key] = replaceMonString((fixedInfo as any)[key]);
        }
      }
    }
    return {
      name: replaceMonString(m.name),
      level: m.level,
      ...(fixedInfo ? { info: fixedInfo } : {}),
    };
  });
  if (isDebug) {
    console.log(`DEBUG: Processing Pokémon in const mon of Object.keys(result) : ${mon}`, mon);
    console.log(`DEBUG: Moves for ${mon}:`, moves.slice(0, 3));
  }
  // Standardize the Pokemon name to ensure consistent keys
  const standardMon = standardizePokemonKey(mon);

  if (isDebug) {
    console.log(`DEBUG: Standardized Pokémon name: ${standardMon}`);
  }

  // Every Pokémon should have an evolution object, even if it's a final evolution
  // with no further evolutions. This ensures we have a chain for all Pokémon.
  const methods = evoMap[standardMon]
    ? evoMap[standardMon].map((e) => ({
        method: e.method,
        parameter: e.parameter,
        target: standardizePokemonKey(e.target),
        ...(e.form ? { form: e.form } : {}),
      }))
    : [];

  if (isDebug) {
    console.log(`DEBUG: Evolution methods for ${standardMon}:`, methods.slice(0, 3));
  }

  // Get the evolution chain and methods - this will work even for final evolutions
  // as it will include all pre-evolutions
  const evolutionResult = getEvolutionChain(standardMon);

  if (isDebug) {
    console.log(`DEBUG: Evolution chain for ${standardMon}:`, evolutionResult.chain);
  }

  // If the chain contains only the current Pokémon and there are no methods,
  // it could be a basic Pokémon with no evolutions
  const evolution: Evolution = {
    methods,
    chain: evolutionResult.chain,
    chainWithMethods: evolutionResult.methodsByPokemon,
  };

  if (isDebug) {
    console.log(`DEBUG: Final evolution object for ${standardMon}:`, evolution);
  }

  // Dex numbers (1-based, null if not found)
  // First get the base name by removing any form suffixes
  let baseMonName = standardizePokemonKey(mon);

  // Handle special cases for Pokémon with hyphens in their names

  if (isDebug) {
    console.log(
      `DEBUG: Base Pokémon name before special case handling: ${baseMonName}, original mon: ${mon}`,
    );
  }

  if (baseMonName === 'Mr- Mime') {
    baseMonName = 'Mr-Mime'; // Special case for Mr. Mime
  }
  // Special case for Mime Jr. and its variants
  if (
    baseMonName === 'Mime- Jr' ||
    baseMonName === 'Mime Jr' ||
    baseMonName === 'Mime-Jr' ||
    baseMonName === 'MimeJr' ||
    baseMonName.toLowerCase() === 'mime-jr'
  ) {
    baseMonName = 'Mime-Jr';
  }

  if (baseMonName === 'porygon -Z' || baseMonName === 'porygon-Z' || 'porygon -z' === baseMonName) {
    baseMonName = 'Porygon-Z';
  }

  if (isDebug) {
    console.log(`DEBUG: Processing Pokémon: ${mon} (base: ${baseMonName})`);
  }

  console.log(`DEBUG: Base Pokémon name after special case handling: ${baseMonName}`);

  let baseMonNameDex = baseMonName; // Normalize for dex lookup

  if (baseMonNameDex.toLowerCase() === 'porygon-z') {
    baseMonNameDex = 'porygon-z'; // Ensure consistent casing for dex lookup
  }
  if (baseMonNameDex.toLowerCase() === 'mr-rime') {
    baseMonNameDex = 'mr-rime'; // Ensure consistent casing for dex lookup
  }

  // Show all dex order entries for debugging
  console.log(`DEBUG: Base Pokémon name for dex lookup: ${baseMonNameDex}`);
  console.log('DEBUG: Full National Dex Order:', JSON.stringify(nationalDexOrder, null, 2));
  console.log('DEBUG: Full Johto Dex Order:', JSON.stringify(johtoDexOrder, null, 2));

  const nationalDex =
    nationalDexOrder.indexOf(baseMonNameDex) >= 0
      ? nationalDexOrder.indexOf(baseMonNameDex) + 1
      : null;
  const johtoDex =
    johtoDexOrder.indexOf(baseMonNameDex) >= 0 ? johtoDexOrder.indexOf(baseMonNameDex) + 1 : null; // Types

  console.log(`DEBUG: Processing Pokémon: ${mon} (base: ${baseMonName})`);
  console.log(
    `DEBUG: Processing Dex for ${baseMonNameDex},  National Dex: ${nationalDex}, Johto Dex: ${johtoDex}`,
    johtoDexOrder.indexOf('porygon-z'),
  );

  // Determine if this is a form and extract the base name and form name
  let basePokemonName = baseMonName;

  let formName: string | null = null;

  // Check if this is a form by checking for known form suffixes
  for (const form of Object.values(KNOWN_FORMS)) {
    if (isDebug) {
      console.log(`DEBUG: Checking form suffix: ${form} for Pokémon: ${mon}`);
      console.log(
        `DEBUG: mon.toLowerCase().endsWith(form.toLowerCase()): ${mon.toLowerCase().endsWith(form.toLowerCase())}`,
      );
    }
    if (mon.toLowerCase().endsWith(form.toLowerCase())) {
      basePokemonName = mon.substring(0, mon.length - form.length);
      formName = form;
      if (isDebug) {
        console.log(`DEBUG: Found form suffix: ${form} for Pokémon: ${mon}`);
        console.log(`DEBUG: Base Pokémon name: ${basePokemonName}, Form name: ${formName}`);
      }
      break;
    }
  }

  // Get types based on whether this is a base form or a special form
  let faithfulTypes: string[] = ['None'];
  let updatedTypes: string[] = ['None'];

  if (formName && formName !== KNOWN_FORMS.PLAIN) {
    // This is a special form like alolan, galarian, etc.
    if (isDebug) {
      console.log(
        `DEBUG: Processing form-specific Pokémon: ${mon} (base: ${basePokemonName}, form: ${formName})`,
      );
      console.log(
        `DEBUG: formName && formName !== KNOWN_FORMS.PLAIN:`,
        formName && formName !== KNOWN_FORMS.PLAIN,
      );
    }
    if (formTypeMap[basePokemonName] && formTypeMap[basePokemonName][formName]) {
      if (isDebug) {
        console.log(
          `DEBUG: Found form-specific types for ${basePokemonName} (${formName})`,
          formTypeMap[basePokemonName][formName],
        );
      }
      // Use form-specific type data from formTypeMap
      const formTypeData = formTypeMap[basePokemonName][formName];
      faithfulTypes = formTypeData.types || ['None'];
      updatedTypes = formTypeData.updatedTypes || ['None']; // Don't fall back to faithfulTypes
      if (isDebug) {
        console.log(`DEBUG: Form type data for ${basePokemonName} (${formName}):`, formTypeData);
      }
    } else {
      // Fallback to base type if form type not found
      // Convert the URL key to the format used in typeMap (which uses toTitleCase/normalizeString)
      const typeMapKey = toTitleCase(basePokemonName);
      if (isDebug) {
        console.log(
          `DEBUG: else fallback for form name variant ${basePokemonName} (${formName}) typeMapKey:`,
          typeMapKey,
        );
      }
      if (typeMap[typeMapKey]) {
        if (isDebug) {
          console.log(
            `DEBUG: typeMap[typeMapKey] is true for ${basePokemonName} (${formName}) in typeMap:`,
            typeMap[typeMapKey],
          );
        }
        faithfulTypes = typeMap[typeMapKey].types || ['None'];
        updatedTypes = typeMap[typeMapKey].updatedTypes || ['None']; // Don't fall back to faithfulTypes
        if (isDebug) {
          console.log(
            `DEBUG: New types for ${basePokemonName} (${formName}):`,
            `${typeMap[typeMapKey].types} and ${typeMap[typeMapKey].updatedTypes}`,
          );
        }
      }
      if (isDebug) {
        console.log(
          `DEBUG: Fallback to base type for ${basePokemonName} (${formName}):`,
          typeMap[typeMapKey],
        );
      }
    }
  } else {
    // This is a base form or plain form - look up directly in typeMap
    // Convert the URL key to the format used in typeMap (which uses toTitleCase/normalizeString)

    // ToDo: review title case conversion

    const typeMapKey = toTitleCase(baseMonName);

    if (isDebug) {
      console.log(
        `DEBUG: Else if no forms - use title case ${basePokemonName} (${formName}):`,
        typeMap[typeMapKey],
      );
    }

    if (isDebug) {
      console.log(`DEBUG: typeMapKey for base form ${baseMonName} (${formName}):`, typeMapKey);
    }
    if (typeMap[typeMapKey]) {
      faithfulTypes = typeMap[typeMapKey].types || ['None'];
      updatedTypes = typeMap[typeMapKey].updatedTypes || ['None']; // Don't fall back to faithfulTypes
      if (isDebug) {
        console.log(
          `DEBUG: New types for ${baseMonName} (${formName}):`,
          `${typeMap[typeMapKey].types} and ${typeMap[typeMapKey].updatedTypes}`,
        );
      }
    }
  }

  // Process faithful types
  let faithfulTypesFormatted: string | string[] = Array.from(new Set(faithfulTypes)).filter(
    (t) => t !== 'None',
  );

  if (isDebug) {
    console.log(
      `DEBUG: Fallback to base type for ${basePokemonName} (${formName}):`,
      faithfulTypesFormatted,
    );
  }

  if (faithfulTypesFormatted.length === 0) {
    if (isDebug) {
      console.log(`DEBUG: No faithful types found for ${basePokemonName} (${formName})`);
    }
    // Fallback to 'Unknown' if no faithful types found
    faithfulTypesFormatted = 'Unknown';
  } else if (faithfulTypesFormatted.length === 1) {
    if (isDebug) {
      console.log(
        `DEBUG: Single faithful type for ${basePokemonName} (${formName}):`,
        faithfulTypesFormatted[0],
      );
    }
    // If only one type, use it directly
    faithfulTypesFormatted = faithfulTypesFormatted[0];
  }

  // Process updated types
  let updatedTypesFormatted: string | string[] = Array.from(new Set(updatedTypes)).filter(
    (t) => t !== 'None',
  );

  if (isDebug) {
    console.log(
      `DEBUG: Updated types for ${basePokemonName} (${formName}):`,
      updatedTypesFormatted,
    );
  }

  if (updatedTypesFormatted.length === 0) {
    if (isDebug) {
      console.log(`DEBUG: No updated types found for ${basePokemonName} (${formName})`);
    }
    updatedTypesFormatted = 'Unknown';
  } else if (updatedTypesFormatted.length === 1) {
    updatedTypesFormatted = updatedTypesFormatted[0];
    if (isDebug) {
      console.log(
        `DEBUG: Single updated type for ${basePokemonName} (${formName}):`,
        updatedTypesFormatted,
      );
    }
  }

  // Set the primary types field to the faithful types by default
  const types = faithfulTypesFormatted;

  if (isDebug) {
    console.log(`DEBUG: Final types for ${basePokemonName} (${formName}):`, types);
  }

  if (isDebug) {
    console.log(`DEBUG: Final updated types for ${basePokemonName} (${formName}):`);
  }

  // Create the final result with both faithful and updated types
  // Only replace #mon in string fields, not the object type
  // Fix types for TS: ensure string/string[] for type fields
  const fixTypeField = (val: string | string[]) => {
    if (Array.isArray(val)) return val.map(replaceMonString);
    return replaceMonString(val);
  };
  const fixedFinalResult: (typeof finalResult)[typeof mon] = {
    evolution,
    moves,
    ...(faithfulMoves ? { faithfulMoves } : {}),
    ...(updatedMoves ? { updatedMoves } : {}),
    ...(nationalDex !== null ? { nationalDex } : {}),
    ...(johtoDex !== null ? { johtoDex } : {}),
    ...(types && types !== 'Unknown' ? { types: fixTypeField(types as string | string[]) } : {}),
    ...(faithfulTypesFormatted && faithfulTypesFormatted !== 'Unknown'
      ? { faithfulTypes: fixTypeField(faithfulTypesFormatted as string | string[]) }
      : {}),
    ...(updatedTypesFormatted && updatedTypesFormatted !== 'Unknown'
      ? { updatedTypes: fixTypeField(updatedTypesFormatted as string | string[]) }
      : {}),
  };
  finalResult[mon] = fixedFinalResult;

  if (isDebug) {
    console.log(`DEBUG: Final Pokémon data for ${mon}:`, finalResult[mon]);
  }
}

// --- Wild Pokémon Location Extraction ---
// LocationEntry type is now imported from the common types file
const wildDir = path.join(__dirname, 'polishedcrystal/data/wild');
const wildFiles = fs.readdirSync(wildDir).filter((f) => f.endsWith('.asm'));

// Aggregate locations by Pokémon
const locationsByMon: { [mon: string]: LocationEntry[] } = {};

for (const file of wildFiles) {
  const isDebug = isDebugPokemon(file);
  if (isDebug) {
    console.log(`DEBUG: Processing wild file: ${file}`);
  }
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
    nite: 0,
  };
  // --- Group wildmon entries by time ---
  let slotEntriesByTime: Record<string, Array<{ key: string; entry: LocationEntry }>> = {};
  let currentTime: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Area block start
    const areaMatch = line.match(/^def_(grass|water)_wildmons ([A-Z0-9_]+)/);
    if (areaMatch) {
      area = normalizeLocationKey(areaMatch[2]);
      method = areaMatch[1];
      inBlock = true;
      blockType = method;
      currentTime = null;
      slotEntriesByTime = {};
      encounterRates = { morn: 0, day: 0, nite: 0 };
      if (isDebug) {
        console.log(
          `DEBUG: Found area block start: area=${area}, method=${method}, blockType=${blockType}`,
        );
      }
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
        if (isDebug) {
          console.log(`DEBUG: Parsed encounter rates:`, encounterRates);
        }
      }
      continue;
    }
    if (inBlock && line.startsWith('end_' + blockType + '_wildmons')) {
      // For each time block, assign canonical rates
      const encounterType = method === 'water' ? 'surf' : 'grass';
      if (isDebug) {
        console.log(
          `DEBUG: End of block for area=${area}, method=${method}, encounterType=${encounterType}`,
        );
      }
      for (const [time, slotEntries] of Object.entries(slotEntriesByTime)) {
        const slotPokemon = slotEntries.map((e) => e.key);
        const mappedRates = mapEncounterRatesToPokemon(slotPokemon, encounterType);
        if (isDebug) {
          console.log(
            `DEBUG: Mapping encounter rates for time=${time}, slotPokemon=`,
            slotPokemon,
            'mappedRates=',
            mappedRates,
          );
        }
        for (let idx = 0; idx < slotEntries.length; idx++) {
          slotEntries[idx].entry.chance = mappedRates[idx]?.rate ?? 0;
          if (!locationsByMon[slotEntries[idx].key]) locationsByMon[slotEntries[idx].key] = [];
          locationsByMon[slotEntries[idx].key].push(slotEntries[idx].entry);
          if (isDebug) {
            console.log(
              `DEBUG: Added location for ${slotEntries[idx].key}:`,
              slotEntries[idx].entry,
            );
          }
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
      if (['morn', 'day', 'nite', 'eve'].includes(t)) {
        currentTime = t;
        if (!slotEntriesByTime[currentTime]) slotEntriesByTime[currentTime] = [];
        if (isDebug) {
          console.log(`DEBUG: Switched to time block: ${currentTime}`);
        }
      }
      continue;
    }
    if (inBlock && line.startsWith('wildmon')) {
      const parsed = parseWildmonLine(line);
      if (parsed) {
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
        else if (currentTime === 'eve' && encounterRates.eve !== undefined)
          encounterRate = encounterRates.eve;
        else encounterRate = encounterRates.day;
        if (!slotEntriesByTime[currentTime || 'day']) slotEntriesByTime[currentTime || 'day'] = [];
        slotEntriesByTime[currentTime || 'day'].push({
          key,
          entry: {
            area,
            method,
            time: currentTime,
            level: normalizedLevel,
            chance: encounterRate,
            formName,
          },
        });
        if (isDebug) {
          console.log(
            `DEBUG: Parsed wildmon line: key=${key}, area=${area}, method=${method}, time=${currentTime}, level=${normalizedLevel}, chance=${encounterRate}, formName=${formName}`,
          );
        }
      }
      continue;
    }
  }
}

// Normalize locationsByMon keys but preserve location entry data
console.log('🔧 Normalizing location data keys...');
const normalizedLocationsByMon: { [mon: string]: LocationEntry[] } = {};
for (const [originalKey, locations] of Object.entries(locationsByMon)) {
  const normalizedKey = normalizePokemonUrlKey(originalKey);
  // Just copy the location entries without modification - they don't contain Pokemon names, nothing to debug here
  normalizedLocationsByMon[normalizedKey] = locations;
  console.log(`Normalized pokemon key: "${originalKey}" -> "${normalizedKey}"`);
}

// Add Pokemon that have base stats files but weren't in evos_attacks.asm
for (const file of baseStatsFiles) {
  const fileName = file.replace('.asm', '');
  const { basePokemonName, formName } = extractFormInfo(fileName);

  console.log(
    `DEBUG: for (const file of baseStatsFiles) Processing base stats file: ${fileName} (base: ${basePokemonName}, form: ${formName})`,
  );

  // Convert to the proper name format used in our data structures
  const pokemonName = toTitleCase(basePokemonName);

  const isDebug = isDebugPokemon(pokemonName) || isDebugPokemon(basePokemonName);

  if (isDebug) {
    console.log(
      `DEBUG: Processing base stats file: ${fileName} (base: ${basePokemonName}, form: ${formName})`,
    );
  }

  // Skip if this Pokemon is already in finalResult (already processed from evos_attacks)
  if (finalResult[pokemonName]) {
    if (isDebug) {
      console.log(`DEBUG: Skipping already processed Pokemon: ${pokemonName}`);
    }
    continue;
  }

  if (isDebug) {
    console.log(`DEBUG: Adding missing Pokemon from base stats: ${pokemonName} (from ${fileName})`);
  }

  // Get the dex numbers
  const nationalDex =
    nationalDexOrder.indexOf(pokemonName) >= 0 ? nationalDexOrder.indexOf(pokemonName) + 1 : null;
  const johtoDex =
    johtoDexOrder.indexOf(pokemonName) >= 0 ? johtoDexOrder.indexOf(pokemonName) + 1 : null; // Get types from our type maps

  if (isDebug) {
    console.log(`DEBUG: National Dex: ${nationalDex}, Johto Dex: ${johtoDex}`);
  }

  let faithfulTypes: string | string[] = 'Unknown';
  let updatedTypes: string | string[] = 'Unknown';

  if (typeMap[pokemonName]) {
    faithfulTypes = processTypeArray(typeMap[pokemonName].types || ['None']);
    updatedTypes = processTypeArray(typeMap[pokemonName].updatedTypes || ['None']);
    if (isDebug) {
      console.log(
        `DEBUG: Found types for ${pokemonName}: faithfulTypes=${faithfulTypes}, updatedTypes=${updatedTypes}`,
      );
    }
  }

  // Create basic Pokemon data structure
  finalResult[pokemonName] = {
    moves: [], // No moves since it wasn't in evos_attacks
    nationalDex,
    johtoDex,
    types: faithfulTypes,
    updatedTypes: updatedTypes,
    evolution: {
      methods: [],
      chain: [pokemonName], // Single Pokemon chain
      chainWithMethods: { [pokemonName]: [] },
    },
    forms: {},
    baseStats: {
      hp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      specialAttack: 0,
      specialDefense: 0,
      total: 0,
    },
    catchRate: 255,
    baseExp: 0,
    heldItems: [],
    abilities: [],
    faithfulAbilities: [],
    updatedAbilities: [],
    growthRate: 'Medium Fast',
    eggGroups: [],
    genderRatio: {
      male: 0,
      female: 0,
    },
    hatchRate: 'Unknown',
    evYield: 'None',
    locations: normalizedLocationsByMon[pokemonName] || [],
  };
  if (isDebug) {
    console.log(`DEBUG: Added missing Pokemon ${pokemonName} with base stats from ${fileName}`);
    console.dir('finalResult[pokemonName]', finalResult[pokemonName]);
  }
}

// Using the previously defined PokemonDataV3 type
const finalResultV3: Record<string, PokemonDataV3> = {};
for (const mon of Object.keys(finalResult)) {
  const isDebug = isDebugPokemon(mon);

  if (isDebug) {
    console.log(`DEBUG: Processing finalResultV3 result for Pokémon: ${mon}`);
  }

  // Provide default values for all DetailedStats fields to satisfy PokemonDataV3
  const fixedFinalResultV3: (typeof finalResultV3)[typeof mon] = {
    ...finalResult[mon],
    // Add all required DetailedStats fields with default values if not present
    baseStats: {
      hp: finalResult[mon].baseStats?.hp || 0,
      attack: 0,
      defense: 0,
      speed: 0,
      specialAttack: 0,
      specialDefense: 0,
      total: 0,
    },
    catchRate: 255,
    baseExp: 0,
    heldItems: [],
    abilities: [],
    faithfulAbilities: [],
    updatedAbilities: [],
    growthRate: replaceMonString('Medium Fast'),
    eggGroups: [],
    genderRatio: {
      male: 0,
      female: 0,
    },
    hatchRate: replaceMonString('Unknown'),
    evYield: replaceMonString('None'),
    locations: normalizedLocationsByMon[mon] || [],
  };
  finalResultV3[mon] = deepReplaceMonString(
    fixedFinalResultV3,
  ) as (typeof finalResultV3)[typeof mon];
  if (isDebug) {
    console.log(`DEBUG: Added missing Pokemon ${mon} with base stats from ${mon}`);
    console.dir('finalResult[pokemonName]', finalResult[mon]);
  }
}

// --- Add missing form entries for Pokemon with base stats files but no moveset entries ---
console.log('Checking for missing form entries...');

// Get all base stats files that represent forms
const baseStatsFormFiles = baseStatsFiles.filter((f) => {
  const fileName = f.replace('.asm', '');
  const { basePokemonName, formName } = extractFormInfo(fileName);

  console.log(
    `DEBUG: Processing base stats form file (not limited to debug pokemon): ${fileName} (base: ${basePokemonName}, form: ${formName})`,
  );

  return formName && formName !== 'Plain'; // Only non-plain forms
});

for (const formFile of baseStatsFormFiles) {
  const fileName = formFile.replace('.asm', '');
  const { basePokemonName, formName } = extractFormInfo(fileName);

  if (!basePokemonName || !formName) continue;

  const basePokemonKey = toTitleCase(basePokemonName);
  const fullFormKey = `${basePokemonKey}${formName}`;

  const isDebug = isDebugPokemon(basePokemonKey) || isDebugPokemon(fullFormKey);

  if (isDebug) {
    console.log(`DEBUG: Processing form file: ${formFile}`);
    console.log(`DEBUG: basePokemonName: ${basePokemonName}, formName: ${formName}`);
    console.log(`DEBUG: basePokemonKey: ${basePokemonKey}, fullFormKey: ${fullFormKey}`);
  }

  // Check if this form already exists in our results
  if (!finalResultV3[fullFormKey]) {
    // Check if the base Pokemon exists
    if (finalResultV3[basePokemonKey]) {
      if (isDebug) {
        console.log(`DEBUG: Creating form entry for ${fullFormKey} based on ${basePokemonKey}`);
      }
      // Create a form entry that inherits from the base Pokemon
      finalResultV3[fullFormKey] = {
        // Copy all data from base Pokemon
        ...finalResultV3[basePokemonKey],

        // But give it a different evolution chain if it has different evolution methods
        evolution: {
          methods: [], // Forms typically don't evolve further
          chain: [fullFormKey], // Single member chain for now
          chainWithMethods: { [fullFormKey]: [] },
        },

        // Locations will be empty for now (could be populated from location data later)
        locations: [],
      };

      if (isDebug) {
        console.log(`DEBUG: Created form entry for ${fullFormKey} based on ${basePokemonKey}`);
      }
    } else {
      if (isDebug) {
        console.log(
          `DEBUG: Base Pokemon ${basePokemonKey} not found, cannot create form ${fullFormKey}`,
        );
      }
    }
  } else {
    if (isDebug) {
      console.log(`DEBUG: Form ${fullFormKey} already exists`);
    }
  }
}

// Now that finalResultV3 is defined and potentially has more forms, we can call exportDetailedStats
exportDetailedStats();

// Group all Pokemon data
const groupedPokemonData = groupPokemonForms(finalResultV3);

console.log('🔧 Starting comprehensive Pokemon key normalization...');
// --- Comprehensive Pokemon Key Normalization ---

/**
 * Normalizes all Pokemon keys throughout the data structures to ensure consistency
 * across all JSON output files for easier web app access
 */
function normalizePokemonDataKeys<T extends Record<string, unknown>>(
  data: T,
  keyField?: string,
): Record<string, T[keyof T]> {
  const normalizedData: Record<string, T[keyof T]> = {};

  for (const [originalKey, value] of Object.entries(data)) {
    // Add isDebug flag for debugging
    const isDebug = isDebugPokemon(originalKey);

    // Get the standardized URL-safe key
    const normalizedKey = normalizePokemonUrlKey(originalKey);

    if (isDebug) {
      console.log(`Normalizing key: "${originalKey}" -> "${normalizedKey}"`);
    }

    // Log hyphenation validation for debugging
    const validation = validatePokemonHyphenation(originalKey);
    if (validation.isEdgeCase) {
      console.log(
        `⚠️  Edge case detected: "${originalKey}" -> "${normalizedKey}" (hyphen not a known form)`,
      );
    }

    // Clone the value to avoid mutation
    // Add an index signature to allow dynamic property assignment
    let normalizedValue: { [key: string]: unknown } =
      typeof value === 'object' ? { ...value, isDebug } : { isDebug };

    // Update the name field to use the proper display name
    if (typeof normalizedValue === 'object' && normalizedValue !== null) {
      if (keyField && normalizedValue[keyField]) {
        normalizedValue[keyField] = normalizePokemonDisplayName(originalKey);
      }

      // Recursively normalize any nested Pokemon references
      normalizedValue = normalizeNestedPokemonReferences(normalizedValue);
    }

    normalizedData[normalizedKey as string] = normalizedValue as T[keyof T];
  }

  return normalizedData;
}

/**
 * Recursively normalizes Pokemon references in nested objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeNestedPokemonReferences(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(normalizeNestedPokemonReferences);
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const normalized = { ...obj };

  // Handle evolution chains
  if (normalized.evolution) {
    if (normalized.evolution.chain) {
      normalized.evolution.chain = normalized.evolution.chain.map((name: string) =>
        normalizePokemonDisplayName(name),
      );
    }

    if (normalized.evolution.chainWithMethods) {
      const newChainWithMethods: Record<string, unknown> = {};
      for (const [pokemonName, methods] of Object.entries(normalized.evolution.chainWithMethods)) {
        const normalizedName = normalizePokemonDisplayName(pokemonName);
        newChainWithMethods[normalizedName] = methods;
      }
      normalized.evolution.chainWithMethods = newChainWithMethods;
    }

    if (normalized.evolution.methods) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      normalized.evolution.methods = normalized.evolution.methods.map((method: any) => {
        if (method.target) {
          const target = normalizePokemonDisplayName(method.target);

          // this seems to be a special case for Porygon Z, but it is not used in the current code
          // // Fix Porygon Z -> porygon-z
          // if (target === 'Porygon Z' ||
          //   target.toLowerCase() === 'porygon_z' ||
          //   target.toLowerCase() === 'porygon z' ||
          //   target.toLowerCase() === 'porygon-z' ||
          //   target.toLowerCase() === 'porygonz') {
          //   target = 'porygon-z';
          // }

          return { ...method, target };
        }
        return method;
      });
    }
  }

  // Handle forms
  if (normalized.forms) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newForms: Record<string, any> = {};
    for (const [formKey, formData] of Object.entries(normalized.forms)) {
      newForms[formKey] = normalizeNestedPokemonReferences(formData);
    }
    normalized.forms = newForms;
  }

  // Handle locations - preserve them as-is since they don't contain Pokemon names
  if (normalized.locations && Array.isArray(normalized.locations)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    normalized.locations = normalized.locations.map((location: any) => {
      // Don't recursively normalize location objects - they contain area names, not Pokemon names
      return { ...location };
    });
  }

  // Recursively process other nested objects, but skip location-specific fields
  for (const [key, value] of Object.entries(normalized)) {
    if (key === 'locations') {
      // Skip locations - already handled above
      continue;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      normalized[key] = normalizeNestedPokemonReferences(value);
    }
  }

  return normalized;
}

// Normalize the main grouped data
const normalizedGroupedData = normalizePokemonDataKeys(groupedPokemonData);

console.log('✅ Pokemon key normalization completed');

// Extract and save base data (dex number, types)
const baseData: Record<string, BaseData> = {};
// List of invalid or placeholder Pokémon names to skip (should match previous list)
const INVALID_POKEMON_KEYS = [
  '',
  'egg',
  'a',
  'mime',
  'mr',
  'file',
  'empty',
  'undefined',
  'null',
  '???',
  'mewtwoarmo',
  'missingno',
  'poke',
  'pkmn',
  'pokemon',
  'poke_mon',
  'poke-mon',
  'poke mon',
  'none',
  'unknown',
  'test',
  'testmon',
  'test_mon',
  'test-mon',
  'test mon',
  'debug',
  'debugmon',
  'debug_mon',
  'debug-mon',
  'debug mon',
  'placeholder',
  'placeholdermon',
  'placeholder_mon',
  'placeholder-mon',
  'placeholder mon',
  'poke_mon',
];

for (const [mon, data] of Object.entries(normalizedGroupedData)) {
  // Filter out invalid Pokémon keys after grouping/normalization as well
  const monKey = mon.trim().toLowerCase();
  if (INVALID_POKEMON_KEYS.includes(monKey)) {
    console.log(`Skipping invalid/placeholder Pokémon key after grouping: "${mon}"`);
    continue;
  }

  // Handle special cases before normalization
  const trimmedMon = mon.trim();
  let displayName = trimmedMon;
  let spriteName = '';

  // Special case handling for displayName and spriteName
  if (
    trimmedMon === 'Mr Mime' ||
    trimmedMon === 'mrmime' ||
    trimmedMon === 'MrMimePlain' ||
    trimmedMon === 'mr-mime'
  ) {
    displayName = 'Mr-Mime';
    spriteName = 'mr__mime';
  } else if (
    trimmedMon === 'mr-rime' ||
    trimmedMon === 'Mr-Rime' ||
    trimmedMon === 'Mr Rime' ||
    trimmedMon === 'MrRime'
  ) {
    displayName = 'mr-rime';
    spriteName = 'mr__rime';
  } else if (
    trimmedMon === 'Mime Jr' ||
    trimmedMon === 'MimeJr' ||
    trimmedMon === 'Mime-Jr' ||
    trimmedMon === 'mime-jr'
  ) {
    displayName = 'Mime-Jr';
    spriteName = 'mime_jr_';
  } else if (trimmedMon === 'Ho Oh' || trimmedMon === 'Ho-Oh' || trimmedMon === 'ho-oh') {
    displayName = 'Ho-Oh';
    spriteName = 'ho_oh';
  } else if (trimmedMon === 'Tauros Paldean Water') {
    spriteName = 'tauros_paldean_water';
  } else if (trimmedMon === 'Tauros Paldean Fire') {
    spriteName = 'tauros_paldean_fire';
  } else if (trimmedMon === 'Farfetch D' || trimmedMon === "Farfetch'd") {
    spriteName = 'farfetch_d';
  } else if (
    trimmedMon === 'Sirfetch D' ||
    trimmedMon === "Sirfetch'd" ||
    trimmedMon === 'Sirfetchd' ||
    trimmedMon === 'Sirfetch-d'
  ) {
    spriteName = 'sirfetch_d';
  } else if (trimmedMon === 'Nidoran-F') {
    spriteName = 'nidoran_f';
  } else if (trimmedMon === 'Nidoran-M') {
    spriteName = 'nidoran_m';
  } else if (trimmedMon === 'Dudunsparce' || 'dudunsparce' === trimmedMon) {
    spriteName = 'dudunsparce_two_segment';
  } else {
    // Default normalization for spriteName
    spriteName = trimmedMon
      .toLowerCase()
      // .replace(/[^a-z0-9]/g, '') // Remove non-alphanumerics
      .replace(/-/g, '_'); // Replace underscores with hyphens
  }

  console.log(`Processing Pokémon: "${trimmedMon}" (spriteName: "${spriteName}")`);

  // Filter out invalid Pokémon before writing to baseData
  if (
    INVALID_POKEMON_KEYS.includes(trimmedMon.toLowerCase()) ||
    INVALID_POKEMON_KEYS.includes(spriteName.toLowerCase()) ||
    !trimmedMon ||
    !spriteName ||
    trimmedMon.length < 2 ||
    spriteName.length < 2
  ) {
    console.log(
      `Skipping invalid or placeholder Pokémon: "${trimmedMon}" (spriteName: "${spriteName}")`,
    );
    continue;
  }

  baseData[trimmedMon] = {
    name: displayName,
    moves: data.moves || [],
    nationalDex: data.nationalDex ?? null,
    johtoDex: data.johtoDex ?? null,
    types: data.faithfulTypes || data.types || 'Unknown', // Default to the main types (updated version)
    updatedTypes:
      data.updatedTypes && !data.updatedTypes.includes('None') ? data.updatedTypes : 'Unknown', // Only use updatedTypes if they exist and aren't 'None'
    frontSpriteUrl: `/sprites/pokemon/${spriteName}/front_cropped.png`,
    baseStats: {
      hp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      specialAttack: 0,
      specialDefense: 0,
      total: 0,
    },
    faithfulAbilities: [],
    updatedAbilities: [],
    catchRate: 255, // default value
    baseExp: 0, // default value
    heldItems: [], // default value
    abilities: [], // default value
    growthRate: 'Medium Fast', // default value
    eggGroups: [], // default value
    genderRatio: {
      male: 0,
      female: 0,
    }, // default value
    hatchRate: 'Unknown', // default value
    evYield: 'None', // default value
    forms: {}, // Ensure forms are initialized as an empty object
  };

  // Add form-specific type data and sprite URL if available
  if (data.forms && Object.keys(data.forms).length > 0) {
    // forms is already initialized as an empty object in baseData[trimmedMon]
    for (const [formName, formData] of Object.entries(data.forms)) {
      // Get form type data, with fallbacks
      let formTypeData = formData.types;
      let formFaithfulTypeData = formData.types; // Default to regular types
      let formUpdatedTypeData = formData.types; // Default to regular types

      if (
        !formTypeData ||
        formTypeData === 'None' ||
        (Array.isArray(formTypeData) && formTypeData.includes('None'))
      ) {
        // Try to get from formTypeMap
        if (formTypeMap[trimmedMon] && formTypeMap[trimmedMon][formName]) {
          const formTypes = formTypeMap[trimmedMon][formName];
          formFaithfulTypeData = processTypeArray(formTypes.types);
          formUpdatedTypeData = processTypeArray(formTypes.updatedTypes);
          formTypeData = formUpdatedTypeData; // Default to updated types
        }
      }
      // If still not found, check directly in the ASM file
      else {
        // Construct the filename pattern for this form
        const formFileName = `${trimmedMon.toLowerCase()}_${formName.toLowerCase()}`;

        // Look for any base stats files that match this pattern
        const matchingFormFiles = baseStatsFiles.filter(
          (f) => f.toLowerCase().startsWith(formFileName) && f.endsWith('.asm'),
        );

        if (matchingFormFiles.length > 0) {
          // Get the file content
          const formFile = matchingFormFiles[0];
          const formFileContent = fs.readFileSync(path.join(BASE_STATS_DIR, formFile), 'utf8');
          const formLines = formFileContent.split(/\r?\n/);

          // Check for conditional types
          let faithfulFormTypes: [string, string] | null = null;
          let updatedFormTypes: [string, string] | null = null;
          let hasConditionalFormTypes = false;

          // First check for conditional types (FAITHFUL)
          for (let i = 0; i < formLines.length; i++) {
            const line = formLines[i].trim();
            if (line.startsWith('if DEF(FAITHFUL)')) {
              // Look for type definition within the conditional block
              for (
                let j = i + 1;
                j < formLines.length && !formLines[j].trim().startsWith('else');
                j++
              ) {
                const typeLine = formLines[j].trim();
                if (typeLine.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/)) {
                  const match = typeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
                  if (match) {
                    // Convert type enums to proper type names for faithful version
                    faithfulFormTypes = [
                      typeEnumToName[match[1]] || 'None',
                      typeEnumToName[match[2]] || 'None',
                    ];
                    hasConditionalFormTypes = true;
                  }
                  break;
                }
              }

              // Look for the else block with updated types
              let foundElse = false;
              for (let j = i + 1; j < formLines.length; j++) {
                if (formLines[j].trim() === 'else') {
                  foundElse = true;
                  // Look for type definition in the else block
                  for (
                    let k = j + 1;
                    k < formLines.length && !formLines[k].trim().startsWith('endc');
                    k++
                  ) {
                    const typeLine = formLines[k].trim();
                    if (typeLine.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/)) {
                      const match = typeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
                      if (match) {
                        // Convert type enums to proper type names for updated version
                        updatedFormTypes = [
                          typeEnumToName[match[1]] || 'None',
                          typeEnumToName[match[2]] || 'None',
                        ];
                      }
                      break;
                    }
                  }
                }
                if (foundElse && formLines[j].trim().startsWith('endc')) {
                  break;
                }
              }

              break; // We've found and processed the conditional block
            }
          }

          // If no conditional types, look for standard type line
          if (!hasConditionalFormTypes) {
            const formTypeLine = formLines.find((l) => l.match(/^\s*db [A-Z_]+, [A-Z_]+ ?; type/));
            if (formTypeLine) {
              const formMatch = formTypeLine.match(/db ([A-Z_]+), ([A-Z_]+) ?; type/);
              if (formMatch) {
                // Convert to proper type names
                const t1 = typeEnumToName[formMatch[1]] || 'None';
                const t2 = typeEnumToName[formMatch[2]] || 'None';

                // Use the same types for both faithful and updated
                faithfulFormTypes = [t1, t2];
                updatedFormTypes = [t1, t2];
              }
            }
          }

          // Process the faithful and updated types
          if (faithfulFormTypes) {
            console.log(
              `Found faithful types for ${trimmedMon} - form ${formName}:`,
              faithfulFormTypes,
            );
            formFaithfulTypeData = processTypeArray(faithfulFormTypes);
          }

          if (updatedFormTypes) {
            console.log(
              `Found updated types for ${trimmedMon} - form ${formName}:`,
              updatedFormTypes,
            );
            formUpdatedTypeData = processTypeArray(updatedFormTypes);
            console.log(
              `Using updated types for ${trimmedMon} - form ${formName}:`,
              formUpdatedTypeData,
            );
            formTypeData = formUpdatedTypeData; // Default to updated types
          } else if (faithfulFormTypes) {
            formTypeData = processTypeArray(faithfulFormTypes);
          }
        }
      }

      // Special case for Alolan Raichu
      if (
        trimmedMon === 'Raichu' &&
        formName === 'alolan' &&
        (!formTypeData || formTypeData === 'Unknown')
      ) {
        console.log('Setting Alolan Raichu types to Electric, Psychic');
        formTypeData = ['Electric', 'Psychic'];
        formFaithfulTypeData = ['Electric', 'Psychic'];
        formUpdatedTypeData = ['Electric', 'Psychic'];
      }

      // Create directory-style sprite path for form variants
      const formSpritePath = `${spriteName}_${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      // Add the form data to the baseData with clear debug information
      console.log(`Adding form data for ${trimmedMon} - form ${formName}`);
      console.log(`  Form types: ${formTypeData}`);
      console.log(`  Form faithful types: ${formFaithfulTypeData}`);
      console.log(`  Form updated types: ${formUpdatedTypeData}`);

      // @ts-expect-error // TypeScript doesn't know about the dynamic structure of baseData[trimmedMon].forms
      baseData[trimmedMon].forms[formName] = {
        types: formFaithfulTypeData || formTypeData || 'Unknown', // Main types should be faithful types
        // faithfulTypes: formFaithfulTypeData || 'Unknown',
        updatedTypes: formUpdatedTypeData || undefined,
        frontSpriteUrl: `/sprites/pokemon/${formSpritePath}/front_cropped.png`,
        baseStats: {
          hp: 0,
          attack: 0,
          defense: 0,
          speed: 0,
          specialAttack: 0,
          specialDefense: 0,
          total: 0,
        },
        faithfulAbilities: [],
        updatedAbilities: [],
        catchRate: 255,
        baseExp: 0,
        heldItems: [],
        abilities: [],
        growthRate: 'Medium Fast',
        eggGroups: [],
        genderRatio: {
          male: 0,
          female: 0,
        },
        hatchRate: 'Unknown',
        evYield: 'None',
      };
    }
  }
}

// Validate keys before writing to ensure no trailing spaces
const validatedBaseData = validatePokemonKeys(baseData);

// Ensure Mr. Rime is in validatedBaseData if it exists in finalResultV3
if (finalResultV3['mr-rime'] && !validatedBaseData['mr-rime']) {
  const mrRime = finalResultV3['mr-rime'];
  validatedBaseData['mr-rime'] = {
    name: 'mr-rime',
    nationalDex: mrRime.nationalDex ?? null,
    johtoDex: mrRime.johtoDex ?? null,
    types: mrRime.types ?? [],
    updatedTypes: mrRime.updatedTypes ?? mrRime.types ?? [],
    frontSpriteUrl: '/sprites/pokemon/mr__rime/front_cropped.png',
    moves: mrRime.moves || [],
  };
  console.log('Added Mr. Rime to validatedBaseData from finalResultV3 for base data JSON');
}

fs.writeFileSync(BASE_DATA_OUTPUT, JSON.stringify(validatedBaseData, null, 2));
console.log('Pokémon base data extracted to', BASE_DATA_OUTPUT);

// Extract and save evolution data
const evolutionData: Record<string, Evolution | null> = {};
for (const [mon, data] of Object.entries(normalizedGroupedData)) {
  console.log(`Processing evolution data for ${mon}`, data);
  evolutionData[mon] = data.evolution;
}

// Build a map of chains to ensure consistent data across all members
const chainCache: Record<string, Evolution> = {};
const processed = new Set<string>();

// Second pass: ensure all members of the same chain have the same chain data

// Helper to normalize a Pokemon key for evolution chains
function normalizeEvolutionKey(key: string): string {
  return normalizePokemonUrlKey(key);
}

for (const [mon, evolutionInfo] of Object.entries(evolutionData)) {
  if (!evolutionInfo || processed.has(mon)) continue;

  // Normalize all keys in the chain and chainWithMethods
  const normalizedChain = evolutionInfo.chain.map(normalizeEvolutionKey);
  const normalizedChainWithMethods: Record<string, EvolutionMethod[]> = {};
  for (const [k, v] of Object.entries(evolutionInfo.chainWithMethods)) {
    normalizedChainWithMethods[normalizeEvolutionKey(k)] = v;
  }

  // Get the chain members as a string for caching (use normalized keys)
  const chainKey = normalizedChain.join(',');

  // Store this chain in the cache if not already present
  if (!chainCache[chainKey]) {
    chainCache[chainKey] = {
      ...evolutionInfo,
      chain: normalizedChain,
      chainWithMethods: normalizedChainWithMethods,
    };
  }

  // For each member of this chain (normalized)
  for (const chainMember of normalizedChain) {
    // Skip if already processed
    if (processed.has(chainMember)) continue;

    // Make sure this member has the complete chain data
    if (evolutionData[chainMember]) {
      // Update to use the cached chain data to ensure consistency
      evolutionData[chainMember] = {
        // Keep the member's own methods
        methods: evolutionData[chainMember].methods,
        // Use the complete chain and chainWithMethods (normalized)
        chain: chainCache[chainKey].chain,
        chainWithMethods: chainCache[chainKey].chainWithMethods,
      };

      // Mark as processed
      processed.add(chainMember);
    }
  }
}

const validatedEvolutionData = validatePokemonKeys(evolutionData);
fs.writeFileSync(EVOLUTION_OUTPUT, JSON.stringify(validatedEvolutionData, null, 2));
console.log('Pokémon evolution data extracted to', EVOLUTION_OUTPUT);

// Extract and save level-up moves
const levelMoves: Record<
  string,
  {
    moves: Move[];
    faithfulMoves?: Move[];
    updatedMoves?: Move[];
    forms?: Record<
      string,
      {
        moves: Move[];
        faithfulMoves?: Move[];
        updatedMoves?: Move[];
      }
    >;
  }
> = {};
for (const [mon, data] of Object.entries(normalizedGroupedData)) {
  levelMoves[mon] = {
    moves: data.moves,
    ...(data.faithfulMoves ? { faithfulMoves: data.faithfulMoves } : {}),
    ...(data.updatedMoves ? { updatedMoves: data.updatedMoves } : {}),
  };

  console.log(`Processing level moves for ${mon}`);
  console.log(`Data:`, data);
  console.log(`levelMoves[mon]:`, levelMoves[mon]);

  // Use the forms from evos_attacks movesetData instead of normalizedGroupedData
  // since evos_attacks has the correct form-specific movesets
  const normalizedMon = normalizePokemonUrlKey(mon);
  const moveStringNormalizedMon = normalizeMoveString(mon);
  console.log(
    `DEBUG: Checking evos_attacks movesetData for ${mon} (urlNormalized: ${normalizedMon}, moveStringNormalized: ${moveStringNormalizedMon}), has forms:`,
    !!movesetData[mon]?.forms ||
      !!movesetData[normalizedMon]?.forms ||
      !!movesetData[moveStringNormalizedMon]?.forms,
  );
  const evosAttacksEntry =
    movesetData[mon] || movesetData[normalizedMon] || movesetData[moveStringNormalizedMon];
  if (evosAttacksEntry?.forms && Object.keys(evosAttacksEntry.forms).length > 0) {
    levelMoves[mon].forms = {};
    console.log(`Found forms in evos_attacks result for ${mon}, using those instead...`);
    console.log(`Forms data from evos_attacks:`, evosAttacksEntry.forms);
    for (const [formName, formData] of Object.entries(evosAttacksEntry.forms)) {
      if (Array.isArray(formData.moves) && formData.moves.length > 0) {
        if (!levelMoves[mon].forms) levelMoves[mon].forms = {};
        console.log(`Adding form ${formName.trim()} moves for ${mon} from evos_attacks`);
        console.log(`Form moves:`, formData.moves.slice(0, 3));
        levelMoves[mon].forms[formName.trim()] = {
          moves: formData.moves.map((m) => ({
            name: m.name,
            level: m.level,
            ...(m.info ? { info: m.info } : {}),
          })),
        };
        console.log(
          `Added form ${formName.trim()} moves for ${mon}`,
          levelMoves[mon].forms[formName.trim()],
        );
      }
    }
  }
  // Fallback to normalizedGroupedData forms if no evos_attacks forms found
  else if (data.forms && Object.keys(data.forms).length > 0) {
    levelMoves[mon].forms = {};
    console.log(`Found forms for ${mon}, processing...`);
    console.log(`Forms data:`, data.forms);
    for (const [formName, formData] of Object.entries(data.forms)) {
      if (Array.isArray(formData.moves) && formData.moves.length > 0) {
        if (!levelMoves[mon].forms) levelMoves[mon].forms = {};
        console.log(`Adding form ${formName.trim()} moves for ${mon}`);
        console.log(`Form moves:`, formData.moves);
        levelMoves[mon].forms[formName.trim()] = {
          moves: formData.moves.map((m) => ({
            name: m.name,
            level: m.level,
            ...(m.info ? { info: m.info } : {}),
          })),
        };
        console.log(
          `Added form ${formName.trim()} moves for ${mon}`,
          levelMoves[mon].forms[formName.trim()],
        );
      }
    }
  }
}

// --- FINAL OUTPUT SECTION ---

// Exported objects for use in the final output section
// These must be defined at the top-level for use in the output index and other files
const validatedLevelMoves = validatePokemonKeys(levelMoves);

// Write level-up moves to file
fs.writeFileSync(LEVEL_MOVES_OUTPUT, JSON.stringify(validatedLevelMoves, null, 2));

// --- Extract and save location data (including hidden grottoes) ---
// Always use the base name as the key, and group form locations under a "forms" property
const locationData: Record<
  string,
  { locations: LocationEntry[]; forms?: Record<string, { locations: LocationEntry[] }> }
> = {};
for (const mon of Object.keys(finalResultV3)) {
  // Parse base name and form name
  const { baseName, formName } = parseFormName(mon);

  const normalizePokemonUrlKeynormalizePokemonUrlKey = normalizePokemonUrlKey(mon);

  console.log(
    `Processing locations for Pokémon: ${mon} (base: ${baseName}, form: ${formName})`,
    normalizePokemonUrlKeynormalizePokemonUrlKey,
  );

  const normalizedBase = normalizePokemonUrlKey(baseName);
  // Always use the base name as the key for output
  const locations = normalizedLocationsByMon[normalizePokemonUrlKey(mon)] || [];

  console.log(`Processing locations for ${mon} (base: ${baseName}, form: ${formName})`);

  if (!locationData[normalizedBase]) {
    locationData[normalizedBase] = { locations: [] };
  }

  if (formName) {
    // Group form locations under forms property of the base
    if (!locationData[normalizedBase].forms) {
      locationData[normalizedBase].forms = {};
    }
    // Overwrite (not push) to avoid duplicate/accumulating locations
    locationData[normalizedBase].forms[formName] = { locations };
  } else {
    // Overwrite (not push) to avoid duplicate/accumulating locations
    locationData[normalizedBase].locations = locations;
  }
}

// Also add hidden grotto locations for each normalized key
const grottoLocations = extractHiddenGrottoes();
for (const [pokemonName, locations] of Object.entries(grottoLocations)) {
  const { baseName, formName } = parseFormName(pokemonName);
  const normalizedBase = normalizePokemonUrlKey(baseName);
  if (formName) {
    if (!locationData[normalizedBase]) {
      locationData[normalizedBase] = { locations: [] };
    }
    if (!locationData[normalizedBase].forms) {
      locationData[normalizedBase].forms = {};
    }
    if (!locationData[normalizedBase].forms![formName]) {
      locationData[normalizedBase].forms![formName] = { locations: [] };
    }
    locationData[normalizedBase].forms![formName].locations.push(...locations);
  } else {
    if (!locationData[normalizedBase]) {
      locationData[normalizedBase] = { locations: [] };
    }
    locationData[normalizedBase].locations.push(...locations);
  }
}

// --- OUTPUT INDEX GENERATION ---

// Helper: Validate and fix moves array (removes null/undefined, ensures correct structure)
// ...implementation moved to end of file...

// // Helper: Default evolution object
// const defaultEvolution: Evolution = {
//   methods: [],
//   chain: [],
//   chainWithMethods: {}
// };

// ...duplicate index generation removed...

// Write the main output for each Pokémon (moved to after POKEMON_DIR declaration)
// ...existing code...

// Process location data to group by forms
const groupedLocationData: Record<
  string,
  { locations: LocationEntry[]; forms?: Record<string, { locations: LocationEntry[] }> }
> = {};

// locationData is now already grouped by base and forms, so just copy
for (const [mon, data] of Object.entries(locationData)) {
  groupedLocationData[mon] = { locations: data.locations };
  if (data.forms) {
    groupedLocationData[mon].forms = data.forms;
  }
}

// Add "evolve from" locations for Pokémon without any locations
for (const [mon, data] of Object.entries(evolutionData)) {
  // Skip if already has locations or no evolution data available
  if (!data || !groupedLocationData[mon] || groupedLocationData[mon].locations.length > 0) continue;

  // Check if this Pokémon is evolved from another one
  const preEvos = data.chain.filter((preMon) => {
    // Check if preEvolution has a level evolution method to this mon
    if (data.chainWithMethods[preMon]) {
      return data.chainWithMethods[preMon].some(
        (evo) => evo.target === mon && evo.method === 'EVOLVE_LEVEL',
      );
    }
    return false;
  });

  // If we found pre-evolutions that evolve into this mon by leveling
  if (preEvos.length > 0) {
    for (const preMon of preEvos) {
      const methods = data.chainWithMethods[preMon].filter(
        (evo) => evo.target === mon && evo.method === 'EVOLVE_LEVEL',
      );

      // Create evolution location entries for each evolution method
      methods.forEach((method) => {
        const evolveLocation: LocationEntry = {
          area: null,
          method: `Evolve from ${preMon} (Level ${method.parameter})`,
          time: null,
          level: '',
          chance: 100,
          formName: method.form || null,
        };

        // Add the evolution location
        groupedLocationData[mon].locations.push(evolveLocation);
      });
    }
  }
}

const validatedLocationData = validatePokemonKeys(groupedLocationData);

// Write the location data file for backward compatibility, but mark it as deprecated
// TODO: Remove this file in a future version - location data is now embedded in individual Pokemon files
fs.writeFileSync(
  LOCATIONS_OUTPUT,
  JSON.stringify(
    {
      ...validatedLocationData,
      _metadata: {
        deprecated: true,
        deprecationMessage:
          'This file is deprecated. Location data is now embedded directly in individual Pokemon files.',
        // "generatedAt": new Date().toISOString(),
        version: '2.0.0',
      },
    },
    null,
    2,
  ),
);

// Extract locations organized by area (creates locations_by_area.json)
console.log('🗺️ Extracting locations by area...');
extractLocationsByArea();

// Extract all locations with flypoint data (creates all_locations.json and locations_by_region.json)
console.log('🗺️ Extracting all locations and flypoints...');
exportAllLocations().catch(console.error);

function exportDetailedStats() {
  try {
    console.log('trying to export detailed stats to', DETAILED_STATS_OUTPUT);

    const detailedStats: Record<string, DetailedStats> = extractDetailedStats();

    // Print all keys of detailedStats, not just the first 50
    console.log('Keys of detailedStats:', Object.keys(detailedStats).join(',\n'));

    // Check if Ho-Oh is in detailedStats after extraction
    console.log(
      'After extractDetailedStats - Is Ho-Oh in detailedStats?',
      'Ho-Oh' in detailedStats,
    );

    // Check if porygon-z is in detailedStats after extraction
    console.log(
      'After extractDetailedStats - Is porygon-z in detailedStats?',
      'porygon-z' in detailedStats,
    );

    if (!('Ho-Oh' in detailedStats)) {
      // Try to find any keys that might be related to Ho-Oh
      const possibleHoOhKeys = Object.keys(detailedStats).filter(
        (k) => k.toLowerCase().includes('ho') && k.toLowerCase().includes('oh'),
      );

      console.log('Possible Ho-Oh related keys:', possibleHoOhKeys);
    }

    // Log all detailedStats keys that do not contain 'truncate'

    if (!('porygon-z' in detailedStats)) {
      // Try to find any keys that might be related to porygon-z
      const possiblePorygonZKeys = Object.keys(detailedStats).filter(
        (k) =>
          k.toLowerCase().includes('porygon') &&
          (k.toLowerCase().includes('z') || k.toLowerCase().includes('-z')) &&
          k.toLowerCase() !== 'porygon-z',
      );

      console.log('Possible porygon-z related keys:', possiblePorygonZKeys);
    }

    // Add types from finalResultV3 to the detailed stats
    for (const [pokemonName, stats] of Object.entries(detailedStats)) {
      const isDebug = isDebugPokemon(pokemonName);
      if (finalResultV3[pokemonName]) {
        console.log(
          `Adding types in detailedStats for ${pokemonName} to finalResultV3`,
          stats.types,
        );
        // Copy types from finalResultV3
        stats.types = finalResultV3[pokemonName].types || 'Unknown';
        stats.updatedTypes =
          finalResultV3[pokemonName].updatedTypes || finalResultV3[pokemonName].types || 'Unknown';

        if (isDebug) {
          console.log(`Debug info for ${pokemonName}:`, {
            originalTypes: stats.types,
            updatedTypes: stats.updatedTypes,
          });
        }
      } else {
        console.log(
          `No direct match for ${pokemonName} in finalResultV3, trying to find a match...`,
        );
        // If pokemon not found in finalResultV3, try looking for a match
        const matchingKey = Object.keys(finalResultV3).find(
          (key) =>
            key.toLowerCase() === pokemonName.toLowerCase() ||
            standardizePokemonKey(key) === standardizePokemonKey(pokemonName),
        );
        console.log(`Matching key found: ${matchingKey}`, stats.types);

        if (matchingKey) {
          // stats.types = finalResultV3[matchingKey].types || 'Unknown';
          // stats.updatedTypes = finalResultV3[matchingKey].updatedTypes || finalResultV3[matchingKey].types || 'Unknown';
        } else {
          // If still not found, set to Unknown
          console.log(`No type data found for: ${pokemonName}`);
          stats.types = 'Unknown';
          stats.updatedTypes = 'Unknown';
        }
      }
    }

    // --- Body Data Extraction ---
    const bodyDataPath = path.join(__dirname, 'polishedcrystal/data/pokemon/body_data.asm');
    if (fs.existsSync(bodyDataPath)) {
      const bodyDataLines = fs.readFileSync(bodyDataPath, 'utf8').split(/\r?\n/);
      for (const line of bodyDataLines) {
        if (line.trim().startsWith('body_data')) {
          // Extract Pokémon name from comment
          const nameMatch = line.match(/;\s*([A-Z0-9_]+)/);
          console.log(`Processing body data line: ${line}`, nameMatch);
          if (nameMatch) {
            const monName = toTitleCase(nameMatch[1]);
            if (detailedStats[monName]) {
              detailedStats[monName] = addBodyDataToDetailedStats(
                line,
                detailedStats[monName],
              ) as DetailedStats;
            }
          }
        }
      }
    }

    // --- Ability Description Enhancement ---
    // Load ability descriptions to add them to the abilities
    const abilityDescriptionsPath = path.join(
      __dirname,
      'output/pokemon_ability_descriptions.json',
    );
    // Define abilityDescriptions outside the if block so it's accessible throughout the function
    let abilityDescriptions: Record<string, { description: string }> = {};
    if (fs.existsSync(abilityDescriptionsPath)) {
      try {
        abilityDescriptions = JSON.parse(fs.readFileSync(abilityDescriptionsPath, 'utf8'));

        // Enhance each Pokemon's ability with its description
        for (const [, stats] of Object.entries(detailedStats)) {
          // Function to enhance abilities with descriptions
          const enhanceAbilitiesWithDescriptions = (abilities: Ability[]): Ability[] => {
            if (!abilities || !Array.isArray(abilities)) return abilities;

            return abilities.map((ability) => {
              if (abilityDescriptions[ability.name]) {
                return {
                  ...ability,
                  description: abilityDescriptions[ability.name].description || '',
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
                const abilityType =
                  index === 0
                    ? ('primary' as const)
                    : index === 1
                      ? ('secondary' as const)
                      : ('hidden' as const);

                return {
                  name: abilityName,
                  description: abilityDescriptions[abilityName]?.description || '',
                  isHidden,
                  abilityType,
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

// const OUTPUT_DIR = path.join(__dirname, 'output');
// const outputFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));

// for (const file of outputFiles) {
//   const filePath = path.join(OUTPUT_DIR, file);
//   let content = fs.readFileSync(filePath, 'utf8');
//   if (content.includes('Ho Oh')) {
//     content = content.replace(/Ho Oh/g, 'Ho-Oh');
//     fs.writeFileSync(filePath, content, 'utf8');
//     console.log(`Replaced "Ho Oh" with "Ho-Oh" in ${file}`);
//   }
// }

// Function to process type arrays into the proper format
function processTypeArray(types: string[]): string | string[] {
  if (!types || types.length === 0) return 'Unknown';

  // Remove duplicates and 'None' values
  const filteredTypes = Array.from(new Set(types)).filter((t) => t !== 'None');

  if (filteredTypes.length === 0) return 'Unknown';
  if (filteredTypes.length === 1) return filteredTypes[0];
  return filteredTypes;
}

// Debugging: Log the formTypeMap contents at the end of the script
console.log('===== Form Type Map Debug =====');
const formMapKeys = Object.keys(formTypeMap);
console.log(`Found ${formMapKeys.length} Pokémon with form types:`);
console.log(formMapKeys);
// Print an example form type if available
if (formMapKeys.length > 0) {
  const example = formMapKeys[0];
  console.log(`Example form type data for ${example}:`, formTypeMap[example]);
}

// --- Generate Individual Pokemon Files ---
console.log('Generating individual Pokemon files...');

const POKEMON_DIR = path.join(__dirname, 'output/pokemon');
if (!fs.existsSync(POKEMON_DIR)) {
  fs.mkdirSync(POKEMON_DIR, { recursive: true });
}

// Load additional data files that we've already generated
// i changed from Record<string, any> to Record<string, DetailedStats> for detailedStatsData
let tmHmData: Record<string, Move[]> = {};
let eggMoveData: Record<string, Move[]> = {};
let pokedexData: Record<string, Record<string, PokemonDexEntry>> = {};
let detailedStatsData: Record<string, DetailedStats> = {};

const TM_HM_OUTPUT = path.join(__dirname, 'output/pokemon_tm_hm_learnset.json');
const EGG_MOVES_OUTPUT = path.join(__dirname, 'output/pokemon_egg_moves.json');
const POKEDEX_ENTRIES_OUTPUT = path.join(__dirname, 'output/pokemon_pokedex_entries.json');

if (fs.existsSync(TM_HM_OUTPUT)) {
  tmHmData = JSON.parse(fs.readFileSync(TM_HM_OUTPUT, 'utf8'));
}

if (fs.existsSync(EGG_MOVES_OUTPUT)) {
  eggMoveData = JSON.parse(fs.readFileSync(EGG_MOVES_OUTPUT, 'utf8'));
}

if (fs.existsSync(POKEDEX_ENTRIES_OUTPUT)) {
  pokedexData = JSON.parse(fs.readFileSync(POKEDEX_ENTRIES_OUTPUT, 'utf8'));
}

if (fs.existsSync(DETAILED_STATS_OUTPUT)) {
  detailedStatsData = JSON.parse(fs.readFileSync(DETAILED_STATS_OUTPUT, 'utf8'));
}

// Ensure Mr. Rime is in validatedBaseData if it exists in finalResultV3
if (finalResultV3['mr-rime'] && !validatedBaseData['mr-rime']) {
  const mrRime = finalResultV3['mr-rime'];
  validatedBaseData['mr-rime'] = {
    name: 'mr-rime',
    nationalDex: mrRime.nationalDex ?? null,
    johtoDex: mrRime.johtoDex ?? null,
    types: mrRime.types ?? [],
    updatedTypes: mrRime.updatedTypes ?? mrRime.types ?? [],
    frontSpriteUrl: '/sprites/pokemon/mr__rime/front_cropped.png',
    moves: mrRime.moves || [],
  };
  console.log('Added Mr. Rime to validatedBaseData from finalResultV3');
}

// Generate individual files for each Pokemon
for (const [pokemonName, baseData] of Object.entries(validatedBaseData)) {
  // Skip invalid Pokémon names
  if (!pokemonName || pokemonName.trim() === '' || pokemonName === 'None') {
    console.log(`Skipping invalid Pokémon name: "${pokemonName}"`);
    continue;
  }
  // --- Ensure all forms are included in individual Pokemon files ---
  // const groupedData = normalizedGroupedData[pokemonName] || {};
  // Deduplicate and normalize form keys
  const forms: Record<
    string,
    DetailedStats & {
      name: string;
      formName: string;
      types: string[] | string;
      updatedTypes?: string[] | string;
      frontSpriteUrl?: string;
      moves?: Move[];
      detailedStats?: DetailedStats;
    }
  > = {};
  // Track seen forms to avoid duplicates
  const seenForms: Record<string, string> = {};
  // Skip groupedData.forms processing since we'll handle forms properly from base stat files below
  const baseName = pokemonName.toLowerCase();

  // Convert hyphens to underscores for file matching, since form files use underscores
  const baseNameForFileMatching = baseName.replace(/-/g, '_');

  const formFiles = baseStatsFiles.filter(
    (f) => f.toLowerCase().startsWith(baseNameForFileMatching + '_') && f.endsWith('.asm'),
  );

  console.log(
    `Processing formFiles formFiles for ${pokemonName} (${baseName}), baseNameForFileMatching: ${baseNameForFileMatching}, found form files:`,
    formFiles,
  );

  const filteredFormFiles = formFiles.filter((f) => f !== 'porygon_z.asm');

  for (const formFile of filteredFormFiles) {
    const formName = formFile.replace(baseNameForFileMatching + '_', '').replace('.asm', '');

    // Skip if the form name is empty (this happens with files like "pokemon_.asm")
    if (!formName || formName.trim() === '') {
      console.log(`Skipping form file with empty form name: ${formFile}`);
      continue;
    }

    const normKey = formName.trim().toLowerCase();
    const titleCaseFormName = toTitleCase(formName.trim());

    console.log(
      `Processing form file: ${formFile}, ${formName} for ${pokemonName} (${normKey}), titleCase: ${titleCaseFormName}`,
    );

    console.log(
      'levelMoves[pokemonName].forms[formName.trim()].moves',
      pokemonName,
      formName,
      levelMoves[pokemonName]?.forms?.[formName.toLowerCase()]?.moves,
    );

    // Only use moves if explicitly defined for this form, otherwise inherit from base
    let formMoves: Move[] | undefined = undefined;
    if (
      levelMoves[pokemonName]?.forms &&
      levelMoves[pokemonName].forms[formName.toLowerCase()] &&
      Array.isArray(levelMoves[pokemonName]?.forms?.[formName.toLowerCase()]?.moves)
    ) {
      formMoves = levelMoves[pokemonName]?.forms?.[formName.toLowerCase()]?.moves;
    } else if (levelMoves[pokemonName]?.moves && Array.isArray(levelMoves[pokemonName].moves)) {
      // Fall back to base Pokémon's moves if form doesn't have specific moves
      formMoves = levelMoves[pokemonName].moves;
    }

    console.log(
      `Processing form ${titleCaseFormName} for ${pokemonName} (${normKey}), found form-specific moves:`,
      !!levelMoves[pokemonName]?.forms?.[formName.toLowerCase()]?.moves,
    );

    // Convert pokemonName (URL key) to display name format used in detailedStatsData
    const displayNameForLookup = normalizePokemonDisplayName(pokemonName);
    const formStats = detailedStatsData[`${displayNameForLookup} ${formName.toLowerCase()}`] || {};
    const baseStats = detailedStatsData[displayNameForLookup] || {};

    // Get form type data, with fallbacks to detailed stats
    let formTypeData: string | string[] = [];
    if (formTypeMap[pokemonName] && formTypeMap[pokemonName][titleCaseFormName]) {
      formTypeData = formTypeMap[pokemonName][titleCaseFormName].types;
    } else if (formStats.types) {
      // Fall back to types from detailed stats if not in formTypeMap
      formTypeData = Array.isArray(formStats.types) ? formStats.types : [formStats.types];
    }

    console.log(`formStats data for ${titleCaseFormName}:`, formStats);
    // Compose a full DetailedStats-like object for the form, but nest under detailedStats
    forms[titleCaseFormName] = {
      name: `${pokemonName} ${formName}`,
      formName: titleCaseFormName,
      nationalDex: baseData.nationalDex,
      johtoDex: baseData.johtoDex,
      types: formTypeData,
      updatedTypes: formTypeData,
      frontSpriteUrl: `/sprites/pokemon/${baseName}_${formName}/front_cropped.png`,
      moves: validateAndFixMoves(formMoves ?? []),
      detailedStats: {
        ...formStats,
        catchRate: formStats.catchRate ?? 255,
        baseExp: formStats.baseExp ?? 0,
        heldItems: formStats.heldItems ?? [],
        abilities: formStats.abilities ?? [],
        faithfulAbilities: formStats.faithfulAbilities ?? [],
        updatedAbilities: formStats.updatedAbilities ?? [],
        growthRate: formStats.growthRate ?? 'Medium Fast',
        eggGroups: formStats.eggGroups ?? [],
        genderRatio: formStats.genderRatio ?? { male: 0, female: 0 },
        hatchRate: formStats.hatchRate ?? 'Unknown',
        evYield: formStats.evYield ?? 'None',
        locations: formStats.locations ?? [],
        height: formStats.height ?? baseStats.height,
        weight: formStats.weight ?? baseStats.weight,
        bodyColor: formStats.bodyColor ?? baseStats.bodyColor,
        bodyShape: formStats.bodyShape ?? baseStats.bodyShape,
        // add any other fields from DetailedStats as needed
      },
    };
    seenForms[normKey] = formName.trim();
  }

  console.log(`Final forms for ${pokemonName}:`, Object.keys(forms), forms);

  // Build minimal root object with safer defaults
  const defaultDetailedStats = {
    baseStats: {
      hp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      specialAttack: 0,
      specialDefense: 0,
      total: 0,
    },
    catchRate: 255,
    baseExp: 0,
    heldItems: [],
    abilities: [],
    faithfulAbilities: [],
    updatedAbilities: [],
    growthRate: 'Medium Fast',
    eggGroups: [],
    genderRatio: { male: 50, female: 50 },
    hatchRate: 'Unknown',
    evYield: 'None',
    types: baseData.types,
    updatedTypes: baseData.updatedTypes,
    height: 0,
    weight: 0,
    bodyShape: 'Unknown',
    bodyColor: 'Unknown',
  };

  const defaultEvolution = {
    methods: [],
    chain: [pokemonName],
    chainWithMethods: { [pokemonName]: [] },
  };

  // Embed complete location data in the Pokemon object
  const pokemonLocationData = validatedLocationData[pokemonName];
  let embeddedLocations: LocationEntry[] = [];
  let embeddedFormLocations: Record<string, { locations: LocationEntry[] }> = {};

  if (pokemonLocationData) {
    // Include base form locations
    embeddedLocations = pokemonLocationData.locations || [];

    // Include form-specific locations
    if (pokemonLocationData.forms) {
      embeddedFormLocations = pokemonLocationData.forms;
    }
  }

  // Also embed location data in the detailedStats if present
  // Convert pokemonName (URL key) to display name format used in detailedStatsData
  const displayNameForLookup = normalizePokemonDisplayName(pokemonName);
  console.log(
    `DEBUG: Individual file for ${pokemonName}, displayNameForLookup: ${displayNameForLookup}, found in detailedStatsData: ${displayNameForLookup in detailedStatsData}`,
  );
  // Don't duplicate locations in detailedStats since they're already at the root level
  const enhancedDetailedStats = {
    ...(detailedStatsData[displayNameForLookup] || defaultDetailedStats),
    // Removed: locations: embeddedLocations
  };

  // Enhance forms with their location data (normalize form keys for lookup)
  const enhancedForms = { ...forms };
  for (const [formKey, formData] of Object.entries(enhancedForms)) {
    // Try to find the normalized form key in embeddedFormLocations
    // e.g., 'Alolan' -> 'alolan', 'Galarian' -> 'galarian'
    const normalizedFormKey = formKey.trim().toLowerCase();
    let formLoc = embeddedFormLocations[normalizedFormKey];
    // Fallback: try also with original key if not found
    if (!formLoc && embeddedFormLocations[formKey]) {
      formLoc = embeddedFormLocations[formKey];
    }
    if (formLoc) {
      enhancedForms[formKey] = {
        ...formData,
        locations: formLoc.locations || [],
      };
      // We don't need to add locations to detailedStats since they're already at the root level
      // if (enhancedForms[formKey].detailedStats) {
      //   enhancedForms[formKey].detailedStats.locations = formLoc.locations || [];
      // }
    }
  }

  const pokemonData: Record<string, unknown> = {
    name: pokemonName,
    nationalDex:
      validatedBaseData[pokemonName]?.nationalDex ??
      finalResultV3[pokemonName]?.nationalDex ??
      null,
    johtoDex:
      validatedBaseData[pokemonName]?.johtoDex ?? finalResultV3[pokemonName]?.johtoDex ?? null,
    types: validatedBaseData[pokemonName]?.types ?? finalResultV3[pokemonName]?.types ?? [],
    updatedTypes:
      validatedBaseData[pokemonName]?.updatedTypes ??
      validatedBaseData[pokemonName]?.types ??
      finalResultV3[pokemonName]?.updatedTypes ??
      finalResultV3[pokemonName]?.types ??
      [],
    frontSpriteUrl:
      validatedBaseData[pokemonName]?.frontSpriteUrl ??
      `/sprites/pokemon/${pokemonName}/front_cropped.png`,
    detailedStats: enhancedDetailedStats,
    evolution: validatedEvolutionData[pokemonName] || defaultEvolution,
    levelMoves: validateAndFixMoves(validatedLevelMoves[pokemonName]?.moves || []),
    ...(validatedLevelMoves[pokemonName]?.faithfulMoves
      ? {
          faithfulLevelMoves: validateAndFixMoves(validatedLevelMoves[pokemonName].faithfulMoves),
        }
      : {}),
    ...(validatedLevelMoves[pokemonName]?.updatedMoves
      ? {
          updatedLevelMoves: validateAndFixMoves(validatedLevelMoves[pokemonName].updatedMoves),
        }
      : {}),
    tmHmMoves: tmHmData[pokemonName] || [],
    eggMoves: eggMoveData[pokemonName] || [],
    locations: embeddedLocations,
    pokedexEntries: pokedexData[pokemonName] || [],
    forms: enhancedForms,
    // Metadata
    // generatedAt: new Date().toISOString(),
    // version: '2.0.0' // Bump version to indicate embedded location data
  };

  // Remove redundant root fields if detailedStats is present
  if (pokemonData.detailedStats) {
    delete pokemonData.baseStats;
    delete pokemonData.abilities;
    delete pokemonData.faithfulAbilities;
    delete pokemonData.updatedAbilities;
    delete pokemonData.catchRate;
    delete pokemonData.baseExp;
    delete pokemonData.growthRate;
    delete pokemonData.eggGroups;
    delete pokemonData.genderRatio;
    delete pokemonData.hatchRate;
    delete pokemonData.evYield;
    delete pokemonData.heldItems;
  }

  // Remove duplicate declarations if they exist
  // (This block should only declare safeFileName and filePath once)

  // Create a safe filename using the URL normalizer
  const safeFileName = getPokemonFileName(pokemonName);

  const filePath = path.join(POKEMON_DIR, safeFileName);

  try {
    fs.writeFileSync(filePath, JSON.stringify(pokemonData, null, 2));
    console.log(`Generated individual file for: ${pokemonName} -> ${safeFileName}`);
  } catch (error) {
    console.error(`Error writing file for ${pokemonName}:`, error);
  }
}

// Generate an index file for quick Pokemon lookups
const pokemonIndex = Object.keys(validatedBaseData)
  .map((name) => ({
    name,
    nationalDex: validatedBaseData[name].nationalDex,
    johtoDex: validatedBaseData[name].johtoDex,
    types: validatedBaseData[name].types,
    frontSpriteUrl: validatedBaseData[name].frontSpriteUrl,
    fileName: getPokemonFileName(name),
  }))
  .sort((a, b) => {
    // Sort by National Dex number, then by name

    if (a.nationalDex && b.nationalDex) {
      return a.nationalDex - b.nationalDex;
    }
    if (a.nationalDex && !b.nationalDex) return -1;
    if (!a.nationalDex && b.nationalDex) return 1;
    return a.name.localeCompare(b.name);
  });

const indexPath = path.join(POKEMON_DIR, '_index.json');
fs.writeFileSync(
  indexPath,
  JSON.stringify(
    {
      // generatedAt: new Date().toISOString(),
      totalPokemon: pokemonIndex.length,
      pokemon: pokemonIndex,
    },
    null,
    2,
  ),
);

console.log(`Generated individual files for ${pokemonIndex.length} Pokemon in ${POKEMON_DIR}`);
console.log(`Created index file at ${indexPath}`);
console.log('Individual Pokemon file generation complete!');

// Helper function to check if one form data is more complete than another
// Currently unused but kept for potential future use
// function isMoreCompleteForm(formA: Record<string, unknown>, formB: Record<string, unknown>): boolean {
//   if (!formA || !formB) return !!formA;
//   // Count the number of defined properties
//   const countProperties = (obj: Record<string, unknown>): number => {
//     if (!obj || typeof obj !== 'object') return 0;
//     return Object.values(obj).filter(value =>
//       value !== undefined && value !== null && value !== ''
//     ).length;
//   };

//   return countProperties(formA) > countProperties(formB);
// }

// Helper function to validate and fix moves
function validateAndFixMoves(moves: (Partial<Move> | null | undefined)[]): Move[] {
  return Array.isArray(moves)
    ? moves.filter(Boolean).map((m) => ({
        name: m?.name || 'Unknown Move',
        level: m?.level || 0,
        ...(m?.info ? { info: m.info } : {}),
      }))
    : [];
}
