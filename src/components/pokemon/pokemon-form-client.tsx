'use client';
import { AbilityData, ComprehensivePokemonData } from '@/types/new';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { PokemonAbilities } from './pokemon-abilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import PokedexHeader from './pokemon-header';
import { WeaknessChart } from './weakness-chart';
import PokemonTypeSetter from './pokemon-type-setter';
import { useQueryState } from 'nuqs';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { PokemonSprite } from './pokemon-sprite';
import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
import { MoveRow } from '../moves';
import Link from 'next/link';
import { EvolutionChainDisplay } from './evolution-chain-display';
import { EvolutionChain } from '@/utils/evolution-data-server';

// Type for location encounter data
interface PokemonLocationEncounter {
  locationId: string;
  locationName: string;
  region: string;
  method: string;
  version: string;
  levelRange: string;
  rate: number;
  formName?: string;
}

// Type for evolution chain data
interface EvolutionChainData {
  polished: EvolutionChain | null;
  faithful: EvolutionChain | null;
}

// Type for enriched move data that comes from server
interface EnrichedMove {
  id: string;
  name: string;
  level?: number;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  effectChance: number;
  category: string;
  description: string;
}

export default function PokemonFormClient({
  pokemonData,
  locationData = [],
  evolutionChainData,
}: {
  pokemonData: ComprehensivePokemonData;
  locationData?: PokemonLocationEncounter[];
  evolutionChainData?: EvolutionChainData;
}) {
  const [selectedForm, setSelectedForm] = useQueryState('form', {
    defaultValue: 'plain',
  });
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'stats',
  });
  const { showFaithful } = useFaithfulPreferenceSafe();

  // Get the current version based on faithful preference
  const version = showFaithful ? 'faithful' : 'polished';

  const currentFormData = pokemonData.versions?.[version]?.forms?.[selectedForm];

  const currentTypes = currentFormData?.types || [];

  const currentAbilities: AbilityData[] = currentFormData?.abilities
    ? (currentFormData.abilities as unknown as AbilityData[])
    : [];

  const uniqueForms = Object.keys(pokemonData.versions?.[version]?.forms || {});

  // Filter location data for the current form
  const currentFormLocations = locationData.filter(
    (loc) => !loc.formName || loc.formName === 'plain' || loc.formName === selectedForm,
  );

  // Group and consolidate locations by area, method, and time
  // Combine level ranges and accumulate rates
  const groupedLocations = currentFormLocations.reduce(
    (acc, loc) => {
      // Create a unique key for location + method + time
      const key = `${loc.locationId}|${loc.method}|${loc.version}`;
      if (!acc[key]) {
        acc[key] = {
          locationId: loc.locationId,
          locationName: loc.locationName,
          region: loc.region,
          method: loc.method,
          version: loc.version,
          levels: [],
          hasVariableLevel: false,
          totalRate: 0,
        };
      }
      // Parse level and add to list - check for non-numeric levels
      const level = parseInt(loc.levelRange, 10);
      if (isNaN(level) || level < 0 || loc.levelRange.toLowerCase().includes('badge')) {
        // Mark as having variable/special level
        acc[key].hasVariableLevel = true;
      } else if (!acc[key].levels.includes(level)) {
        acc[key].levels.push(level);
      }
      // Accumulate the rate
      acc[key].totalRate += loc.rate;
      return acc;
    },
    {} as Record<
      string,
      {
        locationId: string;
        locationName: string;
        region: string;
        method: string;
        version: string;
        levels: number[];
        hasVariableLevel: boolean;
        totalRate: number;
      }
    >,
  );

  // Convert to array and format level ranges
  const consolidatedLocations = Object.values(groupedLocations).map((loc) => {
    let levelRange: string;
    if (loc.hasVariableLevel || loc.levels.length === 0) {
      levelRange = 'Varies';
    } else {
      loc.levels.sort((a, b) => a - b);
      const minLevel = loc.levels[0];
      const maxLevel = loc.levels[loc.levels.length - 1];
      levelRange = minLevel === maxLevel ? `${minLevel}` : `${minLevel}-${maxLevel}`;
    }
    return {
      ...loc,
      levelRange,
    };
  });

  // Sort by location name, then method, then time
  consolidatedLocations.sort((a, b) => {
    if (a.locationName !== b.locationName) return a.locationName.localeCompare(b.locationName);
    if (a.method !== b.method) return a.method.localeCompare(b.method);
    const timeOrder = { morning: 0, day: 1, night: 2 };
    return (
      (timeOrder[a.version as keyof typeof timeOrder] ?? 3) -
      (timeOrder[b.version as keyof typeof timeOrder] ?? 3)
    );
  });

  return (
    <>
      {/* Set Pokemon type theme based on current form */}
      <PokemonTypeSetter
        primaryType={currentTypes[0]?.toLowerCase() || null}
        secondaryType={currentTypes[1]?.toLowerCase() || null}
      />
      <div className="space-y-6">
        <PokedexHeader
          formData={{
            name: pokemonData.name,
            nationalDex: pokemonData.dexNo,
            types: currentTypes,
            species: pokemonData.name,
            description: `Pokemon #${pokemonData.dexNo}`,
          }}
          uniqueForms={uniqueForms}
          pokemonName={pokemonData.name}
          selectedForm={selectedForm}
          setSelectedForm={setSelectedForm}
        />

        <Tabs
          defaultValue={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="w-full z-10 relative"
        >
          <TabsList
            className={cn(
              `grid w-full grid-cols-3 bg-white p-1 h-12 border-1`,
              'pokemon-tab-background',
            )}
          >
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
            <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
              <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-6">
                <BentoGridNoLink className="md:col-span-3">
                  {currentFormData?.baseStats ? (
                    <div className="space-y-4 w-full">
                      <h3 className={'text-neutral-600 dark:text-neutral-200'}>
                        Base Stats ({showFaithful ? 'Faithful' : 'Polished'}):
                      </h3>
                      {[
                        { label: 'HP', value: currentFormData.baseStats.hp, color: '*:bg-red-400' },
                        {
                          label: 'Atk',
                          value: currentFormData.baseStats.attack,
                          color: '*:bg-orange-400',
                        },
                        {
                          label: 'Def',
                          value: currentFormData.baseStats.defense,
                          color: '*:bg-yellow-400',
                        },
                        {
                          label: 'Sp. Atk',
                          value: currentFormData.baseStats.specialAttack,
                          color: '*:bg-blue-400',
                        },
                        {
                          label: 'Sp. Def',
                          value: currentFormData.baseStats.specialDefense,
                          color: '*:bg-green-400',
                        },
                        {
                          label: 'Spd',
                          value: currentFormData.baseStats.speed,
                          color: '*:bg-purple-400',
                        },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex flex-row gap-4 items-center">
                          <div className="flex justify-between items-center w-[120px]">
                            <span className="label-text">{label}</span>
                            <span className="text-xs leading-none text-muted-foreground">
                              {value ?? 'N/A'}
                            </span>
                          </div>
                          <Progress
                            value={typeof value === 'number' ? Math.round((value / 255) * 100) : 0}
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
                        <span className="text-xs text-neutral-600 dark:text-neutral-200 font-bold">
                          {Object.values(currentFormData.baseStats).reduce(
                            (sum: number, stat) => (typeof stat === 'number' ? sum + stat : sum),
                            0,
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm mb-6">No base stat data</div>
                  )}
                </BentoGridNoLink>
                <BentoGridNoLink className="md:col-span-3">
                  <div className={cn('flex flex-col gap-6')}>
                    <WeaknessChart
                      types={currentTypes.map((t: string) => t.toLowerCase())}
                      variant={showFaithful ? 'Faithful' : 'Polished'}
                    />
                  </div>
                </BentoGridNoLink>
                {/* Abilities Section */}
                <PokemonAbilities abilities={currentAbilities} />
              </BentoGrid>
            </div>

            {/* Training Stats Section */}
            <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
              <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-2">
                <BentoGridNoLink className="md:col-span-1">
                  <h3 className={'font-bold text-neutral-600 dark:text-neutral-200 capitalize'}>
                    Training Stats:
                  </h3>
                  <div className="flex flex-row gap-4 items-center">
                    <div className="flex justify-between items-center w-[120px]">
                      <span className="label-text">Growth Rate</span>
                    </div>
                    <span className="text-xs text-left">
                      {currentFormData?.growthRate || 'N/A'}
                    </span>
                  </div>

                  <div className="flex flex-row gap-4 items-center">
                    <div className="flex justify-between items-center w-[120px]">
                      <span className="label-text">Has Gender</span>
                    </div>
                    <span className="text-xs text-left">
                      {currentFormData?.hasGender ? 'Yes' : 'No'}
                    </span>
                  </div>
                </BentoGridNoLink>
                <BentoGridNoLink className="md:col-span-1">
                  <h3 className={'font-bold text-neutral-600 dark:text-neutral-200 capitalize'}>
                    Forms Available:
                  </h3>
                  <div className="text-xs text-left">
                    {uniqueForms.length > 1 ? (
                      <div className="flex flex-wrap gap-1">
                        {uniqueForms.map((form) => (
                          <Badge key={form} variant="outline" className="capitalize text-xs">
                            {form === 'plain' ? 'plain' : form.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">Default form only</span>
                    )}
                  </div>
                </BentoGridNoLink>
              </BentoGrid>
            </div>

            {/* Sprites and Evolution Section */}
            <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
              <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-3">
                <BentoGridNoLink className="md:col-span-1">
                  <div className="mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
                    Sprites
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PokemonSprite
                        form={selectedForm}
                        pokemonName={pokemonData.name}
                        className="shadow-none"
                      />
                      <span className="flex text-xs font-black text-neutral-600 dark:text-neutral-200 capitalize leading-none">
                        Static
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PokemonSprite
                        form={selectedForm}
                        pokemonName={pokemonData.name}
                        type="animated"
                        className="shadow-none"
                      />
                      <span className="flex text-xs font-black text-neutral-600 dark:text-neutral-200 capitalize leading-none">
                        Animated
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PokemonSprite
                        form={selectedForm}
                        pokemonName={pokemonData.name}
                        variant="shiny"
                        className="shadow-none"
                      />
                      <span className="flex text-xs font-black text-neutral-600 dark:text-neutral-200 capitalize leading-none">
                        Shiny Static
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PokemonSprite
                        form={selectedForm}
                        pokemonName={pokemonData.name}
                        variant="shiny"
                        type="animated"
                        className="shadow-none"
                      />
                      <span className="flex text-xs font-black text-neutral-600 dark:text-neutral-200 capitalize leading-none">
                        Shiny Animated
                      </span>
                    </div>
                  </div>
                </BentoGridNoLink>
                <BentoGridNoLink className="md:col-span-2 justify-start">
                  <div className="mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
                    Evolution Chain
                  </div>
                  <EvolutionChainDisplay
                    chain={
                      showFaithful
                        ? (evolutionChainData?.faithful ?? null)
                        : (evolutionChainData?.polished ?? null)
                    }
                    currentPokemon={pokemonData.id}
                    currentForm={selectedForm}
                  />
                </BentoGridNoLink>
              </BentoGrid>
            </div>
          </TabsContent>

          <TabsContent
            value="moves"
            className="text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
          >
            <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
              <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-1">
                <BentoGridNoLink>
                  <Tabs defaultValue="level-up" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 p-1 h-12">
                      <TabsTrigger value="level-up">Level Up</TabsTrigger>
                      <TabsTrigger value="egg">Egg Moves</TabsTrigger>
                      <TabsTrigger value="tm-hm">TM/HM</TabsTrigger>
                    </TabsList>
                    <TabsContent value="level-up">
                      {currentFormData?.movesets?.levelUp &&
                      currentFormData.movesets.levelUp.length > 0 ? (
                        <div>
                          <Table>
                            <TableHeader className={'hidden md:table-header-group'}>
                              <TableRow>
                                <TableHead className="attheader cen align-middle text-left md:w-[60px] label-text">
                                  Level
                                </TableHead>
                                <TableHead className="attheader cen align-middle text-left md:w-[180px] label-text">
                                  Attack Name
                                </TableHead>
                                <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                  Type
                                </TableHead>
                                <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                  Cat.
                                </TableHead>
                                <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                  Att.
                                </TableHead>
                                <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                  Acc.
                                </TableHead>
                                <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                  PP
                                </TableHead>
                                <TableHead className="attheader cen align-middle text-left w-[80px] label-text">
                                  TM/HM
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentFormData.movesets.levelUp
                                .sort((a, b) => a.level - b.level)
                                .map((move, index) => {
                                  // Move data is already enriched from the server
                                  const moveInfo = move as EnrichedMove;

                                  return (
                                    <MoveRow
                                      key={`levelup-${move.id}-${index}`}
                                      id={move.id || ''}
                                      level={move.level}
                                      info={{
                                        name: moveInfo.name || move.id,
                                        type: moveInfo.type || 'normal',
                                        category: moveInfo.category || 'physical',
                                        power: moveInfo.power || 0,
                                        pp: moveInfo.pp || 0,
                                        accuracy: moveInfo.accuracy || 0,
                                        effectChance: moveInfo.effectChance || 0,
                                        description: moveInfo.description || '',
                                      }}
                                    />
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm mb-6">
                          No level-up moves available
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="egg">
                      {currentFormData?.movesets?.eggMoves &&
                      currentFormData.movesets.eggMoves.length > 0 ? (
                        <Table>
                          <TableHeader className={'hidden md:table-header-group'}>
                            <TableRow>
                              <TableHead className="attheader cen align-middle text-left md:w-[238px] label-text">
                                Attack Name
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                Type
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                Cat.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                Att.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                Acc.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                PP
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left w-[80px] label-text">
                                TM/HM
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentFormData.movesets.eggMoves.map((move, index) => {
                              // Move data is already enriched from the server
                              const moveInfo = move as EnrichedMove;

                              return (
                                <MoveRow
                                  key={`eggmove-${move.id}-${index}`}
                                  id={move.id}
                                  info={{
                                    name: moveInfo.name || move.id,
                                    type: moveInfo.type || 'normal',
                                    category: moveInfo.category || 'physical',
                                    power: moveInfo.power || 0,
                                    pp: moveInfo.pp || 0,
                                    accuracy: moveInfo.accuracy || 0,
                                    effectChance: moveInfo.effectChance || 0,
                                    description: moveInfo.description || '',
                                  }}
                                />
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-gray-400 text-sm mb-6 mx-auto text-center py-8">
                          No egg moves
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="tm-hm">
                      {currentFormData?.movesets?.tm && currentFormData.movesets.tm.length > 0 ? (
                        <Table>
                          <TableHeader className={'hidden md:table-header-group'}>
                            <TableRow>
                              <TableHead className="attheader cen align-middle text-left md:w-[238px] label-text">
                                Attack Name
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                Type
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                Cat.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                Att.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                Acc.
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left md:w-[80px] label-text">
                                PP
                              </TableHead>
                              <TableHead className="attheader cen align-middle text-left w-[80px] label-text">
                                TM/HM
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentFormData.movesets.tm.map((move, index) => {
                              // Move data is already enriched from the server
                              const moveInfo = move as EnrichedMove;

                              return (
                                <MoveRow
                                  key={`tm-${move.id}-${index}`}
                                  id={move.id}
                                  info={{
                                    name: moveInfo.name || move.id,
                                    type: moveInfo.type || 'normal',
                                    category: moveInfo.category || 'physical',
                                    power: moveInfo.power || 0,
                                    pp: moveInfo.pp || 0,
                                    accuracy: moveInfo.accuracy || 0,
                                    effectChance: moveInfo.effectChance || 0,
                                    description: moveInfo.description || '',
                                  }}
                                />
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-gray-400 text-sm mb-6">No TM/HM moves</div>
                      )}
                    </TabsContent>
                  </Tabs>
                </BentoGridNoLink>
              </BentoGrid>
            </div>
          </TabsContent>
          <TabsContent
            value="location"
            className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
          >
            <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
              <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-1">
                {consolidatedLocations.length > 0 ? (
                  <BentoGridNoLink>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-neutral-600 dark:text-neutral-200">
                      Wild Encounters
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-left">
                            <span className="label-text">Location</span>
                          </TableHead>
                          <TableHead className="text-left">
                            <span className="label-text">Method</span>
                          </TableHead>
                          <TableHead className="text-left">
                            <span className="label-text">Time</span>
                          </TableHead>
                          <TableHead className="text-left">
                            <span className="label-text">Levels</span>
                          </TableHead>
                          <TableHead className="text-left">
                            <span className="label-text">Rate</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consolidatedLocations.map((loc, idx) => (
                          <TableRow key={`${loc.locationId}-${loc.method}-${loc.version}-${idx}`}>
                            <TableCell className="text-left">
                              <Link
                                href={`/locations/${loc.locationId}`}
                                className="table-link text-sm"
                              >
                                {loc.locationName}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({loc.region})
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell className="text-left">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {loc.method.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-left">
                              <span className="text-sm capitalize">{loc.version}</span>
                            </TableCell>
                            <TableCell className="text-left">
                              <span className="text-sm">
                                {loc.levelRange === 'Varies' ? 'Varies' : `Lv. ${loc.levelRange}`}
                              </span>
                            </TableCell>
                            <TableCell className="text-left">
                              <span className="text-sm">{loc.totalRate}%</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </BentoGridNoLink>
                ) : (
                  <BentoGridNoLink>
                    <div className="text-gray-400 text-sm my-6 text-center">
                      No wild encounter data found. This Pokémon may only be available through
                      breeding, events, or trades.
                    </div>
                  </BentoGridNoLink>
                )}
              </BentoGrid>
            </div>
          </TabsContent>
        </Tabs>
        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4 mb-4 text-xs text-left overflow-x-auto">
            <details>
              <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-200">
                Debug Panel - New Data Structure
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-bold">Pokemon ID:</span> {pokemonData.id}
                </div>
                <div>
                  <span className="font-bold">Current Version:</span> {version}
                </div>
                <div>
                  <span className="font-bold">Selected Form:</span> {selectedForm}
                </div>
                <div>
                  <span className="font-bold">Available Forms:</span> {uniqueForms.join(', ')}
                </div>
                <div>
                  <span className="font-bold">Current Types:</span> {currentTypes.join(', ')}
                </div>
                <div>
                  <span className="font-bold">Current Abilities:</span>{' '}
                  {currentAbilities.join(', ')}
                </div>
                <div>
                  <span className="font-bold">Form Data:</span>
                  <pre className="whitespace-pre-wrap break-all bg-gray-100 dark:bg-gray-800 rounded p-2 mt-1">
                    {JSON.stringify(currentFormData, null, 2)}
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
