export type PokemonType = {
  normal: 'normal';
  fire: 'fire';
  water: 'water';
  electric: 'electric';
  grass: 'grass';
  ice: 'ice';
  fighting: 'fighting';
  poison: 'poison';
  ground: 'ground';
  flying: 'flying';
  psychic: 'psychic';
  bug: 'bug';
  rock: 'rock';
  ghost: 'ghost';
  dragon: 'dragon';
  dark: 'dark';
  steel: 'steel';
  fairy: 'fairy';
};

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
    types?: PokemonType[];
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
  types?: PokemonType[];
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
  type: PokemonType;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  description?: string;
}

export interface PokemonMovesets {
  levelUp?: {
    [level: number]: MoveData['name'][];
  };
  tm?: MoveData['name'][];
  eggMoves?: MoveData['name'][];
}

export interface PokemonManifest {
  id: PokemonData['id'];
  name: PokemonData['name'];
  dexNo: PokemonData['dexNo'];
  forms: Forms | null;
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
  encounters: {
    pokemon: PokemonData['name'];
    formNumber?: number;
    method: string;
    version?: string;
    levelRange: string;
    rate: number;
    items?: string[];
  }[];
  events?: {
    name: string;
    description: string;
  }[];
  items?: string[];
  trainers?: string[];
}

export interface LocationManifest {
  name: LocationData['name'];
  encounterCount: number;
  eventCount: number;
  trainerCount: number;
}

export interface TrainerData {
  id: string;
  name: string;
  class: string;
  teams: {
    matchCount: number;
    pokemon: {
      pokemonName: PokemonData['name'];
      formNumber?: number;
      level: number;
      item?: string;
    };
  }[];
  sprite?: string;
}
