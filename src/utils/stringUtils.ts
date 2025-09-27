import { KNOWN_FORMS } from '../data/constants.ts';
/**
 * String normalizer for Pokémon move names and related strings
 * Handles various formats like camelCase, SNAKE_CASE, prefixed and suffixed variants
 */

/**
 * Removes common prefixes and suffixes from move-related strings
 */
const stripAffixes = (str: string): string => {
  // Common prefixes to strip
  const prefixes = ['BattleAnim_', 'Sfx_'];

  // Common suffixes to strip
  const suffixes = ['Description'];

  let result = str;

  // Strip prefixes
  for (const prefix of prefixes) {
    if (result.startsWith(prefix)) {
      result = result.substring(prefix.length);
      break;
    }
  }

  // Strip suffixes
  for (const suffix of suffixes) {
    if (result.endsWith(suffix)) {
      result = result.substring(0, result.length - suffix.length);
      break;
    }
  }

  return result;
};

/**
 * Converts a string to a standardized format
 * - Strips common prefixes and suffixes
 * - Normalizes to Capital Case (e.g., "Thunder Shock")
 * - Handles special cases
 */
export const normalizeString = (str: string): string => {
  // Special cases that need direct mapping due to conflicts or inconsistencies
  const specialCases: Record<string, string> = {
    NIGHT_SLASH: 'Night Slash',
    SLASH: 'Slash',
    NightSlashDescription: 'Night Slash',
    SlashDescription: 'Slash',
    PSYCHIC_M: 'Psychic', // Special case for PSYCHIC move constant
    PsychicM: 'Psychic', // CamelCase variant
    'Psychic M': 'Psychic', // Space variant
    'Ho-Oh': 'Ho-Oh', // Special case for Ho-Oh
    'Ho Oh': 'Ho-Oh', // Special case for Ho-Oh
    Hooh: 'Ho-Oh', // Another variant for Ho-Oh
    HoOh: 'Ho-Oh', // Another variant for Ho-Oh
    HOOH: 'Ho-Oh', // Uppercase variant
    'ho oh': 'Ho-Oh', // Lowercase with space
    'ho-oh': 'Ho-Oh', // Lowercase with hyphen
    ho_oh: 'Ho-Oh', // Special case for file name format
    HO_OH: 'Ho-Oh', // Special case for ASM constant format
    'porygon -z': 'porygon-z', // Special case for porygon-z
    'porygon-z': 'porygon-Z', // Special case for porygon-z
    'Porygon Z': 'porygon-z', // Special case for porygon-z
    PorygonZ: 'porygon-z', // Another variant for porygon-z
    'PORYGON-Z': 'porygon-z', // Uppercase variant
    'PORYGON -Z': 'porygon-z', // Uppercase variant
    // 'porygon-z': 'porygon-z', // Lowercase with hyphen
    'porygon z': 'porygon-z', // Lowercase with space
    porygon_z: 'porygon-z', // Special case for file name format
    PORYGON_Z: 'porygon-z', // Special case for ASM constant format
    'Mr. Mime': 'Mr-Mime', // Special case for Mr. Mime
    'Mr Mime': 'Mr-Mime', // Special case for Mr. Mime
    'MR. MIME': 'Mr-Mime', // Uppercase variant
    'mr. mime': 'Mr-Mime', // Lowercase with space
    'mr mime': 'Mr-Mime', // Lowercase with space
    mr_mime: 'Mr-Mime', // Special case for file name format
    mr__mime: 'Mr-Mime', // Special case for file name format with double underscore
    MR_MIME: 'Mr-Mime', // Special case for ASM constant format
    MR__MIME: 'Mr-Mime', // Special case for ASM constant format with double underscore
    'Mr. Rime': 'mr-rime', // Special case for Mr. Rime
    'Mr Rime': 'mr-rime', // Special case for Mr. Rime
    'MR. RIME': 'mr-rime', // Uppercase variant
    'mr. rime': 'mr-rime', // Lowercase with space
    'mr rime': 'mr-rime', // Lowercase with space
    mr_rime: 'mr-rime', // Special case for file name format
    mr__rime: 'mr-rime', // Special case for file name format with double underscore
    MR_RIME: 'mr-rime', // Special case for ASM constant format
    MR__RIME: 'mr-rime', // Special case for ASM constant format with double underscore
    MrMime: 'Mr-Mime', // CamelCase variant
    MrRime: 'mr-rime', // CamelCase variant for Mr. Rime

    'Mime Jr.': 'Mime-Jr', // Special case for Mime Jr.
    'Mime Jr': 'Mime-Jr', // Special case for Mime Jr.
    'MIME JR.': 'Mime-Jr', // Uppercase variant
    'mime jr.': 'Mime-Jr', // Lowercase with space
    'mime jr': 'Mime-Jr', // Lowercase with space
    mime_jr: 'Mime-Jr', // Special case for file name format
    mime_jr_: 'Mime-Jr', // Special case for file name format with trailing underscore
    MIME_JR: 'Mime-Jr', // Special case for ASM constant format
    MIME_JR_: 'Mime-Jr', // Special case for ASM constant format with trailing underscore
    MimeJr: 'Mime-Jr', // CamelCase variant

    // Nidoran♀ special cases
    'nidoran F': 'Nidoran-F',
    'Nidoran F': 'Nidoran-F',
    'Nidoran♀': 'Nidoran-F',
    'Nidoran♀Description': 'Nidoran-F',
    'NIDORAN♀': 'Nidoran-F',
    'nidoran♀': 'Nidoran-F',
    'Nidoran-F': 'Nidoran-F',
    NIDORAN_F: 'Nidoran-F',
    nidoran_f: 'Nidoran-F',
    NidoranF: 'Nidoran-F',
    NIDORANF: 'Nidoran-F',
    nidoranf: 'Nidoran-F',

    'nidoran M': 'Nidoran-M',
    'Nidoran M': 'Nidoran-M',
    'Nidoran♂': 'Nidoran-M',
    'Nidoran♂Description': 'Nidoran-M',
    'NIDORAN♂': 'Nidoran-M',
    'nidoran♂': 'Nidoran-M',
    'Nidoran-M': 'Nidoran-M',
    NIDORAN_M: 'Nidoran-M',
    nidoran_m: 'Nidoran-M',
    NidoranM: 'Nidoran-M',
    NIDORANM: 'Nidoran-M',
    nidoranm: 'Nidoran-M',

    "Farfetch'd": 'Farfetch-d', // Special case for Farfetch'd
    'Farfetch D': 'Farfetch-d', // Special case for Farfetch'd
    "FARFETCH'D": 'Farfetch-d', // Uppercase variant
    "farfetch'd": 'Farfetch-d', // Lowercase with apostrophe
    'farfetch d': 'Farfetch-d', // Lowercase with space
    farfetch_d: 'Farfetch-d', // Special case for file name format
    FARFETCH_D: 'Farfetch-d', // Special case for ASM constant format
    Farfetchd: 'Farfetch-d', // CamelCase variant
    FarfetchdDescription: 'Farfetch-d', // Description variant
    FarfetchD: 'Farfetch-d', // Another variant for Farfetch'd

    "Sirfetch'd": 'Sirfetch-d', // Special case for Sirfetch'd
    'Sirfetch D': 'Sirfetch-d', // Special case for Sirfetch'd
    "SIRFETCH'D": 'Sirfetch-d', // Uppercase variant
    "sirfetch'd": 'Sirfetch-d', // Lowercase with apostrophe
    'sirfetch d': 'Sirfetch-d', // Lowercase with space
    sirfetch_d: 'Sirfetch-d', // Special case for file name format
    SIRFETCH_D: 'Sirfetch-d', // Special case for ASM constant format
    Sirfetchd: 'Sirfetch-d', // CamelCase variant
    SirfetchdDescription: 'Sirfetch-d', // Description variant
    SirfetchD: 'Sirfetch-d', // Another variant for Sirfetch'd
  };

  // Check if this is a special case that needs direct mapping
  if (specialCases[str]) {
    console.log(`Found special case: "${str}" → "${specialCases[str]}"`);
    return specialCases[str];
  }

  // Remove common prefixes and suffixes
  let normalized = stripAffixes(str);

  // Convert to words array for processing
  let words: string[] = [];

  // Handle SNAKE_CASE (all uppercase with underscores)
  if (normalized === normalized.toUpperCase() && normalized.includes('_')) {
    // Split by underscore
    words = normalized.toLowerCase().split('_');
  }
  // Handle space separated strings (e.g., "Wild Charge")
  else if (normalized.includes(' ')) {
    words = normalized.toLowerCase().split(' ');
  }
  // Handle PascalCase (e.g., "ThunderShock") or camelCase
  else if (!normalized.includes('_') && normalized !== normalized.toUpperCase()) {
    // Insert space before capital letters to split into words
    const withSpaces = normalized.replace(/([A-Z])/g, ' $1').trim();
    words = withSpaces
      .toLowerCase()
      .split(' ')
      .filter((word) => word.length > 0);
  }
  // Handle ALL_CAPS without underscores
  else if (normalized === normalized.toUpperCase() && !normalized.includes('_')) {
    words = [normalized.toLowerCase()];
  }

  // Convert to Capital Case (first letter of each word capitalized)
  normalized = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return normalized;
};

