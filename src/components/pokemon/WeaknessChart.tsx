import React from 'react';
import { cn } from '@/lib/utils';
import { PokemonType } from '@/types/types';
// import { Badge } from '../ui/badge';
import typeChartData from '../../../type_chart.json';
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
  return (
    <div className="mb-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-1 w-full">
        {ALL_TYPES.map((type) => {
          const value = effectiveness[type];
          const color =
            value > 1
              ? 'text-red-800'
              : value < 1 && value > 0
              ? 'text-blue-800'
              : value === 0
              ? 'text-gray-600 line-through'
              : 'text-gray-800';
          return (
            <div
              key={type}
              className={cn('flex flex-col items-center text-xs font-medium p-1', color)}
              aria-label={`${type} damage: ${value}x`}
            >
              {/* <Badge variant={type as PokemonType['name']} className="mb-1">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge> */}
              <TypeIcon type={type as PokemonType['name']} className="mb-2" />
              <span>{value}x</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
