export interface SpriteInfo {
  url: string;
  width: number;
  height: number;
}

export interface PokemonSpriteData {
  normal_front: SpriteInfo | null;
  shiny_front: SpriteInfo | null;
  normal_animated: SpriteInfo | null;
  shiny_animated: SpriteInfo | null;
}

export interface TrainerSpriteData {
  [variantKey: string]: SpriteInfo;
}

// Unified sprite manifest structure
export interface UnifiedSpriteManifest {
  pokemon: Record<string, PokemonSpriteData>;
  trainers: Record<string, TrainerSpriteData>;
}

// Legacy types for backward compatibility
export interface SpriteManifest {
  [pokemonName: string]: PokemonSpriteData;
}

export interface TrainerManifest {
  [trainerName: string]: TrainerSpriteData;
}

export type SpriteVariant = 'normal' | 'shiny';
export type SpriteType = 'static' | 'animated';
export type SpriteCategory = 'pokemon' | 'trainer';