/**
 * Get a move name from any variant of the string
 * @param str Any variant of a move name string
 * @returns Normalized move name
 */
export const normalizeMoveString = (str: string): string => {
  return normalizeString(str);
};

/**
 * Tests the normalizer with various edge cases
 */
export const runNormalizerTests = (): void => {
  const testCases: [string, string][] = [
    // Format: [input, expected output]
    ['ThunderShock', 'Thunder Shock'],
    ['ThundershockDescription', 'Thundershock'],
    ['Sfx_Thundershock', 'Thundershock'],
    ['THUNDERSHOCK', 'Thundershock'],

    ['EXTREMESPEED', 'Extreme Speed'],
    ['BattleAnim_Extremespeed', 'Extremespeed'],
    ['ExtremespeedDescription', 'Extremespeed'],
    ['ExtremeSpeed', 'Extreme Speed'],

    ['DOUBLE_SLAP', 'Double Slap'],
    ['DoubleSlap', 'Double Slap'],
    ['DoubleSlapDescription', 'Double Slap'],
    ['BattleAnim_DoubleSlap', 'Double Slap'],

    ['Wild Charge', 'Wild Charge'],
    ['WildChargeDescription', 'Wild Charge'],
    ['WILD_CHARGE', 'Wild Charge'],
    ['BattleAnim_WildCharge', 'Wild Charge'],

    ['Disarm Voice', 'Disarm Voice'],
    ['DisarmVoiceDescription', 'Disarm Voice'],
    ['DISARM_VOICE', 'Disarm Voice'],

    ['Slash', 'Slash'],
    ['SLASH', 'Slash'],
    ['SlashDescription', 'Slash'],

    ['Night Slash', 'Night Slash'],
    ['NIGHT_SLASH', 'Night Slash'],
    ['NightSlashDescription', 'Night Slash'],

    ['Extrasensory', 'Extrasensory'],
    ['EXTRASENSORY', 'Extrasensory'],

    ['Healinglight', 'Healing Light'],
    ['HEALINGLIGHT', 'Healing Light'],
    ['BattleAnim_HealingLight', 'Healing Light'],
    ['HealingLight', 'Healing Light'],

    ['Future Sight', 'Future Sight'],
    ['FutureSight', 'Future Sight'],
    ['FUTURE_SIGHT', 'Future Sight'],

    ['Nasty Plot', 'Nasty Plot'],
    ['NASTY_PLOT', 'Nasty Plot'],
    ['NastyPlot', 'Nasty Plot'],

    ['Foresight', 'Foresight'],
    ['FORESIGHT', 'Foresight'],
    ['ForesightDescription', 'Foresight'],
  ];

  console.log('Running normalizer tests:');
  console.log('------------------------');

  let passed = 0;
  let failed = 0;

  for (const [input, expected] of testCases) {
    const result = normalizeMoveString(input);
    const testPassed = result === expected;

    if (testPassed) {
      passed++;
      console.log(`✅ "${input}" → "${result}"`);
    } else {
      failed++;
      console.log(`❌ "${input}" → "${result}" (expected: "${expected}")`);
    }
  }

  console.log('------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${Math.round((passed / testCases.length) * 100)}%`);
};

// Helper to convert move names to Capital Case with spaces
// This is useful for displaying move names in a user-friendly format
// abilities, moves
export function toCapitalCaseWithSpaces(str: string) {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  return normalizeString(str);
  // .toLowerCase()
  // .replace(/(^|_|\s|-)([a-z])/g, (_, sep, c) => sep + c.toUpperCase())
  // .replace(/_/g, '');
}

// Helper to standardize Pokemon key names across the codebase
export function standardizePokemonKey(name: string): string {
  // First, trim any whitespace from the name to avoid trailing space
  let trimmedName = name.trim();

  // Special handling for Paldean forms that need specific treatment
  if (trimmedName.toLowerCase().includes(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase())) {
    return toTitleCase(
      trimmedName
        .substring(0, trimmedName.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase()))
        .toLowerCase(),
    );
  } else if (trimmedName.toLowerCase().includes(KNOWN_FORMS.PALDEAN_WATER.toLowerCase())) {
    return toTitleCase(
      trimmedName
        .substring(0, trimmedName.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_WATER.toLowerCase()))
        .toLowerCase(),
    );
  }

  // Create a regex pattern using all the known forms from our constant
  const formSuffixPattern = new RegExp(`(${Object.values(KNOWN_FORMS).join('|')})$`, 'i');

  // Remove any form suffixes
  const baseName = trimmedName.replace(formSuffixPattern, '');

  // Convert to title case and remove any case inconsistencies
  return toTitleCase(baseName.trim());
}

