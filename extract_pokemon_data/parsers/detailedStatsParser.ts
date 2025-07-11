/**
 * Parser for Pokémon detailed stats from ASM files
 */

import path from 'node:path';
import fs from 'node:fs';
import { getFilesInDir, writeJSONSync } from '../utils/fileUtils.js';
import { getFullPokemonName } from '../utils/stringUtils.js';
import {
  OUTPUT_PATHS,
  GENDER_CODES,
  HATCH_CODES,
  GROWTH_RATE_CODES,
  EGG_GROUP_CODES
} from '../data/constants.js';
import type { DetailedStats } from '../types/pokemon.js';

/**
 * Extract and process Pokémon detailed stats data
 * @returns Record of Pokémon names mapped to their detailed stats
 */
export function extractDetailedStats(): Record<string, DetailedStats> {
  console.log('Starting to process Pokémon detailed stats...');

  // Get base stats files
  const baseStatsDir = path.join(process.cwd(), 'data/pokemon/base_stats');
  const baseStatsFiles = getFilesInDir(baseStatsDir, ['.asm']);

  // Aggregate detailed stats by Pokémon
  const detailedStats: Record<string, DetailedStats> = {};

  for (const file of baseStatsFiles) {
    const filePath = path.join(baseStatsDir, file);
    processStatsFile(filePath, file, detailedStats);
  }

  // Write the detailed stats to a JSON file
  writeJSONSync(OUTPUT_PATHS.DETAILED_STATS, detailedStats);
  console.log('Pokémon detailed stats extracted to', OUTPUT_PATHS.DETAILED_STATS);

  return detailedStats;
}

/**
 * Process a single stats file
 * @param filePath Path to the stats file
 * @param fileName Filename for reference
 * @param detailedStats Output map to populate
 */
