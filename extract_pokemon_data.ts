import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEBUG_POKEMON, evoMap, formTypeMap, preEvoMap, typeMap } from './src/data/constants.ts';
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
    { suffix: 'PaldeanFire', form: 'paldean_fire' },
    { suffix: 'PaldeanWater', form: 'paldean_water' },
    { suffix: 'Armored', form: 'armored' },
    { suffix: 'BloodMoon', form: 'bloodmoon' },
    { suffix: 'plain', form: null },
    { suffix: 'hisui', form: 'hisui' },
    { suffix: 'galarian', form: 'galarian' },
    { suffix: 'alolan', form: 'alolan' },
    { suffix: 'paldean', form: 'paldean' },
    { suffix: 'galar', form: 'galar' },
    { suffix: 'hisuian', form: 'hisuian' },
    { suffix: 'red', form: 'red' },
    { suffix: 'bloodmoon', form: 'bloodmoon' },
    { suffix: 'paldean_fire', form: 'paldean_fire' },
    { suffix: 'paldean_water', form: 'paldean_water' },
    { suffix: 'paldean-fire', form: 'paldean_fire' },
    { suffix: 'paldean-water', form: 'paldean_water' },
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

    // Debug logging for conditional moves
    console.log(
      `DEBUG: For ${currentMonV2} - faithful moves: ${faithfulMovesV2.length}, updated moves: ${updatedMovesV2.length}`,
    );

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
      // Preserve form information for evolution mapping to prevent form stacking
      const evoKey = currentMonV2; // Keep the original form-specific name (e.g., SlowpokePlain, SlowpokeGalarian)
      evoMap[evoKey] = evoMethods.map((e) => ({
        ...e,
        target: normalizeMoveString(e.target),
        form: e.form ? normalizeMoveString(e.form) : undefined,
      }));
      for (const evo of evoMethods) {
        const tgt = normalizeMoveString(evo.target);
        if (!preEvoMap[tgt]) preEvoMap[tgt] = [];
        preEvoMap[tgt].push(currentMonV2); // Also preserve form info in preEvoMap
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
        // Determine the proper source key for storing methods
        // If evoKey contains form info (like SlowpokeGalarian), extract it for display
        let sourceKey = normalizedDisplayName;
        if (evoKey !== standardEvoKey) {
          // This is a form-specific evolution key, extract form info
          const { baseName: evoBaseName, formName } = extractFormFromName(evoKey);
          if (formName) {
            sourceKey = `${normalizedDisplayName} (${capitalizeFirstLetter(formName)} Form)`;
          }
        }

        // Store evolution methods for this Pokémon (potentially with form info)
        if (!methodsByPokemon[sourceKey]) {
          methodsByPokemon[sourceKey] = [];
        }

        // Add all its evolutions to the queue and collect their methods
        for (const evo of evos) {
          const targetMon = standardizePokemonKey(evo.target);
          const normalizedTargetName = normalizePokemonDisplayName(targetMon);

          // Store evolution method information
          methodsByPokemon[sourceKey].push({
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

    // Also include any form-specific methods for this pokemon
    for (const [key, methods] of Object.entries(methodsByPokemon)) {
      if (key.startsWith(pokemon + ' (') && !sortedMethodsByPokemon[key]) {
        sortedMethodsByPokemon[key] = methods;
      }
    }
  }

  return {
    chain: sortedChain,
    methodsByPokemon: sortedMethodsByPokemon,
  };
}

// Add treemon extraction functions
function extractTreemonLocations(): Record<string, LocationEntry[]> {
  const treemonLocationsByMon: Record<string, LocationEntry[]> = {};

  // Read treemon maps file
  const treemonMapsPath = path.join(__dirname, 'polishedcrystal/data/wild/treemon_maps.asm');
  const treemonMapsData = fs.readFileSync(treemonMapsPath, 'utf8');

  // Read treemons file
  const treemonsPath = path.join(__dirname, 'polishedcrystal/data/wild/treemons.asm');
  const treemonsData = fs.readFileSync(treemonsPath, 'utf8');

  // Parse treemon maps to get location -> treemon set mapping
  const locationToTreemonSet: Record<string, string> = {};
  const treemonMapLines = treemonMapsData.split(/\r?\n/);

  for (const line of treemonMapLines) {
    const mapMatch = line.match(/treemon_map\s+([A-Z0-9_]+),\s+([A-Z0-9_]+)/);
    if (mapMatch) {
      const [, locationId, treemonSetId] = mapMatch;
      locationToTreemonSet[locationId] = treemonSetId;
    }
  }

  // Parse treemon sets and Pokemon
  const treemonLines = treemonsData.split(/\r?\n/);
  const treemonSets: Record<string, { normal: any[]; rare: any[] }> = {};

  let currentSet: string | null = null;
  let currentTable: 'normal' | 'rare' = 'normal';
  let inTreeMon = false;

  for (let i = 0; i < treemonLines.length; i++) {
    const line = treemonLines[i].trim();

    // Check for treemon set start
    const setMatch = line.match(/^TreeMonSet_([A-Za-z0-9_]+):$/);
    if (setMatch) {
      currentSet = `TREEMON_SET_${setMatch[1].toUpperCase()}`;
      treemonSets[currentSet] = { normal: [], rare: [] };
      currentTable = 'normal';
      inTreeMon = true;
      continue;
    }

    // Check for rare table marker (comment with "rare")
    if (line.includes('; rare')) {
      currentTable = 'rare';
      continue;
    }

    // Parse tree_mon entries
    if (inTreeMon && currentSet && line.startsWith('tree_mon')) {
      const treeMonMatch = line.match(
        /tree_mon\s+(\d+),\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?,\s+(.+)/,
      );
      if (treeMonMatch) {
        const [, rate, species, form, level] = treeMonMatch;

        const pokemonKey = getFullPokemonName(species, form || null);
        const normalizedKey = normalizePokemonUrlKey(pokemonKey);

        treemonSets[currentSet][currentTable].push({
          species: normalizedKey,
          rate: parseInt(rate),
          level,
          form: form || null,
        });
      }
    }

    // Check for end of treemon set
    if (line === 'db -1') {
      if (currentTable === 'normal') {
        currentTable = 'rare';
      } else {
        inTreeMon = false;
        currentSet = null;
      }
    }
  }

  // Map locations to Pokemon encounters
  for (const [locationId, treemonSetId] of Object.entries(locationToTreemonSet)) {
    const normalizedLocation = normalizeLocationKey(locationId);
    const treemonSet = treemonSets[treemonSetId];

    if (!treemonSet) continue;

    // Process both normal and rare encounters
    const processEncounters = (encounters: any[], method: string) => {
      for (const encounter of encounters) {
        const { species, rate, level, form } = encounter;

        if (!treemonLocationsByMon[species]) {
          treemonLocationsByMon[species] = [];
        }

        treemonLocationsByMon[species].push({
          area: normalizedLocation,
          method,
          time: 'all', // Treemon encounters are generally available all day
          level: level.toString(),
          chance: rate,
          formName: form,
        });
      }
    };

    // Determine method based on treemon set type
    const isRockSmash = treemonSetId === 'TREEMON_SET_ROCK';
    const method = isRockSmash ? 'rocksmash' : 'headbutt';

    processEncounters(treemonSet.normal, method);
    processEncounters(treemonSet.rare, `${method}_rare`);
  }

  console.log(
    `Extracted treemon locations for ${Object.keys(treemonLocationsByMon).length} Pokemon`,
  );
  return treemonLocationsByMon;
}

// Add swarm extraction function
function extractSwarmLocations(): Record<string, LocationEntry[]> {
  const swarmLocationsByMon: Record<string, LocationEntry[]> = {};

  const swarmGrassPath = path.join(__dirname, 'polishedcrystal/data/wild/swarm_grass.asm');
  if (!fs.existsSync(swarmGrassPath)) {
    console.log('Swarm grass file not found, skipping swarm extraction');
    return swarmLocationsByMon;
  }

  const swarmData = fs.readFileSync(swarmGrassPath, 'utf8');
  const lines = swarmData.split(/\r?\n/);

  let currentArea: string | null = null;
  let currentTime: string | null = null;
  let inSwarmBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for swarm area start
    const areaMatch = trimmedLine.match(/def_grass_wildmons\s+([A-Z0-9_]+)/);
    if (areaMatch) {
      currentArea = normalizeLocationKey(areaMatch[1]);
      inSwarmBlock = true;
      continue;
    }

    // Skip encounter rates line
    if (trimmedLine.match(/db\s+\d+\s+percent/)) {
      continue;
    }

    // Check for time sections
    if (inSwarmBlock && trimmedLine.match(/^;\s*(morn|day|nite)$/)) {
      currentTime = trimmedLine.replace(';', '').trim();
      continue;
    }

    // Parse wildmon entries
    if (inSwarmBlock && currentArea && currentTime && trimmedLine.startsWith('wildmon')) {
      const wildmonMatch = trimmedLine.match(
        /wildmon\s+(\d+|\w+),\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?/,
      );
      if (wildmonMatch) {
        const [, level, species, form] = wildmonMatch;

        const pokemonKey = getFullPokemonName(species, form || null);
        const normalizedKey = normalizePokemonUrlKey(pokemonKey);

        if (!swarmLocationsByMon[normalizedKey]) {
          swarmLocationsByMon[normalizedKey] = [];
        }

        swarmLocationsByMon[normalizedKey].push({
          area: currentArea,
          method: 'swarm',
          time: currentTime,
          level: level.toString(),
          chance: 100, // Swarms typically have high encounter rates
          formName: form || null,
        });
      }
    }

    // Check for end of swarm block
    if (trimmedLine === 'end_grass_wildmons') {
      inSwarmBlock = false;
      currentArea = null;
      currentTime = null;
    }
  }

  console.log(`Extracted swarm locations for ${Object.keys(swarmLocationsByMon).length} Pokemon`);
  return swarmLocationsByMon;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to extract form information from Pokemon names like "SlowpokeGalarian"
function extractFormFromName(pokemonName: string): { baseName: string; formName: string | null } {
  // Common form suffixes in the ROM data
  const formSuffixes = ['Galarian', 'Alolan', 'Hisuian', 'Paldean', 'Plain'];

  for (const suffix of formSuffixes) {
    if (pokemonName.endsWith(suffix)) {
      const baseName = pokemonName.slice(0, -suffix.length);
      const formName = suffix.toLowerCase() === 'plain' ? null : suffix.toLowerCase();
      return { baseName, formName };
    }
  }

  // No form suffix found
  return { baseName: pokemonName, formName: null };
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
    const formTypeName = formName;

    console.log(
      `DEBUG: Processing form-specific types for ${fileName} as form ${formTypeName} for ${basePokemonName}`,
    );

    // If the base type doesn't exist in the map yet, initialize it
    if (!formTypeMap[baseTypeName]) {
      formTypeMap[baseTypeName] = {};
    }

    // Add form-specific types
    formTypeMap[baseTypeName][formTypeName] = {
      types: faithfulTypes || ['None', 'None'],
      updatedTypes: updatedTypes || ['None', 'None'], // Don't fall back to faithfulTypes
    };

    console.log(
      `DEBUG: Form-specific types for ${baseTypeName} (${formTypeName}):`,
      formTypeMap[baseTypeName][formTypeName],
    );

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
  // console.log(`DEBUG: Base Pokémon name for dex lookup: ${baseMonNameDex}`);
  // console.log('DEBUG: Full National Dex Order:', JSON.stringify(nationalDexOrder, null, 2));
  // console.log('DEBUG: Full Johto Dex Order:', JSON.stringify(johtoDexOrder, null, 2));

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

  // Get types based on whether this is a base form or a special form
  let faithfulTypes: string[] = ['None'];
  let updatedTypes: string[] = ['None'];

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

  console.log(`DEBUG: Final Pokémon data for ${mon}:`, finalResult[mon]);
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
      console.log(`DEBUG: Processing wildmon line: ${line}`);
      if (parsed) {
        const { formName } = normalizeMonName(parsed.species, parsed.form); // Extract form name
        console.log(
          `DEBUG: Parsed wildmon line: species=${parsed.species}, form=${parsed.form}, level=${parsed.level}, area=${area}, method=${method}, time=${currentTime}`,
        );
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

// Extract and merge treemon location data (headbutt/rocksmash encounters)
console.log('🌳 Extracting treemon location data...');
const treemonLocationsByMon = extractTreemonLocations();
for (const [pokemonKey, treemonLocations] of Object.entries(treemonLocationsByMon)) {
  const normalizedKey = normalizePokemonUrlKey(pokemonKey);
  if (!normalizedLocationsByMon[normalizedKey]) {
    normalizedLocationsByMon[normalizedKey] = [];
  }
  normalizedLocationsByMon[normalizedKey].push(...treemonLocations);
  console.log(`Added ${treemonLocations.length} treemon locations for ${normalizedKey}`);
}

// Extract and merge swarm location data
console.log('🌪️ Extracting swarm location data...');
const swarmLocationsByMon = extractSwarmLocations();
for (const [pokemonKey, swarmLocations] of Object.entries(swarmLocationsByMon)) {
  const normalizedKey = normalizePokemonUrlKey(pokemonKey);
  if (!normalizedLocationsByMon[normalizedKey]) {
    normalizedLocationsByMon[normalizedKey] = [];
  }
  normalizedLocationsByMon[normalizedKey].push(...swarmLocations);
  console.log(`Added ${swarmLocations.length} swarm locations for ${normalizedKey}`);
}

// Write the aggregated Pokemon location data to the main output file
console.log('📍 Writing pokemon location data...');
const pokemonLocationOutput: Record<string, { locations: LocationEntry[] }> = {};
for (const [pokemonKey, locations] of Object.entries(normalizedLocationsByMon)) {
  pokemonLocationOutput[pokemonKey] = { locations };
}

fs.writeFileSync(LOCATIONS_OUTPUT, JSON.stringify(pokemonLocationOutput, null, 2));
console.log(`✅ Wrote ${Object.keys(pokemonLocationOutput).length} Pokemon with location data to ${LOCATIONS_OUTPUT}`);
