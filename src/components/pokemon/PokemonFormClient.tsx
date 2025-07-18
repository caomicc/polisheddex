'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { MoveRow, LocationListItem } from '@/components/pokemon';
import { FormData, Move, MoveDescription, PokemonType, LocationEntry } from '@/types/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { EvolutionChain } from '@/components/ui/EvolutionChain';
import { TypeRelationsChart } from './TypeRelationsChart';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { PokemonAbilities } from './pokemon-abilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader } from '../ui/card';
import { GenderPieChart } from './gender-pie-chart';
import PokemonFormSelect from './PokemonFormSelect';

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
      <div className="max-w-4xl mx-auto rounded-xl overflow-hidden">
        <div
          className={cn(
            'relative py-4 px-4 md:p-6 md:dark:from-gray-800 md:dark:to-gray-900 flex flex-col md:flex-row md:items-center justify-start gap-6',
            `bg-${
              formData.types
                ? typeof formData.types === 'string'
                  ? formData.types.toLowerCase()
                  : Array.isArray(formData.types) && formData.types.length > 0
                  ? formData.types[0].toLowerCase()
                  : 'unknown'
                : 'unknown'
            }-20`,
            `dark:bg-${
              formData.types
                ? typeof formData.types === 'string'
                  ? formData.types.toLowerCase()
                  : Array.isArray(formData.types) && formData.types.length > 0
                  ? formData.types[0].toLowerCase()
                  : 'unknown'
                : 'unknown'
            }-dark`,
          )}
        >
          <div className={'md:hidden text-left mb-4'}>
            <div className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              <p>National #{String(formData.nationalDex).padStart(3, '0')}</p>
              {formData.johtoDex && (
                <p>
                  <span>Johto #{String(formData.johtoDex).padStart(3, '0')}</span>
                </p>
              )}
            </div>
            <p className="text-sm md:text-4xl font-bold capitalize text-gray-900 dark:text-gray-50">
              {pokemonName}
            </p>
            <div
              className="flex flex-col mt-2 spacing-y-2 gap-1"
              aria-label="Pokemon Faithful Types"
              role="group"
            >
              <label className="leading-none text-xs w-[50px]">Faithful:</label>
              <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
                {formData.types ? (
                  Array.isArray(formData.types) ? (
                    formData.types.map((type: string) => (
                      <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <Badge
                      key={formData.types}
                      variant={formData.types.toLowerCase() as PokemonType['name']}
                    >
                      {formData.types}
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary">Unknown</Badge>
                )}
              </div>
            </div>
            <div
              className="flex flex-col mt-2 spacing-y-2 gap-1"
              aria-label="Pokemon Polished Types"
              role="group"
            >
              <label className="leading-none text-xs w-[50px]">Polished:</label>
              <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
                {formData.updatedTypes ? (
                  Array.isArray(formData.updatedTypes) ? (
                    formData.updatedTypes.map((type: string) => (
                      <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <Badge
                      key={formData.updatedTypes}
                      variant={formData.updatedTypes.toLowerCase() as PokemonType['name']}
                    >
                      {formData.types}
                    </Badge>
                  )
                ) : (
                  <></>
                )}
              </div>
            </div>
            {uniqueForms.length > 0 && (
              <PokemonFormSelect
                selectedForm={selectedForm}
                setSelectedForm={setSelectedForm}
                uniqueForms={uniqueForms}
                classes="block md:hidden md:ml-auto"
              />
            )}
          </div>{' '}
          <div className="w-36 p-1 md:p-0 md:w-36 md:h-auto md:mx-[initial] mx-auto">
            <Image
              src={formData.frontSpriteUrl ?? ''}
              alt={`Sprite of Pokémon ${pokemonName}`}
              width={200}
              height={200}
              className="object-contain w-36 md:drop-shadow-xs md:w-36 md:h-auto md:mb-0"
              priority
            />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs md:text-sm text-gray-800 dark:text-gray-200 mb-1 flex gap-3 flex-row">
              <span>
                National{' '}
                <span className="font-bold">#{String(formData.nationalDex).padStart(3, '0')}</span>
              </span>
              {formData.johtoDex && (
                <span>
                  Johto <span className="font-bold">#{formData.johtoDex}</span>
                </span>
              )}
            </div>
            <p className="text-sm md:text-xl font-bold capitalize text-gray-900 dark:text-gray-50">
              {pokemonName}
            </p>
            <div
              className="flex flex-col mt-2 spacing-y-2 md:gap-1"
              aria-label="Pokemon Faithful Types"
              role="group"
            >
              <label className="leading-none text-xs w-[50px]">Faithful:</label>
              <div className="gap-2 flex flex-wrap">
                {formData.types ? (
                  Array.isArray(formData.types) ? (
                    formData.types.map((type: string) => (
                      <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <Badge
                      key={formData.types}
                      variant={formData.types.toLowerCase() as PokemonType['name']}
                    >
                      {formData.types}
                    </Badge>
                  )
                ) : (
                  <></>
                )}
              </div>
            </div>
            <div
              className="flex flex-col mt-2 spacing-y-0 md:gap-1"
              aria-label="Pokemon Polished Types"
              role="group"
            >
              {formData.updatedTypes &&
                Array.isArray(formData.updatedTypes) &&
                formData.updatedTypes.length > 0 && (
                  <>
                    <label className="leading-none text-xs w-[50px]">Polished:</label>
                    <div className="gap-2 flex flex-wrap">
                      {formData.updatedTypes.map((type: string) => (
                        <Badge
                          key={`polished-${type}`}
                          variant={type.toLowerCase() as PokemonType['name']}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
            </div>
          </div>
          {uniqueForms.length > 0 && (
             <PokemonFormSelect
                selectedForm={selectedForm}
                setSelectedForm={setSelectedForm}
                uniqueForms={uniqueForms}
                classes="hidden md:block md:ml-auto"
              />
          )}
        </div>
      </div>

      <Tabs defaultValue="about" className="w-full">
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
            <CardHeader>Species</CardHeader>
            <CardContent className="space-y-2 px-2 md:px-6">
              <p className="text-sm md:text-md text-foreground">{formData.species} Pokémon</p>
              <p className="text-sm md:text-md text-muted-foreground">{formData.description}</p>
              <div
                className="grid grid-col-1 md:grid-cols-2 my-4 max-w-[400px] mx-auto"
                aria-label="Pokemon Types"
                role="group"
              >
                {/* Faithful Types */}
                <div className="flex flex-wrap flex-col gap-2 items-center text-center">
                  <label className="leading-none text-xs w-[50px]">Faithful:</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.types ? (
                      Array.isArray(formData.types) ? (
                        formData.types.map((type: string) => (
                          <Badge
                            key={`faithful-${type}`}
                            variant={type.toLowerCase() as PokemonType['name']}
                          >
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <Badge
                          key={`faithful-${formData.types}`}
                          variant={formData.types.toLowerCase() as PokemonType['name']}
                        >
                          {formData.types}
                        </Badge>
                      )
                    ) : (
                      <Badge variant="secondary">Unknown</Badge>
                    )}
                  </div>
                </div>
                {/* Updated Types */}
                <div
                  className={cn(
                    'flex flex-wrap flex-col gap-2 items-center text-center',
                    formData.updatedTypes ? 'mt-4 md:mt-0' : 'hidden',
                  )}
                >
                  <label className="leading-none text-xs w-[50px]">Polished:</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.updatedTypes &&
                      (Array.isArray(formData.updatedTypes) ? (
                        formData.updatedTypes.map((type: string) => (
                          <Badge
                            key={`updated-${type}`}
                            variant={type.toLowerCase() as PokemonType['name']}
                          >
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <Badge
                          key={`updated-${formData.updatedTypes}`}
                          variant={formData.updatedTypes.toLowerCase() as PokemonType['name']}
                        >
                          {formData.updatedTypes}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-row flex-wrap gap-2 md:gap-0 w-full justify-between relative">
                <div className="flex w-full flex-wrap justify-center items-center gap-0 mb-2">
                  <div className="w-1/3 md:w-1/5 text-center border-r border-gray-200 dark:border-gray-700 last:border-none p-1">
                    <Image
                      src="/icons/ruler-regular.svg"
                      alt="Ruler Icon"
                      width={24}
                      height={24}
                      className="mx-auto pb-2"
                    />
                    <p className="text-sm md:text-md text-muted-foreground">
                      {((formData.height as number) / 10).toFixed(1)} m
                    </p>
                  </div>
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
                  <div className="w-1/3 md:w-1/5 text-center md:border-r border-gray-200 dark:border-gray-700 last:border-none p-1">
                    <Image
                      src="/icons/weight-scale-regular.svg"
                      alt="Scale Icon"
                      width={24}
                      height={24}
                      className="mx-auto pb-2"
                    />
                    <p className="text-sm md:text-md text-muted-foreground">
                      {((formData.weight as number) / 10).toFixed(1)} kg
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 w-1/2 md:w-1/5 text-center border-r border-gray-200 dark:border-gray-700 last:border-none p-1">
                    <Image
                      src="/icons/palette-regular.svg"
                      alt="Palette Icon"
                      width={24}
                      height={24}
                      className="mx-auto pb-2"
                    />
                    <p className="text-sm md:text-md text-muted-foreground">
                      {formData.bodyColor || 'Unknown'}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 w-1/2 md:w-1/5 text-center p-1">
                    <Image
                      src="/icons/shapes-regular.svg"
                      alt="Shape Icon"
                      width={24}
                      height={24}
                      className="mx-auto pb-2"
                    />
                    <p className="text-sm md:text-md text-muted-foreground">
                      {formData.bodyShape || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Abilities</CardHeader>
            <CardContent className="space-y-2">
              <PokemonAbilities
                faithfulAbilities={formData.faithfulAbilities}
                updatedAbilities={formData.updatedAbilities}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Catch Rate</CardHeader>
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
                      className="block"
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
                      className="block"
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
                      className="block"
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
          {formData.baseStats ? (
            <Card>
              <CardHeader>Base Stats</CardHeader>
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
            <CardHeader>Type Relations</CardHeader>
            <CardContent className="space-y-2">
              <div
                className={cn(
                  'grid grid-cols-1 gap-6',
                  formData.updatedTypes ? 'md:grid-cols-2' : '',
                )}
              >
                {formData.types && (
                  <div>
                    <h3 className="italic font-bold text-sm mb-4 text-left">Faithful</h3>
                    <TypeRelationsChart
                      types={
                        Array.isArray(formData.types)
                          ? formData.types.map((t: string) => t.toLowerCase())
                          : formData.types
                          ? [formData.types.toLowerCase()]
                          : []
                      }
                    />
                  </div>
                )}
                {formData.updatedTypes && (
                  <div>
                    <h3 className="italic font-bold text-sm mb-4 text-left">Updated</h3>
                    <TypeRelationsChart
                      types={
                        Array.isArray(formData.updatedTypes)
                          ? formData.updatedTypes.map((t: string) => t.toLowerCase())
                          : formData.updatedTypes
                          ? [formData.updatedTypes.toLowerCase()]
                          : []
                      }
                    />
                  </div>
                )}
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

export function calculateCatchChance(
  baseCatchRate: number,
  ballType: 'pokeball' | 'greatball' | 'ultraball' = 'pokeball',
) {
  // Ball multipliers
  const ballMultipliers: Record<'pokeball' | 'greatball' | 'ultraball', number> = {
    pokeball: 1,
    greatball: 1.5,
    ultraball: 2,
  };

  const ballBonus = ballMultipliers[ballType] ?? 1;

  // Health factors for max HP (HP = maxHP means HP / maxHP = 1)
  const maxHP = 100; // arbitrary, since HP/maxHP = 1
  const currentHP = maxHP; // Full health

  // No status effect
  const statusBonus = 1;

  // Calculate modified catch rate
  const a = ((3 * maxHP - 2 * currentHP) * baseCatchRate * ballBonus * statusBonus) / (3 * maxHP);

  // Clamp `a` to a max of 255
  const cappedA = Math.min(a, 255);

  // Compute catch probability
  const catchProbability = cappedA / 255;

  return catchProbability;
}
