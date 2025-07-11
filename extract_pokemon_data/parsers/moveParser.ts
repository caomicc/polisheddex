/**
 * Parser for move data from ASM files
 */

import path from 'node:path';
import { readFileSync, writeJSONSync } from '../utils/fileUtils.js';
import { normalizeAsmLabelToMoveKey } from '../utils/stringUtils.js';
import {
  CATEGORY_ENUM_TO_NAME,
  OUTPUT_PATHS,
  SHARED_MOVE_DESCRIPTION_GROUPS,
  TYPE_ENUM_TO_NAME
} from '../data/constants.js';
import type { MoveDescription } from '../types/pokemon.js';

/**
 * Extract move descriptions and stats from ASM files
 * @returns Record of move names mapped to their details
 */
export function extractMoveDescriptions(): Record<string, MoveDescription> {
  const moveNamesPath = path.join(process.cwd(), 'data/moves/names.asm');
  const moveDescriptionsPath = path.join(process.cwd(), 'data/moves/descriptions.asm');
  const moveStatsPath = path.join(process.cwd(), 'data/moves/moves.asm');

  const namesData = readFileSync(moveNamesPath);
  const descData = readFileSync(moveDescriptionsPath);
  const statsData = readFileSync(moveStatsPath);

  // Parse move names (order matters)
  const nameLines = namesData.split(/\r?\n/).filter(l => l.trim().startsWith('li '));
  const moveNames = nameLines.map(l => l.match(/li "(.+?)"/)?.[1] || '').filter(Boolean);

  // Parse descriptions by label name
  const descMap = parseMoveDescriptions(descData);

  // Parse move stats
  const moveStats = parseMoveStats(statsData);

  // Map move names to their description by label name
  const moveDescByName = createMoveDescriptionMap(moveNames, descMap, moveStats);

  // Apply shared descriptions to moves with similar effects
  applySharedDescriptions(moveDescByName);

  // Save to a JSON file for reference
  writeJSONSync(OUTPUT_PATHS.MOVE_DESCRIPTIONS, moveDescByName);
  console.log('Move descriptions extracted to', OUTPUT_PATHS.MOVE_DESCRIPTIONS);

  return moveDescByName;
}

/**
 * Parse move descriptions from ASM file content
 * @param descData Raw description file content
 * @returns Map of move keys to their descriptions
 */
function parseMoveDescriptions(descData: string): Record<string, string> {
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
          const normalizedLabel = normalizeAsmLabelToMoveKey(label);
          descMap[normalizedLabel] = buffer.join(' ');
        }
      }
      // Start a new group of labels
      const normalizedLabel = normalizeAsmLabelToMoveKey(labelMatch[1]);
      currentLabels = [normalizedLabel];
      buffer = [];
      collecting = false;
    } else if (line.match(/^\s*[A-Za-z0-9_]+Description:/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)Description:/);
      if (match) {
        const extraLabel = normalizeAsmLabelToMoveKey(match[1]);
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
      const normalizedLabel = normalizeAsmLabelToMoveKey(label);
      descMap[normalizedLabel] = buffer.join(' ');
    }
  }

  return descMap;
}

/**
 * Parse move stats from ASM file content
 * @param statsData Raw move stats file content
 * @returns Map of move keys to their stats
 */
function parseMoveStats(statsData: string): Record<string, { type: string; pp: number; power: number; category: string; accuracy: number }> {
  const statsLines = statsData.split(/\r?\n/);
  // move NAME, EFFECT, POWER, TYPE, ACCURACY, PP, PRIORITY, CATEGORY
  const moveStats: Record<string, { type: string; pp: number; power: number; category: string; accuracy: number }> = {};

  for (const line of statsLines) {
    const match = line.match(/^\s*move\s+([A-Z0-9_]+),\s*[A-Z0-9_]+,\s*(-?\d+),\s*([A-Z_]+),\s*(-?\d+),\s*(\d+),\s*\d+,\s*([A-Z_]+)/);
    if (match) {
      const move = match[1];
      const power = parseInt(match[2], 10);
      const type = TYPE_ENUM_TO_NAME[match[3]] || 'None';
      const accuracy = parseInt(match[4], 10);
      const pp = parseInt(match[5], 10);
      const category = CATEGORY_ENUM_TO_NAME[match[6]] || 'Unknown';
      moveStats[move] = { type, pp, power, category, accuracy };
    }
  }

  return moveStats;
}

/**
 * Create a map of move names to their descriptions and stats
 * @param moveNames List of move names in order
 * @param descMap Map of move keys to their descriptions
 * @param moveStats Map of move keys to their stats
 * @returns Combined move description and stats map
 */
function createMoveDescriptionMap(
  moveNames: string[],
  descMap: Record<string, string>,
  moveStats: Record<string, { type: string; pp: number; power: number; category: string; accuracy: number }>
): Record<string, MoveDescription> {
  const moveDescByName: Record<string, MoveDescription> = {};

  for (let i = 0; i < moveNames.length; i++) {
    const moveName = moveNames[i];
    const moveKey = moveName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const desc = descMap[moveKey] || '';
    const stats = moveStats[moveKey] || { type: 'Normal', pp: 0, power: 0, category: 'Physical', accuracy: 0 };

    moveDescByName[moveName] = {
      description: desc,
      type: stats.type,
      pp: stats.pp,
      power: stats.power,
      category: stats.category,
      accuracy: stats.accuracy
    };
  }

  return moveDescByName;
}

/**
 * Apply shared descriptions to moves with similar effects
 * @param moveDescByName Move description map to update
 */
function applySharedDescriptions(moveDescByName: Record<string, MoveDescription>): void {
  for (const [, moveKeys] of Object.entries(SHARED_MOVE_DESCRIPTION_GROUPS)) {
    // Find representative move to use as template
    const primaryMove = moveKeys[0];
    if (!primaryMove || !moveDescByName[primaryMove]) continue;

    // For each group member, standardize descriptions while keeping move-specific stats
    for (let i = 1; i < moveKeys.length; i++) {
      const key = moveKeys[i];
      if (moveDescByName[key]) {
        // Keep the move's original stats but standardize the description
        const move = moveDescByName[key];
        move.description = moveDescByName[primaryMove].description;
      }
    }
  }
}
