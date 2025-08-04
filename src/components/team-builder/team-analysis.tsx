'use client';

import { useMemo } from 'react';
import { TeamPokemon } from '@/hooks/use-team-search-params';
import { Badge } from '@/components/ui/badge';
import { PokemonType } from '@/types/types';
import typeChartData from '../../../output/type_chart.json';

const TYPE_CHART: Record<string, Record<string, number>> = typeChartData as Record<
  string,
  Record<string, number>
>;
const ALL_TYPES = Object.keys(TYPE_CHART).filter((type) => {
  const data = TYPE_CHART[type];
  return data && Object.keys(data).length > 0;
});

interface TeamAnalysisProps {
  team: (TeamPokemon | null)[];
}

interface TypeCoverage {
  weaknesses: { type: string; count: number; severity: number }[];
  resistances: { type: string; count: number; strength: number }[];
  immunities: { type: string; count: number }[];
}

function calculateTeamTypeCoverage(team: (TeamPokemon | null)[]): TypeCoverage {
  const activePokemon = team.filter(Boolean) as TeamPokemon[];

  if (activePokemon.length === 0) {
    return { weaknesses: [], resistances: [], immunities: [] };
  }

  const typeCounts: Record<
    string,
    { weak: number; resist: number; immune: number; totalEffectiveness: number }
  > = {};

  // Initialize counts for all types
  ALL_TYPES.forEach((type) => {
    typeCounts[type] = { weak: 0, resist: 0, immune: 0, totalEffectiveness: 0 };
  });

  // Calculate effectiveness for each Pokemon against each attacking type
  activePokemon.forEach((pokemon) => {
    ALL_TYPES.forEach((attackingType) => {
      let effectiveness = 1;

      // Calculate combined effectiveness against this Pokemon's types
      pokemon.types.forEach((defType) => {
        const chart = TYPE_CHART[attackingType] || {};
        const multiplier = chart[defType.toLowerCase()] ?? 1;
        effectiveness *= multiplier;
      });

      typeCounts[attackingType].totalEffectiveness += effectiveness;

      // Categorize the effectiveness
      if (effectiveness > 1) {
        typeCounts[attackingType].weak++;
      } else if (effectiveness === 0) {
        typeCounts[attackingType].immune++;
      } else if (effectiveness < 1) {
        typeCounts[attackingType].resist++;
      }
    });
  });

  // Extract weaknesses, resistances, and immunities
  const weaknesses = ALL_TYPES.filter((type) => typeCounts[type].weak > 0)
    .map((type) => ({
      type,
      count: typeCounts[type].weak,
      severity: typeCounts[type].totalEffectiveness,
    }))
    .sort((a, b) => b.severity - a.severity);

  const resistances = ALL_TYPES.filter((type) => typeCounts[type].resist > 0)
    .map((type) => ({
      type,
      count: typeCounts[type].resist,
      strength: activePokemon.length - typeCounts[type].totalEffectiveness,
    }))
    .sort((a, b) => b.strength - a.strength);

  const immunities = ALL_TYPES.filter((type) => typeCounts[type].immune > 0)
    .map((type) => ({
      type,
      count: typeCounts[type].immune,
    }))
    .sort((a, b) => b.count - a.count);

  return { weaknesses, resistances, immunities };
}

export function TeamAnalysis({ team }: TeamAnalysisProps) {
  const coverage = useMemo(() => calculateTeamTypeCoverage(team), [team]);
  const activePokemon = team.filter(Boolean) as TeamPokemon[];

  if (activePokemon.length === 0) {
    return (
      <div className="p-2">
        <h2 className="text-2xl font-semibold mb-4">Team Analysis</h2>
        <p className="text-gray-500">Add Pokémon to your team to see type coverage analysis.</p>
      </div>
    );
  }

  const getSeverityColor = (severity: number, total: number) => {
    const ratio = severity / total;
    if (ratio >= 2) return 'bg-red-100 text-red-800 border-red-200';
    if (ratio >= 1.5) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  return (
    <div className="p-2">
      <h2 className="text-2xl font-semibold mb-6">Team Analysis</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weaknesses */}
        <div>
          <h3 className="mb-3 text-red-700">Team Weaknesses</h3>
          <div className="space-y-2">
            {coverage.weaknesses.length === 0 ? (
              <p className="text-gray-500 text-sm">No common weaknesses found!</p>
            ) : (
              coverage.weaknesses.map(({ type, count, severity }) => (
                <div
                  key={type}
                  className={`flex items-center justify-between p-2 rounded border ${getSeverityColor(severity, activePokemon.length)}`}
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant={type.toLowerCase() as PokemonType['name']} className="text-xs">
                      {type}
                    </Badge>
                    <span className="text-sm">
                      {count}/{activePokemon.length} weak
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    ×{(severity / activePokemon.length).toFixed(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resistances */}
        <div>
          <h3 className="mb-3 text-green-700">Team Resistances</h3>
          <div className="space-y-2">
            {coverage.resistances.length === 0 ? (
              <p className="text-gray-500 text-sm">No resistances found.</p>
            ) : (
              coverage.resistances.map(({ type, count }) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 rounded bg-green-100 text-green-800 border border-green-200"
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant={type.toLowerCase() as PokemonType['name']} className="text-xs">
                      {type}
                    </Badge>
                    <span className="text-sm">
                      {count}/{activePokemon.length} resist
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Immunities */}
        <div>
          <h3 className="mb-3 text-blue-700">Team Immunities</h3>
          <div className="space-y-2">
            {coverage.immunities.length === 0 ? (
              <p className="text-gray-500 text-sm">No immunities found.</p>
            ) : (
              coverage.immunities.map(({ type, count }) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 rounded bg-blue-100 text-blue-800 border border-blue-200"
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant={type.toLowerCase() as PokemonType['name']} className="text-xs">
                      {type}
                    </Badge>
                    <span className="text-sm">
                      {count}/{activePokemon.length} immune
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team Summary */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="mb-3">Team Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-gray-800">{activePokemon.length}</div>
            <div className="text-sm text-gray-600">Pokémon</div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-2xl font-bold text-red-800">{coverage.weaknesses.length}</div>
            <div className="text-sm text-red-600">Weaknesses</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-800">{coverage.resistances.length}</div>
            <div className="text-sm text-green-600">Resistances</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-800">{coverage.immunities.length}</div>
            <div className="text-sm text-blue-600">Immunities</div>
          </div>
        </div>
      </div>
    </div>
  );
}
