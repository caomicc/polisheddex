import type { EvoRaw } from "../types/types.ts";

// Define all known Pokémon form types in one place for consistency
export const KNOWN_FORMS = {
  ALOLAN: 'alolan',
  GALARIAN: 'galarian',
  HISUIAN: 'hisuian',
  GALAR: 'galar',
  HISUI: 'hisui',
  PLAIN: 'plain',
  RED: 'red',
  ARMORED: 'armored',
  BLOODMOON: 'bloodmoon',
  PALDEAN: 'paldean',
  PALDEAN_FIRE: 'paldean_fire',
  PALDEAN_WATER: 'paldean_water'
};

// Debug flag for tracking Pokémon type processing
export const DEBUG_POKEMON = ['Growlithe', 'Raichu', 'Arcanine', 'Diglett', 'Dugtrio', 'Meowth', 'Persian', 'Exeggutor', 'Marowak', 'Slowbro', 'Slowking', 'Qwilfish', 'Dudunsparce'];

export const typeMap: Record<string, string[]> = {};

export const formTypeMap: Record<string, Record<string, string[]>> = {};


export const evoMap: Record<string, EvoRaw[]> = {};
export const preEvoMap: Record<string, string[]> = {};