// --- NOTE: parseDexEntries has been moved to a Node-only file (parseDexEntries.node.ts) ---
export function parseDexEntries(_file: string): never {
  throw new Error(
    'parseDexEntries is only available in Node.js/server environments. Import from parseDexEntries.node.ts instead.',
  );
}
// Helper to parse wildmon lines
export function parseWildmonLine(
  line: string,
): { level: string; species: string; form: string | null } | null {
  // Handles: wildmon LEVEL, SPECIES [, FORM]
  const match = line.match(/wildmon ([^,]+), ([A-Z0-9_]+)(?:, ([A-Z0-9_]+))?/);

  if (!match) return null;

  let level = match[1].trim();
  if (level.startsWith('LEVEL_FROM_BADGES')) {
    level = level.replace(/^LEVEL_FROM_BADGES/, 'Badge Level').trim();
  }

  console.log(
    `DEBUG: stringUtils parseWildmonLine: level: ${level}, species: ${match[2]}, form: ${match[3]}`,
  );

  return {
    level,
    species: match[2].trim(),
    form: match[3] ? match[3].trim() : null,
  };
}

export function normalizeMonName(
  name: string,
  formStr: string | null,
): { baseName: string; formName: string | null } {
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
    GENDER_F0: {
      male: 100,
      female: 0,
    },
    GENDER_F12_5: {
      male: 87.5,
      female: 12.5,
    },
    GENDER_F25: {
      male: 75,
      female: 25,
    },
    GENDER_F50: {
      male: 50,
      female: 50,
    },
    GENDER_F75: {
      male: 25,
      female: 75,
    },
    GENDER_F100: {
      male: 0,
      female: 100,
    },
    GENDER_UNKNOWN: {
      male: 0,
      female: 0,
    },
  };
  return genderCodes[code] || { male: 0, female: 0 };
}

