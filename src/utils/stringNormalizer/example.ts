import { normalizeMoveString, runNormalizerTests } from './stringNormalizer';

/**
 * Example usage of the string normalizer
 */

// Run the test suite to verify all test cases
runNormalizerTests();

// Example of practical usage
const moveVariants = [
  'THUNDERSHOCK',
  'ThunderShock',
  'ThundershockDescription',
  'BattleAnim_ThunderShock',
  'Sfx_Thundershock'
];

console.log('\nPractical usage example:');
console.log('------------------------');

// Normalize a set of move variants
const normalizedMoves = moveVariants.map(move => {
  const normalized = normalizeMoveString(move);
  console.log(`"${move}" → "${normalized}"`);
  return normalized;
});

// Check if all variants normalize to the same string
const allMatch = normalizedMoves.every(move => move === normalizedMoves[0]);
console.log(`\nAll variants normalize to the same string: ${allMatch ? 'Yes ✅' : 'No ❌'}`);

// Example with move conflict resolution
const conflictingMoves = [
  'Slash',
  'SLASH',
  'SlashDescription',
  'Night Slash',
  'NIGHT_SLASH',
  'NightSlashDescription'
];

console.log('\nConflict resolution example:');
console.log('---------------------------');

conflictingMoves.forEach(move => {
  console.log(`"${move}" → "${normalizeMoveString(move)}"`);
});

// Example of using the normalizer in a mapping function
interface MoveData {
  power: number;
  type: string;
  hits?: string;
  recoil?: boolean;
}

const moveMap = new Map<string, MoveData>();

// Add some move data with various string formats
// Note that with Capital Case, we should use "Thunder Shock" as the key
moveMap.set(normalizeMoveString('THUNDERSHOCK'), { power: 40, type: 'Electric' });
moveMap.set(normalizeMoveString('DOUBLE_SLAP'), { power: 15, type: 'Normal', hits: '2-5' });
moveMap.set(normalizeMoveString('Wild Charge'), { power: 90, type: 'Electric', recoil: true });

console.log('\nUsing normalized strings as Map keys:');
console.log('----------------------------------');

// Now we can look up moves with any variant, all will be normalized to "Thunder Shock" format
console.log(`ThunderShock data:`, moveMap.get(normalizeMoveString('ThunderShock')));
console.log(`DoubleSlap data:`, moveMap.get(normalizeMoveString('DoubleSlapDescription')));
console.log(`WILD_CHARGE data:`, moveMap.get(normalizeMoveString('WildChargeDescription')));
