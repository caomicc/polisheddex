import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractMoveDescriptions() {
  const moveNamesPath = path.join(__dirname, 'data/moves/names.asm');
  const moveDescriptionsPath = path.join(__dirname, 'data/moves/descriptions.asm');
  const moveDescriptionsOutputPath = path.join(__dirname, 'move_descriptions.json');

  const namesData = fs.readFileSync(moveNamesPath, 'utf8');
  const descData = fs.readFileSync(moveDescriptionsPath, 'utf8');

  // Parse move names (order matters)
  const nameLines = namesData.split(/\r?\n/).filter(l => l.trim().startsWith('li '));
  const moveNames = nameLines.map(l => l.match(/li "(.+?)"/)?.[1] || '').filter(Boolean);

  // Parse descriptions
  const descLines = descData.split(/\r?\n/);
  const descMap: Record<string, string> = {};
  let currentLabel = '';
  let collecting = false;
  let buffer: string[] = [];
  for (const line of descLines) {
    if (line.endsWith('Description:')) {
      if (currentLabel && buffer.length) {
        descMap[currentLabel] = buffer.join(' ');
      }
      currentLabel = line.replace(':', '');
      buffer = [];
      collecting = false;
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
  if (currentLabel && buffer.length) {
    descMap[currentLabel] = buffer.join(' ');
  }

  // Map move names to their description (by order)
  const moveDescByName: Record<string, string> = {};
  const descLabels = Object.keys(descMap);
  for (let i = 0; i < moveNames.length; i++) {
    const label = descLabels[i];
    if (label && moveNames[i]) {
      const moveKey = moveNames[i].toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      if (descMap[label]) {
        moveDescByName[moveKey] = descMap[label];
      } else {
        console.warn(`Warning: No description found for move: ${moveKey}`);
      }
    }
  }
  fs.writeFileSync(moveDescriptionsOutputPath, JSON.stringify(moveDescByName, null, 2));
  console.log('Move descriptions extracted to', moveDescriptionsOutputPath);
}

// --- New code for extracting move descriptions ---
extractMoveDescriptions();

const filePath = path.join(__dirname, 'data/pokemon/evos_attacks.asm');
const outputPath = path.join(__dirname, 'pokemon_evo_moves.json');

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

const finalResult: Record<string, PokemonDataV2 & { nationalDex: number | null }> = {};
for (const mon of Object.keys(result)) {
  const moves = result[mon].moves;
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
  finalResult[mon] = { evolution, moves, nationalDex };
}

fs.writeFileSync(outputPath, JSON.stringify(finalResult, null, 2));
console.log('Pokémon evolution and moves data extracted to', outputPath);
