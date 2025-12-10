/**
 * Badge level thresholds for wild Pokémon in Polished Crystal.
 * LEVEL_FROM_BADGES + N will become BadgeBaseLevels[CountSetBits(wBadges)] + N
 * Source: polishedcrystal/data/wild/badge_base_levels.asm
 */

export interface BadgeLevelThreshold {
  badges: number;
  level: number;
  gymLeader: string | null;
  region: 'johto' | 'kanto';
}

export const BADGE_LEVEL_THRESHOLDS: BadgeLevelThreshold[] = [
  { badges: 0, level: 4, gymLeader: null, region: 'johto' },
  { badges: 1, level: 8, gymLeader: 'Falkner', region: 'johto' },
  { badges: 2, level: 12, gymLeader: 'Bugsy', region: 'johto' },
  { badges: 3, level: 16, gymLeader: 'Whitney', region: 'johto' },
  { badges: 4, level: 20, gymLeader: 'Morty', region: 'johto' },
  { badges: 5, level: 24, gymLeader: 'Chuck', region: 'johto' },
  { badges: 6, level: 28, gymLeader: 'Jasmine', region: 'johto' },
  { badges: 7, level: 32, gymLeader: 'Pryce', region: 'johto' },
  { badges: 8, level: 36, gymLeader: 'Clair', region: 'johto' },
  { badges: 9, level: 40, gymLeader: 'Lt. Surge', region: 'kanto' },
  { badges: 10, level: 43, gymLeader: 'Sabrina', region: 'kanto' },
  { badges: 11, level: 46, gymLeader: 'Misty', region: 'kanto' },
  { badges: 12, level: 49, gymLeader: 'Erika', region: 'kanto' },
  { badges: 13, level: 52, gymLeader: 'Janine', region: 'kanto' },
  { badges: 14, level: 55, gymLeader: 'Brock', region: 'kanto' },
  { badges: 15, level: 58, gymLeader: 'Blaine', region: 'kanto' },
  { badges: 16, level: 61, gymLeader: 'Blue', region: 'kanto' },
];

/**
 * Calculate the actual level for a given badge count and offset
 */
export function calculateBadgeLevel(badgeCount: number, offset: number = 0): number {
  const threshold = BADGE_LEVEL_THRESHOLDS[badgeCount] || BADGE_LEVEL_THRESHOLDS[0];
  return threshold.level + offset;
}

/**
 * Format a badge level with offset range for display
 * @param baseLevel - The base level at a given badge count
 * @param minOffset - The minimum offset in the encounter table
 * @param maxOffset - The maximum offset in the encounter table
 * @returns Formatted string like "Lv. 4 ±2" or "Lv. 6"
 */
export function formatBadgeLevelWithOffsets(
  baseLevel: number,
  minOffset: number,
  maxOffset: number
): string {
  if (minOffset === maxOffset) {
    // Single offset, show exact level
    return `Lv. ${baseLevel + minOffset}`;
  }

  // Check if offsets are symmetric around 0
  if (minOffset === -maxOffset) {
    return `Lv. ${baseLevel} ±${maxOffset}`;
  }

  // Asymmetric offsets - show as range from base
  const minLevel = baseLevel + minOffset;
  const maxLevel = baseLevel + maxOffset;
  return `Lv. ${minLevel}–${maxLevel}`;
}

/**
 * Parse offset from a badge level string like "Badge +2" or "Badge -1"
 * @returns The numeric offset, or 0 if not parseable
 */
export function parseBadgeOffset(levelRange: string): number {
  if (!levelRange.startsWith('Badge ')) return 0;
  const offsetStr = levelRange.replace('Badge ', '').trim();
  // Handle "Badge +2 to +4" format - extract first number
  const match = offsetStr.match(/^([+-]?\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Extract all unique offsets from an array of level range strings
 */
export function extractBadgeOffsets(levelRanges: string[]): number[] {
  const offsets = new Set<number>();
  
  for (const range of levelRanges) {
    if (!range.startsWith('Badge ')) continue;
    
    const offsetStr = range.replace('Badge ', '').trim();
    
    // Handle "Badge +2 to +4" format
    const rangeMatch = offsetStr.match(/^([+-]?\d+)\s*to\s*([+-]?\d+)$/);
    if (rangeMatch) {
      offsets.add(parseInt(rangeMatch[1], 10));
      offsets.add(parseInt(rangeMatch[2], 10));
      continue;
    }
    
    // Handle simple "Badge +2" format
    const simpleMatch = offsetStr.match(/^([+-]?\d+)$/);
    if (simpleMatch) {
      offsets.add(parseInt(simpleMatch[1], 10));
    }
  }
  
  return Array.from(offsets).sort((a, b) => a - b);
}
