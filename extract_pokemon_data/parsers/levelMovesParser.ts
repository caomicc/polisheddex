/**
 * Parser for Pokémon level-up moves from ASM files
 */

import path from 'node:path';
import fs from 'node:fs';
import { getFilesInDir, writeJSONSync } from '../utils/fileUtils.js';
import { getFullPokemonName } from '../utils/stringUtils.js';
import { OUTPUT_PATHS } from '../data/constants.js';
import type { Move } from '../types/pokemon.js';

/**
 * Extract and process Pokémon level-up moves
 * @returns Record of Pokémon names mapped to their level-up moves
 */
export function extractLevelMoves(): Record<string, Move[]> {
  console.log('Starting to process Pokémon level-up moves...');

  // Get evolution and attacks files (which contain level-up moves)
  const evosAttacksDir = path.join(process.cwd(), 'data/pokemon/evos_attacks');
  const evosAttacksFiles = getFilesInDir(evosAttacksDir, ['.asm']);

  // Aggregate level moves by Pokémon
  const levelMovesByMon: Record<string, Move[]> = {};

  for (const file of evosAttacksFiles) {
    // Skip main include file
    if (file === 'evos_attacks.asm') continue;

    const filePath = path.join(evosAttacksDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    processLevelMovesFile(content, file, levelMovesByMon);
  }

  // Write the level moves to a JSON file
  writeJSONSync(OUTPUT_PATHS.LEVEL_MOVES, levelMovesByMon);
  console.log('Pokémon level-up moves extracted to', OUTPUT_PATHS.LEVEL_MOVES);

  return levelMovesByMon;
}

/**
 * Process a single level moves file
 * @param content File content
 * @param filename Filename for reference
 * @param levelMovesByMon Output map to populate
 */
function processLevelMovesFile(
  content: string,
  filename: string,
  levelMovesByMon: Record<string, Move[]>
): void {
  const lines = content.split(/\r?\n/);
  let currentPokemon: string | null = null;
  let currentForm: string | null = null;
  let inMovesSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for Pokémon entry
    const pokemonMatch = line.match(/^([A-Za-z0-9_]+)EvosAttacks:$/);
    if (pokemonMatch) {
      currentPokemon = pokemonMatch[1];
      currentForm = null;
      inMovesSection = false;
      continue;
    }

    // Check for form-specific entry
    const formMatch = line.match(/^([A-Za-z0-9_]+)_([A-Za-z0-9_]+)EvosAttacks:$/);
    if (formMatch) {
      currentPokemon = formMatch[1];
      currentForm = formMatch[2];
      inMovesSection = false;
      continue;
    }

    // Mark the start of moves section
    if (line === 'db 0 ; no more evolutions' || line === 'db 0') {
      inMovesSection = true;

      // Initialize moves array if this is the first time we see this Pokémon
      if (currentPokemon) {
        const fullName = getFullPokemonName(currentPokemon, currentForm);
        if (!levelMovesByMon[fullName]) {
          levelMovesByMon[fullName] = [];
        }
      }

      continue;
    }

    // End of moves section
    if (line === 'db 0 ; no more level-up moves') {
      inMovesSection = false;
      continue;
    }

    // Parse move entries
    if (inMovesSection && currentPokemon && line.startsWith('db ')) {
      const moveMatch = line.match(/db\s+(\d+),\s+([A-Z0-9_]+)/);
      if (moveMatch) {
        const level = parseInt(moveMatch[1], 10);
        const moveName = moveMatch[2].replace(/_/g, ' ');

        const fullName = getFullPokemonName(currentPokemon, currentForm);
        const move: Move = {
          name: moveName,
          level
        };

        levelMovesByMon[fullName].push(move);
      }
    }
  }
}
