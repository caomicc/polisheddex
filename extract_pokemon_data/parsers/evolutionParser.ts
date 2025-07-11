/**
 * Parser for Pokémon evolution data from ASM files
 */

import path from 'node:path';
import fs from 'node:fs';
import { getFilesInDir, writeJSONSync } from '../utils/fileUtils.js';
import { getFullPokemonName } from '../utils/stringUtils.js';
import { OUTPUT_PATHS } from '../data/constants.js';
import type { Evolution, EvoRaw } from '../types/pokemon.js';

/**
 * Extract and process Pokémon evolution data
 * @returns Record of Pokémon names mapped to their evolution data
 */
export function extractEvolutionData(): Record<string, Evolution[]> {
  console.log('Starting to process evolution data...');

  // Get evolution files
  const evoDir = path.join(process.cwd(), 'data/pokemon/evos_attacks');
  const evoFiles = getFilesInDir(evoDir, ['.asm']);

  // Aggregate evolutions by Pokémon
  const evolutionsByMon: Record<string, Evolution[]> = {};

  for (const file of evoFiles) {
    // Skip certain files
    if (file === 'evos_attacks.asm') continue;

    const filePath = path.join(evoDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    processEvoFile(content, file, evolutionsByMon);
  }

  // Write the evolutions to a JSON file
  writeJSONSync(OUTPUT_PATHS.EVOLUTION, evolutionsByMon);
  console.log('Pokémon evolution data extracted to', OUTPUT_PATHS.EVOLUTION);

  return evolutionsByMon;
}

/**
 * Process a single evolution file
 * @param content File content
 * @param filename Filename for reference
 * @param evolutionsByMon Output map to populate
 */
function processEvoFile(
  content: string,
  filename: string,
  evolutionsByMon: Record<string, Evolution[]>
): void {
  const lines = content.split(/\r?\n/);
  let currentPokemon: string | null = null;
  let currentForm: string | null = null;
  let inEvoBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for Pokémon definition line
    const pokemonMatch = line.match(/^([A-Za-z0-9_]+)EvosAttacks:$/);
    if (pokemonMatch) {
      const pokemonName = pokemonMatch[1];
      currentPokemon = pokemonName;
      currentForm = null;
      inEvoBlock = true;
      continue;
    }

    // Check for form-specific evolutions
    const formMatch = line.match(/^([A-Za-z0-9_]+)_([A-Za-z0-9_]+)EvosAttacks:$/);
    if (formMatch) {
      currentPokemon = formMatch[1];
      currentForm = formMatch[2];
      inEvoBlock = true;
      continue;
    }

    // If we're in an evolution block and encounter "db 0", it marks the end of evolutions
    if (inEvoBlock && line === 'db 0') {
      inEvoBlock = false;
      continue;
    }

    // Parse evolution entries
    if (inEvoBlock && line.startsWith('evo_data')) {
      const parsed = parseEvoLine(line);
      if (parsed && currentPokemon) {
        const fullName = getFullPokemonName(currentPokemon, currentForm);

        // Process the evolution data
        const targetName = getFullPokemonName(parsed.target, parsed.form || null);
        const evolution: Evolution = {
          methods: [{
            method: parsed.method,
            parameter: parsed.parameter,
            target: parsed.target,
            form: parsed.form || undefined
          }],
          chain: [targetName]
        };

        // Add to evolutions by Pokémon
        if (!evolutionsByMon[fullName]) {
          evolutionsByMon[fullName] = [];
        }
        evolutionsByMon[fullName].push(evolution);
      }
    }
  }
}

/**
 * Parse an evolution line to extract evolution data
 * @param line Line from the evolution file
 * @returns Parsed evolution entry or null if invalid
 */
function parseEvoLine(line: string): EvoRaw | null {
  // Parse lines like: evo_data EVOLVE_LEVEL, 16, IVYSAUR
  // or with a form: evo_data EVOLVE_ITEM, LEAF_STONE, EXEGGUTOR, ALOLAN
  const basicMatch = line.match(/evo_data\s+([A-Z_]+),\s+([A-Z0-9_]+|[0-9]+),\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?/);

  if (basicMatch) {
    const method = basicMatch[1];
    const paramStr = basicMatch[2];
    const target = basicMatch[3];
    const form = basicMatch[4]; // This will be undefined if not present

    // Determine if parameter is a number or string
    let parameter: string | number | null = null;
    if (paramStr) {
      const parsedNum = parseInt(paramStr, 10);
      parameter = isNaN(parsedNum) ? paramStr : parsedNum;
    }

    return {
      method: formatEvolutionMethod(method),
      parameter,
      target,
      form
    };
  }

  // Handle special case for no-parameter evolution methods
  const simpleMatch = line.match(/evo_data\s+([A-Z_]+),\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?/);
  if (simpleMatch) {
    return {
      method: formatEvolutionMethod(simpleMatch[1]),
      parameter: null,
      target: simpleMatch[2],
      form: simpleMatch[3] // This will be undefined if not present
    };
  }

  return null;
}

/**
 * Format evolution method for display
 * @param method Raw method from ASM
 * @returns Formatted method name
 */
function formatEvolutionMethod(method: string): string {
  const methodMap: Record<string, string> = {
    'EVOLVE_LEVEL': 'Level',
    'EVOLVE_ITEM': 'Item',
    'EVOLVE_TRADE': 'Trade',
    'EVOLVE_HAPPINESS': 'Happiness',
    'EVOLVE_STAT': 'Stats',
    'EVOLVE_MOVE': 'Move',
    'EVOLVE_MAP': 'Location',
    'EVOLVE_ITEM_MALE': 'Item (Male)',
    'EVOLVE_ITEM_FEMALE': 'Item (Female)',
    'EVOLVE_HOLD': 'Hold Item',
    'EVOLVE_TIME': 'Time of Day',
    'EVOLVE_MOVE_TYPE': 'Move Type',
    'EVOLVE_PARTY': 'With Pokémon in Party',
    'EVOLVE_LEVEL_REGION': 'Level Up in Region',
    'EVOLVE_HAPPINESS_REGION': 'Happiness in Region',
  };

  return methodMap[method] || method.replace('EVOLVE_', '');
}
