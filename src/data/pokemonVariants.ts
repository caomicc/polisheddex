// Generated from polishedcrystal/constants/pokemon_constants.asm
// This file defines which Pokemon have variants/forms based on the ROM constants

export const POKEMON_VARIANTS = {
  // Unown forms (cosmetic variants)
  UNOWN: [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 
    'exclamation', 'question'
  ],
  
  // Arbok forms (cosmetic variants)
  ARBOK: ['johto', 'kanto', 'koga', 'agatha', 'ariana'],
  
  // Pikachu forms (cosmetic variants)
  PIKACHU: ['plain', 'fly', 'surf', 'red', 'yellow', 'spark'],
  
  // Pichu forms (cosmetic variants)
  PICHU: ['plain', 'spiky-eared'],
  
  // Magikarp forms (cosmetic variants)
  MAGIKARP: [
    'plain', 'skelly', 'calico1', 'calico2', 'calico3', 'two-tone', 'orca', 
    'dapples', 'tiger', 'zebra', 'stripe', 'bubbles', 'diamonds', 'patches', 
    'forehead1', 'mask1', 'forehead2', 'mask2', 'saucy', 'raindrop'
  ],
  
  // Gyarados forms (variant forms)
  GYARADOS: ['plain', 'red'],
  
  // Mewtwo forms (variant forms)
  MEWTWO: ['plain', 'armored'],
  
  // Dudunsparce forms (variant forms)
  DUDUNSPARCE: ['two-segment', 'three-segment'],
  
  // Alolan forms (variant forms)
  RATTATA: ['plain', 'alolan'],
  RATICATE: ['plain', 'alolan'],
  RAICHU: ['plain', 'alolan'],
  SANDSHREW: ['plain', 'alolan'],
  SANDSLASH: ['plain', 'alolan'],
  VULPIX: ['plain', 'alolan'],
  NINETALES: ['plain', 'alolan'],
  DIGLETT: ['plain', 'alolan'],
  DUGTRIO: ['plain', 'alolan'],
  MEOWTH: ['plain', 'alolan', 'galarian'],
  PERSIAN: ['plain', 'alolan'],
  GEODUDE: ['plain', 'alolan'],
  GRAVELER: ['plain', 'alolan'],
  GOLEM: ['plain', 'alolan'],
  GRIMER: ['plain', 'alolan'],
  MUK: ['plain', 'alolan'],
  EXEGGUTOR: ['plain', 'alolan'],
  MAROWAK: ['plain', 'alolan'],
  
  // Galarian forms (variant forms)
  PONYTA: ['plain', 'galarian'],
  RAPIDASH: ['plain', 'galarian'],
  SLOWPOKE: ['plain', 'galarian'],
  SLOWBRO: ['plain', 'galarian'],
  FARFETCHD: ['plain', 'galarian'],
  WEEZING: ['plain', 'galarian'],
  MR_MIME: ['plain', 'galarian'],
  ARTICUNO: ['plain', 'galarian'],
  ZAPDOS: ['plain', 'galarian'],
  MOLTRES: ['plain', 'galarian'],
  SLOWKING: ['plain', 'galarian'],
  CORSOLA: ['plain', 'galarian'],
  
  // Hisuian forms (variant forms)
  GROWLITHE: ['plain', 'hisuian'],
  ARCANINE: ['plain', 'hisuian'],
  VOLTORB: ['plain', 'hisuian'],
  ELECTRODE: ['plain', 'hisuian'],
  TYPHLOSION: ['plain', 'hisuian'],
  QWILFISH: ['plain', 'hisuian'],
  SNEASEL: ['plain', 'hisuian'],
  
  // Paldean forms (variant forms)
  WOOPER: ['plain', 'paldean'],
  TAUROS: ['plain', 'paldean-fire', 'paldean-water'],
  
  // Ursaluna forms (variant forms)
  URSALUNA: ['plain', 'bloodmoon'],
} as const;

// Helper function to check if a Pokemon has variants
export function hasVariants(pokemonName: string): boolean {
  const normalizedName = pokemonName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return normalizedName in POKEMON_VARIANTS;
}

// Helper function to get all variants for a Pokemon
export function getVariants(pokemonName: string): readonly string[] {
  const normalizedName = pokemonName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return POKEMON_VARIANTS[normalizedName as keyof typeof POKEMON_VARIANTS] || ['plain'];
}

// Helper function to check if a specific variant exists
export function hasVariant(pokemonName: string, variantName: string): boolean {
  const variants = getVariants(pokemonName);
  return variants.includes(variantName.toLowerCase());
}

// Map of Pokemon names to their normalized constant names
export const POKEMON_NAME_MAP: Record<string, string> = {
  'mr-mime': 'MR_MIME',
  'farfetch-d': 'FARFETCHD',
  'farfetchd': 'FARFETCHD',
  // Add more mappings as needed
};

// Helper function to normalize Pokemon names for constant lookup
export function normalizePokemonNameForConstants(pokemonName: string): string {
  const name = pokemonName.toLowerCase();
  
  // Check for special mappings first
  if (POKEMON_NAME_MAP[name]) {
    return POKEMON_NAME_MAP[name];
  }
  
  // Default normalization
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}