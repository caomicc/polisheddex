/**
 * Parser for Pokémon location data from ASM files
 */

import path from 'node:path';
import fs from 'node:fs';
import { getFilesInDir, writeJSONSync } from '../utils/fileUtils.js';
import { getFullPokemonName } from '../utils/stringUtils.js';
import { OUTPUT_PATHS } from '../data/constants.js';
import type { LocationEntry, WildmonEntry } from '../types/pokemon.js';

/**
 * Extract and process wild Pokémon location data
 * @returns Record of Pokémon names mapped to their location entries
 */
export function extractPokemonLocations(): Record<string, LocationEntry[]> {
  console.log('Starting to process wild Pokémon locations...');

  // Get wild data files
  const wildDir = path.join(process.cwd(), 'data/wild');
  const wildFiles = getFilesInDir(wildDir, ['.asm']);

  // Aggregate locations by Pokémon
  const locationsByMon: Record<string, LocationEntry[]> = {};

  for (const file of wildFiles) {
    const filePath = path.join(wildDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    processWildFile(content, file, locationsByMon);
  }

  // Write the locations to a JSON file
  writeJSONSync(OUTPUT_PATHS.LOCATIONS, locationsByMon);
  console.log('Pokémon locations extracted to', OUTPUT_PATHS.LOCATIONS);

  return locationsByMon;
}

/**
 * Process a single wild Pokémon file
 * @param content File content
 * @param filename Filename for reference
 * @param locationsByMon Output map to populate
 */
function processWildFile(
  content: string,
  filename: string,
  locationsByMon: Record<string, LocationEntry[]>
): void {
  const lines = content.split(/\r?\n/);
  let area: string | null = null;
  let method: string | null = null;
  let time: string | null = null;
  let inBlock = false;
  let blockType: string | null = null;
  let encounterRates: { morn: number; day: number; nite: number; eve?: number } = {
    morn: 0,
    day: 0,
    nite: 0
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Area block start
    const areaMatch = line.match(/^def_(grass|water)_wildmons ([A-Z0-9_]+)/);
    if (areaMatch) {
      area = areaMatch[2];
      method = areaMatch[1];
      inBlock = true;
      blockType = method;
      time = null;
      // Reset encounter rates for new area
      encounterRates = { morn: 0, day: 0, nite: 0 };
      continue;
    }

    // Parse encounter rates line
    if (inBlock && line.match(/^\s*db\s+\d+\s+percent/)) {
      const rateMatches = line.match(/(\d+)\s+percent/g);
      if (rateMatches) {
        if (rateMatches.length >= 3) {
          // Format: db X percent, Y percent, Z percent ; encounter rates: morn/day/nite
          encounterRates.morn = parseInt(rateMatches[0].match(/(\d+)/)![1], 10);
          encounterRates.day = parseInt(rateMatches[1].match(/(\d+)/)![1], 10);
          encounterRates.nite = parseInt(rateMatches[2].match(/(\d+)/)![1], 10);
          // Handle eve if present (some files might have a 4th rate)
          if (rateMatches.length > 3) {
            encounterRates.eve = parseInt(rateMatches[3].match(/(\d+)/)![1], 10);
          }
        } else {
          // Format: db X percent ; encounter rate (for water areas typically)
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
      inBlock = false;
      area = null;
      method = null;
      time = null;
      continue;
    }

    if (inBlock && line.startsWith(';')) {
      // Time of day section
      const t = line.replace(';', '').trim().toLowerCase();
      if (["morn", "day", "nite", "eve"].includes(t)) {
        time = t;
      }
      continue;
    }

    if (inBlock && line.startsWith('wildmon')) {
      const parsed = parseWildmonLine(line);
      if (parsed) {
        const { pokemon, form, level } = parsed;
        const fullName = getFullPokemonName(pokemon, form);

        // Create encounter entry
        if (area && method && time) {
          const entry: LocationEntry = {
            area: formatAreaName(area),
            method: formatMethodName(method),
            level: level.toString(),
            time: time,
            chance: encounterRates[time as keyof typeof encounterRates] || 0
          };

          // Add to locations by Pokémon
          if (!locationsByMon[fullName]) {
            locationsByMon[fullName] = [];
          }
          locationsByMon[fullName].push(entry);
        }
      }
    }
  }
}

/**
 * Parse a wildmon line to extract Pokémon data
 * @param line Line from the wild file
 * @returns Parsed wildmon entry or null if invalid
 */
function parseWildmonLine(line: string): WildmonEntry | null {
  // Parse lines like: wildmon 5, RATTATA
  // or with a form: wildmon 10, TAUROS, PALDEAN_FIRE
  const match = line.match(/wildmon\s+(\d+),\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?/);

  if (match) {
    return {
      level: parseInt(match[1], 10),
      pokemon: match[2],
      form: match[3] || null
    };
  }

  return null;
}

/**
 * Format area name for display
 * @param area Raw area name from ASM
 * @returns Formatted area name
 */
function formatAreaName(area: string): string {
  return area
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format encounter method name
 * @param method Raw method from ASM (grass, water, etc.)
 * @returns Formatted method name
 */
function formatMethodName(method: string): string {
  const methodMap: Record<string, string> = {
    'grass': 'Walking in grass',
    'water': 'Surfing',
    'fishing': 'Fishing',
    'headbutt': 'Headbutt trees'
  };

  return methodMap[method] || method;
}
