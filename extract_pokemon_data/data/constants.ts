/**
 * Constants and mapping utilities for Pokémon data extraction
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../');

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

// Output file paths
export const OUTPUT_PATHS = {
  MOVE_DESCRIPTIONS: path.join(ROOT_DIR, 'pokemon_move_descriptions.json'),
  EGG_MOVES: path.join(ROOT_DIR, 'pokemon_egg_moves.json'),
  BASE_DATA: path.join(ROOT_DIR, 'pokemon_base_data.json'),
  EVOLUTION: path.join(ROOT_DIR, 'pokemon_evolution_data.json'),
  LEVEL_MOVES: path.join(ROOT_DIR, 'pokemon_level_moves.json'),
  LOCATIONS: path.join(ROOT_DIR, 'pokemon_locations.json'),
  POKEDEX_ENTRIES: path.join(ROOT_DIR, 'pokemon_pokedex_entries.json'),
  DETAILED_STATS: path.join(ROOT_DIR, 'pokemon_detailed_stats.json'),
  ABILITY_DESCRIPTIONS: path.join(ROOT_DIR, 'pokemon_ability_descriptions.json')
};

// Type mapping constants
export const TYPE_ENUM_TO_NAME: Record<string, string> = {
  'NORMAL': 'Normal',
  'FIGHTING': 'Fighting',
  'FLYING': 'Flying',
  'POISON': 'Poison',
  'GROUND': 'Ground',
  'ROCK': 'Rock',
  'BUG': 'Bug',
  'GHOST': 'Ghost',
  'STEEL': 'Steel',
  'FIRE': 'Fire',
  'WATER': 'Water',
  'GRASS': 'Grass',
  'ELECTRIC': 'Electric',
  'PSYCHIC': 'Psychic',
  'ICE': 'Ice',
  'DRAGON': 'Dragon',
  'DARK': 'Dark',
  'FAIRY': 'Fairy',
  'SHADOW': 'Shadow',
  'NONE': 'None',
  'UNKNOWN_T': 'Unknown'
};

// Category mapping constants
export const CATEGORY_ENUM_TO_NAME: Record<string, string> = {
  'PHYSICAL': 'Physical',
  'SPECIAL': 'Special',
  'STATUS': 'Status'
};

// Gender code mappings
export const GENDER_CODES: Record<string, string> = {
  'GENDER_F0': '0% ♀ (Male only)',
  'GENDER_F12_5': '12.5% ♀, 87.5% ♂',
  'GENDER_F25': '25% ♀, 75% ♂',
  'GENDER_F50': '50% ♀, 50% ♂',
  'GENDER_F75': '75% ♀, 25% ♂',
  'GENDER_F100': '100% ♀ (Female only)',
  'GENDER_UNKNOWN': 'Genderless'
};

// Hatch rate code mappings
export const HATCH_CODES: Record<string, string> = {
  'HATCH_FASTEST': 'Very Fast (1,280 steps)',
  'HATCH_FASTER': 'Fast (2,560 steps)',
  'HATCH_FAST': 'Medium-Fast (5,120 steps)',
  'HATCH_MEDIUM_FAST': 'Medium-Fast (5,120 steps)',
  'HATCH_MEDIUM_SLOW': 'Medium-Slow (6,400 steps)',
  'HATCH_SLOW': 'Slow (8,960 steps)',
  'HATCH_SLOWER': 'Very Slow (10,240 steps)',
  'HATCH_SLOWEST': 'Extremely Slow (20,480 steps)'
};

// Growth rate code mappings
export const GROWTH_RATE_CODES: Record<string, string> = {
  'GROWTH_MEDIUM_FAST': 'Medium Fast',
  'GROWTH_SLIGHTLY_FAST': 'Slightly Fast',
  'GROWTH_SLIGHTLY_SLOW': 'Slightly Slow',
  'GROWTH_MEDIUM_SLOW': 'Medium Slow',
  'GROWTH_FAST': 'Fast',
  'GROWTH_SLOW': 'Slow',
  'GROWTH_ERRATIC': 'Erratic',
  'GROWTH_FLUCTUATING': 'Fluctuating'
};

// Egg group code mappings
export const EGG_GROUP_CODES: Record<string, string> = {
  'EGG_MONSTER': 'Monster',
  'EGG_WATER_1': 'Water 1',
  'EGG_BUG': 'Bug',
  'EGG_FLYING': 'Flying',
  'EGG_GROUND': 'Field',
  'EGG_FAIRY': 'Fairy',
  'EGG_PLANT': 'Grass',
  'EGG_HUMANSHAPE': 'Human-Like',
  'EGG_WATER_3': 'Water 3',
  'EGG_MINERAL': 'Mineral',
  'EGG_INDETERMINATE': 'Amorphous',
  'EGG_WATER_2': 'Water 2',
  'EGG_DITTO': 'Ditto',
  'EGG_DRAGON': 'Dragon',
  'EGG_NONE': 'Undiscovered'
};

// Shared description groups for moves with the same effects
export const SHARED_MOVE_DESCRIPTION_GROUPS: Record<string, string[]> = {
  paralysis: [
    'BODY_SLAM', 'THUNDER_SHOCK', 'THUNDERBOLT', 'THUNDER', 'LICK', 'SPARK'
  ],
  freeze: [
    'ICE_BEAM', 'BLIZZARD'
  ],
  confuse: [
    'PSYBEAM', 'CONFUSION', 'DIZZY_PUNCH', 'WATER_PULSE', 'HURRICANE'
  ],
  flinch: [
    'STOMP', 'HEADBUTT', 'BITE', 'WATERFALL', 'ROCK_SLIDE', 'HYPER_FANG',
    'AIR_SLASH', 'IRON_HEAD', 'ZEN_HEADBUTT', 'EXTRA_SENSORY', 'DARK_PULSE',
    'ASTONISH', 'ICICLE_CRASH'
  ],
  poison: [
    'POISON_STING', 'SLUDGE_BOMB', 'POISON_JAB', 'GUNK_SHOT'
  ],
  burn: [
    'EMBER', 'FLAME_THROWER', 'FIRE_BLAST', 'SACRED_FIRE', 'SCALD'
  ],
  statdown_spdef: [
    'ACID', 'PSYCHIC_M', 'SHADOW_BALL', 'BUG_BUZZ', 'EARTH_POWER',
    'ENERGY_BALL', 'FLASH_CANNON', 'FOCUS_BLAST'
  ],
  statdown_def: [
    'CRUNCH', 'IRON_TAIL'
  ],
  statdown_atk: [
    'AURORA_BEAM', 'PLAY_ROUGH'
  ],
  statdown_speed: [
    'BUBBLE_BEAM', 'BULLDOZE', 'ICY_WIND'
  ],
  statdown_acc: [
    'MUD_SLAP', 'OCTAZOOKA', 'SMOKESCREEN', 'FLASH'
  ],
  confuse2: [
    'CONFUSE_RAY', 'SUPERSONIC', 'SWEET_KISS'
  ],
  sleep: [
    'SLEEP_POWDER', 'HYPNOSIS', 'LOVELY_KISS', 'SING', 'SPORE', 'YAWN'
  ]
};

// Shared description groups for abilities
export const SHARED_ABILITY_DESCRIPTION_GROUPS: Record<string, string[]> = {
  'Battle Armor': ['Shell Armor'],
  'Cloud Nine': ['Air Lock'],
  'Insomnia': ['Vital Spirit'],
  'Immunity': ['Pastel Veil'],
  'Clear Body': ['White Smoke'],
  'Filter': ['Solid Rock'],
};
