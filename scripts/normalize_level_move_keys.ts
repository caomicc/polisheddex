// This script normalizes all move names in pokemon_level_moves.json using the normalizeMoveKey convention from extractUtils.ts
import fs from 'node:fs';
import path from 'node:path';
import { normalizeMoveKey } from '../src/utils/stringUtils.ts';

const filePath = path.join(__dirname, '../output/pokemon_level_moves.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

for (const pokemon in data) {
  if (Array.isArray(data[pokemon].moves)) {
    for (const move of data[pokemon].moves) {
      if (move.name) {
        move.name = normalizeMoveKey(move.name);
      }
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('Move names normalized in pokemon_level_moves.json');
