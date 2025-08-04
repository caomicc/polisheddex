// Common types for Pokémon data extraction and processing

export interface EvoRaw {
  method: string;
  parameter: string | number | null;
  target: string;
  form?: string;
}

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
  pokemon: Record<
    string,
    {
      methods: Record<
        string,
        {
          times: Record<string, EncounterDetail[]>;
        }
      >;
    }
  >;
}

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
  level?: number | string;
  info?: MoveDescription;
}

export interface MoveSet {
  moves: Move[];
  faithfulMoves?: Move[]; // Moves in the faithful version
  updatedMoves?: Move[]; // Moves in the updated (non-faithful) version
}

export interface MoveDescription {
  description: string;
  type: string | PokemonType['name'];
  name?: string;
  faithful?: {
    type: string | PokemonType['name'];
    pp: number | string;
    power: number | string;
    accuracy?: number | string;
    effectPercent?: number | string;
    category?: 'Physical' | 'Special' | 'Status' | 'Unknown';
  };
  updated?: {
    type: string | PokemonType['name'];
    pp: number | string;
    power: number | string;
    accuracy?: number | string;
    effectPercent?: number | string;
    category?: 'Physical' | 'Special' | 'Status' | 'Unknown';
  };
  tm?: {
    number: string;
    name?: string;
    location?: {
      area: string;
      details?: string;
    };
  };
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

// Type definitions for the detailed stats
export interface DetailedStats {
  moves?: Move[]; // Basic moves (for backward compatibility)
  faithfulMoves?: Move[]; // Moves in the faithful version
  updatedMoves?: Move[]; // Moves in the updated (non-faithful) version
  name?: string;
  formName?: string;
  frontSpriteUrl?: string;
  johtoDex?: number | null;
  nationalDex?: number | null;
  baseStats?: {
    hp?: number;
    attack?: number;
    defense?: number;
    speed?: number;
    specialAttack?: number;
    specialDefense?: number;
    total?: number;
  };
  faithfulBaseStats?: {
    hp?: number;
    attack?: number;
    defense?: number;
    speed?: number;
    specialAttack?: number;
    specialDefense?: number;
    total?: number;
  };
  polishedBaseStats?: {
    hp?: number;
    attack?: number;
    defense?: number;
    speed?: number;
    specialAttack?: number;
    specialDefense?: number;
    total?: number;
  };
  catchRate?: number;
  baseExp?: number;
  heldItems?: string[];
  genderRatio?: {
    male?: number;
    female?: number;
    genderless?: number; // Percentage for genderless Pokémon
  };
  hatchRate?: string;
  abilities?: Ability[]; // The combined list of abilities (for backward compatibility)
  faithfulAbilities?: Ability[]; // Abilities in the faithful version
  updatedAbilities?: Ability[]; // Abilities in the updated (non-faithful) version
  growthRate?: string;
  eggGroups?: string[];
  evYield?: string;
  height?: number | string; // Height can be a number or a string (e.g., "1.2 m")
  weight?: number | string; // Weight can be a number or a string (e.g., "60 kg");
  bodyShape?: string;
  bodyColor?: string;
  types?: string[] | string;
  faithfulTypes?: string[] | string; // Types in the faithful version
  locations?: LocationEntry[];
  updatedTypes?: string[] | string; // Types in the polished/updated version
  forms?: Record<
    string,
    Omit<DetailedStats, 'moves'> & {
      name: string;
      moves?: Move[];
      baseStats?: DetailedStats['baseStats'];
      detailedStats?: DetailedStats;
    }
  >;
  levelMoves?: Move[]; // Moves learned by leveling up (for backward compatibility)
  faithfulLevelMoves?: Move[]; // Level moves in the faithful version
  updatedLevelMoves?: Move[]; // Level moves in the updated (non-faithful) version
  tmHmLearnset?: Move[]; // TM/HM learnset
  eggMoves?: Move[]; // Egg moves
  species?: string; // Species name for the Pokémon
  pokedexEntries?: Record<string, PokemonDexEntry>;
}
export type PokemonDataV3 = PokemonDataV2 &
  DetailedStats & {
    detailedStats?: DetailedStats;
    baseStats?: DetailedStats['baseStats'];
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
  chainWithMethods: Record<string, EvolutionMethod[]>;
}

export interface Ability {
  id: string;
  name?: string;
  description?: string;
  isHidden?: boolean;
  abilityType?: 'primary' | 'secondary' | 'hidden';
}

export interface FormData extends DetailedStats {
  moves: Move[];
  faithfulMoves?: Move[];
  updatedMoves?: Move[];
  faithfulLevelMoves?: Move[]; // Level moves in the faithful version
  updatedLevelMoves?: Move[]; // Level moves in the updated (non-faithful) version
  tmHmLearnset: Move[];
  locations: LocationEntry[];
  eggMoves: Move[];
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
  types: string[] | string; // Current displayed types (default to updated)
  faithfulTypes?: string[] | string; // Types in the faithful version
  updatedTypes?: string[] | string; // Types in the polished/updated version
  frontSpriteUrl?: string;
  normalizedUrl?: string; // Pre-computed normalized URL to reduce runtime processing
  forms?: Record<
    string,
    DetailedStats & {
      types: string[] | string; // Current displayed types (default to updated)
      faithfulTypes?: string[] | string; // Types in the faithful version
      updatedTypes?: string[] | string; // Types in the polished/updated version
      frontSpriteUrl?: string;
      name: string;
    }
  >;
  [key: string]: unknown; // Replaced `any` with `unknown` to resolve lint issue
}

export interface LevelMovesData {
  moves: Move[]; // For backward compatibility
  faithfulMoves?: Move[]; // Level moves in the faithful version
  updatedMoves?: Move[]; // Level moves in the updated (non-faithful) version
  forms?: Record<
    string,
    {
      moves: Move[]; // For backward compatibility
      faithfulMoves?: Move[]; // Level moves in the faithful version
      updatedMoves?: Move[]; // Level moves in the updated (non-faithful) version
    }
  >;
}

export interface LocationsData {
  locations: LocationEntry[];
  forms?: Record<string, { locations: LocationEntry[] }>;
}

export interface PokemonType {
  name:
    | 'normal'
    | 'fire'
    | 'water'
    | 'electric'
    | 'grass'
    | 'ice'
    | 'fighting'
    | 'poison'
    | 'ground'
    | 'flying'
    | 'psychic'
    | 'bug'
    | 'rock'
    | 'ghost'
    | 'dragon'
    | 'dark'
    | 'steel'
    | 'fairy';
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
  chainWithMethods?: Record<string, EvolutionMethod[]>; // key: pokemon name, value: evolution methods
  spritesByGen?: Record<string, string>; // key: pokemon name, value: sprite url
  className?: string;
}

export interface PokemonDexEntry {
  species: string;
  description: string;
}
// Define interfaces for location data structure
export interface EncounterDetail {
  level: string;
  chance: number;
  rareItem?: string;
}

export type TimeEncounters = {
  [time in NonNullable<PokemonEncounter['time']>]: EncounterDetail[];
};

export interface MethodData {
  times: TimeEncounters;
}

export interface PokemonMethods {
  methods: {
    [method: string]: MethodData;
  };
}

export interface LocationConnection {
  direction:
    | 'north'
    | 'south'
    | 'east'
    | 'west'
    | 'northeast'
    | 'northwest'
    | 'southeast'
    | 'southwest'
    | 'warp';
  targetLocation: string;
  targetLocationDisplay: string;
  offset: number;
}

export interface NPCTrade {
  traderName: string;
  wantsPokemon: string;
  wantsForm?: string;
  givesPokemon: string;
  givesForm?: string;
  givesGender?: string;
  nickname: string;
  item?: string;
  ability?: string;
  nature?: string;
}

export interface LocationEvent {
  type: 'rival_battle' | 'trainer_battle' | 'special' | 'coordinate_trigger' | 'item';
  description: string;
  details?: string;
  eventFlag?: string;
  coordinates?: { x: number; y: number };
}

export interface LocationItem {
  type: 'item' | 'hiddenItem' | 'tmHm';
  name: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface LocationHiddenItem {
  name: string;
  coordinates: {
    x: number;
    y: number;
  };
}

export interface GroupedLocation extends LocationData {
  children?: GroupedLocation[];
  hasData: boolean; // Whether this location has Pokemon, items, trainers, etc.
}

export interface LocationHierarchy {
  parent?: string;
  type: 'landmark' | 'route' | 'cave' | 'building' | 'floor' | 'house' | 'gym' | 'tower' | 'island';
}

// Item types
export interface ItemLocation {
  area: string;
  details: string;
}

export interface ItemAttributes {
  price: number;
  effect: string;
  parameter: number;
  category: string;
  useOutsideBattle: string;
  useInBattle: string;
  isKeyItem?: boolean;
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  attributes: ItemAttributes;
  locations: ItemLocation[];
}

export interface PokemonEncounter {
  name: string;
  level: string;
  chance: number;
  rareItem?: string;
  form?: string;
  location?: string;
  method?: string;
  time?: 'day' | 'nite' | 'morn' | 'grotto' | 'default' | 'any' | 'null' | 'all'; // 'default' for any time, 'any' for no specific time
}

// consolidated types:

// Base stats interface used across multiple types
export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

// Coordinates interface for reusability
export interface Coordinates {
  x: number;
  y: number;
}

// Trainer Pokemon variant for version-specific data
export interface TrainerPokemonVariant {
  ability?: string;
  nature?: string;
  moves?: string[];
  dvs?: PokemonStats;
  evs?: PokemonStats;
}

// Main trainer Pokemon interface
export interface TrainerPokemon {
  level: number;
  species: string;
  nickname?: string;
  item?: string;
  gender?: string;
  form?: string;
  ability?: string;
  nature?: string;
  shiny?: boolean;
  moves?: string[];
  dvs?: PokemonStats;
  evs?: PokemonStats;
  // Version-specific variants
  faithful?: TrainerPokemonVariant;
  polished?: TrainerPokemonVariant;
}

// Location trainer interface
export interface LocationTrainer {
  id: string;
  name: string;
  trainerClass: string;
  spriteType: string;
  coordinates: Coordinates;
  possibleCoordinates?: Coordinates[];
  eventFlag?: string;
  pokemon?: TrainerPokemon[];
  items?: string[];
  baseReward?: number;
  aiFlags?: string[];
  rematchable?: boolean;
  seenText?: string;
  beatenText?: string;
  afterText?: string;
  teams?: {
    [teamName: string]: {
      pokemon: TrainerPokemon[];
      baseReward?: number;
      aiFlags?: string[];
      rematchable?: boolean;
    };
  };
}

// TM/HM location structure
export interface TMHMLocation {
  area: string;
  details?: string;
}

// Full TM/HM data structure
export interface TMHMData {
  id: string;
  name: string;
  description: string;
  tmNumber: string;
  moveName: string;
  type: string;
  power: number;
  pp: number;
  accuracy: number;
  category: string;
  location: TMHMLocation;
}

// Simplified TM/HM reference for location data
export interface TMHMReference {
  tmNumber: string;
  moveName: string;
  location: string;
}

// Main location data interface
export interface LocationData {
  id: number;
  name: string;
  displayName: string;
  region: 'johto' | 'kanto' | 'orange';
  type?:
    | 'landmark'
    | 'route'
    | 'cave'
    | 'building'
    | 'floor'
    | 'house'
    | 'gym'
    | 'tower'
    | 'island';
  parent?: string; // Key of parent location
  x: number;
  y: number;
  flyable: boolean;
  spawnPoint?: string;
  connections: LocationConnection[];
  npcTrades?: NPCTrade[];
  events?: LocationEvent[];
  items?: LocationItem[];
  tmhms?: TMHMReference[];
  trainers?: LocationTrainer[];
  gymLeader?: GymLeader;
  area?: string;
  urlName?: string;
  types?: string[] | string;
  pokemonCount?: number;
  hasHiddenGrottoes?: boolean;
  hasTrainers?: boolean;
  trainerCount?: number;
}
// Gym Leader interface
export interface GymLeader {
  name: string;
  trainerClass: string;
  badge: string;
  region: 'johto' | 'kanto' | 'orange';
  pokemon?: TrainerPokemon[];
  coordinates?: Coordinates;
  speciality?: string; // Type speciality like "Flying", "Bug", etc.
}

// Union type for all items (assuming ItemData is defined elsewhere)
export type AnyItemData = ItemData | TMHMData;

export interface ItemsDatabase {
  [itemId: string]: AnyItemData;
}

// Type guards
export function isRegularItem(item: AnyItemData): item is ItemData {
  return 'attributes' in item && item.attributes !== undefined;
}

export function isTMHMItem(item: AnyItemData): item is TMHMData {
  return 'tmNumber' in item && item.tmNumber !== undefined;
}
