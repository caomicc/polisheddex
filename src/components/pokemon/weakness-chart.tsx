import React from 'react';
// import { PokemonType } from '@/types/types';
import { PokemonType as TypeChartType, getTypeEffectiveness } from '@/data/typeChart';
import { Badge } from '../ui/badge';

const ALL_TYPES: TypeChartType[] = [
  'NORMAL',
  'FIRE',
  'WATER',
  'ELECTRIC',
  'GRASS',
  'ICE',
  'FIGHTING',
  'POISON',
  'GROUND',
  'FLYING',
  'PSYCHIC',
  'BUG',
  'ROCK',
  'GHOST',
  'DRAGON',
  'DARK',
  'STEEL',
  'FAIRY',
];

function getDefensiveEffectiveness(defTypes: string[]): Record<string, number> {
  // For each attacking type, calculate the combined multiplier against all defending types
  const result: Record<string, number> = {};
  for (const attackType of ALL_TYPES) {
    let multiplier = 1;
    for (const defType of defTypes) {
      // Convert string types to TypeChartType and get effectiveness
      const effectiveness = getTypeEffectiveness(
        attackType,
        defType.toUpperCase() as TypeChartType,
      );
      multiplier *= effectiveness;
    }
    result[attackType] = multiplier;
  }
  return result;
}

export function WeaknessChart({ types }: { types: string[]; variant?: string }) {
  const effectiveness = getDefensiveEffectiveness(types);
  const weaknesses = ALL_TYPES.filter((type) => effectiveness[type] > 1);
  const strengths = ALL_TYPES.filter((type) => effectiveness[type] < 1 && effectiveness[type] > 0);

  return (
    <div className="text-left">
      <div className="space-y-2 mb-6">
        <h3 className="text-neutral-600 dark:text-neutral-200">Weaknesses:</h3>
        <div className="w-full flex flex-row flex-wrap gap-2 mb-3">
          {weaknesses.length === 0 ? (
            <span className="text-gray-600">None</span>
          ) : (
            weaknesses.map((type) => (
              <Badge key={type} variant={type.toLowerCase() as any}>
                <span>
                  {type} ×{effectiveness[type]}
                </span>
              </Badge>
            ))
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-neutral-600 dark:text-neutral-200">Resistances:</h3>
        <div className="w-full flex flex-row flex-wrap gap-2">
          {strengths.length === 0 ? (
            <span className="text-gray-600">None</span>
          ) : (
            strengths.map((type) => (
              <Badge key={type} variant={type.toLowerCase() as any}>
                <span>
                  {type} ×{effectiveness[type]}
                </span>
              </Badge>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