function processStatsFile(
  filePath: string,
  fileName: string,
  detailedStats: Record<string, DetailedStats>
): void {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    // Extract Pokémon name and form from filename
    // Example: bulbasaur.asm or pikachu_cosplay.asm
    const nameMatch = fileName.match(/([a-zA-Z0-9_]+)(?:_([a-zA-Z0-9_]+))?\.asm$/);
    if (nameMatch) {
      const pokemonName = nameMatch[1].toUpperCase();
      const formName = nameMatch[2]?.toUpperCase() || null;
      const fullName = getFullPokemonName(pokemonName, formName);

      // Base stats - they appear in a standard format in the file
      // Line format: db 45, 49, 49, 45, 65, 65 ; hp, atk, def, spd, sat, sdf
      const baseStatsLine = lines.find(l => l.includes('; hp, atk, def, spd, sat, sdf'));
      const baseStats = {
        hp: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        specialAttack: 0,
        specialDefense: 0,
        total: 0
      };

      if (baseStatsLine) {
        const statMatch = baseStatsLine.match(/db\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)/);
        if (statMatch) {
          baseStats.hp = parseInt(statMatch[1], 10);
          baseStats.attack = parseInt(statMatch[2], 10);
          baseStats.defense = parseInt(statMatch[3], 10);
          baseStats.speed = parseInt(statMatch[4], 10);
          baseStats.specialAttack = parseInt(statMatch[5], 10);
          baseStats.specialDefense = parseInt(statMatch[6], 10);
          baseStats.total = baseStats.hp + baseStats.attack + baseStats.defense +
            baseStats.speed + baseStats.specialAttack + baseStats.specialDefense;
        }
      }

      // Extract catch rate
      const catchRateLine = lines.find(l => l.trim().startsWith('db ') && l.includes('; catch rate'));
      let catchRate = 0;
      if (catchRateLine) {
        const catchMatch = catchRateLine.match(/db\s+(\d+)/);
        if (catchMatch) {
          catchRate = parseInt(catchMatch[1], 10);
        }
      }

      // Extract base exp
      const baseExpLine = lines.find(l => l.trim().startsWith('db ') && l.includes('; base exp'));
      let baseExp = 0;
      if (baseExpLine) {
        const expMatch = baseExpLine.match(/db\s+(\d+)/);
        if (expMatch) {
          baseExp = parseInt(expMatch[1], 10);
        }
      }

      // Extract held items
      const heldItemLines = lines.filter(l => l.includes('held_'));
      const heldItems: string[] = [];
      for (const line of heldItemLines) {
        const itemMatch = line.match(/dw ([A-Z0-9_]+)/);
        if (itemMatch) {
          heldItems.push(itemMatch[1].replace(/_/g, ' '));
        }
      }

      // Gender ratio
      const genderLine = lines.find(l => l.includes('gender'));
      let genderRatio = 'Unknown';
      if (genderLine) {
        const genderMatch = genderLine.match(/db ([A-Z0-9_]+)/);
        if (genderMatch) {
          const genderCode = genderMatch[1];
          genderRatio = convertGenderCode(genderCode);
        }
      }

      // Extract hatch rate
      const hatchLine = lines.find(l => l.includes('hatch'));
      let hatchRate = 'Unknown';
      if (hatchLine) {
        const hatchMatch = hatchLine.match(/db ([A-Z0-9_]+)/);
        if (hatchMatch) {
          const hatchCode = hatchMatch[1];
          hatchRate = convertHatchCode(hatchCode);
        }
      }

      // Extract growth rate
      const growthLine = lines.find(l => l.includes('growth'));
      let growthRate = 'Medium Fast';
      if (growthLine) {
        const growthMatch = growthLine.match(/db ([A-Z0-9_]+)/);
        if (growthMatch) {
          const growthCode = growthMatch[1];
          growthRate = convertGrowthRateCode(growthCode);
        }
      }

      // Extract egg groups
      const eggGroupLines = lines.filter(l => l.includes('egg_group'));
      const eggGroups: string[] = [];
      for (const line of eggGroupLines) {
        const eggMatch = line.match(/db ([A-Z0-9_]+)/);
        if (eggMatch) {
          const eggCode = eggMatch[1];
          eggGroups.push(convertEggGroupCode(eggCode));
        }
      }

      // Extract abilities
      const abilityLines = lines.filter(l => l.includes('ability'));
      const abilities: string[] = [];
      for (const line of abilityLines) {
        const abilityMatch = line.match(/db ([A-Z0-9_]+)/);
        if (abilityMatch) {
          const ability = abilityMatch[1].replace(/_/g, ' ');
          abilities.push(ability);
        }
      }

      // Extract EV yield - Format: ev_yield NUM STAT
      const evYieldLine = lines.find(l => l.trim().startsWith('ev_yield'));
      let evYield = 'None';

      if (evYieldLine) {
        const evYieldMatch = evYieldLine.match(/ev_yield\s+(\d+)\s+([A-Za-z]+)/);
        if (evYieldMatch) {
          evYield = `${evYieldMatch[1]} ${evYieldMatch[2]}`;
        }
      }

      // Add the detailed stats to our result
      detailedStats[fullName] = {
        baseStats,
        catchRate,
        baseExp,
        heldItems,
        genderRatio,
        hatchRate,
        abilities,
        growthRate,
        eggGroups,
        evYield
      };
    }
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
  }
}

/**
 * Convert gender code to human-readable string
 * @param code Gender code from ASM
 * @returns Formatted gender ratio
 */
function convertGenderCode(code: string): string {
  return GENDER_CODES[code] || 'Unknown';
}

/**
 * Convert hatch code to human-readable string
 * @param code Hatch code from ASM
 * @returns Formatted hatch rate
 */
function convertHatchCode(code: string): string {
  return HATCH_CODES[code] || 'Unknown';
}

/**
 * Convert growth rate code to human-readable string
 * @param code Growth rate code from ASM
 * @returns Formatted growth rate
 */
function convertGrowthRateCode(code: string): string {
  return GROWTH_RATE_CODES[code] || 'Medium Fast';
}

/**
 * Convert egg group code to human-readable string
 * @param code Egg group code from ASM
 * @returns Formatted egg group name
 */
function convertEggGroupCode(code: string): string {
  return EGG_GROUP_CODES[code] || 'Undiscovered';
}
