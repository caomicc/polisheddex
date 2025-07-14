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
    // 'Ho Oh': 'Ho-Oh', // Special case for Ho-Oh
    // 'Hooh': 'Ho-Oh', // Another variant for Ho-Oh
    // 'HoOh': 'Ho-Oh', // Another variant for Ho-Oh
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