export function convertHatchCode(code: string): string {
  const hatchCodes: Record<string, string> = {
    HATCH_FASTEST: 'Very Fast (1,280 steps)',
    HATCH_FASTER: 'Fast (2,560 steps)',
    HATCH_FAST: 'Medium-Fast (5,120 steps)',
    HATCH_MEDIUM_FAST: 'Medium-Fast (5,120 steps)',
    HATCH_MEDIUM_SLOW: 'Medium-Slow (6,400 steps)',
    HATCH_SLOW: 'Slow (8,960 steps)',
    HATCH_SLOWER: 'Very Slow (10,240 steps)',
    HATCH_SLOWEST: 'Extremely Slow (20,480 steps)',
  };
  return hatchCodes[code] || 'Unknown';
}

export function convertGrowthRateCode(code: string): string {
  const growthRateCodes: Record<string, string> = {
    GROWTH_MEDIUM_FAST: 'Medium Fast',
    GROWTH_SLIGHTLY_FAST: 'Slightly Fast',
    GROWTH_SLIGHTLY_SLOW: 'Slightly Slow',
    GROWTH_MEDIUM_SLOW: 'Medium Slow',
    GROWTH_FAST: 'Fast',
    GROWTH_SLOW: 'Slow',
    GROWTH_ERRATIC: 'Erratic',
    GROWTH_FLUCTUATING: 'Fluctuating',
  };
  return growthRateCodes[code] || 'Medium Fast';
}

