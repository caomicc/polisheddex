import { SpriteManifest, SpriteInfo, SpriteVariant, SpriteType } from '@/types/spriteTypes';

let spriteManifest: SpriteManifest | null = null;

/**
 * Load the sprite manifest from the public directory
 */
export async function loadSpriteManifest(): Promise<SpriteManifest | null> {
  if (spriteManifest) {
    return spriteManifest!;
  }

  try {
    const response = await fetch('/sprite_manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load sprite manifest: ${response.statusText}`);
    }
    spriteManifest = await response.json();
    return spriteManifest;
  } catch (error) {
    console.error('Failed to load sprite manifest:', error);
    return {};
  }
}

/**
 * Get sprite information for a specific Pokemon
 */
export function getPokemonSprite(
  manifest: SpriteManifest,
  pokemonName: string,
  variant: SpriteVariant = 'normal',
  type: SpriteType = 'static',
): SpriteInfo | null {
  const normalizedName = pokemonName.toLowerCase().replace(/-/g, '_');
  const pokemonData = manifest[normalizedName];

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
  const normalizedName = pokemonName.toLowerCase().replace(/-/g, '_');
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
 * Get sprite with automatic fallback
 */
export function getSpriteWithFallback(
  manifest: SpriteManifest,
  pokemonName: string,
  variant: SpriteVariant = 'normal',
  type: SpriteType = 'static',
): SpriteInfo {
  const sprite = getPokemonSprite(manifest, pokemonName, variant, type);
  return sprite || getFallbackSprite(pokemonName, variant, type);
}
