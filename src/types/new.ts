import { LocationItem } from './types';

interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface Forms {
  [formName: string]: {
    formNumber: number;
    types?: string[];
    abilities?: AbilityData['name'][];
    baseStats?: Partial<BaseStats>;
    growthRate?: string;
    hasGender?: boolean;
    movesets?: PokemonMovesets;
  };
}

export interface PokemonData {
  id: string;
  name: string;
  dexNo: number;
  types?: string[];
  abilities?: AbilityData['name'][];
  baseStats?: BaseStats;
  forms?: Forms;
}

export interface ComprehensivePokemonData {
  id: PokemonData['id'];
  name: PokemonData['name'];
  dexNo: PokemonData['dexNo'];
  versions: {
    [versionName: string]: Omit<PokemonData, 'dexNo' | 'id' | 'name'>;
  };
}

export interface MoveManifest {
  name: MoveData['name'];
  description: MoveData['description'];
}

export interface MoveData {
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  description?: string;
}

export interface PokemonMovesets {
  levelUp?: {
    [level: number]: MoveData['name'][] | MoveData['name'];
  };
  tm?: MoveData['name'][];
  eggMoves?: MoveData['name'][];
}

export interface PokemonManifest {
  id: PokemonData['id'];
  name: PokemonData['name'];
  dexNo: PokemonData['dexNo'];
  forms: string[] | Forms | null; // forms might be overkill here, re-eval late
}

export interface AbilityData {
  name: string;
  description: string;
  pokemon: PokemonData['name'][];
}

export interface AbilityManifest {
  name: AbilityData['name'];
  description: AbilityData['description'];
}

export interface EvolutionData {
  from: {
    name: PokemonData['name'];
    formNumber?: number;
  };
  to: {
    name: PokemonData['name'];
    formNumber?: number;
  };
  method: {
    action: string;
    parameter?: string | number;
  };
}

export interface ItemsData {
  id: string;
  name: string;
  description: string;
  attributes: {
    price?: number;
    effect?: string;
    params?: number | string | boolean;
    category?: string;
  };
  locations?: Array<{
    area: string;
    method: string;
  }>;
}

export interface LocationData {
  id: string;
  name: string;
  constantName?: string;
  connectionCount?: number;
  isLandmark?: boolean;
  order?: number;
  region?: string;
  encounters?: {
    pokemon: PokemonData['name'];
    formNumber?: number;
    method: string;
    version?: string;
    levelRange: string;
    rate: number;
    items?: string[];
  }[];
  connections?: {
    direction: string;
    to: LocationData['name'];
    toId: LocationData['id'];
  }[];
  events?: {
    name: string;
    description: string;
    type: string; // itemball, fruit tree, trainer, rock smash,
  }[];
  items?: LocationItem[];
  trainers?: string[];
}

export interface LocationManifest {
  id: LocationData['id'];
  name: LocationData['name'];
  constantName?: LocationData['constantName'];
  isLandmark?: LocationData['isLandmark'];
  region?: LocationData['region'];
  order?: number;
  connections?: number;
  encounterCount?: number;
  eventCount?: number;
  trainerCount?: number;
}

export interface TrainerData {
  id: string;
  name: string;
  constantName: string;
  class: string;
  teams: {
    matchCount: number;
    pokemon: {
      pokemonName: PokemonData['name'];
      formNumber?: number;
      level: number;
      item?: string;
      moves?: MoveData['name'][];
      nature?: string;
      ability?: string;
      gender?: string;
      shiny?: boolean;
      dvs?: string;
      evs?: string;
    }[];
  }[];
  items?: string[];
  sprite?: string;
}

export interface ComprehensiveTrainerData {
  id: TrainerData['id'];
  name: TrainerData['name'];
  class: TrainerData['class'];
  constantName: TrainerData['constantName'];
  sprite?: TrainerData['sprite'];
  items?: TrainerData['items'];
  versions: {
    [versionName: string]: Omit<
      TrainerData,
      'id' | 'name' | 'class' | 'constantName' | 'sprite' | 'items'
    >;
  };
}

export interface TrainerManifest {
  id: TrainerData['id'];
  name: TrainerData['name'];
  class: TrainerData['class'];
  constantName?: TrainerData['constantName'];
}
