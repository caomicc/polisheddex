import fs from 'node:fs';

import { KNOWN_FORMS } from "../data/constants.ts";
import { normalizeString } from './stringNormalizer/stringNormalizer.ts';

// Helper to convert move names to Capital Case with spaces
// This is useful for displaying move names in a user-friendly format
// abilities, moves
export function toCapitalCaseWithSpaces(str: string) {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Helper to normalize ASM labels to move keys (e.g., BatonPass -> BATON_PASS, Psybeam -> PSY_BEAM)
export function normalizeAsmLabelToMoveKey(label: string) {
  return label
    .replace(/DESCRIPTION$/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2') // lowerUpper -> lower_Upper
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // ABBRWord -> ABBR_Word
    .toUpperCase();
}

// old alias
export function toTitleCase(str: string) {
  return normalizeString(str)
  // .toLowerCase()
  // .replace(/(^|_|\s|-)([a-z])/g, (_, sep, c) => sep + c.toUpperCase())
  // .replace(/_/g, '');
}


// Helper to standardize Pokemon key names across the codebase
export function standardizePokemonKey(name: string): string {
  // First, trim any whitespace from the name to avoid trailing space
  name = name.trim();

  // Special handling for Paldean forms that need specific treatment
  if (name.toLowerCase().includes(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase())) {
    return toTitleCase(name.substring(0, name.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase())).toLowerCase());
  } else if (name.toLowerCase().includes(KNOWN_FORMS.PALDEAN_WATER.toLowerCase())) {
    return toTitleCase(name.substring(0, name.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_WATER.toLowerCase())).toLowerCase());
  }

  // Create a regex pattern using all the known forms from our constant
  const formSuffixPattern = new RegExp(`(${Object.values(KNOWN_FORMS).join('|')})$`, 'i');

  // Remove any form suffixes
  const baseName = name.replace(formSuffixPattern, '');

  // Convert to title case and remove any case inconsistencies
  return toTitleCase(baseName.trim());
}

export function parseDexEntries(file: string): string[] {
  // Accepts a file path to a dex order file and returns an array of TitleCase names in order
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const names: string[] = [];

  // Keep track of Pokemon that have been processed to avoid duplicates
  const processedBaseNames = new Set<string>();

  // Check if this is a dp-style file (dex_order_new.asm) or a SECTION-style file (dex_entries.asm)
  const isOrderStyle = text.includes('dp ');

  for (const line of lines) {
    if (isOrderStyle) {
      // Look for lines with dp POKEMON_NAME format
      const match = line.match(/dp ([A-Z0-9_]+)/);
      if (match) {
        const name = toTitleCase(match[1]);
        if (!processedBaseNames.has(name)) {
          processedBaseNames.add(name);
          names.push(name);
        }
      }
    } else {
      // Look for lines with SECTION "PokemonNamePokedexEntry" format
      const match = line.match(/SECTION "([A-Za-z0-9_]+)PokedexEntry"/);
      if (match) {
        let name = match[1];

        // Remove form suffixes from names
        for (const form of Object.values(KNOWN_FORMS)) {
          const formCapitalized = form.charAt(0).toUpperCase() + form.slice(1);
          if (name.endsWith(formCapitalized)) {
            name = name.slice(0, name.length - formCapitalized.length);
            break;
          }
        }

        // Convert to TitleCase
        name = toTitleCase(name);

        if (!processedBaseNames.has(name)) {
          processedBaseNames.add(name);
          names.push(name);
        }
      }
    }
  }
  return names;
}

// Helper to parse wildmon lines
export function parseWildmonLine(line: string): { level: string; species: string; form: string | null } | null {
  // Handles: wildmon LEVEL, SPECIES [, FORM]
  const match = line.match(/wildmon ([^,]+), ([A-Z0-9_]+)(?:, ([A-Z0-9_]+))?/);

  if (!match) return null;

  let level = match[1].trim();
  if (level.startsWith('LEVEL_FROM_BADGES')) {
    level = level.replace(/^LEVEL_FROM_BADGES/, 'Badge Level').trim();
  }
  return {
    level,
    species: match[2].trim(),
    form: match[3] ? match[3].trim() : null
  };
}

