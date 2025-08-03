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

export interface SpriteManifest {
  [pokemonName: string]: PokemonSpriteData;
}

export type SpriteVariant = 'normal' | 'shiny';
export type SpriteType = 'static' | 'animated';