export function convertEggGroupCode(code: string): string {
  const eggGroupCodes: Record<string, string> = {
    EGG_MONSTER: 'Monster',
    EGG_WATER_1: 'Water 1',
    EGG_BUG: 'Bug',
    EGG_FLYING: 'Flying',
    EGG_GROUND: 'Field',
    EGG_FAIRY: 'Fairy',
    EGG_PLANT: 'Grass',
    EGG_HUMANSHAPE: 'Human-Like',
    EGG_WATER_3: 'Water 3',
    EGG_MINERAL: 'Mineral',
    EGG_INDETERMINATE: 'Amorphous',
    EGG_WATER_2: 'Water 2',
    EGG_DITTO: 'Ditto',
    EGG_DRAGON: 'Dragon',
    EGG_NONE: 'Undiscovered',
  };
  return eggGroupCodes[code] || 'Undiscovered';
}

/**
 * Normalizes a move name to the canonical key format used for lookups.
 * Example: "Light Screen" -> "LIGHT_SCREEN", "psybeam" -> "PSY_BEAM"
 */
export function normalizeMoveKey(name: string): string {
  return (
    name
      // .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
      .replace(/\s+/g, '_') // spaces to underscores
      .replace(/[^A-Z0-9_]/gi, '_') // non-alphanumeric to underscores
      .toUpperCase()
  );
}

export const typeEnumToName: Record<string, string> = {
  NORMAL: 'Normal',
  FIGHTING: 'Fighting',
  FLYING: 'Flying',
  POISON: 'Poison',
  GROUND: 'Ground',
  ROCK: 'Rock',
  BUG: 'Bug',
  GHOST: 'Ghost',
  STEEL: 'Steel',
  FIRE: 'Fire',
  WATER: 'Water',
  GRASS: 'Grass',
  ELECTRIC: 'Electric',
  PSYCHIC: 'Psychic',
  ICE: 'Ice',
  DRAGON: 'Dragon',
  DARK: 'Dark',
  FAIRY: 'Fairy',
  SHADOW: 'Shadow',
  NONE: 'None',
};

/**
 * Utility to replace all occurrences of "#mon" with "pokemon" in a string, and trim any tab characters.
 */
