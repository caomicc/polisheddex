import {
  SpriteManifest,
  SpriteInfo,
  SpriteVariant,
  SpriteType,
  TrainerManifest,
  PokemonSpriteData,
  TrainerSpriteData,
  UnifiedSpriteManifest,
  SpriteCategory,
} from '@/types/spriteTypes';

// Known form suffixes that should be preserved with underscores
const FORM_SUFFIXES = [
  '_alolan',
  '_galarian',
  '_hisuian',
  '_paldean',
  '_paldean_fire',
  '_paldean_water',
  '_paldeanfire', // Reduced form - will be mapped
  '_paldeanwater', // Reduced form - will be mapped
  '_mega',
  '_mega_x',
  '_mega_y',
  '_gmax',
  '_primal',
  '_origin',
  '_sky',
  '_therian',
  '_black',
  '_white',
  '_attack',
  '_defense',
  '_speed',
  '_plant',
  '_sandy',
  '_trash',
  '_heat',
  '_wash',
  '_frost',
  '_fan',
  '_mow',
  '_zen',
  '_pirouette',
  '_blade',
  '_shield',
  '_10',
  '_50',
  '_complete',
  '_school',
  '_meteor',
  '_dusk',
  '_midnight',
  '_dawn',
  '_dusk_mane',
  '_dawn_wings',
  '_ultra',
  '_crowned',
  '_eternamax',
  '_ice',
  '_shadow',
  '_single_strike',
  '_rapid_strike',
  '_bloodmoon',
  '_hero',
  '_wellspring',
  '_hearthflame',
  '_cornerstone',
  '_terastal',
  '_stellar',
  '_red',
  '_yellow',
  '_green',
  '_blue',
  '_orange',
  '_purple',
  '_pink',
  '_two_segment',
  '_three_segment',
  '_johto',
  '_kanto',
  '_agatha',
  '_ariana',
  '_koga',
  // Pikachu/Pichu specific forms
  '_fly',
  '_surf',
  '_spark',
  '_spikyeared',
  '_spiky',
];

// Map reduced form names to their folder-friendly versions
const FORM_SUFFIX_MAP: Record<string, string> = {
  _paldeanfire: '_paldean_fire',
  _paldeanwater: '_paldean_water',
  _spikyeared: '_spikyeared',
};

/**
 * Normalize a Pokemon name for sprite lookup.
 * Reduces the base name (removes special chars, underscores) but preserves form suffixes.
 * Examples:
 *   - "Ho-Oh" -> "hooh"
 *   - "Mr. Mime" -> "mrmime"
 *   - "ninetales_alolan" -> "ninetales_alolan"
 *   - "Mr. Mime_galarian" -> "mrmime_galarian"
 *   - "tauros_paldeanfire" -> "tauros_paldean_fire"
 */
