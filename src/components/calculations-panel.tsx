'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { PokemonEntry, Nature } from './pokemon-slot';
import { TYPES } from '@/lib/types-data';
import {
  // computeDefensiveSummary,
  computeOffensiveCoverage,
  analyzeAbilitySynergies,
  computeDetailedDefensiveAnalysis,
  loadTypeChart,
} from '@/lib/calculations';
import { useEffect, useState } from 'react';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import TableWrapper from './ui/table-wrapper';
import { BentoGridNoLink } from './ui/bento-box';

type PokemonStats = {
  name: string;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    specialAttack: number;
    specialDefense: number;
    total: number;
  };
  abilities: Array<{ name: string; isHidden: boolean }>;
  nature?: Nature;
  item?: string;
};

export default function CalculationsPanel({
  team,
  disabled,
}: {
  team: PokemonEntry[];
  disabled?: boolean;
}) {
  const [pokemonStats, setPokemonStats] = useState<PokemonStats[]>([]);
  const [loading, setLoading] = useState(false);
  const { showFaithful } = useFaithfulPreference();

  // Load type chart when faithful preference changes
  useEffect(() => {
    loadTypeChart();
  }, [showFaithful]);

  // Load detailed stats for all Pokemon in the team
  useEffect(() => {
    const loadTeamStats = async () => {
      setLoading(true);
      try {
        const statsPromises = team.map(async (pokemon) => {
          if (!pokemon.name) return null;

          try {
            const fileName = pokemon.name.toLowerCase().replace(/[ -]/g, '-');
            const response = await fetch(`/output/pokemon/${fileName}.json`);
            if (!response.ok) throw new Error('Pokemon not found');

            const data = await response.json();

            // Use faithful or polished stats based on context
            const detailedStats = data.detailedStats;
            const baseStats = showFaithful
              ? detailedStats?.faithfulBaseStats
              : detailedStats?.polishedBaseStats || detailedStats?.baseStats;

            const abilities = showFaithful
              ? detailedStats?.faithfulAbilities
              : detailedStats?.updatedAbilities || detailedStats?.abilities;

            return {
              name: pokemon.name,
              baseStats: baseStats || {
                hp: 0,
                attack: 0,
                defense: 0,
                speed: 0,
                specialAttack: 0,
                specialDefense: 0,
                total: 0,
              },
              abilities: abilities || [],
              nature: pokemon.nature,
              item: pokemon.item,
            } as PokemonStats;
          } catch {
            return null;
          }
        });

        const results = await Promise.all(statsPromises);
        setPokemonStats(results.filter(Boolean) as PokemonStats[]);
      } catch (error) {
        console.error('Failed to load team stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!disabled && team.some((p) => p.name)) {
      loadTeamStats();
    } else {
      setPokemonStats([]);
    }
  }, [team, disabled, showFaithful]);
  if (disabled) {
    return (
      <Alert>
        <AlertTitle>No data yet</AlertTitle>
        <AlertDescription>
          Add at least one Pokémon with types or moves to see calculations.
        </AlertDescription>
      </Alert>
    );
  }

  // Create enriched team data with faithful/polished context
  const enrichedTeam = team.map((pokemon) => {
    if (!pokemon.name) return pokemon;

    const pokemonStatData = pokemonStats.find((p) => p.name === pokemon.name);
    if (pokemonStatData && pokemonStatData.abilities.length > 0) {
      // Always use the first ability from the loaded stats data which respects faithful/polished context
      // This ensures calculations are always correct regardless of what's stored in the team data
      return {
        ...pokemon,
        ability: pokemonStatData.abilities[0]?.name || pokemon.ability,
        types: pokemon.types,
      };
    }
    return pokemon;
  });

  // const defensive = computeDefensiveSummary(enrichedTeam);
  const offensive = computeOffensiveCoverage(enrichedTeam);
  const abilitySynergies = analyzeAbilitySynergies(enrichedTeam);
  const detailedDefensive = computeDetailedDefensiveAnalysis(enrichedTeam);

  // const maxWeak = Math.max(...TYPES.map((t) => defensive[t]?.weak ?? 0));

  // Calculate team statistics
  const teamStats =
    pokemonStats.length > 0
      ? {
          totalBST: pokemonStats.reduce((sum, p) => sum + p.baseStats.total, 0),
          averageBST:
            pokemonStats.reduce((sum, p) => sum + p.baseStats.total, 0) / pokemonStats.length,
          averageStats: {
            hp: pokemonStats.reduce((sum, p) => sum + p.baseStats.hp, 0) / pokemonStats.length,
            attack:
              pokemonStats.reduce((sum, p) => sum + p.baseStats.attack, 0) / pokemonStats.length,
            defense:
              pokemonStats.reduce((sum, p) => sum + p.baseStats.defense, 0) / pokemonStats.length,
            speed:
              pokemonStats.reduce((sum, p) => sum + p.baseStats.speed, 0) / pokemonStats.length,
            specialAttack:
              pokemonStats.reduce((sum, p) => sum + p.baseStats.specialAttack, 0) /
              pokemonStats.length,
            specialDefense:
              pokemonStats.reduce((sum, p) => sum + p.baseStats.specialDefense, 0) /
              pokemonStats.length,
          },
          maxStats: {
            hp: Math.max(...pokemonStats.map((p) => p.baseStats.hp)),
            attack: Math.max(...pokemonStats.map((p) => p.baseStats.attack)),
            defense: Math.max(...pokemonStats.map((p) => p.baseStats.defense)),
            speed: Math.max(...pokemonStats.map((p) => p.baseStats.speed)),
            specialAttack: Math.max(...pokemonStats.map((p) => p.baseStats.specialAttack)),
            specialDefense: Math.max(...pokemonStats.map((p) => p.baseStats.specialDefense)),
          },
          abilities: pokemonStats
            .flatMap((p) => p.abilities.map((a) => a.name))
            .filter((ability, index, self) => self.indexOf(ability) === index),
          natures: pokemonStats.map((p) => p.nature).filter(Boolean) as Nature[],
          items: pokemonStats.map((p) => p.item).filter(Boolean) as string[],
        }
      : null;

  return (
    <>
      <TableWrapper className="overflow-x-auto">
        <Table>
          <TableCaption>Individual Pokémon weaknesses by attacking type</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="label-text">Type</TableHead>
              {team
                .map((pokemon, index) =>
                  pokemon.name ? (
                    <TableHead key={`${pokemon.name}-${index}`} className="label-text">
                      {pokemon.name}
                      {/* , {pokemon.types.join('/')} */}
                    </TableHead>
                  ) : null,
                )
                .filter(Boolean)}
              <TableHead className="label-text text-center">Weaknesses</TableHead>
              <TableHead className="label-text text-center">Resistances</TableHead>
              <TableHead className="label-text text-center">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TYPES.map((type) => {
              // Calculate summary counts for this type
              let weaknessCount = 0;
              let resistanceCount = 0;

              team.forEach((pokemon) => {
                if (!pokemon.name) return;
                const memberData = detailedDefensive.memberAnalysis.find(
                  (m) => m.name === pokemon.name,
                );
                if (memberData) {
                  if (memberData.weaknesses.includes(type)) {
                    weaknessCount++;
                  } else if (memberData.resistances.includes(type)) {
                    resistanceCount++;
                  }
                }
              });

              return (
                <TableRow key={type}>
                  <TableCell className="font-medium">
                    <Badge variant={type.toLowerCase()}>{type}</Badge>
                  </TableCell>
                  {team
                    .map((pokemon, index) => {
                      if (!pokemon.name) return null;

                      const memberData = detailedDefensive.memberAnalysis.find(
                        (m) => m.name === pokemon.name,
                      );
                      const isWeak = memberData?.weaknesses.includes(type);
                      const isResist = memberData?.resistances.includes(type);
                      const isImmune = memberData?.immunities.includes(type);

                      let effectiveness = '1x';
                      let cellClass = 'text-center';

                      if (isImmune) {
                        effectiveness = '0x';
                        cellClass += ' bg-gray-100 text-gray-600';
                      } else if (isWeak) {
                        effectiveness = '2x';
                        cellClass += ' bg-red-100 text-red-800 font-semibold';
                      } else if (isResist) {
                        effectiveness = '0.5x';
                        cellClass += ' bg-green-100 text-green-800';
                      }

                      return (
                        <TableCell key={`${pokemon.name}-${type}-${index}`} className={cellClass}>
                          {effectiveness}
                        </TableCell>
                      );
                    })
                    .filter(Boolean)}
                  <TableCell className="text-center font-medium">
                    {weaknessCount > 0 ? (
                      <span className="text-red-800">{weaknessCount}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {resistanceCount > 0 ? (
                      <span className="text-green-800">{resistanceCount}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span className="text-muted-foreground">
                      {-weaknessCount + resistanceCount}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrapper>

      <div className="grid gap-4 lg:grid-cols-2 mt-2 lg:mt-4">
        <BentoGridNoLink>
          <h2 className="text-lg">Stat Distribution</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Highest BST:</span>
              <span className="font-medium">
                {Math.max(...pokemonStats.map((p) => p.baseStats.total))}(
                {
                  pokemonStats.find(
                    (p) =>
                      p.baseStats.total === Math.max(...pokemonStats.map((p) => p.baseStats.total)),
                  )?.name
                }
                )
              </span>
            </div>
            <div className="flex justify-between">
              <span>Lowest BST:</span>
              <span className="font-medium">
                {Math.min(...pokemonStats.map((p) => p.baseStats.total))}(
                {
                  pokemonStats.find(
                    (p) =>
                      p.baseStats.total === Math.min(...pokemonStats.map((p) => p.baseStats.total)),
                  )?.name
                }
                )
              </span>
            </div>
            <div className="flex justify-between">
              <span>BST Range:</span>
              <span className="font-medium">
                {Math.max(...pokemonStats.map((p) => p.baseStats.total)) -
                  Math.min(...pokemonStats.map((p) => p.baseStats.total))}
              </span>
            </div>
          </div>
        </BentoGridNoLink>

        <BentoGridNoLink>
          <h2 className="text-lg">Team Balance</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Physical Attackers:</span>
              <span className="font-medium">
                {pokemonStats.filter((p) => p.baseStats.attack > p.baseStats.specialAttack).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Special Attackers:</span>
              <span className="font-medium">
                {pokemonStats.filter((p) => p.baseStats.specialAttack > p.baseStats.attack).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Balanced:</span>
              <span className="font-medium">
                {
                  pokemonStats.filter((p) => p.baseStats.attack === p.baseStats.specialAttack)
                    .length
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fast (≥100 Speed):</span>
              <span className="font-medium">
                {pokemonStats.filter((p) => p.baseStats.speed >= 100).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tanky (≥100 HP):</span>
              <span className="font-medium">
                {pokemonStats.filter((p) => p.baseStats.hp >= 100).length}
              </span>
            </div>
          </div>
        </BentoGridNoLink>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading team statistics...</p>
          </div>
        ) : teamStats ? (
          <>
            <BentoGridNoLink>
              <h2>Team Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Total BST</div>
                  <div className="text-2xl font-bold">{Math.round(teamStats.totalBST)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Average BST</div>
                  <div className="text-2xl font-bold">{Math.round(teamStats.averageBST)}</div>
                </div>
              </div>
            </BentoGridNoLink>

            <BentoGridNoLink>
              <h2>Average Base Stats</h2>
              {Object.entries(teamStats.averageStats).map(([stat, value]) => {
                const maxValue = teamStats.maxStats[stat as keyof typeof teamStats.maxStats];
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                return (
                  <div key={stat}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-medium">{Math.round(value)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </BentoGridNoLink>
          </>
        ) : (
          <Alert>
            <AlertTitle>No team data</AlertTitle>
            <AlertDescription>
              Add Pokémon to your team to see detailed statistics.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Enhanced offensive analysis */}
      {offensive.typeEffectiveness && Object.keys(offensive.typeEffectiveness).length > 0 && (
        <div className="mt-6">
          <h3 className="mb-4">Detailed Type Effectiveness</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            {Object.entries(offensive.typeEffectiveness).map(([moveType, effectiveness]) => (
              <BentoGridNoLink key={moveType}>
                <div className="flex items-center gap-2">
                  <Badge variant={moveType.toLowerCase()}>{moveType}</Badge>
                  <span className="text-sm font-medium">moves</span>
                </div>
                <div>
                  <div className="font-medium text-green-700 mb-1">
                    Super Effective ({[...new Set(effectiveness.superEffective)].length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(effectiveness.superEffective)].map((type) => (
                      <Badge key={type} variant={type.toLowerCase()} className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-red-700 mb-1">
                    Not Very Effective ({[...new Set(effectiveness.notVeryEffective)].length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(effectiveness.notVeryEffective)].map((type) => (
                      <Badge key={type} variant={type.toLowerCase()} className="text-xs opacity-50">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </BentoGridNoLink>
            ))}
          </div>
        </div>
      )}

      {/* Ability synergies section */}
      <div className="mt-6">
        <h3 className="mb-4">Ability Analysis</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <BentoGridNoLink>
            <h2 className="text-lg">Team Abilities</h2>
            {abilitySynergies.synergies.length > 0 ? (
              <div className="space-y-2">
                {abilitySynergies.synergies.map((synergy, i) => (
                  <div key={`${synergy.ability}-${i}`} className="p-2 border rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{synergy.ability}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {synergy.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{synergy.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recognized abilities with special effects.
              </p>
            )}
          </BentoGridNoLink>

          <BentoGridNoLink>
            <h2 className="text-lg">Potential Synergies</h2>
            {abilitySynergies.potentialSynergies.length > 0 ? (
              <div className="space-y-2">
                {abilitySynergies.potentialSynergies.map((synergy, i) => (
                  <div key={i} className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">{synergy}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No obvious synergies detected.</p>
            )}

            {Object.keys(abilitySynergies.categoryCounts).length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium mb-2">Ability Categories</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(abilitySynergies.categoryCounts).map(([category, count]) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </BentoGridNoLink>
        </div>
      </div>
    </>
  );
}