export function normalizeMonName(name: string, formStr: string | null): { baseName: string; formName: string | null } {
  // Trim and convert to TitleCase, then remove any trailing spaces
  const baseName = toTitleCase(name).trimEnd();

  let formName: string | null = null;

  if (formStr) {
    if (formStr === 'ALOLAN_FORM') {
      formName = KNOWN_FORMS.ALOLAN;
    } else if (formStr === 'GALARIAN_FORM') {
      formName = KNOWN_FORMS.GALARIAN;
    } else if (formStr === 'HISUIAN_FORM') {
      formName = KNOWN_FORMS.HISUIAN;
    } else if (formStr === 'PALDEAN_FORM') {
      formName = KNOWN_FORMS.PALDEAN;
    } else if (formStr === 'TAUROS_PALDEAN_FIRE_FORM') {
      formName = KNOWN_FORMS.PALDEAN_FIRE;
    } else if (formStr === 'TAUROS_PALDEAN_WATER_FORM') {
      formName = KNOWN_FORMS.PALDEAN_WATER;
    } else if (formStr === 'PLAIN_FORM' || formStr.includes('PLAIN')) {
      formName = null;
    } else {
      formName = toTitleCase(formStr).trimEnd();
    }
  }

  return { baseName, formName };
}
// Helper functions to convert game codes to human-readable strings
export function convertGenderCode(code: string): { male: number; female: number } {
  const genderCodes: Record<string, { male: number; female: number }> = {
    'GENDER_F0': {
      male: 100,
      female: 0,
    },
    'GENDER_F12_5': {
      male: 87.5,
      female: 12.5,
    },
    'GENDER_F25': {
      male: 75,
      female: 25,
    },
    'GENDER_F50': {
      male: 50,
      female: 50,
    },
    'GENDER_F75': {
      male: 25,
      female: 75,
    },
    'GENDER_F100': {
      male: 0,
      female: 100,
    },
    'GENDER_UNKNOWN': {
      male: 0,
      female: 0,
    },
  };
  return genderCodes[code] || { male: 0, female: 0 };
}

export function convertHatchCode(code: string): string {
  const hatchCodes: Record<string, string> = {
    'HATCH_FASTEST': 'Very Fast (1,280 steps)',
    'HATCH_FASTER': 'Fast (2,560 steps)',
    'HATCH_FAST': 'Medium-Fast (5,120 steps)',
    'HATCH_MEDIUM_FAST': 'Medium-Fast (5,120 steps)',
    'HATCH_MEDIUM_SLOW': 'Medium-Slow (6,400 steps)',
    'HATCH_SLOW': 'Slow (8,960 steps)',
    'HATCH_SLOWER': 'Very Slow (10,240 steps)',
    'HATCH_SLOWEST': 'Extremely Slow (20,480 steps)'
  };
  return hatchCodes[code] || 'Unknown';
}

export function convertGrowthRateCode(code: string): string {
  const growthRateCodes: Record<string, string> = {
    'GROWTH_MEDIUM_FAST': 'Medium Fast',
    'GROWTH_SLIGHTLY_FAST': 'Slightly Fast',
    'GROWTH_SLIGHTLY_SLOW': 'Slightly Slow',
    'GROWTH_MEDIUM_SLOW': 'Medium Slow',
    'GROWTH_FAST': 'Fast',
    'GROWTH_SLOW': 'Slow',
    'GROWTH_ERRATIC': 'Erratic',
    'GROWTH_FLUCTUATING': 'Fluctuating'
  };
  return growthRateCodes[code] || 'Medium Fast';
}

export function convertEggGroupCode(code: string): string {
  const eggGroupCodes: Record<string, string> = {
    'EGG_MONSTER': 'Monster',
    'EGG_WATER_1': 'Water 1',
    'EGG_BUG': 'Bug',
    'EGG_FLYING': 'Flying',
    'EGG_GROUND': 'Field',
    'EGG_FAIRY': 'Fairy',
    'EGG_PLANT': 'Grass',
    'EGG_HUMANSHAPE': 'Human-Like',
    'EGG_WATER_3': 'Water 3',
    'EGG_MINERAL': 'Mineral',
    'EGG_INDETERMINATE': 'Amorphous',
    'EGG_WATER_2': 'Water 2',
    'EGG_DITTO': 'Ditto',
    'EGG_DRAGON': 'Dragon',
    'EGG_NONE': 'Undiscovered'
  };
  return eggGroupCodes[code] || 'Undiscovered';
}

/**
 * Normalizes a move name to the canonical key format used for lookups.
 * Example: "Light Screen" -> "LIGHT_SCREEN", "psybeam" -> "PSY_BEAM"
 */
export function normalizeMoveKey(name: string): string {
  return name
    // .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .replace(/\s+/g, '_') // spaces to underscores
    .replace(/[^A-Z0-9_]/gi, '_') // non-alphanumeric to underscores
    .toUpperCase();
}

export const typeEnumToName: Record<string, string> = {
  'NORMAL': 'Normal', 'FIGHTING': 'Fighting', 'FLYING': 'Flying', 'POISON': 'Poison', 'GROUND': 'Ground',
  'ROCK': 'Rock', 'BUG': 'Bug', 'GHOST': 'Ghost', 'STEEL': 'Steel', 'FIRE': 'Fire', 'WATER': 'Water',
  'GRASS': 'Grass', 'ELECTRIC': 'Electric', 'PSYCHIC': 'Psychic', 'ICE': 'Ice', 'DRAGON': 'Dragon',
  'DARK': 'Dark', 'FAIRY': 'Fairy', 'SHADOW': 'Shadow', 'NONE': 'None'
};
