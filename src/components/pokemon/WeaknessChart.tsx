import React from 'react';
import { cn } from '@/lib/utils';
import { PokemonType } from '@/types/types';
// import { Badge } from '../ui/badge';
import typeChartData from '../../../output/type_chart.json';
import TypeIcon from './TypeIcon';

// TODO: Update types
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

export function WeaknessChart({ types }: { types: string[] }) {
  const effectiveness = getTypeEffectiveness(types);
  const weaknesses = ALL_TYPES.filter((type) => effectiveness[type] > 1);
  const strengths = ALL_TYPES.filter((type) => effectiveness[type] < 1 && effectiveness[type] > 0);

  return (
    <div className="mb-4">
      <div className="mb-2 font-semibold text-lg">Weak Against</div>
      <div className="w-full flex flex-row flex-wrap gap-2 mb-6">
        {weaknesses.length === 0 ? (
          <span className="text-gray-600">None</span>
        ) : (
          weaknesses.map((type) => (
            <div
              key={type}
              className={cn('flex flex-col items-center text-xs font-medium p-1 text-red-800')}
              aria-label={`${type} damage: ${effectiveness[type]}x`}
            >
              <TypeIcon type={type as PokemonType['name']} className="mb-2" />
              <span>{effectiveness[type]}x</span>
            </div>
          ))
        )}
      </div>
      <div className="mb-2 font-semibold text-lg">Strength Against</div>
      <div className="w-full flex flex-row flex-wrap gap-2">
        {strengths.length === 0 ? (
          <span className="text-gray-600">None</span>
        ) : (
          strengths.map((type) => (
            <div
              key={type}
              className={cn('flex flex-col items-center text-xs font-medium p-1 text-blue-800')}
              aria-label={`${type} resistance: ${effectiveness[type]}x`}
            >
              <TypeIcon type={type as PokemonType['name']} className="mb-2" />
              <span>{effectiveness[type]}x</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
