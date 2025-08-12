'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PokemonEntry, Nature } from './pokemon-slot';
import { TYPES } from '@/lib/types-data';
import {
  computeDefensiveSummary,
  computeOffensiveCoverage,
  analyzeAbilitySynergies,
} from '@/lib/calculations';
import { useEffect, useState } from 'react';

// Nature effects on stats
const NATURE_EFFECTS: Record<string, { increases?: string; decreases?: string }> = {
  Hardy: {},
  Lonely: { increases: 'Attack', decreases: 'Defense' },
  Brave: { increases: 'Attack', decreases: 'Speed' },
  Adamant: { increases: 'Attack', decreases: 'Special Attack' },
  Naughty: { increases: 'Attack', decreases: 'Special Defense' },
  Bold: { increases: 'Defense', decreases: 'Attack' },
  Docile: {},
  Relaxed: { increases: 'Defense', decreases: 'Speed' },
  Impish: { increases: 'Defense', decreases: 'Special Attack' },
  Lax: { increases: 'Defense', decreases: 'Special Defense' },
  Timid: { increases: 'Speed', decreases: 'Attack' },
  Hasty: { increases: 'Speed', decreases: 'Defense' },
  Serious: {},
  Jolly: { increases: 'Speed', decreases: 'Special Attack' },
  Naive: { increases: 'Speed', decreases: 'Special Defense' },
  Modest: { increases: 'Special Attack', decreases: 'Attack' },
  Mild: { increases: 'Special Attack', decreases: 'Defense' },
  Quiet: { increases: 'Special Attack', decreases: 'Speed' },
  Bashful: {},
  Rash: { increases: 'Special Attack', decreases: 'Special Defense' },
  Calm: { increases: 'Special Defense', decreases: 'Attack' },
  Gentle: { increases: 'Special Defense', decreases: 'Defense' },
  Sassy: { increases: 'Special Defense', decreases: 'Speed' },
  Careful: { increases: 'Special Defense', decreases: 'Special Attack' },
  Quirky: {},
};

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
            return {
              name: pokemon.name,
              baseStats: data.detailedStats?.baseStats || {
                hp: 0,
                attack: 0,
                defense: 0,
                speed: 0,
                specialAttack: 0,
                specialDefense: 0,
                total: 0,
              },
              abilities: data.detailedStats?.abilities || [],
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
  }, [team, disabled]);
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

  const defensive = computeDefensiveSummary(team);
  const offensive = computeOffensiveCoverage(team);
  const abilitySynergies = analyzeAbilitySynergies(team);
  // const detailedDefensive = computeDetailedDefensiveAnalysis(team);

  const maxWeak = Math.max(...TYPES.map((t) => defensive[t]?.weak ?? 0));

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
    <Tabs defaultValue="defensive">
      <TabsList>
        <TabsTrigger value="defensive">Defensive</TabsTrigger>
        <TabsTrigger value="offensive">Offensive</TabsTrigger>
        <TabsTrigger value="stats">Team Stats</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent value="defensive" className="mt-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-x-auto">
            <Table>
              <TableCaption>Team defensive profile by attacking type</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Attack Type</TableHead>
                  <TableHead className="text-right">Weak (≥2x)</TableHead>
                  <TableHead className="text-right">Resist (≤0.5x)</TableHead>
                  <TableHead className="text-right">Immune (0x)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TYPES.map((t) => {
                  const row = defensive[t];
                  return (
                    <TableRow key={t}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge variant={t.toLowerCase()}>{t}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row?.weak ?? 0}</TableCell>
                      <TableCell className="text-right">{row?.resist ?? 0}</TableCell>
                      <TableCell className="text-right">{row?.immune ?? 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">At-risk weaknesses</div>
              <p className="text-xs text-muted-foreground">
                Types with the most team members weak.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TYPES.filter((t) => (defensive[t]?.weak ?? 0) === maxWeak && maxWeak > 0).map(
                  (t, idx) => (
                    <div
                      key={t + idx}
                      className="flex p-1 border-red-100 border bg-red-50 items-center gap-2 rounded-md"
                    >
                      <Badge variant={t.toLowerCase()}>{t}</Badge>
                      <p className="text-xs text-red-800 ">{defensive[t]?.weak} weak</p>
                    </div>
                  ),
                )}
                {maxWeak <= 0 && (
                  <span className="text-sm text-muted-foreground">No standout weaknesses yet.</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Team immunities</div>
              <p className="text-xs text-muted-foreground">
                You have at least one immunity to these types.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TYPES.filter((t) => (defensive[t]?.immune ?? 0) > 0).map((t, idx) => (
                  <div
                    key={t + idx}
                    className="flex p-1 border-emerald-100 border bg-emerald-50 items-center gap-2 rounded-md"
                  >
                    <Badge variant={t.toLowerCase()}>{t}</Badge>
                    <p className="text-xs text-emerald-800 ">{defensive[t]?.immune} immune</p>
                  </div>
                ))}
                {TYPES.every((t) => (defensive[t]?.immune ?? 0) === 0) && (
                  <span className="text-sm text-muted-foreground">No immunities detected.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="offensive" className="mt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-sm font-medium">Super-effective coverage</div>
            <p className="text-xs text-muted-foreground">
              Defender single-types you can hit for 2x with at least one move type.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {offensive.covered.length > 0 ? (
                offensive.covered.map((t, idx) => (
                  <Badge key={t + idx} variant={t.toLowerCase()}>
                    {t}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  No super-effective coverage yet.
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">No super-effective coverage</div>
            <p className="text-xs text-muted-foreground">
              Types you cannot hit super-effectively with any selected move types.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {offensive.missing.length > 0 ? (
                offensive.missing.map((t, idx) => (
                  <div
                    key={t + idx}
                    className="flex p-1 border-amber-100 border bg-amber-50 items-center gap-2 rounded-md"
                  >
                    <Badge variant={t.toLowerCase()}>{t}</Badge>
                    <p className="text-xs text-amber-800">Missing</p>
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  You have super-effective coverage for all types.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium">Move types used</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {offensive.moveTypes.length > 0 ? (
              offensive.moveTypes.map((t, idx) => (
                <Badge key={t + idx} variant={t.toLowerCase()}>
                  {t}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No move types selected.</span>
            )}
          </div>
        </div>

        {/* Enhanced offensive analysis */}
        {offensive.typeEffectiveness && Object.keys(offensive.typeEffectiveness).length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium mb-4">Detailed Type Effectiveness</div>
            <div className="grid gap-4">
              {Object.entries(offensive.typeEffectiveness).map(([moveType, effectiveness]) => (
                <Card key={moveType}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={moveType.toLowerCase()}>{moveType}</Badge>
                      <span className="text-sm font-medium">moves</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-medium text-green-700 mb-1">
                          Super Effective ({effectiveness.superEffective.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {effectiveness.superEffective.map((type, idx) => (
                            <Badge
                              key={type + idx}
                              variant={type.toLowerCase()}
                              className="text-xs"
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-red-700 mb-1">
                          Not Very Effective ({effectiveness.notVeryEffective.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {effectiveness.notVeryEffective.map((type, idx) => (
                            <Badge
                              key={type + idx}
                              variant={type.toLowerCase()}
                              className="text-xs opacity-50"
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ability synergies section */}
        <div className="mt-6">
          <div className="text-sm font-medium mb-4">Ability Analysis</div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Abilities</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Potential Synergies</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="stats" className="mt-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading team statistics...</p>
          </div>
        ) : teamStats ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div>
                  <div className="text-sm font-medium mb-2">Team Members</div>
                  <div className="text-sm text-muted-foreground">
                    {pokemonStats.length} of 6 slots filled
                  </div>
                  <Progress value={(pokemonStats.length / 6) * 100} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Base Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Abilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {teamStats.abilities.length > 0 ? (
                    teamStats.abilities.map((ability) => (
                      <Badge key={ability} variant="secondary">
                        {ability}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No abilities selected</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Natures & Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Natures</div>
                  <div className="flex flex-wrap gap-2">
                    {teamStats.natures.length > 0 ? (
                      teamStats.natures.map((nature, i) => {
                        const effect = NATURE_EFFECTS[nature];
                        return (
                          <Badge
                            key={`${nature}-${i}`}
                            variant="outline"
                            title={
                              effect.increases
                                ? `+${effect.increases}, -${effect.decreases}`
                                : 'Neutral'
                            }
                          >
                            {nature}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">No natures selected</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Held Items</div>
                  <div className="flex flex-wrap gap-2">
                    {teamStats.items.length > 0 ? (
                      teamStats.items.map((item, i) => (
                        <Badge key={`${item}-${i}`} variant="outline">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No items selected</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert>
            <AlertTitle>No team data</AlertTitle>
            <AlertDescription>
              Add Pokémon to your team to see detailed statistics.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      <TabsContent value="details" className="mt-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading detailed analysis...</p>
          </div>
        ) : pokemonStats.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Individual Pokémon base stats and details</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pokémon</TableHead>
                    <TableHead className="text-right">HP</TableHead>
                    <TableHead className="text-right">Atk</TableHead>
                    <TableHead className="text-right">Def</TableHead>
                    <TableHead className="text-right">SpA</TableHead>
                    <TableHead className="text-right">SpD</TableHead>
                    <TableHead className="text-right">Spe</TableHead>
                    <TableHead className="text-right">BST</TableHead>
                    <TableHead>Nature</TableHead>
                    <TableHead>Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pokemonStats.map((pokemon, i) => {
                    const nature = pokemon.nature ? NATURE_EFFECTS[pokemon.nature] : null;
                    return (
                      <TableRow key={`${pokemon.name}-${i}`}>
                        <TableCell className="font-medium">{pokemon.name}</TableCell>
                        <TableCell className="text-right">{pokemon.baseStats.hp}</TableCell>
                        <TableCell
                          className={`text-right ${
                            nature?.increases === 'Attack'
                              ? 'text-green-600 font-semibold'
                              : nature?.decreases === 'Attack'
                                ? 'text-red-600'
                                : ''
                          }`}
                        >
                          {pokemon.baseStats.attack}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            nature?.increases === 'Defense'
                              ? 'text-green-600 font-semibold'
                              : nature?.decreases === 'Defense'
                                ? 'text-red-600'
                                : ''
                          }`}
                        >
                          {pokemon.baseStats.defense}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            nature?.increases === 'Special Attack'
                              ? 'text-green-600 font-semibold'
                              : nature?.decreases === 'Special Attack'
                                ? 'text-red-600'
                                : ''
                          }`}
                        >
                          {pokemon.baseStats.specialAttack}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            nature?.increases === 'Special Defense'
                              ? 'text-green-600 font-semibold'
                              : nature?.decreases === 'Special Defense'
                                ? 'text-red-600'
                                : ''
                          }`}
                        >
                          {pokemon.baseStats.specialDefense}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            nature?.increases === 'Speed'
                              ? 'text-green-600 font-semibold'
                              : nature?.decreases === 'Speed'
                                ? 'text-red-600'
                                : ''
                          }`}
                        >
                          {pokemon.baseStats.speed}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {pokemon.baseStats.total}
                        </TableCell>
                        <TableCell>
                          {pokemon.nature ? (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              title={
                                nature?.increases
                                  ? `+${nature.increases}, -${nature.decreases}`
                                  : 'Neutral'
                              }
                            >
                              {pokemon.nature}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pokemon.item ? (
                            <Badge variant="outline" className="text-xs">
                              {pokemon.item}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stat Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Highest BST:</span>
                      <span className="font-medium">
                        {Math.max(...pokemonStats.map((p) => p.baseStats.total))}(
                        {
                          pokemonStats.find(
                            (p) =>
                              p.baseStats.total ===
                              Math.max(...pokemonStats.map((p) => p.baseStats.total)),
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
                              p.baseStats.total ===
                              Math.min(...pokemonStats.map((p) => p.baseStats.total)),
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Physical Attackers:</span>
                      <span className="font-medium">
                        {
                          pokemonStats.filter((p) => p.baseStats.attack > p.baseStats.specialAttack)
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Attackers:</span>
                      <span className="font-medium">
                        {
                          pokemonStats.filter((p) => p.baseStats.specialAttack > p.baseStats.attack)
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balanced:</span>
                      <span className="font-medium">
                        {
                          pokemonStats.filter(
                            (p) => p.baseStats.attack === p.baseStats.specialAttack,
                          ).length
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
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertTitle>No detailed data</AlertTitle>
            <AlertDescription>
              Add Pokémon to your team to see detailed individual statistics.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>
    </Tabs>
  );
}
