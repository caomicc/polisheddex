import React from 'react';
import { cn } from '@/lib/utils';
import { PokemonType } from '@/types/types';
import typeChartData from '../../../output/type_chart.json';
import TypeIcon from './TypeIcon';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../ui/table';

const TYPE_CHART: Record<string, Record<string, number>> = typeChartData as any;
const ALL_TYPES = Object.keys(TYPE_CHART).filter((type) => {
  const data = TYPE_CHART[type];
  return data && Object.keys(data).length > 0;
});

function getTypeEffectiveness(defTypes: string[]): Record<string, number> {
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

const relationLabels = [
  { label: '0x', value: 0 },
  { label: '.25x', value: 0.25 },
  { label: '.5x', value: 0.5 },
  { label: '2x', value: 2 },
  { label: '4x', value: 4 },
];

export function TypeRelationsChart({ types }: { types: string[] }) {
  const effectiveness = getTypeEffectiveness(types);
  const relations: Record<string, string[]> = {};

  relationLabels.forEach(({ label, value }) => {
    relations[label] = ALL_TYPES.filter((type) => effectiveness[type] === value);
  });
  relations['None'] = ALL_TYPES.filter(
    (type) => !relationLabels.some(({ value }) => effectiveness[type] === value),
  );

  return (
    <Table>
      <TableHeader className="sr-only">
        <TableRow>
          <TableCell className="w-1/4">Relation</TableCell>
          <TableCell>Types</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {relationLabels.map(({ label }) => (
          <TableRow key={label}>
            <TableCell className="font-semibold">{label}</TableCell>
            <TableCell className={'p-0'}>
              <div className="flex flex-row flex-wrap gap-2">
                {relations[label].length === 0 ? (
                  <span className="text-gray-600">None</span>
                ) : (
                  relations[label].map((type) => (
                    <div
                      key={type}
                      className={cn('flex flex-col items-center text-xs font-medium p-0')}
                      aria-label={`${type} relation: ${label}`}
                    >
                      <TypeIcon className="w-6 h-6 p-[6px]" type={type as PokemonType['name']} />
                      {/* <span>{effectiveness[type]}x</span> */}
                    </div>
                  ))
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