function normalizePokemonName(name: string): string {
  const nameLower = name.toLowerCase();

  // Check for form suffixes (longest first to handle _paldean_fire before _paldean)
  const sortedSuffixes = [...FORM_SUFFIXES].sort((a, b) => b.length - a.length);

  for (const suffix of sortedSuffixes) {
    if (nameLower.endsWith(suffix)) {
      const baseName = nameLower.slice(0, -suffix.length);
      // Reduce the base name (remove special chars including underscores)
      const reducedBase = baseName
        .replace(/\s/g, '')
        .replace(/-/g, '')
        .replace(/_/g, '')
        .replace(/'/g, '')
        .replace(/\./g, '')
        .replace(/♂/g, 'm')
        .replace(/♀/g, 'f')
        .replace(/é/g, 'e');
      // Map reduced form names to folder-friendly versions
      const mappedSuffix = FORM_SUFFIX_MAP[suffix] || suffix;
      return `${reducedBase}${mappedSuffix}`;
    }
  }

  // No form suffix, reduce the whole name
  return nameLower
    .replace(/\s/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')
    .replace(/'/g, '')
    .replace(/\./g, '')
    .replace(/♂/g, 'm')
    .replace(/♀/g, 'f')
    .replace(/é/g, 'e');
}

let unifiedManifest: UnifiedSpriteManifest | null = null;

/**
 * Load the unified sprite manifest from the public directory
 */
export async function loadUnifiedSpriteManifest(): Promise<UnifiedSpriteManifest | null> {
  if (unifiedManifest) {
    return unifiedManifest;
  }

  try {
    const response = await fetch('/sprite_manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load sprite manifest: ${response.statusText}`);
    }
    unifiedManifest = await response.json();
    return unifiedManifest;
  } catch (error) {
    console.error('Failed to load sprite manifest:', error);
    return null;
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function loadSpriteManifest(): Promise<SpriteManifest | null> {
  const unified = await loadUnifiedSpriteManifest();
  return unified?.pokemon || null;
}

/**
 * Get sprite information for a specific Pokemon from unified manifest
 */
export function getSprite(
  manifest: UnifiedSpriteManifest | SpriteManifest,
  pokemonName: string,
  variant: SpriteVariant = 'normal',
  type: SpriteType = 'static',
  facing: 'front' | 'back' = 'front',
): SpriteInfo | null {
  // Normalize Pokemon names: reduce base name but preserve form suffixes
  const normalizedName = normalizePokemonName(pokemonName);

  // Handle both unified and legacy manifests
  const pokemonData =
    'pokemon' in manifest
      ? (manifest.pokemon as Record<string, PokemonSpriteData>)[normalizedName]
      : manifest[normalizedName];

  if (!pokemonData) {
    return null;
  }

  // Back sprites don't have animation frames in GBC Pokemon games
  // Always use static for back sprites
  const effectiveType = facing === 'back' ? 'static' : type;

  // Build the key based on variant, facing, and type
  // Format: {variant}_{facing} or {variant}_{facing}_animated (front only)
  const animatedSuffix = effectiveType === 'animated' ? '_animated' : '';
  const key = `${variant}_${facing}${animatedSuffix}` as keyof PokemonSpriteData;

  return pokemonData[key] || null;
}

/**
 * Generate fallback sprite info for Pokemon not in manifest
 */
export function getFallbackSprite(
  pokemonName: string,
  variant: SpriteVariant = 'normal',
  type: SpriteType = 'static',
  facing: 'front' | 'back' = 'front',
): SpriteInfo {
  // Normalize Pokemon names: reduce base name but preserve form suffixes
  const normalizedName = normalizePokemonName(pokemonName);

  // Back sprites don't have animation frames in GBC Pokemon games
  const effectiveType = facing === 'back' ? 'static' : type;

  const extension = effectiveType === 'animated' ? 'gif' : 'png';
  const filename =
    effectiveType === 'animated'
      ? `${variant}_${facing}_animated.${extension}`
      : `${variant}_${facing}.${extension}`;

  return {
    url: `/sprites/pokemon/${normalizedName}/${filename}`,
    width: 64, // fallback dimensions
    height: 64,
  };
}

/**
 * Get sprite with automatic fallback, including form-based fallback
 */
export function getSpriteWithFallback(
  manifest: UnifiedSpriteManifest | SpriteManifest,
  spriteName: string,
  variant: SpriteVariant = 'normal',
  type: SpriteType = 'static',
): SpriteInfo {
  const sprite = getSprite(manifest, spriteName, variant, type);

  if (sprite) {
    return sprite;
  }

  // If sprite not found and name contains form (has underscore), try base pokemon
  if (spriteName.includes('_')) {
    const baseName = spriteName.split('_')[0];
    const baseSprite = getSprite(manifest, baseName, variant, type);
    if (baseSprite) {
      return baseSprite;
    }
  }

  return getFallbackSprite(spriteName, variant, type);
}

/**
 * Get trainer sprite information from unified manifest
 */
export function getTrainerSprite(
  manifest: UnifiedSpriteManifest | TrainerManifest,
  trainerName: string,
  variant?: string,
): SpriteInfo | null {
  const normalizedName = trainerName.toLowerCase().replace(/-/g, '_');

  // Handle both unified and legacy manifests
  const trainerData =
    'trainers' in manifest ? manifest.trainers[normalizedName] : manifest[normalizedName];

  if (!trainerData) {
    return null;
  }

  // If variant is specified, try to get that specific variant
  if (variant) {
    const variantKey = variant.toLowerCase().replace(/-/g, '_');
    if (typeof trainerData === 'object' && trainerData !== null) {
      return (trainerData as TrainerSpriteData)[variantKey] as SpriteInfo;
    }
    return null;
  }

  // Return the first available sprite if no variant specified
  const firstKey = Object.keys(trainerData)[0];
  if (firstKey && typeof trainerData === 'object' && trainerData !== null) {
    return (trainerData as TrainerSpriteData)[firstKey] || null;
  }
  return null;
}

/**
 * Generate fallback sprite info for trainers not in manifest
 */
export function getFallbackTrainerSprite(
  trainerName: string,
  type: SpriteType = 'static',
): SpriteInfo {
  let normalizedName = trainerName.toLowerCase().replace(/-/g, '_');

  // special mapping: handle known trainer name variants
  switch (normalizedName) {
    case 'cooltrainerm':
      normalizedName = 'cooltrainer_m';
      break;
    case 'cooltrainerf':
      normalizedName = 'cooltrainer_f';
      break;
    case 'swimmerm':
      normalizedName = 'swimmer_m';
      break;
    case 'swimmerf':
      normalizedName = 'swimmer_f';
      break;
    case 'teacherm':
      normalizedName = 'teacher_m';
      break;
    case 'teacherf':
      normalizedName = 'teacher_f';
      break;
    case 'veteranm':
      normalizedName = 'veteran_m';
      break;
    case 'veteranf':
      normalizedName = 'veteran_f';
      break;
    case 'sightseerm':
      normalizedName = 'sightseer_m';
      break;
    case 'sightseerf':
      normalizedName = 'sightseer_f';
      break;
    case 'pokefanm':
      normalizedName = 'pokefan_m';
      break;
    case 'pokefanf':
      normalizedName = 'pokefan_f';
      break;
    case 'officerm':
      normalizedName = 'officer_m';
      break;
    case 'officerf':
      normalizedName = 'officer_f';
      break;
    case 'guitaristm':
      normalizedName = 'guitarist_m';
      break;
    case 'guitaristf':
      normalizedName = 'guitarist_f';
      break;
    case 'gruntm':
      normalizedName = 'grunt_m';
      break;
    case 'gruntf':
      normalizedName = 'grunt_f';
      break;
    case 'psychict':
      normalizedName = 'psychic_m';
      break;
    case 'blackbeltt':
      normalizedName = 'blackbelt_t';
      break;
    case 'rocket_scientist':
      normalizedName = 'scientist';
    case 'prof_elm':
      normalizedName = 'elm';
      break;
    case 'prof_oak':
      normalizedName = 'oak';
      break;
    default:
      break;
  }

  return {
    url: `/sprites/trainers/${normalizedName}/${normalizedName}.png`,
    width: 64, // fallback dimensions
    height: 64,
  };
}

/**
 * Get trainer sprite with automatic fallback
 */
export function getTrainerSpriteWithFallback(
  manifest: UnifiedSpriteManifest | TrainerManifest,
  trainerName: string,
  variant?: string,
): SpriteInfo {
  const sprite = getTrainerSprite(manifest, trainerName, variant);
  return sprite || getFallbackTrainerSprite(trainerName, 'static');
}

/**
 * Get sprite information for any category (pokemon or trainer)
 */
export function getUnifiedSprite(
  manifest: UnifiedSpriteManifest,
  spriteName: string,
  category: SpriteCategory,
  variant?: SpriteVariant | string,
  type?: SpriteType,
  facing?: 'front' | 'back',
): SpriteInfo | null {
  if (category === 'pokemon') {
    return getSprite(manifest, spriteName, variant as SpriteVariant, type, facing);
  } else {
    return getTrainerSprite(manifest, spriteName, variant as string);
  }
}

/**
 * Get sprite with fallback for any category, including form-based fallback for Pokemon
 */
export function getUnifiedSpriteWithFallback(
  manifest: UnifiedSpriteManifest,
  spriteName: string,
  category: SpriteCategory,
  variant?: SpriteVariant | string,
  type?: SpriteType,
  facing?: 'front' | 'back',
): SpriteInfo {
  const sprite = getUnifiedSprite(manifest, spriteName, category, variant, type, facing);

  if (sprite) {
    return sprite;
  }

  if (category === 'pokemon') {
    // If sprite not found and name contains form (has underscore), try base pokemon
    if (spriteName.includes('_')) {
      const baseName = spriteName.split('_')[0];
      const baseSprite = getUnifiedSprite(manifest, baseName, category, variant, type, facing);
      if (baseSprite) {
        return baseSprite;
      }
    }
    return getFallbackSprite(spriteName, variant as SpriteVariant, type, facing);
  } else {
    return getFallbackTrainerSprite(spriteName, type || 'static');
  }
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
  rarebone: 'bone',

  mental_herb: 'herb',
  power_herb: 'herb',
  white_herb: 'herb',

  silver_leaf: 'leaf',
  gold_leaf: 'leaf',
  silverleaf: 'leaf',
  goldleaf: 'leaf',

  surf_mail: 'mail',
  lite_blue_mail: 'mail',
  blue_sky_mail: 'bluesky_mail',

  harsh_lure: 'lure',
  potent_lure: 'lure',
  malign_lure: 'lure',

  potion: 'potion',
  super_potion: 'potion',
  superpotion: 'potion',
  hyper_potion: 'potion',
  hyperpotion: 'potion',

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
  iron: 'vitamin',

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
  // Apricorns without underscores (as stored in location data)
  redapricorn: 'apricorn',
  bluapricorn: 'apricorn',
  whtapricorn: 'apricorn',
  grnapricorn: 'apricorn',
  ylwapricorn: 'apricorn',
  pnkapricorn: 'apricorn',
  blkapricorn: 'apricorn',

  // Add more mappings as needed
};

export function getItemSpriteName(itemName: string): string {
  const normalized = itemName.toLowerCase().replace(/ /g, '_');
  return ITEM_SPRITE_MAP[normalized] ?? normalized;
}
