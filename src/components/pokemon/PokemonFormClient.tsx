'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { MoveRow, LocationListItem } from '@/components/pokemon';
import { FormData, Move, MoveDescription, LocationEntry, Ability } from '@/types/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { EvolutionChain } from './EvolutionChain';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { PokemonAbilities } from './pokemon-abilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { GenderPieChart } from './gender-pie-chart';
import PokedexHeader from './PokedexHeader';
import { WeaknessChart } from './WeaknessChart';
import PokemonTypeSetter from './PokemonTypeSetter';
import SectionCard from './SectionCard';
import { useQueryState } from 'nuqs';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonSprite } from './pokemon-sprite';
import { loadAbilityById } from '@/utils/loaders/ability-data-loader';
// import { Ability } from '@/types/abilityTypes';

// Helper function to deduplicate moves based on name and level
function deduplicateMoves(moves: Move[]): Move[] {
  const seen = new Set<string>();
  return moves.filter((move) => {
    const key = `${move.name}-${move.level}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

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
  const [selectedForm, setSelectedForm] = useQueryState('form', {
    defaultValue: 'default',
  });
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'stats',
  });
  const { showFaithful } = useFaithfulPreference();

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

  // console.log('Form Data:', formData);
  // console.log('selectedForm', selectedForm);

  // Deduplicate and normalize forms for dropdown
  const uniqueForms = Array.from(
    new Set(forms.map((f) => f.trim().toLowerCase()).filter((f) => f !== 'default')),
  );

  console.log('Unique Forms:', formData);

  return (
    <>
      {/* Set Pokemon type theme based on current form */}
      <PokemonTypeSetter
        primaryType={(showFaithful ? formData.types : formData.updatedTypes) || null}
        secondaryType={undefined}
      />
      <div className="space-y-6">
        <PokedexHeader
          formData={formData}
          uniqueForms={uniqueForms}
          pokemonName={pokemonName}
          selectedForm={selectedForm}
          setSelectedForm={setSelectedForm}
        />

        <Tabs
          defaultValue={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className={cn(`w-full`, 'pokemon-tab-background')}>
            <TabsTrigger className="pokemon-hero-text" value="stats">
              Stats
            </TabsTrigger>
            <TabsTrigger className="pokemon-hero-text" value="moves">
              Moves
            </TabsTrigger>
            <TabsTrigger className="pokemon-hero-text" value="location">
              Location
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="stats"
            className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
          >
            <SectionCard headline={'Base Stats'} className="">
              <div className="flex flex-col md:flex-row gap-12 items-start mb-6">
                <div className="md:flex-1 flex h-full w-full">
                  {(() => {
                    // Determine which base stats to show based on faithful preference
                    const baseStatsToShow = showFaithful
                      ? formData.faithfulBaseStats || formData.baseStats
                      : formData.polishedBaseStats || formData.baseStats;

                    return baseStatsToShow ? (
                      <div className="space-y-4 w-full">
                        <h3>Base Stats:</h3>
                        {[
                          { label: 'HP', value: baseStatsToShow.hp, color: '*:bg-red-400' },
                          {
                            label: 'Atk',
                            value: baseStatsToShow.attack,
                            color: '*:bg-orange-400',
                          },
                          {
                            label: 'Def',
                            value: baseStatsToShow.defense,
                            color: '*:bg-yellow-400',
                          },
                          {
                            label: 'Sp. Atk',
                            value: baseStatsToShow.specialAttack,
                            color: '*:bg-blue-400',
                          },
                          {
                            label: 'Sp. Def',
                            value: baseStatsToShow.specialDefense,
                            color: '*:bg-green-400',
                          },
                          { label: 'Spd', value: baseStatsToShow.speed, color: '*:bg-purple-400' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex flex-row gap-4 items-center">
                            <div className="flex justify-between items-center w-[120px]">
                              <span className="text-xs font-bold leading-none">{label}</span>
                              <span className="text-xs leading-none text-muted-foreground">
                                {value ?? 'N/A'}
                              </span>
                            </div>
                            <Progress
                              value={
                                typeof value === 'number' ? Math.round((value / 255) * 100) : 0
                              }
                              aria-label={`${label} stat`}
                              className={cn(
                                color,
                                'dark:bg-slate-800 h-2 w-full rounded-full',
                                'transition-all duration-300 ease-in-out',
                              )}
                            />
                          </div>
                        ))}
                        <div className="flex justify-between items-center mt-2 border-t pt-2 border-gray-200 dark:border-gray-700">
                          <span className="font-semibold">Total</span>
                          <span className="text-xs text-muted-foreground">
                            {[
                              baseStatsToShow.hp,
                              baseStatsToShow.attack,
                              baseStatsToShow.defense,
                              baseStatsToShow.specialAttack,
                              baseStatsToShow.specialDefense,
                              baseStatsToShow.speed,
                            ].reduce(
                              (sum: number, stat) => (typeof stat === 'number' ? sum + stat : sum),
                              0,
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm mb-6">No base stat data</div>
                    );
                  })()}
                </div>
                <div className="md:flex-1 md:h-[100%] flex ">
                  <div className={cn('flex flex-col gap-6')}>
                    {showFaithful ? (
                      <div>
                        <WeaknessChart
                          types={
                            Array.isArray(formData.types)
                              ? formData.types.map((t: string) => t.toLowerCase())
                              : formData.types
                                ? [formData.types.toLowerCase()]
                                : []
                          }
                          variant="Faithful"
                        />
                      </div>
                    ) : formData.updatedTypes ? (
                      <div>
                        <WeaknessChart
                          types={
                            Array.isArray(formData.updatedTypes)
                              ? formData.updatedTypes.map((t: string) => t.toLowerCase())
                              : formData.updatedTypes
                                ? [formData.updatedTypes.toLowerCase()]
                                : []
                          }
                          variant="Polished"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <PokemonAbilities
                abilities={formData.abilities}
                faithfulAbilities={formData.faithfulAbilities}
                updatedAbilities={formData.updatedAbilities}
              />
            </SectionCard>

            <SectionCard headline={'Catch Rate'}>
              <h3 className="mb-2">Base Catch Rate: {formData.catchRate}</h3>
              <span className="flex flex-row items-start justify-between max-w-[300px] w-full mx-auto">
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
            </SectionCard>
            <SectionCard headline={'Training'}>
              <h3>Training Stats:</h3>
              <Table className="max-w-full">
                <TableHeader className="sr-only">
                  <TableRow>
                    <TableHead>Training Stats</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-left">Growth Rate</TableCell>
                    <TableCell className="text-left">{formData.growthRate}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left">EV Yield</TableCell>
                    <TableCell className="text-left">{formData.evYield || 'None'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left">Base Exp.</TableCell>
                    <TableCell className="text-left">{formData.baseExp}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left">Egg Groups</TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-start gap-1">
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
                    <TableCell className="text-left">Hatch Rate</TableCell>
                    <TableCell className="text-left">{formData.hatchRate}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </SectionCard>
            <SectionCard headline={'Species Information'}>
              <h3>Pokédex Entry:</h3>
              <p className="text-sm md:text-md text-foreground text-left">
                {formData.species} Pokémon
              </p>
              <p className="text-sm md:text-md text-muted-foreground text-left">
                {formData.description}
              </p>

              <h3 className={cn('my-4')}>Sprites:</h3>

              <div className="flex flex-row gap-4 items-start justify-center mb-8">
                <div className="flex flex-col items-center justify-center gap-2">
                  <PokemonSprite pokemonName={pokemonName} />

                  <span className="text-xs font-bold text-muted-foreground capitalize leading-none ">
                    Front Sprite
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <PokemonSprite pokemonName={pokemonName} type="animated" />
                  <span className="text-xs font-bold text-muted-foreground capitalize leading-base">
                    Front Sprite
                    <br />
                    (Animated)
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <PokemonSprite pokemonName={pokemonName} variant="shiny" />
                  <span className="text-xs font-bold text-muted-foreground capitalize leading-none">
                    Shiny Sprite
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <PokemonSprite pokemonName={pokemonName} variant="shiny" type="animated" />

                  <span className="text-xs font-bold text-muted-foreground capitalize leading-base">
                    Shiny Sprite
                    <br />
                    (Animated)
                  </span>
                </div>
              </div>

              <div className="mt-0 flex flex-row flex-wrap gap-2 md:gap-0 w-full just</div>ify-between relative">
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
            </SectionCard>

            {formData.evolution &&
            formData.evolution.chainWithMethods &&
            Object.keys(formData.evolution.chainWithMethods).length > 1 ? (
              <SectionCard headline={'Evolution'}>
                <h3>Evolution:</h3>

                <EvolutionChain
                  evolutionData={{
                    chain: formData.evolution.chain,
                    chainWithMethods: formData.evolution.chainWithMethods || {},
                    methods: formData.evolution.methods || [], // if not present, fallback to empty array
                  }}
                  spritesByGen={(() => {
                    const sprites: Record<string, string> = {};

                    // Add sprites for base chain Pokémon
                    formData.evolution.chain.forEach((name) => {
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
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        ([source, methods]) => {
                          methods.forEach((method) => {
                            if (method.target && method.form) {
                              const formVariantKey = `${method.target} (${method.form})`;

                              for (const [formKey, formDataEntry] of Object.entries(allFormData)) {
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
              </SectionCard>
            ) : (
              <div className="text-gray-500 text-center w-full my-4 text-sm">
                No evolution data.
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="moves"
            className="text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
          >
            <SectionCard headline={'Moves'}>
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
                  {(() => {
                    // Determine which moves to show based on toggle
                    let movesToShow: Move[] = [];

                    if (showFaithful) {
                      // Show faithful moves if available, otherwise fall back to regular moves
                      const faithfulMoves =
                        formData.faithfulLevelMoves && formData.faithfulLevelMoves.length > 0
                          ? formData.faithfulLevelMoves
                          : formData.moves || [];

                      // Deduplicate moves (same name + level)
                      movesToShow = deduplicateMoves(faithfulMoves);
                    } else {
                      // Show updated moves combined with regular moves
                      const regularMoves = formData.moves || [];
                      const updatedMoves = formData.updatedLevelMoves || [];

                      // Combine regular and updated moves, with updated moves taking precedence
                      const combinedMoves = [...regularMoves];
                      for (const updatedMove of updatedMoves) {
                        const existingIndex = combinedMoves.findIndex(
                          (m) => m.level === updatedMove.level && m.name === updatedMove.name,
                        );
                        if (existingIndex >= 0) {
                          combinedMoves[existingIndex] = updatedMove;
                        } else {
                          combinedMoves.push(updatedMove);
                        }
                      }

                      // Deduplicate and sort by level
                      movesToShow = deduplicateMoves(combinedMoves).sort(
                        (a: Move, b: Move) => Number(a.level) - Number(b.level),
                      );
                    }

                    return movesToShow && Array.isArray(movesToShow) && movesToShow.length > 0 ? (
                      <div>
                        <Table>
                          <TableHeader className={'hidden md:table-header-group'}>
                            <TableRow>
                              <TableHead className="attheader cen align-middle text-left md:w-[60px]">
                                Level
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[180px]">
                                Attack Name
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                                Type
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                                Cat.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                                Att.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                                Acc.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                                PP
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left w-[80px]">
                                TM/HM
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {movesToShow.map((moveData: Move, index: number) => {
                              const moveInfo =
                                moveDescData[moveData.name.toLowerCase().replace(/\s+/g, '-')] ??
                                undefined;

                              return (
                                <MoveRow
                                  key={`move-${moveData.name}-${moveData.level}-${showFaithful ? 'faithful' : 'polished'}-${index}`}
                                  name={moveData.name}
                                  level={moveData.level}
                                  info={moveInfo}
                                />
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm mb-6">
                        No {showFaithful ? 'faithful' : 'updated'} move data
                      </div>
                    );
                  })()}
                </TabsContent>
                <TabsContent value="egg">
                  {formData.eggMoves &&
                  Array.isArray(formData.eggMoves) &&
                  formData.eggMoves.length > 0 ? (
                    <Table>
                      <TableHeader className={'hidden md:table-header-group'}>
                        <TableRow>
                          <TableHead className="attheader cen align-middle text-left md:w-[238px]">
                            Attack Name
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            Type
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            Cat.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            Att.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            Acc.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            PP
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            TM/HM
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.eggMoves.map((moveData: Move, index) => {
                          const keyMoveName = (moveData as unknown as Move['name'])
                            ?.toLowerCase()
                            .replace(/\s+/g, '-');

                          const moveInfo = moveDescData[keyMoveName] ?? undefined;

                          console.log(
                            `Rendering egg move: ${moveData.name} (key: ${keyMoveName})`,
                            moveInfo,
                          );

                          return (
                            <MoveRow
                              key={`eggmove-${index}`}
                              name={moveData.name || (moveData as unknown as Move['name'])}
                              info={moveInfo}
                              level={moveData.level}
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
                          <TableHead className="attheader cen align-middle text-left md:w-[238px]">
                            Attack Name
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            Type
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            Cat.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            Att.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            Acc.
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left md:w-[80px]">
                            PP
                          </TableHead>
                          <TableHead className="attheader cen align-middle text-left w-[80px]">
                            TM/HM
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.tmHmLearnset.map((moveData) => {
                          const moveInfo =
                            moveDescData[moveData.name.toLowerCase().replace(/\s+/g, '-')] ??
                            undefined;
                          return (
                            <MoveRow
                              key={`tm-${moveData.name}`}
                              name={moveData.name}
                              level={moveData.level}
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
            </SectionCard>
          </TabsContent>
          <TabsContent
            value="location"
            className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
          >
            <SectionCard headline={'Locations'}>
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
            </SectionCard>
          </TabsContent>
        </Tabs>
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
      </div>
    </>
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
  // currentHP: number = 100,
  // maxHP: number = 100,
  // status: 'none' | 'par' | 'brn' | 'psn' | 'frz' | 'slp' = 'none',
  // speciesWeight?: number,
) {
  // console.log('Calculating catch chance with parameters:', {
  //   baseCatchRate,
  //   ballType,
  //   currentHP,
  //   maxHP,
  //   status,
  // });

  const num = baseCatchRate / 3;

  // Step 2: Use the lookup table to get the wobble threshold for this value
  const wobbleTable: Array<{ a: number; b: number }> = [
    { a: 1, b: 90 },
    { a: 2, b: 103 },
    { a: 3, b: 111 },
    { a: 4, b: 117 },
    { a: 5, b: 122 },
    { a: 6, b: 126 },
    { a: 7, b: 130 },
    { a: 8, b: 133 },
    { a: 9, b: 136 },
    { a: 10, b: 139 },
    { a: 11, b: 141 },
    { a: 12, b: 144 },
    { a: 13, b: 146 },
    { a: 14, b: 148 },
    { a: 15, b: 150 },
    { a: 16, b: 152 },
    { a: 17, b: 154 },
    { a: 18, b: 155 },
    { a: 19, b: 157 },
    { a: 20, b: 158 },
    { a: 21, b: 160 },
    { a: 22, b: 161 },
    { a: 23, b: 163 },
    { a: 24, b: 164 },
    { a: 25, b: 165 },
    { a: 26, b: 166 },
    { a: 27, b: 168 },
    { a: 28, b: 169 },
    { a: 29, b: 170 },
    { a: 30, b: 171 },
    { a: 31, b: 172 },
    { a: 32, b: 173 },
    { a: 33, b: 174 },
    { a: 34, b: 175 },
    { a: 35, b: 176 },
    { a: 36, b: 177 },
    { a: 37, b: 178 },
    { a: 38, b: 179 },
    { a: 39, b: 180 },
    { a: 41, b: 181 },
    { a: 42, b: 182 },
    { a: 43, b: 183 },
    { a: 44, b: 184 },
    { a: 46, b: 185 },
    { a: 47, b: 186 },
    { a: 48, b: 187 },
    { a: 50, b: 188 },
    { a: 51, b: 189 },
    { a: 52, b: 190 },
    { a: 54, b: 191 },
    { a: 55, b: 192 },
    { a: 57, b: 193 },
    { a: 59, b: 194 },
    { a: 60, b: 195 },
    { a: 62, b: 196 },
    { a: 64, b: 197 },
    { a: 65, b: 198 },
    { a: 67, b: 199 },
    { a: 69, b: 200 },
    { a: 71, b: 201 },
    { a: 73, b: 202 },
    { a: 75, b: 203 },
    { a: 76, b: 204 },
    { a: 78, b: 205 },
    { a: 81, b: 206 },
    { a: 83, b: 207 },
    { a: 85, b: 208 },
    { a: 87, b: 209 },
    { a: 89, b: 210 },
    { a: 91, b: 211 },
    { a: 94, b: 212 },
    { a: 96, b: 213 },
    { a: 99, b: 214 },
    { a: 101, b: 215 },
    { a: 104, b: 216 },
    { a: 106, b: 217 },
    { a: 109, b: 218 },
    { a: 111, b: 219 },
    { a: 114, b: 220 },
    { a: 117, b: 221 },
    { a: 120, b: 222 },
    { a: 123, b: 223 },
    { a: 126, b: 224 },
    { a: 129, b: 225 },
    { a: 132, b: 226 },
    { a: 135, b: 227 },
    { a: 138, b: 228 },
    { a: 141, b: 229 },
    { a: 145, b: 230 },
    { a: 148, b: 231 },
    { a: 151, b: 232 },
    { a: 155, b: 233 },
    { a: 158, b: 234 },
    { a: 162, b: 235 },
    { a: 166, b: 236 },
    { a: 170, b: 237 },
    { a: 173, b: 238 },
    { a: 177, b: 239 },
    { a: 181, b: 240 },
    { a: 185, b: 241 },
    { a: 189, b: 242 },
    { a: 194, b: 243 },
    { a: 198, b: 244 },
    { a: 202, b: 245 },
    { a: 207, b: 246 },
    { a: 211, b: 247 },
    { a: 216, b: 248 },
    { a: 220, b: 249 },
    { a: 225, b: 250 },
    { a: 230, b: 251 },
    { a: 235, b: 252 },
    { a: 240, b: 253 },
    { a: 245, b: 254 },
    { a: 250, b: 255 },
    { a: 255, b: 255 },
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

  // console.log('Initial catch rate (baseCatchRate / 3):', num);
  // console.log('Polished catch rate:', polishedCatchRate);
  // console.log('Polished probability:', polishedProb);

  return polishedProb;
}
