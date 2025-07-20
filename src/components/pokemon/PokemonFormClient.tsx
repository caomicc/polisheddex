'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MoveRow, LocationListItem } from '@/components/pokemon';
import { FormData, Move, MoveDescription, LocationEntry } from '@/types/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { EvolutionChain } from '@/components/ui/EvolutionChain';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { PokemonAbilities } from './pokemon-abilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader } from '../ui/card';
import { GenderPieChart } from './gender-pie-chart';
import PokedexHeader from './PokedexHeader';
import { WeaknessChart } from './WeaknessChart';

export default function PokemonFormClient({
  forms,
  allFormData,
  moveDescData,
  pokemonName,
}: {
  forms: string[];
  allFormData: Record<string, FormData>;
  moveDescData: Record<string, MoveDescription>;
  pokemonName: string;
}) {
  const [selectedForm, setSelectedForm] = useState('default');
  const [activeTab, setActiveTab] = useState('about');

  // Load saved tab from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem('pokemonActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('pokemonActiveTab', value);
  };

  // Convert selectedForm to title case to match keys in allFormData
  const toTitleCase = (str: string) =>
    str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

  const formKey =
    selectedForm === 'default'
      ? 'default'
      : Object.keys(allFormData).find(
          (key) => key.toLowerCase() === toTitleCase(selectedForm).toLowerCase(),
        ) || selectedForm;

  const formData = allFormData[formKey] || allFormData['default'];

  console.log('Form Data:', formData);
  console.log('selectedForm', selectedForm);

  // Deduplicate and normalize forms for dropdown
  const uniqueForms = Array.from(
    new Set(forms.map((f) => f.trim().toLowerCase()).filter((f) => f !== 'default')),
  );

  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === 'development' && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4 mb-4 text-xs text-left overflow-x-auto">
          <details>
            <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-200">
              Debug Panel
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <span className="font-bold">Selected Form:</span> {selectedForm}
              </div>
              <div>
                <span className="font-bold">Form Data:</span>
                <pre className="whitespace-pre-wrap break-all bg-gray-100 dark:bg-gray-800 rounded p-2 mt-1">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-bold">All Forms:</span>
                <pre className="whitespace-pre-wrap break-all bg-gray-100 dark:bg-gray-800 rounded p-2 mt-1">
                  {JSON.stringify(Object.keys(allFormData), null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
      <PokedexHeader
        formData={formData}
        uniqueForms={uniqueForms}
        pokemonName={pokemonName}
        selectedForm={selectedForm}
        setSelectedForm={setSelectedForm}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="moves">Moves</TabsTrigger>
          <TabsTrigger value="evolution">Location</TabsTrigger>
        </TabsList>
        <TabsContent
          value="about"
          className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
        >
          <Card>
            <CardHeader className={'sr-only'}>Species</CardHeader>
            <CardContent className="space-y-2 px-2 md:px-6">
              <p className="text-sm md:text-md text-foreground">{formData.species} Pokémon</p>
              <p className="text-sm md:text-md text-muted-foreground">{formData.description}</p>

              <div className="mt-0 flex flex-row flex-wrap gap-2 md:gap-0 w-full justify-between relative">
                <div className="flex w-full flex-wrap justify-center items-center gap-0">
                  <div className="w-1/3 md:w-1/5 text-center border-r border-gray-200 dark:border-gray-700 last:border-none p-1 relative flex items-center justify-center">
                    {formData.genderRatio &&
                    formData.genderRatio.male === 0 &&
                    formData.genderRatio.female === 0 ? (
                      <div className="translate-y-[-1px] relative flex flex-row justify-center items-center gap-2">
                        <div className="md:text-md text-muted-foreground relative gap-1 flex flex-col justify-start">
                          <div className="text-xs  items-center flex">
                            <div className="aspect-square w-3 md:w-4 inline-block relative mr-1">
                              <Image
                                src={'/icons/genderless-solid.svg'}
                                alt={''}
                                className="inline-block fa-fw"
                                fill
                              />
                            </div>{' '}
                            Genderless
                          </div>
                        </div>
                        <div className="inline-block w-10 h-10 align-middle">
                          <GenderPieChart male={0} female={0} genderless={100} />
                        </div>
                      </div>
                    ) : formData.genderRatio ? (
                      <div className="translate-y-[-1px] relative flex flex-row justify-center items-center gap-1 md:gap-2 w-full">
                        <div className="md:text-md text-muted-foreground relative gap-1 flex flex-col justify-start">
                          <div className="text-[10px] items-center flex">
                            <div className="aspect-square w-3 md:w-4 inline-block relative items-center mr-1">
                              <Image
                                src={'/icons/mars-solid.svg'}
                                alt={''}
                                className="inline-block fa-fw"
                                fill
                              />
                            </div>{' '}
                            {formData.genderRatio.male}%
                          </div>
                          <div className="text-[10px]  items-center flex">
                            <div className="aspect-square w-3 md:w-4 inline-block relative items-center mr-1">
                              <Image
                                src={'/icons/venus-solid.svg'}
                                alt={''}
                                className="inline-block w-full"
                                fill
                              />
                            </div>{' '}
                            {formData.genderRatio.female}%
                          </div>
                        </div>
                        <div className="inline-block w-14">
                          <GenderPieChart
                            male={formData.genderRatio.male ?? 0}
                            female={formData.genderRatio.female ?? 0}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="translate-y-[-1px] relative">
                        <div className="inline-block w-10 h-10 align-middle">
                          <GenderPieChart male={50} female={50} />
                        </div>
                        <div className="text-sm md:text-md text-muted-foreground relative">
                          Unknown
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.baseStats ? (
            <Card>
              <CardHeader className='sr-only'>Base Stats</CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'HP', value: formData.baseStats.hp, color: '*:bg-red-400' },
                  { label: 'Atk', value: formData.baseStats.attack, color: '*:bg-orange-400' },
                  { label: 'Def', value: formData.baseStats.defense, color: '*:bg-yellow-400' },
                  {
                    label: 'Sp. Atk',
                    value: formData.baseStats.specialAttack,
                    color: '*:bg-blue-400',
                  },
                  {
                    label: 'Sp. Def',
                    value: formData.baseStats.specialDefense,
                    color: '*:bg-green-400',
                  },
                  { label: 'Spd', value: formData.baseStats.speed, color: '*:bg-purple-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-row gap-4 items-center">
                    <div className="flex justify-between items-center w-[120px]">
                      <span className="text-xs font-bold leading-none">{label}</span>
                      <span className="text-xs leading-none text-muted-foreground">
                        {value ?? 'N/A'}
                      </span>
                    </div>
                    <Progress
                      value={typeof value === 'number' ? Math.round((value / 255) * 100) : 0}
                      aria-label={`${label} stat`}
                      className={cn(
                        color,
                        'bg-slate-200 dark:bg-slate-800 h-2 w-full rounded-full',
                        'transition-all duration-300 ease-in-out',
                      )}
                    />
                  </div>
                ))}
                <div className="flex justify-between items-center mt-2 border-t pt-2 border-gray-200 dark:border-gray-700">
                  <span className="font-semibold">Total</span>
                  <span className="text-xs text-muted-foreground">
                    {[
                      formData.baseStats.hp,
                      formData.baseStats.attack,
                      formData.baseStats.defense,
                      formData.baseStats.specialAttack,
                      formData.baseStats.specialDefense,
                      formData.baseStats.speed,
                    ].reduce(
                      (sum: number, stat) => (typeof stat === 'number' ? sum + stat : sum),
                      0,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-gray-400 text-sm mb-6">No base stat data</div>
          )}

          <Card>
            <CardHeader className='sr-only'>Abilities</CardHeader>
            <CardContent className="space-y-2">
              <PokemonAbilities
                faithfulAbilities={formData.faithfulAbilities}
                updatedAbilities={formData.updatedAbilities}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='sr-only'>Catch Rate</CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <span className="font-bold">Base Catch Rate</span>: {formData.catchRate}
              </p>
              <span className="flex flex-row items-start justify-between max-w-[300px] mx-auto">
                <div>
                  <p className="flex items-center gap-1 flex-col text-center text-sm mb-2">
                    <Image
                      src="/sprites/items/poke_ball.png"
                      alt="Pokeball Icon"
                      width={32}
                      height={32}
                      className="block rounded-sm"
                    />{' '}
                    Pokeball
                  </p>
                  <p className="text-sm md:text-md text-muted-foreground text-center">
                    <Badge className="bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {(calculateCatchChance(formData.catchRate ?? 0, 'pokeball') * 100).toFixed(1)}
                      %
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 flex-col text-center text-sm mb-2">
                    <Image
                      src="/sprites/items/great_ball.png"
                      alt="Greatball Icon"
                      width={32}
                      height={32}
                      className="block rounded-sm"
                    />{' '}
                    Greatball
                  </p>
                  <p className="text-sm md:text-md text-muted-foreground text-center">
                    <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {(calculateCatchChance(formData.catchRate ?? 0, 'greatball') * 100).toFixed(
                        1,
                      )}
                      %
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 flex-col text-center text-sm mb-2">
                    <Image
                      src="/sprites/items/ultra_ball.png"
                      alt="Ultraball Icon"
                      width={32}
                      height={32}
                      className="block rounded-sm"
                    />{' '}
                    Ultraball
                  </p>
                  <p className="text-sm md:text-md text-muted-foreground text-center">
                    <Badge className="bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      {(calculateCatchChance(formData.catchRate ?? 0, 'ultraball') * 100).toFixed(
                        1,
                      )}
                      %
                    </Badge>
                  </p>
                </div>
              </span>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Sample rates for this pokemon when full HP, actual calculation may vary based on
                status effects, level, and other factors.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Training</CardHeader>
            <CardContent className="space-y-2">
              <Table className="max-w-full">
                <TableHeader className="sr-only">
                  <TableRow>
                    <TableHead className="font-medium w-[120px]">Training Stats</TableHead>
                    <TableHead className="font-medium">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-[120px]">Growth Rate</TableCell>
                    <TableCell>{formData.growthRate}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">EV Yield</TableCell>
                    <TableCell>{formData.evYield || 'None'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium w-[120px]">Base Exp.</TableCell>
                    <TableCell>{formData.baseExp}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Breeding</CardHeader>
            <CardContent className="space-y-2">
              <Table className="max-w-full">
                <TableHeader className="sr-only">
                  <TableRow>
                    <TableHead className="font-medium w-[120px]">Breeding Stats</TableHead>
                    <TableHead className="font-medium">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-[120px]">Egg Groups</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {formData.eggGroups && formData.eggGroups.length > 0 ? (
                          formData.eggGroups.map((group, idx) => (
                            <span key={idx}>
                              {group}
                              {formData.eggGroups && idx < formData.eggGroups.length - 1 && (
                                <span>,</span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">Unknown</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium w-[120px]">Hatch Rate</TableCell>
                    <TableCell>{formData.hatchRate}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Evolution</CardHeader>
            <CardContent className="space-y-2">
              {formData.evolution && formData.evolution.chain ? (
                <EvolutionChain
                  chain={formData.evolution.chain}
                  chainWithMethods={formData.evolution.chainWithMethods || {}}
                  spritesByGen={(() => {
                    const sprites: Record<string, string> = {};

                    // Add sprites for base chain Pokémon
                    formData.evolution.chain.forEach((name) => {
                      // Try to find an entry in allFormData for this Pokémon
                      for (const [formKey, formDataEntry] of Object.entries(allFormData)) {
                        if (
                          formDataEntry.frontSpriteUrl &&
                          formKey.toLowerCase() === name.toLowerCase()
                        ) {
                          sprites[name] = formDataEntry.frontSpriteUrl;
                          break;
                        }
                      }
                    });

                    // Add sprites for form variants
                    if (formData.evolution.chainWithMethods) {
                      Object.entries(formData.evolution.chainWithMethods).forEach(
                        ([source, methods]) => {
                          console.log(`Processing methods for source: ${source}`, methods);
                          methods.forEach((method) => {
                            if (method.target && method.form) {
                              const formVariantKey = `${method.target} (${method.form})`;

                              // Try to find form variant in allFormData
                              for (const [formKey, formDataEntry] of Object.entries(allFormData)) {
                                // Check if this is the right form
                                if (
                                  formKey.toLowerCase().includes(method.form.toLowerCase()) &&
                                  formKey.toLowerCase().includes(method.target.toLowerCase()) &&
                                  formDataEntry.frontSpriteUrl
                                ) {
                                  sprites[formVariantKey] = formDataEntry.frontSpriteUrl;
                                  break;
                                }
                              }
                            }
                          });
                        },
                      );
                    }

                    return sprites;
                  })()}
                />
              ) : (
                <div className="text-gray-500">No evolution data.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value="stats"
          className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
        >

          <Card>
            <CardHeader className='sr-only'>Type Relations</CardHeader>
            <CardContent className="space-y-2">
              <div
                className={cn(
                  'grid grid-cols-1 gap-6',
                  formData.updatedTypes ? 'md:grid-cols-2' : '',
                )}
              >
                <div>
                  <WeaknessChart
                    types={
                      Array.isArray(formData.types)
                        ? formData.types.map((t: string) => t.toLowerCase())
                        : formData.types
                        ? [formData.types.toLowerCase()]
                        : []
                    }
                    variant='Faithful'
                  />
                </div>
                <div>
                  <WeaknessChart
                    types={
                      Array.isArray(formData.updatedTypes)
                        ? formData.updatedTypes.map((t: string) => t.toLowerCase())
                        : formData.updatedTypes
                        ? [formData.updatedTypes.toLowerCase()]
                        : []
                    }
                    variant='Polished'
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value="moves"
          className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
        >
          <Card>
            <CardHeader>
              Moves*{' '}
              <span className="text-muted-foreground italic text-xs">
                *Faithful vs. Polished movesets coming soon!
              </span>
            </CardHeader>
            <CardContent className="space-y-2 px-0 md:px-6">
              <Tabs defaultValue="level-up" className="w-full">
                <div className="px-4 md:px-0">
                  <TabsList className="w-full">
                    <TabsTrigger value="level-up">Level Up</TabsTrigger>
                    <TabsTrigger value="egg">Egg Moves</TabsTrigger>
                    <TabsTrigger value="tm-hm">TM/HM</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="level-up">
                  {/* Moves List */}
                  {formData.moves && Array.isArray(formData.moves) && formData.moves.length > 0 ? (
                    <Table>
                      <TableHeader className={'hidden md:table-header-group'}>
                        <TableRow>
                          <TableHead className="attheader cen align-middle text-left w-[60px]">
                            Level
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[180px]">
                            Attack Name
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Type
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Cat.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Att.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Acc.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            PP
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Effect %
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.moves.map((moveData: Move) => {
                          const moveInfo = moveDescData[moveData.name] || null;
                          return (
                            <MoveRow
                              key={`move-${moveData.name}-${moveData.level}`}
                              name={moveData.name}
                              level={moveData.level}
                              info={moveInfo}
                            />
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-gray-400 text-sm mb-6">No move data</div>
                  )}
                </TabsContent>
                <TabsContent value="egg">
                  {formData.eggMoves &&
                  Array.isArray(formData.eggMoves) &&
                  formData.eggMoves.length > 0 ? (
                    <Table>
                      <TableHeader className={'hidden md:table-header-group'}>
                        <TableRow>
                          <TableHead className="attheader cen align-middle text-left w-[60px]">
                            Level
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[180px]">
                            Attack Name
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Type
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Cat.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Att.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Acc.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            PP
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Effect %
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.eggMoves.map((moveName: string) => {
                          const moveInfo = moveDescData[moveName] || null;
                          return (
                            <MoveRow
                              key={`egg-${moveName}`}
                              name={moveName}
                              level={1}
                              info={moveInfo}
                            />
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-gray-400 text-sm mb-6">No egg moves</div>
                  )}
                </TabsContent>
                <TabsContent value="tm-hm">
                  {formData.tmHmLearnset &&
                  Array.isArray(formData.tmHmLearnset) &&
                  formData.tmHmLearnset.length > 0 ? (
                    <Table>
                      <TableHeader className={'hidden md:table-header-group'}>
                        <TableRow>
                          <TableHead className="attheader cen align-middle text-left w-[60px]">
                            Level
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[180px]">
                            Attack Name
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Type
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Cat.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Att.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Acc.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            PP
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            Effect %
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.tmHmLearnset.map((move) => {
                          const moveInfo = moveDescData[move.name] || null;
                          return (
                            <MoveRow
                              key={`tm-${move.name}`}
                              name={move.name}
                              level={move.level}
                              info={moveInfo}
                            />
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-gray-400 text-sm mb-6">No learnset</div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value="evolution"
          className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
        >
          <Card>
            <CardHeader>Locations</CardHeader>
            <CardContent className="space-y-2">
              {formData.locations &&
              Array.isArray(formData.locations) &&
              formData.locations.length > 0 ? (
                <Table>
                  <TableHeader className={'hidden md:table-header-group'}>
                    <TableRow>
                      <TableHead className="attheader cen align-middle text-left w-[60px]">
                        Area
                      </TableHead>
                      <TableHead className="attheader cen align-middle text-left w-[180px]">
                        Method
                      </TableHead>
                      <TableHead className="attheader cen align-middle text-left w-[80px]">
                        Time
                      </TableHead>
                      <TableHead className="attheader cen align-middle text-left w-[80px]">
                        Level
                      </TableHead>
                      <TableHead className="attheader cen align-middle text-left w-[80px]">
                        Encounter Rate
                      </TableHead>
                      <TableHead className="attheader cen align-middle text-left w-[80px]">
                        Held Item
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Show all slots for this Pokémon, not just one per area/method/time */}
                    {formData.locations.map((loc: LocationEntry, idx: number) => (
                      <LocationListItem
                        key={idx}
                        area={loc.area}
                        method={loc.method}
                        time={loc.time}
                        level={loc.level}
                        chance={loc.chance}
                        rareItem={loc.rareItem}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-gray-400 text-sm mb-6">No location data</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Calculates the catch probability for a Pokémon at full HP, no status, using Gen 2 mechanics.
 * @param baseCatchRate The Pokémon's base catch rate (0-255)
 * @param ballType The type of Poké Ball used
 * @returns Probability (0-1) of catching the Pokémon
 */
/**
 * Calculates the catch probability for a Pokémon using Polished/Gen 2 mechanics.
 * @param baseCatchRate The Pokémon's base catch rate (0-255)
 * @param ballType The type of Poké Ball used
 * @param currentHP The Pokémon's current HP
 * @param maxHP The Pokémon's max HP
 * @param status Status condition: 'none', 'par', 'brn', 'psn', 'frz', 'slp'
 * @param speciesWeight (kg) Only needed for Heavy Ball
 * @returns Probability (0-1) of catching the Pokémon
 */
export function calculateCatchChance(
  baseCatchRate: number,
  ballType: 'pokeball' | 'greatball' | 'ultraball' | 'heavyball' = 'pokeball',
  currentHP: number = 100,
  maxHP: number = 100,
  status: 'none' | 'par' | 'brn' | 'psn' | 'frz' | 'slp' = 'none',
  // speciesWeight?: number,
) {

console.log('Calculating catch chance with parameters:', {
  baseCatchRate,
  ballType,
  currentHP,
  maxHP,
  status,
});

  const num = baseCatchRate / 3;

  // Step 2: Use the lookup table to get the wobble threshold for this value
  const wobbleTable: Array<{ a: number; b: number }> = [
    { a: 1, b: 90 }, { a: 2, b: 103 }, { a: 3, b: 111 }, { a: 4, b: 117 }, { a: 5, b: 122 },
    { a: 6, b: 126 }, { a: 7, b: 130 }, { a: 8, b: 133 }, { a: 9, b: 136 }, { a: 10, b: 139 },
    { a: 11, b: 141 }, { a: 12, b: 144 }, { a: 13, b: 146 }, { a: 14, b: 148 }, { a: 15, b: 150 },
    { a: 16, b: 152 }, { a: 17, b: 154 }, { a: 18, b: 155 }, { a: 19, b: 157 }, { a: 20, b: 158 },
    { a: 21, b: 160 }, { a: 22, b: 161 }, { a: 23, b: 163 }, { a: 24, b: 164 }, { a: 25, b: 165 },
    { a: 26, b: 166 }, { a: 27, b: 168 }, { a: 28, b: 169 }, { a: 29, b: 170 }, { a: 30, b: 171 },
    { a: 31, b: 172 }, { a: 32, b: 173 }, { a: 33, b: 174 }, { a: 34, b: 175 }, { a: 35, b: 176 },
    { a: 36, b: 177 }, { a: 37, b: 178 }, { a: 38, b: 179 }, { a: 39, b: 180 }, { a: 41, b: 181 },
    { a: 42, b: 182 }, { a: 43, b: 183 }, { a: 44, b: 184 }, { a: 46, b: 185 }, { a: 47, b: 186 },
    { a: 48, b: 187 }, { a: 50, b: 188 }, { a: 51, b: 189 }, { a: 52, b: 190 }, { a: 54, b: 191 },
    { a: 55, b: 192 }, { a: 57, b: 193 }, { a: 59, b: 194 }, { a: 60, b: 195 }, { a: 62, b: 196 },
    { a: 64, b: 197 }, { a: 65, b: 198 }, { a: 67, b: 199 }, { a: 69, b: 200 }, { a: 71, b: 201 },
    { a: 73, b: 202 }, { a: 75, b: 203 }, { a: 76, b: 204 }, { a: 78, b: 205 }, { a: 81, b: 206 },
    { a: 83, b: 207 }, { a: 85, b: 208 }, { a: 87, b: 209 }, { a: 89, b: 210 }, { a: 91, b: 211 },
    { a: 94, b: 212 }, { a: 96, b: 213 }, { a: 99, b: 214 }, { a: 101, b: 215 }, { a: 104, b: 216 },
    { a: 106, b: 217 }, { a: 109, b: 218 }, { a: 111, b: 219 }, { a: 114, b: 220 }, { a: 117, b: 221 },
    { a: 120, b: 222 }, { a: 123, b: 223 }, { a: 126, b: 224 }, { a: 129, b: 225 }, { a: 132, b: 226 },
    { a: 135, b: 227 }, { a: 138, b: 228 }, { a: 141, b: 229 }, { a: 145, b: 230 }, { a: 148, b: 231 },
    { a: 151, b: 232 }, { a: 155, b: 233 }, { a: 158, b: 234 }, { a: 162, b: 235 }, { a: 166, b: 236 },
    { a: 170, b: 237 }, { a: 173, b: 238 }, { a: 177, b: 239 }, { a: 181, b: 240 }, { a: 185, b: 241 },
    { a: 189, b: 242 }, { a: 194, b: 243 }, { a: 198, b: 244 }, { a: 202, b: 245 }, { a: 207, b: 246 },
    { a: 211, b: 247 }, { a: 216, b: 248 }, { a: 220, b: 249 }, { a: 225, b: 250 }, { a: 230, b: 251 },
    { a: 235, b: 252 }, { a: 240, b: 253 }, { a: 245, b: 254 }, { a: 250, b: 255 }, { a: 255, b: 255 },
  ];

  let adjustedNum = num;
  if (ballType === 'greatball') {
    adjustedNum = num * 1.5;
  } else if (ballType === 'ultraball') {
    adjustedNum = Math.ceil(num * 2);
  }

  // Find the closest lower and higher a values for interpolation
  const roundedNum = Math.round(adjustedNum);
  let polishedCatchRate: number;
  const exact = wobbleTable.find((entry) => entry.a === roundedNum);
  if (exact) {
    polishedCatchRate = exact.b;
  } else {
    // Interpolate between closest lower and higher
    const lower = [...wobbleTable].reverse().find((entry) => entry.a < roundedNum);
    const higher = wobbleTable.find((entry) => entry.a > roundedNum);
    if (lower && higher) {
      // Linear interpolation
      const ratio = (roundedNum - lower.a) / (higher.a - lower.a);
      polishedCatchRate = Math.round(lower.b + (higher.b - lower.b) * ratio);
    } else if (lower) {
      polishedCatchRate = lower.b;
    } else if (higher) {
      polishedCatchRate = higher.b;
    } else {
      polishedCatchRate = 0;
    }
  }

  const newNum = polishedCatchRate + 1;

  const polishedProb = Math.pow(newNum / 256, 4);

  console.log('Initial catch rate (baseCatchRate / 3):', num);
  console.log('Polished catch rate:', polishedCatchRate);
  console.log('Polished probability:', polishedProb);

  return polishedProb;
}
