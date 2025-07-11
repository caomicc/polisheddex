/**
 * Parser for Pokémon egg moves from ASM files
 */

import path from 'node:path';
import fs from 'node:fs';
import { getFilesInDir, writeJSONSync } from '../utils/fileUtils.js';
import { getFullPokemonName } from '../utils/stringUtils.js';
import { OUTPUT_PATHS } from '../data/constants.js';

/**
 * Extract and process Pokémon egg moves
 * @returns Record of Pokémon names mapped to their egg moves
 */
export function extractEggMoves(): Record<string, string[]> {
  console.log('Starting to process Pokémon egg moves...');

  // Get egg moves files
  const eggMovesDir = path.join(process.cwd(), 'data/pokemon/egg_moves');
  const eggMovesFiles = getFilesInDir(eggMovesDir, ['.asm']);

  // Aggregate egg moves by Pokémon
  const eggMovesByMon: Record<string, string[]> = {};

  for (const file of eggMovesFiles) {
    const filePath = path.join(eggMovesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    processEggMovesFile(content, file, eggMovesByMon);
  }

  // Write the egg moves to a JSON file
  writeJSONSync(OUTPUT_PATHS.EGG_MOVES, eggMovesByMon);
  console.log('Pokémon egg moves extracted to', OUTPUT_PATHS.EGG_MOVES);

  return eggMovesByMon;
}

/**
 * Process a single egg moves file
 * @param content File content
 * @param filename Filename for reference
 * @param eggMovesByMon Output map to populate
 */
function processEggMovesFile(
  content: string,
  filename: string,
  eggMovesByMon: Record<string, string[]>
): void {
  const lines = content.split(/\r?\n/);
  let currentPokemon: string | null = null;
  let currentForm: string | null = null;

  // Try to extract Pokémon name from filename
  const filenameMatch = filename.match(/^([a-z0-9_]+)(?:_([a-z0-9_]+))?\.asm$/i);
  if (filenameMatch) {
    currentPokemon = filenameMatch[1].toUpperCase();
    currentForm = filenameMatch[2]?.toUpperCase() || null;
  } else {
    // If filename doesn't match, try to find Pokémon name in content
    const headerMatch = content.match(/^\s*([A-Za-z0-9_]+)EggMoves:/m);
    const formHeaderMatch = content.match(/^\s*([A-Za-z0-9_]+)_([A-Za-z0-9_]+)EggMoves:/m);

    if (formHeaderMatch) {
      currentPokemon = formHeaderMatch[1];
      currentForm = formHeaderMatch[2];
    } else if (headerMatch) {
      currentPokemon = headerMatch[1];
      currentForm = null;
    } else {
      console.warn(`Could not determine Pokémon for egg moves in ${filename}`);
      return;
    }
  }

  // If we found a Pokémon, extract egg moves
  if (currentPokemon) {
    const fullName = getFullPokemonName(currentPokemon, currentForm);
    const eggMoves: string[] = [];

    // Parse move entries
    for (const line of lines) {
      // Line format is typically: db MOVE_NAME
      const moveMatch = line.match(/^\s*db\s+([A-Z0-9_]+)/);
      if (moveMatch) {
        const moveName = moveMatch[1].replace(/_/g, ' ');
        eggMoves.push(moveName);
      }
    }

    // Only add if there are moves
    if (eggMoves.length > 0) {
      eggMovesByMon[fullName] = eggMoves;
    }
  }
}
