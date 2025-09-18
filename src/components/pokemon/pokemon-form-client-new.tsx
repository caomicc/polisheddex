'use client';
import { ComprehensivePokemonData } from '@/types/new';
import { MoveDescription, LocationEntry } from '@/types/types';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { PokemonAbilities } from './pokemon-abilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import PokedexHeader from './pokemon-header';
import { WeaknessChart } from './weakness-chart';
import PokemonTypeSetter from './pokemon-type-setter';
import { useQueryState } from 'nuqs';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
import { PokemonSprite } from './pokemon-sprite';
import { MoveRow } from '../moves';
import { LocationListItem } from '../locations';
import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
import {
  getComprehensivePokemonTypes,
  getComprehensivePokemonForms,
  getComprehensivePokemonAbilities,
  getComprehensivePokemonBaseStats,
  getComprehensivePokemonMovesets,
} from '@/utils/loaders/pokemon-data-loader';

// Helper function to deduplicate moves based on name and level
function deduplicateMoves(
  moves: Array<{ name: string; level: number }>,
): Array<{ name: string; level: number }> {
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
  pokemonData,
  moveDescData,
  locationData,
}: {
  pokemonData: ComprehensivePokemonData;
  moveDescData: Record<string, MoveDescription>;
  locationData?: LocationEntry[];
}) {
  const [selectedForm, setSelectedForm] = useQueryState('form', {
    defaultValue: 'plain',
  });
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'stats',
  });
  const { showFaithful } = useFaithfulPreference();

  // Get the current version based on faithful preference
  const currentVersion = showFaithful ? 'faithful' : 'polished';

  // Get available forms for the current version
  const availableForms = getComprehensivePokemonForms(pokemonData, currentVersion);
  const currentForm = availableForms.includes(selectedForm) ? selectedForm : 'plain';

  // Get data for the current form and version
  const currentTypes = getComprehensivePokemonTypes(pokemonData, currentVersion, currentForm);
  const currentAbilities = getComprehensivePokemonAbilities(
    pokemonData,
    currentVersion,
    currentForm,
  );
  const currentBaseStats = getComprehensivePokemonBaseStats(
    pokemonData,
    currentVersion,
    currentForm,
  );
  const currentMovesets = getComprehensivePokemonMovesets(pokemonData, currentVersion, currentForm);

  // Get form data for the current form
  const currentFormData = pokemonData.versions?.[currentVersion]?.forms?.[currentForm];

  // Deduplicate and normalize forms for dropdown (exclude 'plain' if there are other forms)
  const uniqueForms = availableForms.filter(
    (form) => availableForms.length === 1 || form !== 'plain',
  );

  console.log('Pokemon Data:', pokemonData);
  console.log('Current Version:', currentVersion);
  console.log('Current Form:', currentForm);
  console.log('Available Forms:', availableForms);
  console.log('Current Form Data:', currentFormData);

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
            // Map the new data structure to what PokedexHeader expects
            name: pokemonData.name,
            nationalDex: pokemonData.dexNo,
            johtoDex: null, // TODO: Add johtoDex to ComprehensivePokemonData if needed
            types: currentTypes,
            species: pokemonData.name,
            description: `Pokemon #${pokemonData.dexNo}`,
            frontSpriteUrl: `/sprites/pokemon/${pokemonData.id}${currentForm !== 'plain' ? `_${currentForm}` : ''}.png`,
            // Add other required fields with defaults
            moves: [],
            tmHmLearnset: [],
            locations: locationData || [],
            eggMoves: [],
            evolution: null,
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
                  {currentBaseStats ? (
                    <div className="space-y-4 w-full">
                      <h3 className={'text-neutral-600 dark:text-neutral-200'}>
                        Base Stats ({showFaithful ? 'Faithful' : 'Polished'}):
                      </h3>
                      {[
                        { label: 'HP', value: currentBaseStats.hp, color: '*:bg-red-400' },
                        { label: 'Atk', value: currentBaseStats.attack, color: '*:bg-orange-400' },
                        { label: 'Def', value: currentBaseStats.defense, color: '*:bg-yellow-400' },
                        {
                          label: 'Sp. Atk',
                          value: currentBaseStats.specialAttack,
                          color: '*:bg-blue-400',
                        },
                        {
                          label: 'Sp. Def',
                          value: currentBaseStats.specialDefense,
                          color: '*:bg-green-400',
                        },
                        { label: 'Spd', value: currentBaseStats.speed, color: '*:bg-purple-400' },
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
                          {Object.values(currentBaseStats).reduce(
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
                <PokemonAbilities
                  abilities={currentAbilities.map((abilityName) => ({
                    id: abilityName,
                    name: abilityName,
                    abilityType: 'primary' as const,
                  }))}
                  // For backwards compatibility, map to expected format
                  faithfulAbilities={
                    showFaithful
                      ? currentAbilities.map((abilityName) => ({
                          id: abilityName,
                          name: abilityName,
                          abilityType: 'primary' as const,
                        }))
                      : undefined
                  }
                  updatedAbilities={
                    !showFaithful
                      ? currentAbilities.map((abilityName) => ({
                          id: abilityName,
                          name: abilityName,
                          abilityType: 'primary' as const,
                        }))
                      : undefined
                  }
                />
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
                    {availableForms.length > 1 ? (
                      <div className="flex flex-wrap gap-1">
                        {availableForms.map((form) => (
                          <Badge key={form} variant="outline" className="capitalize text-xs">
                            {form === 'plain' ? 'Default' : form.replace(/([A-Z])/g, ' $1').trim()}
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
                  <div className="text-gray-500 text-center w-full my-4 text-sm mb-auto">
                    Evolution data coming soon...
                  </div>
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
                      {currentMovesets?.levelUp && currentMovesets.levelUp.length > 0 ? (
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
                              {deduplicateMoves(currentMovesets.levelUp)
                                .sort((a, b) => a.level - b.level)
                                .map((moveData, index) => {
                                  const moveInfo =
                                    moveDescData[
                                      moveData.name.toLowerCase().replace(/\s+/g, '-')
                                    ] ?? undefined;

                                  return (
                                    <MoveRow
                                      key={`move-${moveData.name}-${moveData.level}-${currentVersion}-${index}`}
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
                          No level-up moves available
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="egg">
                      {currentMovesets?.eggMoves && currentMovesets.eggMoves.length > 0 ? (
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
                            {currentMovesets.eggMoves.map((moveName, index) => {
                              const moveInfo =
                                moveDescData[moveName.toLowerCase().replace(/\s+/g, '-')] ??
                                undefined;

                              return (
                                <MoveRow key={`eggmove-${index}`} name={moveName} info={moveInfo} />
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
                      {currentMovesets?.tm && currentMovesets.tm.length > 0 ? (
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
                            {currentMovesets.tm.map((moveName, index) => {
                              const moveInfo =
                                moveDescData[moveName.toLowerCase().replace(/\s+/g, '-')] ??
                                undefined;

                              return (
                                <MoveRow
                                  key={`tm-${moveName}-${index}`}
                                  name={moveName}
                                  info={moveInfo}
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
                {locationData && locationData.length > 0 ? (
                  <>
                    {/* Wild Encounters */}
                    {(() => {
                      const wildLocations = locationData.filter(
                        (loc: LocationEntry) =>
                          loc.method &&
                          [
                            'grass',
                            'water',
                            'fish_good',
                            'fish_super',
                            'fish_old',
                            'surf',
                            'rock_smash',
                            'headbutt',
                            'wild',
                          ].includes(loc.method),
                      );

                      return wildLocations.length > 0 ? (
                        <BentoGridNoLink>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-neutral-600 dark:text-neutral-200">
                            Wild Encounters
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left">
                                  <span className="label-text">Area</span>
                                </TableHead>
                                <TableHead className="text-left">
                                  <span className="label-text">Method</span>
                                </TableHead>
                                <TableHead className="text-left">
                                  <span className="label-text">Time</span>
                                </TableHead>
                                <TableHead className="text-left">
                                  <span className="label-text">Level</span>
                                </TableHead>
                                <TableHead className="text-left">
                                  <span className="label-text">Rate</span>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {wildLocations.map((loc: LocationEntry, idx: number) => (
                                <LocationListItem key={`wild-${idx}`} {...loc} />
                              ))}
                            </TableBody>
                          </Table>
                        </BentoGridNoLink>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <BentoGridNoLink>
                    <div className="text-gray-400 text-sm my-6 text-center">
                      No location data found. Try breeding!
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
                  <span className="font-bold">Current Version:</span> {currentVersion}
                </div>
                <div>
                  <span className="font-bold">Selected Form:</span> {currentForm}
                </div>
                <div>
                  <span className="font-bold">Available Forms:</span> {availableForms.join(', ')}
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
