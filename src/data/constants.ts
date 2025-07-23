import type { EvoRaw } from '../types/types.ts';

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
  PALDEAN_WATER: 'paldean_water',
};

// Debug flag for tracking Pokémon type processing
export const DEBUG_POKEMON = [
  'Noctowl',
  'Butterfree',
  'Ledian',
  'Ampharos',
  'Sunflora',
  'Typhlosion',
  'Growlithe',
  'Raichu',
  'Arcanine',
  'Diglett',
  'Dugtrio',
  'Meowth',
  'Persian',
  'Exeggutor',
  'Marowak',
  'Slowbro',
  'Slowking',
  'Qwilfish',
  'Dudunsparce',
  'Feraligatr',
];

export interface TypeData {
  types: string[];
  updatedTypes: string[];
}

export const typeMap: Record<string, TypeData> = {};

export const formTypeMap: Record<string, Record<string, TypeData>> = {};

export const evoMap: Record<string, EvoRaw[]> = {};
export const preEvoMap: Record<string, string[]> = {};

export const sharedDescriptionGroups: Record<string, string[]> = {
  paralysis: ['BODY_SLAM', 'THUNDERSHOCK', 'THUNDERBOLT', 'THUNDER', 'LICK', 'SPARK'],
  freeze: ['ICE_BEAM', 'BLIZZARD'],
  confuse: ['PSYBEAM', 'CONFUSION', 'DIZZY_PUNCH', 'WATER_PULSE', 'HURRICANE'],
  flinch: [
    'STOMP',
    'HEADBUTT',
    'BITE',
    'WATERFALL',
    'ROCK_SLIDE',
    'HYPER_FANG',
    'AIR_SLASH',
    'IRON_HEAD',
    'ZEN_HEADBUTT',
    'EXTRASENSORY',
    'DARK_PULSE',
    'ASTONISH',
    'ICICLE_CRASH',
  ],
  poison: ['POISON_STING', 'SLUDGE_BOMB', 'POISON_JAB', 'GUNK_SHOT'],
  burn: ['EMBER', 'FLAME_THROWER', 'FIRE_BLAST', 'SACRED_FIRE', 'SCALD'],
  statdown_spdef: [
    'ACID',
    'PSYCHIC_M',
    'SHADOW_BALL',
    'BUG_BUZZ',
    'EARTH_POWER',
    'ENERGY_BALL',
    'FLASH_CANNON',
    'FOCUS_BLAST',
  ],
  statdown_def: ['CRUNCH', 'IRON_TAIL'],
  statdown_atk: ['AURORA_BEAM', 'PLAY_ROUGH'],
  statdown_speed: ['BUBBLE_BEAM', 'BULLDOZE', 'ICY_WIND'],
  statdown_acc: ['MUD_SLAP', 'OCTAZOOKA', 'SMOKESCREEN', 'FLASH'],
  confuse2: ['CONFUSE_RAY', 'SUPERSONIC', 'SWEET_KISS'],
  sleep: ['SING', 'SLEEP_POWDER', 'HYPNOSIS'],
  sleep2: ['SPORE'],
  paralyze: ['STUN_SPORE', 'GLARE'],
  burn2: ['WILL_O_WISP'],
  poison2: ['POISON_POWDER'],
  leveldamage: ['SEISMIC_TOSS', 'NIGHT_SHADE'],
  recoil: ['FLARE_BLITZ', 'BRAVE_BIRD', 'WILD_CHARGE'],
  neverMiss: ['SWIFT', 'AERIAL_ACE', 'FEINT_ATTACK', 'DISARM_VOICE', 'AURA_SPHERE'],
};
