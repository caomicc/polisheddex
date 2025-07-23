/**
 * Utility function to convert item display names to item IDs for linking
 */
export function getItemIdFromDisplayName(displayName: string): string | null {
  if (!displayName || typeof displayName !== 'string') {
    return null;
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
