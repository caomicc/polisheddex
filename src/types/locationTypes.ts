export interface EncounterDetail {
  level: string;
  chance: number;
  rareItem?: string;
}

export interface TimeEncounters {
  [time: string]: EncounterDetail[];
}

export interface MethodData {
  times: TimeEncounters;
}

export interface PokemonMethods {
  methods: {
    [method: string]: MethodData;
  };
}

export interface LocationData {
  pokemon: {
    [pokemonName: string]: PokemonMethods;
  };
}

export type GroupedPokemon = {
  [method: string]: {
    [time: string]: {
      pokemon: {
        name: string;
        level: string;
        chance: number;
        rareItem?: string;
      }[];
    };
  };
};
