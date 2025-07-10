// Common types for Pokémon data extraction and processing

export type EvoRaw = {
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


// --- Evolution parsing ---
export type Move = { level: number; move: string };
export type EvolutionMethod = {
  method: string;
  parameter: string | number | null;
  target: string;
  form?: string;
};
export type Evolution = {
  methods: EvolutionMethod[];
  chain: string[];
};
export type PokemonDataV2 = { evolution: Evolution | null; moves: Move[] };

// Define a type for Pokemon forms
export type PokemonForm = {
  formName: string;
  types?: string | string[];
  moves?: Move[];
  locations?: LocationEntry[];
};

export type PokemonDataV3 = PokemonDataV2 & {
  nationalDex: number | null,
  types: string | string[],
  locations: LocationEntry[],
  forms?: Record<string, PokemonForm>
};
