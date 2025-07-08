import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Move = { level: number; move: string };
type PokemonData = { evolution_level: number | null; moves: Move[] };

const filePath = path.join(__dirname, 'data/pokemon/evos_attacks.asm');
const outputPath = path.join(__dirname, 'pokemon_evo_moves.json');

// --- New code for extracting move descriptions ---
const moveNamesPath = path.join(__dirname, 'data/moves/names.asm');
const moveDescriptionsPath = path.join(__dirname, 'data/moves/descriptions.asm');
const moveDescriptionsOutputPath = path.join(__dirname, 'move_descriptions.json');

function extractMoveDescriptions() {
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

extractMoveDescriptions();

const data = fs.readFileSync(filePath, 'utf8');

const lines = data.split(/\r?\n/);
const result: Record<string, PokemonData> = {};

let currentMon: string | null = null;
let currentEvoLevel: number | null = null;
let moves: Move[] = [];

for (let line of lines) {
  line = line.trim();
  if (line.startsWith('evos_attacks ')) {
    if (currentMon) {
      result[currentMon] = {
        evolution_level: currentEvoLevel,
        moves: moves
      };
    }
    currentMon = line.split(' ')[1];
    currentEvoLevel = null;
    moves = [];
  } else if (line.startsWith('evo_data EVOLVE_LEVEL')) {
    const match = line.match(/EVOLVE_LEVEL,\s*(\d+),/);
    if (match) {
      currentEvoLevel = parseInt(match[1], 10);
    }
  } else if (line.startsWith('learnset ')) {
    const match = line.match(/learnset (\d+),\s*([A-Z0-9_]+)/);
    if (match) {
      moves.push({
        level: parseInt(match[1], 10),
        move: match[2]
      });
    }
  }
}
if (currentMon) {
  result[currentMon] = {
    evolution_level: currentEvoLevel,
    moves: moves
  };
}

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('Pokémon evolution and moves data extracted to', outputPath);
