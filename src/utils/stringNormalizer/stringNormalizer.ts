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
    'NIGHT_SLASH': 'Night Slash',
    'SLASH': 'Slash',
    'NightSlashDescription': 'Night Slash',
    'SlashDescription': 'Slash',
    'Ho-Oh': 'Ho-Oh', // Special case for Ho-Oh
    'Ho Oh': 'Ho-Oh', // Special case for Ho-Oh
    'Hooh': 'Ho-Oh', // Another variant for Ho-Oh
    'HoOh': 'Ho-Oh', // Another variant for Ho-Oh
    'HOOH': 'Ho-Oh', // Uppercase variant
    'ho oh': 'Ho-Oh', // Lowercase with space
    'ho-oh': 'Ho-Oh', // Lowercase with hyphen
    'ho_oh': 'Ho-Oh', // Special case for file name format
    'HO_OH': 'Ho-Oh', // Special case for ASM constant format
    'Porygon-Z': 'Porygon-Z', // Special case for Porygon-Z
    'Porygon Z': 'Porygon-Z', // Special case for Porygon-Z
    'PorygonZ': 'Porygon-Z', // Another variant for Porygon-Z
    'PORYGON-Z': 'Porygon-Z', // Uppercase variant
    'porygon-z': 'Porygon-Z', // Lowercase with hyphen
    'porygon z': 'Porygon-Z', // Lowercase with space
    'porygon_z': 'Porygon-Z', // Special case for file name format
    'PORYGON_Z': 'Porygon-Z', // Special case for ASM constant format
    'Mr. Mime': 'Mr-Mime', // Special case for Mr. Mime
    'Mr Mime': 'Mr-Mime', // Special case for Mr. Mime
    'MR. MIME': 'Mr-Mime', // Uppercase variant
    'mr. mime': 'Mr-Mime', // Lowercase with space
    'mr mime': 'Mr-Mime', // Lowercase with space
    'mr_mime': 'Mr-Mime', // Special case for file name format
    'MR_MIME': 'Mr-Mime', // Special case for ASM constant format
    'MrMime': 'Mr-Mime', // CamelCase variant

    'Mime Jr.': 'Mime-Jr', // Special case for Mime Jr.
    'Mime Jr': 'Mime-Jr', // Special case for Mime Jr.
    'MIME JR.': 'Mime-Jr', // Uppercase variant
    'mime jr.': 'Mime-Jr', // Lowercase with space
    'mime jr': 'Mime-Jr', // Lowercase with space
    'mime_jr': 'Mime-Jr', // Special case for file name format
    'MIME_JR': 'Mime-Jr', // Special case for ASM constant format
    'MimeJr': 'Mime-Jr', // CamelCase variant


    // Nidoran♀ special cases
    'nidoran F': 'Nidoran-F',
    'Nidoran F': 'Nidoran-F',
    'Nidoran♀': 'Nidoran-F',
    'Nidoran♀Description': 'Nidoran-F',
    'NIDORAN♀': 'Nidoran-F',
    'nidoran♀': 'Nidoran-F',
    'Nidoran-F': 'Nidoran-F',
    'NIDORAN_F': 'Nidoran-F',
    'nidoran_f': 'Nidoran-F',
    'NidoranF': 'Nidoran-F',
    'NIDORANF': 'Nidoran-F',
    'nidoranf': 'Nidoran-F',


    'nidoran M': 'Nidoran-M',
    'Nidoran M': 'Nidoran-M',
    'Nidoran♂': 'Nidoran-M',
    'Nidoran♂Description': 'Nidoran-M',
    'NIDORAN♂': 'Nidoran-M',
    'nidoran♂': 'Nidoran-M',
    'Nidoran-M': 'Nidoran-M',
    'NIDORAN_M': 'Nidoran-M',
    'nidoran_m': 'Nidoran-M',
    'NidoranM': 'Nidoran-M',
    'NIDORANM': 'Nidoran-M',
    'nidoranm': 'Nidoran-M',

    'Farfetch\'d': 'Farfetch-d', // Special case for Farfetch'd
    'Farfetch D': 'Farfetch-d', // Special case for Farfetch'd
    'FARFETCH\'D': 'Farfetch-d', // Uppercase variant
    'farfetch\'d': 'Farfetch-d', // Lowercase with apostrophe
    'farfetch d': 'Farfetch-d', // Lowercase with space
    'farfetch_d': 'Farfetch-d', // Special case for file name format
    'FARFETCH_D': 'Farfetch-d', // Special case for ASM constant format
    'Farfetchd': 'Farfetch-d', // CamelCase variant
    'FarfetchdDescription': 'Farfetch-d', // Description variant
    'FarfetchD': 'Farfetch-d', // Another variant for Farfetch'd

    'Sirfetch\'d': 'Sirfetch-d', // Special case for Sirfetch'd
    'Sirfetch D': 'Sirfetch-d', // Special case for Sirfetch'd
    'SIRFETCH\'D': 'Sirfetch-d', // Uppercase variant
    'sirfetch\'d': 'Sirfetch-d', // Lowercase with apostrophe
    'sirfetch d': 'Sirfetch-d', // Lowercase with space
    'sirfetch_d': 'Sirfetch-d', // Special case for file name format
    'SIRFETCH_D': 'Sirfetch-d', // Special case for ASM constant format
    'Sirfetchd': 'Sirfetch-d', // CamelCase variant
    'SirfetchdDescription': 'Sirfetch-d', // Description variant
    'SirfetchD': 'Sirfetch-d', // Another variant for Sirfetch'd
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
  else if (!normalized.includes('_') &&
    normalized !== normalized.toUpperCase()) {
    // Insert space before capital letters to split into words
    const withSpaces = normalized.replace(/([A-Z])/g, ' $1').trim();
    words = withSpaces.toLowerCase().split(' ').filter(word => word.length > 0);
  }
  // Handle ALL_CAPS without underscores
  else if (normalized === normalized.toUpperCase() && !normalized.includes('_')) {
    words = [normalized.toLowerCase()];
  }

  // Convert to Capital Case (first letter of each word capitalized)
  normalized = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
