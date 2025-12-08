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
import { useEffect, useState } from 'react';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import TableWrapper from './ui/table-wrapper';
import { BentoGridNoLink } from './ui/bento-box';

// All Pokemon types
const TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

type PokemonType = (typeof TYPES)[number];

// Type effectiveness chart: attacking type -> defending type -> multiplier
// 0 = immune, 0.5 = not very effective, 1 = normal, 2 = super effective
const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Calculate defensive multiplier (how much damage a Pokemon takes from an attacking type)
function getDefensiveMultiplier(defenderTypes: string[], attackingType: PokemonType): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const normalizedDefType = defType.toLowerCase() as PokemonType;
    const effectiveness = TYPE_CHART[attackingType]?.[normalizedDefType];
    if (effectiveness !== undefined) {
      multiplier *= effectiveness;
    }
  }
  return multiplier;
}

type PokemonStats = {
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    specialAttack: number;
    specialDefense: number;
    total: number;
  };
  abilities: string[];
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
  const { showFaithful } = useFaithfulPreferenceSafe();

  // Load type chart when faithful preference changes
  // useEffect(() => {
  //   loadTypeChart();
  // }, [showFaithful]);

  // Load detailed stats for all Pokemon in the team
  useEffect(() => {
    const loadTeamStats = async () => {
      setLoading(true);
      try {
        const statsPromises = team.map(async (pokemon) => {
          if (!pokemon.name) return null;

          try {
            // Extract form from name (e.g., "Slowking (Galarian)" -> form: "galarian")
            const formMatch = pokemon.name.match(/\(([^)]+)\)/);
            const formKey = formMatch ? formMatch[1].toLowerCase().replace(/\s+/g, '') : 'plain';

            // Strip form suffix (e.g., "Slowking (Galarian)" -> "slowking")
            const fileName = pokemon.name
              .toLowerCase()
              .replace(/\s*\([^)]*\)/g, '')
              .trim()
              .replace(/['']/g, '')
              .replace(/[^a-z0-9-]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            const response = await fetch(`/new/pokemon/${fileName}.json`);
            if (!response.ok) throw new Error('Pokemon not found');

            const data = await response.json();

            // Use the new data structure: data.versions.{polished|faithful}.forms.{formKey}
            const version = showFaithful ? 'faithful' : 'polished';
            const formData =
              data.versions?.[version]?.forms?.[formKey] ||
              data.versions?.[version]?.forms?.plain ||
              data.versions?.polished?.forms?.plain;

            const baseStats = formData?.baseStats;
            const abilities = formData?.abilities || [];
            const types = formData?.types || pokemon.types || [];

            // Calculate total BST since it's not in the data
            const total = baseStats
              ? (baseStats.hp || 0) +
                (baseStats.attack || 0) +
                (baseStats.defense || 0) +
                (baseStats.specialAttack || 0) +
                (baseStats.specialDefense || 0) +
                (baseStats.speed || 0)
              : 0;

            return {
              name: pokemon.name,
              types: types,
              baseStats: baseStats
                ? { ...baseStats, total }
                : {
                    hp: 0,
                    attack: 0,
                    defense: 0,
                    speed: 0,
                    specialAttack: 0,
                    specialDefense: 0,
                    total: 0,
                  },
              abilities: abilities,
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
  // const enrichedTeam = team.map((pokemon) => {
  //   if (!pokemon.name) return pokemon;

  //   const pokemonStatData = pokemonStats.find((p) => p.name === pokemon.name);
  //   if (pokemonStatData && pokemonStatData.abilities.length > 0) {
  //     // Always use the first ability from the loaded stats data which respects faithful/polished context
  //     // This ensures calculations are always correct regardless of what's stored in the team data
  //     return {
  //       ...pokemon,
  //       ability: pokemonStatData.abilities[0]?.name || pokemon.ability,
  //       types: pokemon.types,
  //     };
  //   }
  //   return pokemon;
  // });

  // const defensive = computeDefensiveSummary(enrichedTeam);
  // const offensive = computeOffensiveCoverage(enrichedTeam);
  // const abilitySynergies = analyzeAbilitySynergies(enrichedTeam);

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
            .flatMap((p) => p.abilities)
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
              <TableHead className="table-header-label">Type</TableHead>
              {pokemonStats
                .map((pokemon, index) =>
                  pokemon.name ? (
                    <TableHead key={`${pokemon.name}-${index}`} className="table-header-label">
                      {pokemon.name}
                    </TableHead>
                  ) : null,
                )
                .filter(Boolean)}
              <TableHead className="table-header-label text-center">Weaknesses</TableHead>
              <TableHead className="table-header-label text-center">Resistances</TableHead>
              <TableHead className="table-header-label text-center">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TYPES.map((type) => {
              // Calculate summary counts for this type
              let weaknessCount = 0;
              let resistanceCount = 0;

              pokemonStats.forEach((pokemon) => {
                if (!pokemon.name || !pokemon.types?.length) return;
                const multiplier = getDefensiveMultiplier(pokemon.types, type);
                if (multiplier >= 2) {
                  weaknessCount++;
                } else if (multiplier > 0 && multiplier <= 0.5) {
                  resistanceCount++;
                }
              });

              return (
                <TableRow key={type}>
                  <TableCell className="font-medium">
                    <Badge variant={type.toLowerCase() as never}>{type}</Badge>
                  </TableCell>
                  {pokemonStats
                    .map((pokemon, index) => {
                      if (!pokemon.name || !pokemon.types?.length) return null;

                      // Calculate exact effectiveness multiplier for this pokemon vs this attacking type
                      const multiplier = getDefensiveMultiplier(pokemon.types, type);

                      let effectiveness = '1×';
                      let cellClass = 'text-center font-medium';

                      if (multiplier === 0) {
                        effectiveness = '0×';
                        cellClass +=
                          ' bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
                      } else if (multiplier === 4) {
                        effectiveness = '4×';
                        cellClass +=
                          ' bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200 font-black';
                      } else if (multiplier === 2) {
                        effectiveness = '2×';
                        cellClass +=
                          ' bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-semibold';
                      } else if (multiplier === 0.25) {
                        effectiveness = '¼×';
                        cellClass +=
                          ' bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-200 font-black';
                      } else if (multiplier === 0.5) {
                        effectiveness = '½×';
                        cellClass +=
                          ' bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 font-semibold';
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
                      <span className="text-red-800 dark:text-red-400">{weaknessCount}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {resistanceCount > 0 ? (
                      <span className="text-green-800 dark:text-green-400">{resistanceCount}</span>
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
      {/* {offensive.typeEffectiveness && Object.keys(offensive.typeEffectiveness).length > 0 && (
        <div className="mt-6">
          <h3 className="mb-4">Detailed Type Effectiveness</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            {Object.entries(offensive.typeEffectiveness).map(([moveType, effectiveness]) => (
              <BentoGridNoLink key={moveType}>
                <div className="flex items-center">
                  <h3 className=" font-medium">{moveType}</h3>
                </div>
                <div>
                  <div className="table-header-label text-green-700! mb-1">
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
                  <div className="table-header-label text-red-700! mb-1">
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
      )} */}

      {/* Ability synergies section */}
      <div className="mt-6">
        <h3 className="mb-4">Ability Analysis</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <BentoGridNoLink>
            <h2 className="text-lg">Team Abilities</h2>
            {pokemonStats.length > 0 ? (
              <div className="space-y-2">
                {pokemonStats.map((pokemon, i) => {
                  if (!pokemon.abilities?.length) return null;
                  // abilities is an array of strings like ["intimidate", "intimidate", "moxie"]
                  // First two are regular abilities, third is hidden
                  const regularAbilities = pokemon.abilities
                    .slice(0, 2)
                    .filter((a, idx, arr) => a && arr.indexOf(a) === idx);
                  const hiddenAbility = pokemon.abilities[2];

                  return (
                    <div key={`${pokemon.name}-${i}`} className="p-2 border rounded">
                      <div className="font-medium text-sm mb-1">{pokemon.name}</div>
                      <div className="flex flex-wrap gap-1">
                        {regularAbilities.map((ability, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs capitalize">
                            {ability}
                          </Badge>
                        ))}
                        {hiddenAbility && (
                          <Badge variant="outline" className="text-xs capitalize opacity-70">
                            {hiddenAbility} (HA)
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add Pokémon to see their abilities.</p>
            )}
          </BentoGridNoLink>

          <BentoGridNoLink>
            <h2 className="text-lg">Potential Synergies</h2>
            {(() => {
              // Collect all abilities from the team
              const allAbilities = pokemonStats
                .flatMap((p) => p.abilities || [])
                .map((a) => a.toLowerCase());

              const synergies: string[] = [];

              // Weather synergies
              const weatherSetters = {
                drought: 'Sun',
                drizzle: 'Rain',
                sandstream: 'Sandstorm',
                snowwarning: 'Hail',
              };
              const weatherBeneficiaries: Record<string, string[]> = {
                Sun: ['chlorophyll', 'solarpower', 'leafguard', 'flowergift', 'harvest'],
                Rain: ['swiftswim', 'raindish', 'hydration', 'dryskin'],
                Sandstorm: ['sandrush', 'sandforce', 'sandveil'],
                Hail: ['slushrush', 'icebody', 'snowcloak'],
              };

              for (const [setter, weather] of Object.entries(weatherSetters)) {
                if (allAbilities.includes(setter)) {
                  const beneficiaries = weatherBeneficiaries[weather] || [];
                  const hasPartner = beneficiaries.some((b) => allAbilities.includes(b));
                  if (hasPartner) {
                    synergies.push(
                      `${weather} team: ${setter} + ${beneficiaries.find((b) => allAbilities.includes(b))}`,
                    );
                  }
                }
              }

              // Terrain synergies
              if (allAbilities.includes('electricsurge') && allAbilities.includes('surgesurfer')) {
                synergies.push('Electric Terrain: electricsurge + surgesurfer');
              }
              if (allAbilities.includes('psychicsurge') && allAbilities.includes('telepathy')) {
                synergies.push('Psychic Terrain team support');
              }

              // Intimidate stacking
              const intimidateCount = allAbilities.filter((a) => a === 'intimidate').length;
              if (intimidateCount >= 2) {
                synergies.push(`Intimidate cycling (${intimidateCount} users)`);
              }

              // Regenerator core
              const regeneratorCount = allAbilities.filter((a) => a === 'regenerator').length;
              if (regeneratorCount >= 2) {
                synergies.push(`Regenerator core (${regeneratorCount} users)`);
              }

              // Flash Fire + Fire moves
              if (allAbilities.includes('flashfire')) {
                synergies.push('Flash Fire immunity - redirect Fire attacks');
              }

              // Volt Absorb / Lightning Rod
              if (allAbilities.includes('voltabsorb') || allAbilities.includes('lightningrod')) {
                synergies.push('Electric immunity - protect teammates');
              }

              // Storm Drain / Water Absorb
              if (allAbilities.includes('stormdrain') || allAbilities.includes('waterabsorb')) {
                synergies.push('Water immunity - protect teammates');
              }

              // Levitate
              if (allAbilities.includes('levitate')) {
                synergies.push('Levitate - immune to Ground, Earthquake safe');
              }

              return synergies.length > 0 ? (
                <div className="space-y-2">
                  {synergies.map((synergy, i) => (
                    <div
                      key={i}
                      className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-200">{synergy}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {pokemonStats.length > 0
                    ? 'No obvious synergies detected. Consider abilities that complement each other!'
                    : 'Add Pokémon to analyze ability synergies.'}
                </p>
              );
            })()}
          </BentoGridNoLink>
        </div>
      </div>
    </>
  );
}
