export type PokemonType =
  | 'NORMAL'
  | 'FIRE'
  | 'WATER'
  | 'ELECTRIC'
  | 'GRASS'
  | 'ICE'
  | 'FIGHTING'
  | 'POISON'
  | 'GROUND'
  | 'FLYING'
  | 'PSYCHIC'
  | 'BUG'
  | 'ROCK'
  | 'GHOST'
  | 'DRAGON'
  | 'DARK'
  | 'STEEL'
  | 'FAIRY';

export type TypeEffectiveness = 0 | 0.5 | 1 | 2;

export interface TypeMatchup {
  attacker: PokemonType;
  defender: PokemonType;
  effectiveness: TypeEffectiveness;
}

export const TYPE_CHART: TypeMatchup[] = [
  // Normal
  { attacker: 'NORMAL', defender: 'ROCK', effectiveness: 0.5 },
  { attacker: 'NORMAL', defender: 'STEEL', effectiveness: 0.5 },
  { attacker: 'NORMAL', defender: 'GHOST', effectiveness: 0 }, // Foresight can remove this immunity

  // Fire
  { attacker: 'FIRE', defender: 'FIRE', effectiveness: 0.5 },
  { attacker: 'FIRE', defender: 'WATER', effectiveness: 0.5 },
  { attacker: 'FIRE', defender: 'GRASS', effectiveness: 2 },
  { attacker: 'FIRE', defender: 'ICE', effectiveness: 2 },
  { attacker: 'FIRE', defender: 'BUG', effectiveness: 2 },
  { attacker: 'FIRE', defender: 'ROCK', effectiveness: 0.5 },
  { attacker: 'FIRE', defender: 'DRAGON', effectiveness: 0.5 },
  { attacker: 'FIRE', defender: 'STEEL', effectiveness: 2 },

  // Water
  { attacker: 'WATER', defender: 'FIRE', effectiveness: 2 },
  { attacker: 'WATER', defender: 'WATER', effectiveness: 0.5 },
  { attacker: 'WATER', defender: 'GRASS', effectiveness: 0.5 },
  { attacker: 'WATER', defender: 'GROUND', effectiveness: 2 },
  { attacker: 'WATER', defender: 'ROCK', effectiveness: 2 },
  { attacker: 'WATER', defender: 'DRAGON', effectiveness: 0.5 },

  // Electric
  { attacker: 'ELECTRIC', defender: 'WATER', effectiveness: 2 },
  { attacker: 'ELECTRIC', defender: 'ELECTRIC', effectiveness: 0.5 },
  { attacker: 'ELECTRIC', defender: 'GRASS', effectiveness: 0.5 },
  { attacker: 'ELECTRIC', defender: 'GROUND', effectiveness: 0 },
  { attacker: 'ELECTRIC', defender: 'FLYING', effectiveness: 2 },
  { attacker: 'ELECTRIC', defender: 'DRAGON', effectiveness: 0.5 },

  // Grass
  { attacker: 'GRASS', defender: 'FIRE', effectiveness: 0.5 },
  { attacker: 'GRASS', defender: 'WATER', effectiveness: 2 },
  { attacker: 'GRASS', defender: 'GRASS', effectiveness: 0.5 },
  { attacker: 'GRASS', defender: 'POISON', effectiveness: 0.5 },
  { attacker: 'GRASS', defender: 'GROUND', effectiveness: 2 },
  { attacker: 'GRASS', defender: 'FLYING', effectiveness: 0.5 },
  { attacker: 'GRASS', defender: 'BUG', effectiveness: 0.5 },
  { attacker: 'GRASS', defender: 'ROCK', effectiveness: 2 },
  { attacker: 'GRASS', defender: 'DRAGON', effectiveness: 0.5 },
  { attacker: 'GRASS', defender: 'STEEL', effectiveness: 0.5 },

  // Ice
  { attacker: 'ICE', defender: 'FIRE', effectiveness: 0.5 },
  { attacker: 'ICE', defender: 'WATER', effectiveness: 0.5 },
  { attacker: 'ICE', defender: 'GRASS', effectiveness: 2 },
  { attacker: 'ICE', defender: 'ICE', effectiveness: 0.5 },
  { attacker: 'ICE', defender: 'GROUND', effectiveness: 2 },
  { attacker: 'ICE', defender: 'FLYING', effectiveness: 2 },
  { attacker: 'ICE', defender: 'DRAGON', effectiveness: 2 },
  { attacker: 'ICE', defender: 'STEEL', effectiveness: 0.5 },

  // Fighting
  { attacker: 'FIGHTING', defender: 'NORMAL', effectiveness: 2 },
  { attacker: 'FIGHTING', defender: 'ICE', effectiveness: 2 },
  { attacker: 'FIGHTING', defender: 'POISON', effectiveness: 0.5 },
  { attacker: 'FIGHTING', defender: 'FLYING', effectiveness: 0.5 },
  { attacker: 'FIGHTING', defender: 'PSYCHIC', effectiveness: 0.5 },
  { attacker: 'FIGHTING', defender: 'BUG', effectiveness: 0.5 },
  { attacker: 'FIGHTING', defender: 'ROCK', effectiveness: 2 },
  { attacker: 'FIGHTING', defender: 'GHOST', effectiveness: 0 }, // Foresight can remove this immunity
  { attacker: 'FIGHTING', defender: 'DARK', effectiveness: 2 },
  { attacker: 'FIGHTING', defender: 'STEEL', effectiveness: 2 },
  { attacker: 'FIGHTING', defender: 'FAIRY', effectiveness: 0.5 },

  // Poison
  { attacker: 'POISON', defender: 'GRASS', effectiveness: 2 },
  { attacker: 'POISON', defender: 'POISON', effectiveness: 0.5 },
  { attacker: 'POISON', defender: 'GROUND', effectiveness: 0.5 },
  { attacker: 'POISON', defender: 'ROCK', effectiveness: 0.5 },
  { attacker: 'POISON', defender: 'GHOST', effectiveness: 0.5 },
  { attacker: 'POISON', defender: 'STEEL', effectiveness: 0 },
  { attacker: 'POISON', defender: 'FAIRY', effectiveness: 2 },

  // Ground
  { attacker: 'GROUND', defender: 'FIRE', effectiveness: 2 },
  { attacker: 'GROUND', defender: 'ELECTRIC', effectiveness: 2 },
  { attacker: 'GROUND', defender: 'GRASS', effectiveness: 0.5 },
  { attacker: 'GROUND', defender: 'POISON', effectiveness: 2 },
  { attacker: 'GROUND', defender: 'FLYING', effectiveness: 0 }, // Flying types are immune to Ground
  { attacker: 'GROUND', defender: 'BUG', effectiveness: 0.5 },
  { attacker: 'GROUND', defender: 'ROCK', effectiveness: 2 },
  { attacker: 'GROUND', defender: 'STEEL', effectiveness: 2 },

  // Flying
  { attacker: 'FLYING', defender: 'ELECTRIC', effectiveness: 0.5 },
  { attacker: 'FLYING', defender: 'GRASS', effectiveness: 2 },
  { attacker: 'FLYING', defender: 'FIGHTING', effectiveness: 2 },
  { attacker: 'FLYING', defender: 'BUG', effectiveness: 2 },
  { attacker: 'FLYING', defender: 'ROCK', effectiveness: 0.5 },
  { attacker: 'FLYING', defender: 'STEEL', effectiveness: 0.5 },

  // Psychic
  { attacker: 'PSYCHIC', defender: 'FIGHTING', effectiveness: 2 },
  { attacker: 'PSYCHIC', defender: 'POISON', effectiveness: 2 },
  { attacker: 'PSYCHIC', defender: 'PSYCHIC', effectiveness: 0.5 },
  { attacker: 'PSYCHIC', defender: 'DARK', effectiveness: 0 },
  { attacker: 'PSYCHIC', defender: 'STEEL', effectiveness: 0.5 },

  // Bug
  { attacker: 'BUG', defender: 'FIRE', effectiveness: 0.5 },
  { attacker: 'BUG', defender: 'GRASS', effectiveness: 2 },
  { attacker: 'BUG', defender: 'FIGHTING', effectiveness: 0.5 },
  { attacker: 'BUG', defender: 'POISON', effectiveness: 0.5 },
  { attacker: 'BUG', defender: 'FLYING', effectiveness: 0.5 },
  { attacker: 'BUG', defender: 'PSYCHIC', effectiveness: 2 },
  { attacker: 'BUG', defender: 'GHOST', effectiveness: 0.5 },
  { attacker: 'BUG', defender: 'DARK', effectiveness: 2 },
  { attacker: 'BUG', defender: 'STEEL', effectiveness: 0.5 },
  { attacker: 'BUG', defender: 'FAIRY', effectiveness: 0.5 },

  // Rock
  { attacker: 'ROCK', defender: 'FIRE', effectiveness: 2 },
  { attacker: 'ROCK', defender: 'ICE', effectiveness: 2 },
  { attacker: 'ROCK', defender: 'FIGHTING', effectiveness: 0.5 },
  { attacker: 'ROCK', defender: 'GROUND', effectiveness: 0.5 },
  { attacker: 'ROCK', defender: 'FLYING', effectiveness: 2 },
  { attacker: 'ROCK', defender: 'BUG', effectiveness: 2 },
  { attacker: 'ROCK', defender: 'STEEL', effectiveness: 0.5 },

  // Ghost
  { attacker: 'GHOST', defender: 'NORMAL', effectiveness: 0 },
  { attacker: 'GHOST', defender: 'PSYCHIC', effectiveness: 2 },
  { attacker: 'GHOST', defender: 'GHOST', effectiveness: 2 },
  { attacker: 'GHOST', defender: 'DARK', effectiveness: 0.5 },

  // Dragon
  { attacker: 'DRAGON', defender: 'DRAGON', effectiveness: 2 },
  { attacker: 'DRAGON', defender: 'STEEL', effectiveness: 0.5 },
  { attacker: 'DRAGON', defender: 'FAIRY', effectiveness: 0 },

  // Dark
  { attacker: 'DARK', defender: 'FIGHTING', effectiveness: 0.5 },
  { attacker: 'DARK', defender: 'PSYCHIC', effectiveness: 2 },
  { attacker: 'DARK', defender: 'GHOST', effectiveness: 2 },
  { attacker: 'DARK', defender: 'DARK', effectiveness: 0.5 },
  { attacker: 'DARK', defender: 'FAIRY', effectiveness: 0.5 },

  // Steel
  { attacker: 'STEEL', defender: 'FIRE', effectiveness: 0.5 },
  { attacker: 'STEEL', defender: 'WATER', effectiveness: 0.5 },
  { attacker: 'STEEL', defender: 'ELECTRIC', effectiveness: 0.5 },
  { attacker: 'STEEL', defender: 'ICE', effectiveness: 2 },
  { attacker: 'STEEL', defender: 'ROCK', effectiveness: 2 },
  { attacker: 'STEEL', defender: 'STEEL', effectiveness: 0.5 },
  { attacker: 'STEEL', defender: 'FAIRY', effectiveness: 2 },

  // Fairy
  { attacker: 'FAIRY', defender: 'FIRE', effectiveness: 0.5 },
  { attacker: 'FAIRY', defender: 'FIGHTING', effectiveness: 2 },
  { attacker: 'FAIRY', defender: 'POISON', effectiveness: 0.5 },
  { attacker: 'FAIRY', defender: 'DRAGON', effectiveness: 2 },
  { attacker: 'FAIRY', defender: 'DARK', effectiveness: 2 },
  { attacker: 'FAIRY', defender: 'STEEL', effectiveness: 0.5 },
];

/**
 * Get type effectiveness multiplier for an attack
 * @param attackerType - The type of the attacking move
 * @param defenderType - The type of the defending Pokemon
 * @returns Effectiveness multiplier (0, 0.5, 1, or 2)
 */
export function getTypeEffectiveness(
  attackerType: PokemonType,
  defenderType: PokemonType,
): TypeEffectiveness {
  const matchup = TYPE_CHART.find(
    (entry) => entry.attacker === attackerType && entry.defender === defenderType,
  );
  return matchup?.effectiveness ?? 1; // Default to neutral (1x) if no specific matchup found
}
