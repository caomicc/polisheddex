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
    // Apricorns - now handled as individual items
    redapricorn: 'red-apricorn',
    bluapricorn: 'blu-apricorn',
    whtapricorn: 'wht-apricorn',
    grnapricorn: 'grn-apricorn',
    ylwapricorn: 'ylw-apricorn',
    pnkapricorn: 'pnk-apricorn',
    blkapricorn: 'blk-apricorn',
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
 * @param moveName The move name (e.g., "Dragon Claw", "Fire Punch")
 * @returns URL-safe move name (e.g., "dragon-claw", "fire-punch")
 */
export function getMoveUrlFromName(moveName: string): string {
  return moveName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Convert spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // Keep only alphanumeric characters and hyphens
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Maps specific item names to their shared sprite image file names.
 * Add new mappings here as needed for items that share a sprite.
 */
export const ITEM_SPRITE_MAP: Record<string, string> = {
  quick_powder: 'sand',
  sacred_ash: 'sand',
  metal_powder: 'sand',
  bright_powder: 'sand',
  stardust: 'sand',
  soft_sand: 'sand',
  energy_powder: 'powder',
  heal_powder: 'powder',
  silver_powder: 'powder',
  ice_heal: 'antidote',
  burn_heal: 'antidote',
  paralyze_heal: 'antidote',
  awakening: 'antidote',

  xattack: 'battle_item',
  xdefend: 'battle_item',
  xspeed: 'battle_item',
  xsp_atk: 'battle_item',
  xsp_def: 'battle_item',
  xaccuracy: 'battle_item',
  dire_hit: 'battle_item',
  guard_spec: 'battle_item',

  repel: 'repel',
  super_repel: 'repel',
  max_repel: 'repel',

  ether: 'ether',
  max_ether: 'ether',
  elixir: 'ether',
  max_elixir: 'ether',

  silk_scarf: 'scarf',
  choice_scarf: 'scarf',
  thick_club: 'bone',
  rare_bone: 'bone',

  mental_herb: 'herb',
  power_herb: 'herb',
  white_herb: 'herb',

  silver_leaf: 'leaf',
  gold_leaf: 'leaf',

  surf_mail: 'mail',
  lite_blue_mail: 'mail',
  blue_sky_mail: 'bluesky_mail',

  harsh_lure: 'lure',
  potent_lure: 'lure',
  malign_lure: 'lure',

  potion: 'potion',
  super_potion: 'potion',
  hyper_potion: 'potion',

  ssticket: 's_s_ticket',

  gbcsounds: 'gbc_sounds',

  never_melt_ice: 'nevermeltice',

  hpup: 'hp_up',
  protein: 'vitamin',
  zinc: 'vitamin',
  carbos: 'vitamin',
  calcium: 'vitamin',
  ppmax: 'pp_max',
  ppup: 'pp_up',

  full_restore: 'max_potion',
  poké_doll: 'poke_doll',
  poké_ball: 'poke_ball',

  weak_policy: 'policy',
  blundr_policy: 'policy',

  squirt_bottle: 'squirtbottle',

  ability_patch: 'abilitypatch',
  balm_mushroom: 'balmmushroom',
  black_glasses: 'blackglasses',
  maranga_berry: 'marangaberry',
  metronome: 'metronome_i',
  mystic_ticket: 'mysticticket',
  orange_ticket: 'orangeticket',
  pewter_crunch: 'pewtercrunch',
  portrait_mail: 'portraitmail',
  punchin_glove: 'punchinglove',
  slowpoke_tail: 'slowpoketail',
  tiny_mushroom: 'tinymushroom',
  twisted_spoon: 'twistedspoon',
  thunder_stone: 'thunderstone',

  rage_candy_bar: 'ragecandybar',
  secret_potion: 'secretpotion',
  gsball: 'gs_ball',
  silph_scope2: 'silphscope2',

  // Apricorns - all use the generic apricorn sprite
  red_apricorn: 'apricorn',
  blu_apricorn: 'apricorn',
  wht_apricorn: 'apricorn',
  grn_apricorn: 'apricorn',
  ylw_apricorn: 'apricorn',
  pnk_apricorn: 'apricorn',
  blk_apricorn: 'apricorn',

  // Add more mappings as needed
};

export function getItemSpriteName(itemName: string): string {
  const normalized = itemName.toLowerCase().replace(/ /g, '_');
  return ITEM_SPRITE_MAP[normalized] ?? normalized;
}
