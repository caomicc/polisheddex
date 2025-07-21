/**
 * Normalize location names to consistent snake_case keys
 * This ensures all data sources (Pokemon locations, comprehensive locations, etc.) use the same keys
 */
export function normalizeLocationKey(input: string): string {
  return input
    // Convert CamelCase/PascalCase to snake_case first
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    // Convert spaces, hyphens, and other separators to underscores
    .replace(/[\s\-\.]+/g, '_')
    // Handle basement floor patterns: "b_1_f" -> "b_1f"
    .replace(/_b_(\d+)_f(_|$)/g, '_b_$1f$2')
    // Handle regular floor patterns: "tower_1_f" -> "tower_1f"
    .replace(/(\w)_?(\d+)_+f(_|$)/gi, '$1_$2f$3')
    // Pattern for standalone numbers that should be floors - but NOT for routes
    // Only add "f" to numbers that are likely floors (between words that suggest buildings/areas)
    .replace(/(tower|building|floor|level|gym|center|house|cave|tunnel|path|mansion)_(\d+)(_|$)/gi, '$1_$2f$3')
    .replace(/(\w)_(\d+)_(\w+)_side(_|$)/gi, '$1_$2f_$3_side$4') // Handle "ice_path_2_blackthorn_side" -> "ice_path_2f_blackthorn_side"
    // Clean up multiple underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');
}
