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

export interface MovesManifest {
  id: string;
  name: string;
  type: string;
  category: string;
  hasTM: boolean;
}

export interface MoveStats {
  name: string; // Added name property for brick break vs rock smash distinction
  power: number;
  type: string;
  accuracy: number | string;
  pp: number;
  effectChance: number;
  category: string;
  description: string;
}

export interface MoveData {
  id: string;
  name?: string;
  description?: string;
  versions: {
    [versionName: string]: MoveStats;
  };
  tm?: {
    number: string;
    location?: string;
  };
}

export interface MoveLearner {
  id: string;
  name?: string;
  form?: string;
  methods: Array<{
    method: 'levelUp' | 'tm' | 'eggMove';
    level?: number;
    tmNumber?: string;
  }>;
}

export interface PokemonMovesets {
  levelUp?: {
    name: string;
    level: number;
  }[];
  tm?: string[]; // TM move names
  eggMoves?: string[];
}

export interface PokemonManifest {
  id: PokemonData['id'];
  name: PokemonData['name'];
  dexNo: PokemonData['dexNo'];
  versions: {
    [versionName: string]: {
      [formName: string]: {
        types: string[];
      };
    };
  };
}

// Collection type for the manifest data
export interface PokemonManifestCollection {
  [pokemonId: string]: PokemonManifest;
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
    formName?: string;
  };
  to: {
    name: PokemonData['name'];
    formName?: string;
  };
  method: {
    action: string;
    parameter?: string | number;
  };
}

export interface EvolutionManifest {
  [pokemonName: string]: {
    [formName: string]: {
      name: string;
      form: string;
    }[];
  };
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  attributes: {
    price?: number;
    effect?: string;
    params?: number | string | boolean;
    category?: string;
    moveName?: string;
  };
  locations?: Array<{
    area: string;
    method: string;
  }>;
}

export interface ComprehensiveItemsData {
  id: ItemData['id'];
  versions: {
    [versionName: string]: Omit<ItemData, 'id'>;
  };
}

export interface ItemsManifest {
  id: ItemData['id'];
  name: ItemData['name'];
  locationCount?: number;
}

export interface ItemLocation {
  type: string;
  name: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface LocationData {
  id: string;
  name: string;
  constantName?: string;
  connectionCount?: number;
  type?: string[]; // gate, pokemon center, mart, gym, building, landmark.. etc
  isMart?: boolean;
  isPokemonCenter?: boolean;
  order?: number;
  region?: string;
  parent?: string;
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
    item?: string;
  }[];
  items?: ItemLocation[];
  trainers?: string[];
}

export interface LocationManifest {
  id: LocationData['id'];
  name: LocationData['name'];
  constantName?: LocationData['constantName'];
  type?: LocationData['type'];
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
      formName?: string;
      nickname?: string;
      level: number;
      item?: string;
      moves?: string[];
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

// Build and write evolution chains
export type ChainLink = {
  from: { name: string; formName: string };
  to: { name: string; formName: string };
  method: { action: string; parameter?: string | number };
};

export type FullEvolutionChains = {
  [root: string]: ChainLink[][];
};

export type EvolutionManifestEntry = {
  id: string;
  relatedPokemon: string[];
};

// Evolution chain building types and function
export type EvolutionMethod = {
  action: string;
  parameter?: string | number;
};

export type EvolutionStep = {
  from: { name: string; formName: string };
  to: { name: string; formName: string };
  method: EvolutionMethod;
};

export type EvolutionChains = {
  [root: string]: ChainLink[][];
};
