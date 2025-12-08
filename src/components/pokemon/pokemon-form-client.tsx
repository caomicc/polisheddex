'use client';
import { AbilityData, ComprehensivePokemonData } from '@/types/new';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import PokedexHeader from './pokemon-header';
import PokemonTypeSetter from './pokemon-type-setter';
import { useQueryState } from 'nuqs';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { MoveRow } from '../moves';
import Link from 'next/link';
import { EvolutionTable } from './evolution-table';
import { EvolutionChain } from '@/utils/evolution-data-server';
import { PokemonInfoTable } from './pokemon-info-table';
import { StatsRadarChart } from './stats-radar-chart';

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
      <div className="space-y-8">
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

        {/* Pokemon Info Table */}
        <PokemonInfoTable
          name={pokemonData.name}
          dexNo={pokemonData.dexNo}
          types={currentTypes}
          abilities={currentAbilities}
          selectedForm={selectedForm}
          evolutionChain={
            showFaithful
              ? (evolutionChainData?.faithful ?? null)
              : (evolutionChainData?.polished ?? null)
          }
          growthRate={currentFormData?.growthRate}
          hasGender={currentFormData?.hasGender}
          availableForms={uniqueForms}
        />

        {/* Base Stats Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            Base Stats
          </h2>
          {currentFormData?.baseStats ? (
            <StatsRadarChart stats={currentFormData.baseStats} />
          ) : (
            <p className="text-sm text-neutral-500">No base stat data available.</p>
          )}
        </section>

        {/* Evolution Chain */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            Evolution Chain
          </h2>
          <EvolutionTable
            chain={
              showFaithful
                ? (evolutionChainData?.faithful ?? null)
                : (evolutionChainData?.polished ?? null)
            }
            currentPokemon={pokemonData.id}
            currentForm={selectedForm}
          />
        </section>

        {/* Level Up Moves */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            Level Up Moves ({currentFormData?.movesets?.levelUp?.length || 0})
          </h2>
          {currentFormData?.movesets?.levelUp && currentFormData.movesets.levelUp.length > 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <Table className="w-full text-sm">
                  <TableHeader className="hidden md:table-header-group">
                    <TableRow>
                      <TableHead className="w-[60px]">Level</TableHead>
                      <TableHead className="w-[180px]">Move</TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[80px]">Cat.</TableHead>
                      <TableHead className="w-[60px]">Power</TableHead>
                      <TableHead className="w-[60px]">Acc.</TableHead>
                      <TableHead className="w-[60px]">PP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentFormData.movesets.levelUp
                      .sort((a, b) => a.level - b.level)
                      .map((move, index) => {
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
              <p className="text-sm text-neutral-500 text-center py-4">No level-up moves available.</p>
            )}
        </section>

        {/* Egg Moves */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            Egg Moves ({currentFormData?.movesets?.eggMoves?.length || 0})
          </h2>
          {currentFormData?.movesets?.eggMoves && currentFormData.movesets.eggMoves.length > 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <Table className="w-full text-sm">
                  <TableHeader className="hidden md:table-header-group">
                    <TableRow>
                      <TableHead className="w-[240px]">Move</TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[80px]">Cat.</TableHead>
                      <TableHead className="w-[60px]">Power</TableHead>
                      <TableHead className="w-[60px]">Acc.</TableHead>
                      <TableHead className="w-[60px]">PP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentFormData.movesets.eggMoves.map((move, index) => {
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
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">No egg moves available.</p>
            )}
        </section>

        {/* TM/HM Moves */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            TM/HM Moves ({currentFormData?.movesets?.tm?.length || 0})
          </h2>
          {currentFormData?.movesets?.tm && currentFormData.movesets.tm.length > 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <Table className="w-full text-sm">
                  <TableHeader className="hidden md:table-header-group">
                    <TableRow>
                      <TableHead className="w-[240px]">Move</TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[80px]">Cat.</TableHead>
                      <TableHead className="w-[60px]">Power</TableHead>
                      <TableHead className="w-[60px]">Acc.</TableHead>
                      <TableHead className="w-[60px]">PP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentFormData.movesets.tm.map((move, index) => {
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
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">No TM/HM moves available.</p>
            )}
        </section>

        {/* Wild Encounters */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            Wild Encounters ({consolidatedLocations.length})
          </h2>
          {consolidatedLocations.length > 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Levels</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedLocations.map((loc, idx) => (
                      <TableRow key={`${loc.locationId}-${loc.method}-${loc.version}-${idx}`}>
                        <TableCell>
                          <Link href={`/locations/${loc.locationId}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                            {loc.locationName}
                            <span className="text-xs text-neutral-500 ml-1">({loc.region})</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {loc.method.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{loc.version}</TableCell>
                        <TableCell>{loc.levelRange === 'Varies' ? 'Varies' : `Lv. ${loc.levelRange}`}</TableCell>
                        <TableCell>{loc.totalRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">
                No wild encounter data. This Pokémon may only be available through breeding, events, or trades.
              </p>
            )}
        </section>

        {/* Debug Panel (Dev Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4">
            <summary className="cursor-pointer font-semibold">Debug Panel</summary>
            <div className="mt-2 space-y-1">
              <div><strong>ID:</strong> {pokemonData.id}</div>
              <div><strong>Version:</strong> {version}</div>
              <div><strong>Form:</strong> {selectedForm}</div>
              <div><strong>Forms:</strong> {uniqueForms.join(', ')}</div>
              <div><strong>Types:</strong> {currentTypes.join(', ')}</div>
            </div>
          </details>
        )}
      </div>
    </>
  );
}
