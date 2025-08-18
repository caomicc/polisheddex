/**
 * Utility function to convert item display names to item IDs for linking
 */
export function getItemIdFromDisplayName(displayName: string): string | null {
  if (!displayName || typeof displayName !== 'string') {
    return null;
  }

  // Handle TM/HM/Move Tutor cases: extract "tm50" from "TM50 Leech Life"
  const tmhmMatch = displayName.match(/^(TM|HM|TR|Move Tutor)\s?(\d+)/i);
  if (tmhmMatch) {
    return `${tmhmMatch[1].toLowerCase()}${tmhmMatch[2]}`;
  }

  // Convert display name to a likely item ID format
  // Most items follow the pattern: "Display Name" -> "displayname" (lowercase, no spaces/special chars)
  const normalizedId = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();

  // Handle some special cases that might not follow the standard pattern
  const specialCases: Record<string, string> = {
    pokéball: 'poke',
    pokeball: 'poke',
    greatball: 'great',
    ultraball: 'ultra',
    masterball: 'master',
    safariball: 'safari',
    levelball: 'level',
    lureball: 'lure',
    moonball: 'moon',
    friendball: 'friend',
    loveball: 'love',
    heavyball: 'heavy',
    fastball: 'fast',
    sportball: 'sport',
    // Evolution stones
    thunderstone: 'thunderstone',
    waterstone: 'waterstone',
    firestone: 'firestone',
    leafstone: 'leafstone',
    moonstone: 'moonstone',
    sunstone: 'sunstone',
    duskstone: 'duskstone',
    shinystone: 'shinystone',
    dawnstone: 'dawnstone',
    // Evolution items
    kingsrock: 'kingsrock',
    metalcoat: 'metalcoat',
    dragonscale: 'dragonscale',
    upgrade: 'upgrade',
    dubiousdisc: 'dubiousdisc',
    protector: 'protector',
    electirizer: 'electirizer',
    magmarizer: 'magmarizer',
    reapercloth: 'reapercloth',
    prismscale: 'prismscale',
    whippeddream: 'whippeddream',
    sachet: 'sachet',
    // Other common items
    maxrevive: 'maxrevive',
    fullrestore: 'fullrestore',
    maxpotion: 'maxpotion',
    hyperpotion: 'hyperpotion',
    superpotion: 'superpotion',
    freshwater: 'freshwater',
    sodapop: 'sodapop',
    lemonade: 'lemonade',
    moomoomilk: 'moomoomilk',
    energypowder: 'energypowder',
    energyroot: 'energyroot',
    healpowder: 'healpowder',
    revivalherb: 'revivalherb',
    rarecandy: 'rarecandy',
    ppup: 'ppup',
    ppmax: 'ppmax',
    guardspec: 'guardspec',
    direhit: 'direhit',
    xattack: 'xattack',
    xdefend: 'xdefend',
    xspeed: 'xspeed',
    xspecial: 'xspecial',
    xaccuracy: 'xaccuracy',
  };

  // Check if it's a special case
  if (specialCases[normalizedId]) {
    return specialCases[normalizedId];
  }

  // For most cases, the normalized ID should work
  return normalizedId;
}

/**
 * Helper function to check if an item ID is valid by checking if it exists in the items data
 * This would need the items data to be passed in, or you could load it here
 */
export function isValidItemId(itemId: string, itemsData: Record<string, any>): boolean {
  return itemId in itemsData;
}

/**
 * Get the move name that a TM teaches from the TM item name
 * @param itemName The TM display name (e.g., "TM01 Dynamicpunch")
 * @returns The move name (e.g., "Dynamicpunch") or null if not a TM or move not found
 */
export function getTMMoveFromItemName(itemName: string): string | null {
  if (!itemName || typeof itemName !== 'string') {
    return null;
  }

  // Check if this is a TM/HM/TR/Move Tutor item
  const tmMatch = itemName.match(/^(TM|HM|TR|Move Tutor)\s?(\d+)\s+(.+)$/i);
  if (tmMatch) {
    const moveName = tmMatch[3].trim();
    return moveName;
  }

  return null;
}

/**
 * Check if an item is a TM/HM/TR that should link to a move page
 * @param itemName The item display name
 * @param itemType The item type from location data
 * @returns True if this is a TM-type item that should link to moves
 */
export function isTMItem(itemName: string, itemType?: string): boolean {
  if (itemType === 'tmHm') {
    return true;
  }

  // Also check the name pattern as fallback
  return /^(TM|HM|TR|Move Tutor)\s?\d+/i.test(itemName);
}

/**
 * Convert a move name to a URL-safe format for linking
 * @param moveName The move name (e.g., "Dynamicpunch")
 * @returns URL-safe move name (e.g., "dynamicpunch")
 */
export function getMoveUrlFromName(moveName: string): string {
  return moveName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
}
