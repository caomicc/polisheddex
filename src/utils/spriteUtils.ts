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
): SpriteInfo | null {
  const normalizedName = pokemonName
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\(/g, '_')
    .replace(/\)/g, '')
    .replace(/\s/g, '');

  // Handle both unified and legacy manifests
  const pokemonData =
    'pokemon' in manifest
      ? (manifest.pokemon as Record<string, PokemonSpriteData>)[normalizedName]
      : manifest[normalizedName];

  if (!pokemonData) {
    return null;
  }

  // Determine which sprite to return based on variant and type
  if (variant === 'normal') {
    if (type === 'animated' && pokemonData.normal_animated) {
      return pokemonData.normal_animated;
    }
    return pokemonData.normal_front;
  } else {
    if (type === 'animated' && pokemonData.shiny_animated) {
      return pokemonData.shiny_animated;
    }
    return pokemonData.shiny_front;
  }
}

/**
 * Generate fallback sprite info for Pokemon not in manifest
 */
export function getFallbackSprite(
  pokemonName: string,
  variant: SpriteVariant = 'normal',
  type: SpriteType = 'static',
): SpriteInfo {
  let normalizedName = pokemonName.toLowerCase().replace(/-/g, '_');

  // If this is a form and the form-specific fallback doesn't work, try the base pokemon
  if (normalizedName.includes('_')) {
    const baseName = normalizedName.split('_')[0];
    // Return the base pokemon fallback instead of the form-specific one
    normalizedName = baseName;
  }

  const extension = type === 'animated' ? 'gif' : 'png';
  const filename =
    type === 'animated'
      ? `${variant}_front_animated.${extension}`
      : `${variant}_front.${extension}`;

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

  // const filename = type === 'animated' ? `animated.${extension}` : `static.${extension}`;
  console.log('trainerSpritePath', `/sprites/trainers/${normalizedName}/${normalizedName}.png`);
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
): SpriteInfo | null {
  if (category === 'pokemon') {
    return getSprite(manifest, spriteName, variant as SpriteVariant, type);
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
): SpriteInfo {
  const sprite = getUnifiedSprite(manifest, spriteName, category, variant, type);

  console.log('Unified sprite', sprite, manifest, spriteName, category, variant, type);

  if (sprite) {
    return sprite;
  }

  if (category === 'pokemon') {
    // If sprite not found and name contains form (has underscore), try base pokemon
    if (spriteName.includes('_')) {
      const baseName = spriteName.split('_')[0];
      const baseSprite = getUnifiedSprite(manifest, baseName, category, variant, type);
      if (baseSprite) {
        return baseSprite;
      }
    }
    return getFallbackSprite(spriteName, variant as SpriteVariant, type);
  } else {
    console.log('spriteName', spriteName);
    return getFallbackTrainerSprite(spriteName, type || 'static');
  }
}
