/**
 * Client-side function to format a normalized location key into a display name
 * This creates reasonable display names without requiring file system access
 * @param normalizedKey - The normalized location key (e.g., "union_cave_b_1f_south")
 * @returns A formatted display name (e.g., "Union Cave B1F South")
 */
export function getLocationDisplayName(normalizedKey: string): string {
  if (!normalizedKey) return 'Unknown Location';

  return (
    normalizedKey
      .split('_')
      .map((word) => {
        // Handle special cases
        if (word === 'b') return 'B';
        if (word.match(/^\d+f$/)) return word.toUpperCase(); // 1f -> 1F
        if (word.match(/^b\d+f$/)) return word.toUpperCase(); // b1f -> B1F
        // Handle route numbers
        if (word === 'route') return 'Route';
        // Capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      // Fix spacing issues with basement floors: "B 1F" -> "B1F"
      .replace(/\bB (\d+F)\b/g, 'B$1')
  );
}

// --- Normalize Location Key ---
/**
 * Normalize location names to consistent snake_case keys
 * This ensures all data sources (Pokemon locations, comprehensive locations, etc.) use the same keys
 */
export function normalizeLocationKey(input: string): string {
  console.log(`Normalizing location key: ${input}`);
  const normalizedKey = input
    // Convert CamelCase/PascalCase to snake_case first
    // Handle sequences like "B1FSouth" -> "B1_F_South"
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
    // Handle specific word replacements
    .replace(/pokecenter/g, 'poke_center')
    // Handle route numbers specifically: "route30" -> "route_30"
    .replace(/^route(\d+)(_|$)/g, 'route_$1$2')
    // Convert spaces, hyphens, and other separators to underscores
    .replace(/[\s\-\.]+/g, '_')
    // Handle basement floor patterns: "b_1_f" -> "b_1f"
    .replace(/_b(\d+)_f(?=_|$)/g, '_b_$1f')
    // Handle regular floor patterns: "tower_1_f" -> "tower_1f"
    .replace(/(\w)_?(\d+)_+f(_|$)/gi, '$1_$2f$3')
    // Ensure room/floor numbers have consistent underscore separation
    .replace(/(room)(\d+)(_|$)/gi, '$1_$2$3')
    // Pattern for standalone numbers that should be floors - but NOT for routes
    // Only add "f" to numbers that are likely floors (between words that suggest buildings/areas)
    .replace(
      /(tower|building|floor|level|gym|center|house|cave|tunnel|path|mansion)_(\d+)(_|$)/gi,
      '$1_$2f$3',
    )
    .replace(/(\w)_(\d+)_(\w+)_side(_|$)/gi, '$1_$2f_$3_side$4') // Handle "ice_path_2_blackthorn_side" -> "ice_path_2f_blackthorn_side"
    // Clean up multiple underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  console.log(`Normalized location key: ${normalizedKey}`);
  return normalizedKey;
}

console.log('🌍 Normalized location key function ready');

// // Helper function to convert method names to more user-friendly format
// export function formatMethod(method: string): string {
//   if (method === 'grass') return 'Wild Grass';
//   if (method === 'surf') return 'Surfing';
//   if (method === 'fish') return 'Fishing';
//   if (method === 'rock_smash') return 'Rock Smash';
//   if (method === 'headbutt') return 'Headbutt';
//   if (method === 'gift') return 'Gift Pokémon';
//   if (method === 'event') return 'Event Pokémon';
//   if (method === 'egg') return 'Egg';
//   if (method === 'trade') return 'Trade';
//   if (method === 'special') return 'Special Encounter';
//   if (method === 'roaming') return 'Roaming Pokémon';
//   if (method === 'swarm') return 'Swarm Encounter';
//   if (method === 'honey_tree') return 'Honey Tree';
//   if (method === 'rock') return 'Rock';
//   if (method === 'cave') return 'Cave Encounter';
//   if (method === 'hidden') return 'Hidden Pokémon';
//   if (method === 'hidden_grotto') return 'Hidden Grotto';
//   if (method === 'unknown') return 'Special Encounter';
//   return method.charAt(0).toUpperCase() + method.slice(1);
// }

// // Helper function to format time of day
// export function formatTime(time: string): string {
//   if (time === 'morn') return 'Morning';
//   if (time === 'day') return 'Day';
//   if (time === 'nite') return 'Night';
//   if (time === 'eve') return 'Evening';
//   if (time === 'any') return 'Any Time';
//   // Hidden grotto rarities
//   if (time === 'common') return 'Common';
//   if (time === 'uncommon') return 'Uncommon';
//   if (time === 'rare') return 'Rare';
//   return time.charAt(0).toUpperCase() + time.slice(1);
// }