export function replaceMonString(val: string): string {
  if (typeof val !== 'string') return val;
  return val.replace(/#mon/g, 'Pokemon').replace(/\t+/g, '').trim();
}

/**
 * Recursively replace all occurrences of "#mon" with "pokemon" in all string fields of an object or array.
 */
export function deepReplaceMonString(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return replaceMonString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(deepReplaceMonString);
  }
  if (obj && typeof obj === 'object') {
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = deepReplaceMonString(value);
    }
    return newObj;
  }
  return obj;
}

/**
 * Format a normalized location key into a display-friendly name
 */
export function formatDisplayName(normalizedKey: string): string {
  return (
    normalizedKey
      .replace(/([a-z])([A-Z])/g, '$1_$2') // Add underscore before capitals
      .replace(/([a-zA-Z])(\d+[Ff])/g, '$1_$2') // Separate letters from floor numbers like "Tower1F" -> "Tower_1F"
      .replace(/(\d+[Ff])([A-Z][a-z])/g, '$1_$2') // Separate floor numbers from following words like "1FInside" -> "1F_Inside"
      .replace(/([Bb])(\d+[Ff])(north|south|east|west|coast|inside)/gi, '$1$2_$3') // Handle "B1fnorth" -> "B1f_north"
      // .replace(/(\d+)([a-z]+)/g, '$1_$2')
      .replace(/(route)(\d+)(north|south|east|west|coast|inside)/gi, '$1_$2_$3') // Separate route numbers: "Route44" -> "Route_44"
      // Separate digits from following lowercase words (handles "route42inside" -> "route_42_inside")
      .split('_')
      .map((word) => {
        // Handle floor abbreviations (both uppercase and lowercase f)
        if (/^[Bb]\d+[Ff]$/i.test(word)) {
          const floorNum = word.match(/\d+/)?.[0];
          return `Basement ${floorNum ? ordinalSuffix(parseInt(floorNum)) : ''} Floor`;
        }
        if (/^\d+[Ff]$/i.test(word)) {
          const floorNum = word.match(/\d+/)?.[0];
          return `${floorNum ? ordinalSuffix(parseInt(floorNum)) : ''} Floor`;
        }
        // Handle route numbers (route44 -> Route 44)
        if (/^route\d+[a-zA-Z]*$/i.test(word)) {
          const m = word.match(/^route(\d+)([a-zA-Z]+)?$/i);
          const routeNum = m?.[1];
          const suffix = m?.[2];
          if (routeNum) {
            if (suffix) {
              return `Route ${routeNum} ${suffix.charAt(0).toUpperCase() + suffix.slice(1).toLowerCase()}`;
            }
            return `Route ${routeNum}`;
          }
        }
        // Handle directions
        if (/^(ne|nw|se|sw|ea|we|n|s|e|w|north|south|east|west)$/i.test(word)) {
          const dirMap: Record<string, string> = {
            n: 'North',
            s: 'South',
            e: 'East',
            w: 'West',
            ne: 'Northeast',
            nw: 'Northwest',
            se: 'Southeast',
            sw: 'Southwest',
            ea: 'East',
            we: 'West',
            north: 'North',
            south: 'South',
            east: 'East',
            west: 'West',
          };
          return dirMap[word.toLowerCase()] || word.toUpperCase();
        }
        // Capitalize normal words (numbers remain unchanged)
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ')
  );
}

/**
 * Helper for ordinal suffixes (1 -> First, 2 -> Second, etc.)
 */
function ordinalSuffix(num: number): string {
  switch (num) {
    case 1:
      return 'First';
    case 2:
      return 'Second';
    case 3:
      return 'Third';
    case 4:
      return 'Fourth';
    case 5:
      return 'Fifth';
    case 6:
      return 'Sixth';
    case 7:
      return 'Seventh';
    case 8:
      return 'Eighth';
    case 9:
      return 'Ninth';
    case 10:
      return 'Tenth';
    default:
      return `${num}th`;
  }
}

/**
 * Infer the region a location belongs to based on its key
 */
export function inferLocationRegion(locationKey: string): 'johto' | 'kanto' | 'orange' {
  const key = locationKey.toLowerCase();

  // Johto locations
  const johtoLocations = [
    'new_bark_town',
    'cherrygrove_city',
    'violet_city',
    'azalea_town',
    'goldenrod_city',
    'ecruteak_city',
    'olivine_city',
    'cianwood_city',
    'mahogany_town',
    'blackthorn_city',
    'dark_cave',
    'sprout_tower',
    'ruins_of_alph',
    'union_cave',
    'slowpoke_well',
    'ilex_forest',
    'radio_tower',
    'national_park',
    'tin_tower',
    'whirl_islands',
    'mt_silver',
    'dragon_den',
    'ice_path',
    'tohjo_falls',
    'route_29',
    'route_30',
    'route_31',
    'route_32',
    'route_33',
    'route_34',
    'route_35',
    'route_36',
    'route_37',
    'route_38',
    'route_39',
    'route_40',
    'route_41',
    'route_42',
    'route_43',
    'route_44',
    'route_45',
    'route_46',
  ];

  // Kanto locations
  const kantoLocations = [
    'pallet_town',
    'viridian_city',
    'pewter_city',
    'cerulean_city',
    'vermilion_city',
    'lavender_town',
    'celadon_city',
    'fuchsia_city',
    'saffron_city',
    'cinnabar_island',
    'cinnabar_volcano',
    'indigo_plateau',
    'viridian_forest',
    'mt_moon',
    'cerulean_cave',
    'rock_tunnel',
    'power_plant',
    'pokemon_tower',
    'silph_co',
    'safari_zone',
    'seafoam_islands',
    'pokemon_mansion',
    'victory_road',
    'route_1',
    'route_2',
    'route_3',
    'route_4',
    'route_5',
    'route_6',
    'route_7',
    'route_8',
    'route_9',
    'route_10',
    'route_11',
    'route_12',
    'route_13',
    'route_14',
    'route_15',
    'route_16',
    'route_17',
    'route_18',
    'route_19',
    'route_20',
    'route_21',
    'route_22',
    'route_23',
    'route_24',
    'route_25',
    'route_26',
    'route_27',
    'route_28',
  ];

  // Check for exact matches or partial matches
  for (const location of johtoLocations) {
    if (key.includes(location) || location.includes(key)) {
      return 'johto';
    }
  }

  for (const location of kantoLocations) {
    if (key.includes(location) || location.includes(key)) {
      return 'kanto';
    }
  }

  // Route number-based inference
  if (key.includes('route_')) {
    const routeMatch = key.match(/route_(\d+)/);
    if (routeMatch) {
      const routeNum = parseInt(routeMatch[1]);
      if (routeNum >= 29 && routeNum <= 46) return 'johto';
      if (routeNum >= 1 && routeNum <= 28) return 'kanto';
    }
  }

  return 'johto';
}
/**
 * Format move name from ASM format to display format
 */
export function formatMoveName(asmName: string): string {
  // Special cases
  if (asmName === 'PSYCHIC_M') return 'Psychic';

  // Replace underscores with spaces and convert to title case
  return asmName
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Utility functions for text processing and normalization
 */

/**
 * Normalizes text by removing accents and converting to lowercase
 * This allows accent-insensitive search (e.g., "é" matches "e")
 *
 * @param text - The text to normalize
 * @returns Normalized text without accents and in lowercase
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase();
}

/**
 * Performs accent-insensitive substring search
 *
 * @param text - The text to search in
 * @param searchTerm - The search term
 * @returns True if the search term is found (accent-insensitive)
 */
export function accentInsensitiveIncludes(text: string, searchTerm: string): boolean {
  return normalizeText(text).includes(normalizeText(searchTerm));
}

// Helper function to capitalize first letter
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
