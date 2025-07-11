/**
 * Parser for Pokémon base data from ASM files
 */

import path from 'node:path';
import fs from 'node:fs';
import { getFilesInDir, writeJSONSync } from '../utils/fileUtils.js';
import { getFullPokemonName } from '../utils/stringUtils.js';
import { OUTPUT_PATHS } from '../data/constants.js';
import type { BaseData } from '../types/pokemon.js';

/**
 * Extract and process Pokémon base data
 * @returns Record of Pokémon names mapped to their base data
 */
export function extractBaseData(): Record<string, BaseData> {
  console.log('Starting to process Pokémon base data...');

  // Get base data files
  const baseDir = path.join(process.cwd(), 'data/pokemon/base_data');
  const baseFiles = getFilesInDir(baseDir, ['.asm']);

  // Aggregate base data by Pokémon
  const baseDataByMon: Record<string, BaseData> = {};

  for (const file of baseFiles) {
    const filePath = path.join(baseDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    processBaseDataFile(content, file, baseDataByMon);
  }

  // Write the base data to a JSON file
  writeJSONSync(OUTPUT_PATHS.BASE_DATA, baseDataByMon);
  console.log('Pokémon base data extracted to', OUTPUT_PATHS.BASE_DATA);

  return baseDataByMon;
}

/**
 * Process a single base data file
 * @param content File content
 * @param filename Filename for reference
 * @param baseDataByMon Output map to populate
 */
function processBaseDataFile(
  content: string,
  filename: string,
  baseDataByMon: Record<string, BaseData>
): void {
  const lines = content.split(/\r?\n/);
  let currentPokemon: string | null = null;
  let currentForm: string | null = null;

  // Check for Pokémon and form in the filename
  const filenameMatch = filename.match(/^([a-z0-9_]+)(?:_([a-z0-9_]+))?\.asm$/i);
  if (filenameMatch) {
    currentPokemon = filenameMatch[1].toUpperCase();
    currentForm = filenameMatch[2]?.toUpperCase() || null;
  }

  if (currentPokemon) {
    const fullName = getFullPokemonName(currentPokemon, currentForm);

    // Extract base data values
    const typeLines = lines.filter(l => l.trim().startsWith('db TYPE_'));
    const heightLine = lines.find(l => l.trim().startsWith('dw ') && l.includes('; height'));
    const weightLine = lines.find(l => l.trim().startsWith('dw ') && l.includes('; weight'));
    const dexNumberLines = lines.filter(l => l.includes('dex number'));

    // Parse types
    const types: string[] = [];
    for (const line of typeLines) {
      const typeMatch = line.match(/TYPE_([A-Z]+)/g);
      if (typeMatch) {
        types.push(...typeMatch.map(t => t.replace('TYPE_', '')));
      }
    }

    // Parse height and weight but don't store them in the base data
    // as they're not part of the BaseData interface
    if (heightLine) {
      const heightMatch = heightLine.match(/dw\s+(\d+)/);
      if (heightMatch) {
        const heightValue = parseInt(heightMatch[1], 10) / 10; // Convert from decimeters to meters
        console.debug(`${fullName} height: ${heightValue.toFixed(1)} m`);
      }
    }

    if (weightLine) {
      const weightMatch = weightLine.match(/dw\s+(\d+)/);
      if (weightMatch) {
        const weightValue = parseInt(weightMatch[1], 10) / 10; // Convert from hectograms to kg
        console.debug(`${fullName} weight: ${weightValue.toFixed(1)} kg`);
      }
    }

    // Parse Pokédex numbers
    let nationalDex: number | null = null;
    let johtoDex: number | null = null;

    for (const line of dexNumberLines) {
      if (line.includes('national dex')) {
        const match = line.match(/;\s*national dex\s*#(\d+)/i);
        if (match) {
          nationalDex = parseInt(match[1], 10);
        }
      } else if (line.includes('johto dex')) {
        const match = line.match(/;\s*johto dex\s*#(\d+)/i);
        if (match) {
          johtoDex = parseInt(match[1], 10);
        }
      }
    }

    // Create the base data entry
    baseDataByMon[fullName] = {
      name: fullName,
      types: types.length > 0 ? types : ['NORMAL'],
      nationalDex,
      johtoDex
    };
  }
}
