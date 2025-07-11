// Common types for Pokémon data extraction and processing

export interface EvoRaw {
  method: string;
  parameter: string | number | null;
  target: string;
  form?: string;
};

export interface LocationEntry {
  area: string | null;
  method: string | null;
  time: string | null;
  level: string;
  chance: number;
  rareItem?: string; // Optional property for hidden grottoes
  formName?: string | null; // Form name if applicable
}

// Define location data structure types
export interface LocationAreaData {
  pokemon: Record<string, {
    methods: Record<string, {
      times: Record<string, EncounterDetail[]>
    }>
  }>
};

export interface PokemonLocationData {
  locations: LocationEntry[];
  forms?: Record<string, { locations: LocationEntry[] }>;
}

export interface EncounterDetail {
  level: string;
  chance: number;
  rareItem?: string;
  formName?: string | null;
}

export interface Move {
  name: string;
  level: number | string;
  info?: MoveDescription;
}

export interface MoveDescription {
  description: string;
  type: string | PokemonType['name'];
  pp: number | string;
  power: number | string;
  accuracy?: number | string;
  effectPercent?: number | string;
  category: string;
}

export interface EvolutionMethod {
  method: string;
  parameter: string | number | null;
  target: string;
  form?: string;
}

export interface PokemonDataV2 {
  evolution: Evolution | null;
  moves: Move[];
}

// Define a type for Pokemon forms
export interface PokemonForm {
  formName: string;
  types?: string | string[];
  moves?: Move[];
  locations?: LocationEntry[];
};

export interface PokemonDataV3 extends PokemonDataV2 {
  nationalDex: number | null;
  johtoDex: number | null;
  types: string | string[];
  locations: LocationEntry[];
  forms?: Record<string, PokemonForm>;
};


export interface MoveDetail {
  level: string;
  name: string;
  description: string;
  type: string;
  pp: number;
  power: number;
  category: string;
}

// Already defined above, remove duplicate definition

export interface Evolution {
  methods: EvolutionMethod[];
  chain: string[];
}


// Type definitions for the detailed stats
export interface DetailedStats {
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    specialAttack: number;
    specialDefense: number;
    total: number;
  };
  catchRate: number;
  baseExp: number;
  heldItems: string[];
  genderRatio: string;
  hatchRate: string;
  abilities: Ability[] | string[]; // Can be either an array of Ability objects or strings
  growthRate: string;
  eggGroups: string[];
  evYield: string;
  height?: number | string; // Height can be a number or a string (e.g., "1.2 m")
  weight?: number | string; // Weight can be a number or a string (e.g., "60 kg");
  bodyShape?: string;
  bodyColor?: string;
}

export interface Ability {
  name: string;
  description: string;
  isHidden?: boolean;
}

export interface FormData extends DetailedStats {
  types: string[] | string;
  moves: Move[];
  locations: LocationEntry[];
  eggMoves: string[];
  evolution: Evolution | null;
  nationalDex: number | null;
  frontSpriteUrl?: string;
  johtoDex: number | null;
  species: string;
  description: string;
}

export interface BaseData extends DetailedStats {

  name: string;
  nationalDex: number | null;
  johtoDex: number | null;
  types: string[] | string;
  frontSpriteUrl?: string;
  forms?: Record<string, DetailedStats & {
    types: string[] | string;
    frontSpriteUrl?: string;
  }>;
}

export interface LevelMovesData {
  moves: Move[];
  forms?: Record<string, { moves: Move[] }>;
}

export interface LocationsData {
  locations: LocationEntry[];
  forms?: Record<string, { locations: LocationEntry[] }>;
}

export interface PokemonType {
  name:
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";
  damageRelations?: {
    doubleDamageTo: PokemonType[];
    doubleDamageFrom: PokemonType[];
    halfDamageTo: PokemonType[];
    halfDamageFrom: PokemonType[];
    noDamageTo: PokemonType[];
    noDamageFrom: PokemonType[];
  };
}

export interface EvolutionChainProps {
  chain: string[];
  spritesByGen?: Record<string, string>; // key: pokemon name, value: sprite url
  className?: string;
}

export interface PokemonDexEntry {
  species: string;
  description: string;
}
