/**
 * Parser for ability data from ASM files
 */

import path from 'node:path';
import { readFileSync, writeJSONSync } from '../utils/fileUtils.js';
import { toCapitalCaseWithSpaces } from '../utils/stringUtils.js';
import { SHARED_ABILITY_DESCRIPTION_GROUPS, OUTPUT_PATHS } from '../data/constants.js';
import type { AbilityDescription } from '../types/pokemon.js';

/**
 * Extract ability descriptions from ASM files
 * @returns Record of ability names mapped to their descriptions
 */
export function extractAbilityDescriptions(): Record<string, AbilityDescription> {
  const abilityNamesPath = path.join(process.cwd(), 'data/abilities/names.asm');
  const abilityDescriptionsPath = path.join(process.cwd(), 'data/abilities/descriptions.asm');

  const namesData = readFileSync(abilityNamesPath);
  const descData = readFileSync(abilityDescriptionsPath);

  console.log('Extracting ability descriptions...');

  // Parse ability names (order matters)
  // First get the ability identifiers from the table at the beginning
  const nameIds = namesData.split(/\r?\n/)
    .filter(l => l.trim().startsWith('dw '))
    .map(l => l.trim().replace('dw ', ''))
    .filter(Boolean);

  // Then get the actual string names from the rawchar definitions
  const abilityNameMap: Record<string, string> = {};
  const rawNameMatches = namesData.matchAll(/^(\w+):\s+rawchar\s+"([^@]+)@"/gm);

  console.log('Raw name matches found:', [...namesData.matchAll(/^(\w+):\s+rawchar\s+"([^@]+)@"/gm)].length);

  for (const match of rawNameMatches) {
    const [, id, name] = match;
    abilityNameMap[id] = name;
  }

  console.log('Ability name map entries:', Object.keys(abilityNameMap).length);

  // Map the ids to their corresponding names
  const abilityNames = nameIds.map(id => abilityNameMap[id] || id);

  console.log('Ability names parsed:', abilityNames.length, 'abilities');

  // Parse descriptions by label name
  const descMap = parseAbilityDescriptions(descData);

  // Map ability names to their description
  const abilityDescByName: Record<string, AbilityDescription> = {};
  for (let i = 0; i < abilityNames.length; i++) {
    const abilityKey = abilityNames[i].toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const desc = descMap[abilityKey] || '';
    const prettyName = toCapitalCaseWithSpaces(abilityKey);
    abilityDescByName[prettyName] = {
      description: desc
    };
  }

  // Handle special cases where descriptions are shared
  applySharedDescriptions(abilityDescByName);

  // Save to a JSON file for reference
  writeJSONSync(OUTPUT_PATHS.ABILITY_DESCRIPTIONS, abilityDescByName);
  console.log('Ability descriptions extracted to', OUTPUT_PATHS.ABILITY_DESCRIPTIONS);

  return abilityDescByName;
}

/**
 * Parse description sections from ability description ASM file
 * @param descData Raw file content string
 * @returns Map of ability keys to their description text
 */
function parseAbilityDescriptions(descData: string): Record<string, string> {
  const descLines = descData.split(/\r?\n/);
  const descMap: Record<string, string> = {};
  let currentLabels: string[] = [];
  let collecting = false;
  let buffer: string[] = [];

  for (const line of descLines) {
    const labelMatch = line.match(/^([A-Za-z0-9_]+)Description:/);

    if (labelMatch) {
      if (currentLabels.length && buffer.length) {
        for (const label of currentLabels) {
          const normalizedLabel = label.toUpperCase();
          descMap[normalizedLabel] = buffer.join(' ');
        }
      }
      // Start a new group of labels
      const normalizedLabel = labelMatch[1].toUpperCase();
      currentLabels = [normalizedLabel];
      buffer = [];
      collecting = false;
    } else if (line.match(/^\s*[A-Za-z0-9_]+Description:/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)Description:/);
      if (match) {
        const extraLabel = match[1].toUpperCase();
        currentLabels.push(extraLabel);
      }
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

  if (currentLabels.length && buffer.length) {
    for (const label of currentLabels) {
      const normalizedLabel = label.toUpperCase();
      descMap[normalizedLabel] = buffer.join(' ');
    }
  }

  return descMap;
}

/**
 * Apply shared descriptions to abilities that share the same effect
 * @param abilityDescByName Record of abilities and their descriptions
 */
function applySharedDescriptions(abilityDescByName: Record<string, AbilityDescription>): void {
  for (const [primary, aliasList] of Object.entries(SHARED_ABILITY_DESCRIPTION_GROUPS)) {
    const primaryDesc = abilityDescByName[primary];
    if (primaryDesc) {
      for (const alias of aliasList) {
        abilityDescByName[alias] = primaryDesc;
      }
    }
  }
}
