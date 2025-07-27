import React from 'react';
import { PokemonType } from '@/types/types';
import typeChartData from '../../../output/type_chart.json';
import { Badge } from '../ui/badge';

// TODO: Update types`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_CHART: Record<string, Record<string, number>> = typeChartData as any;
const ALL_TYPES = Object.keys(TYPE_CHART).filter((type) => {
  const data = TYPE_CHART[type];
  return data && Object.keys(data).length > 0;
});

function getTypeEffectiveness(defTypes: string[]): Record<string, number> {
  // For each attacking type, calculate the combined multiplier against all defending types
  const result: Record<string, number> = {};
  for (const attackType of ALL_TYPES) {
    let multiplier = 1;
    for (const defType of defTypes) {
      const chart = TYPE_CHART[attackType] || {};
      const m = chart[defType] ?? 1;
      multiplier *= m;
    }
    result[attackType] = multiplier;
  }
  return result;
}

export function WeaknessChart({ types }: { types: string[]; variant?: string }) {
  const effectiveness = getTypeEffectiveness(types);
  const weaknesses = ALL_TYPES.filter((type) => effectiveness[type] > 1);
  const strengths = ALL_TYPES.filter((type) => effectiveness[type] < 1 && effectiveness[type] > 0);

  return (
    <div className="text-left">
      <div>
        <div className={'font-bold text-sm mb-2 text-left'}>Weaknesses:</div>
        <div className="w-full flex flex-row flex-wrap gap-2 mb-3">
          {weaknesses.length === 0 ? (
            <span className="text-gray-600">None</span>
          ) : (
            weaknesses.map((type) => (
              <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
                <span>
                  {type} ×{effectiveness[type]}
                </span>
              </Badge>
            ))
          )}
        </div>
      </div>
      <div>
        <div className={'font-bold text-sm mb-2 text-left'}>Strengths:</div>
        <div className="w-full flex flex-row flex-wrap gap-2">
          {strengths.length === 0 ? (
            <span className="text-gray-600">None</span>
          ) : (
            strengths.map((type) => (
              <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
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
