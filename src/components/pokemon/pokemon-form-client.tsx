'use client';
import { AbilityData, ComprehensivePokemonData } from '@/types/new';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
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
import { DetailCard } from '@/components/ui/detail-card';
import TableWrapper from '@/components/ui/table-wrapper';
import { Sparkles, Egg, Disc, MapPin } from 'lucide-react';
import { PokemonEncountersCard } from './pokemon-encounters-card';

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
          genderRatio={currentFormData?.genderRatio}
          hatchRate={currentFormData?.hatchRate}
          catchRate={currentFormData?.catchRate}
          baseExp={currentFormData?.baseExp}
          eggGroups={currentFormData?.eggGroups}
          heldItems={currentFormData?.heldItems}
          availableForms={uniqueForms}
        />



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
        {currentFormData?.movesets?.levelUp && currentFormData.movesets.levelUp.length > 0 && (
          <DetailCard icon={Sparkles} title={`Level Up Moves (${currentFormData.movesets.levelUp.length})`}>
            <TableWrapper>
              <Table className="data-table">
                <TableHeader className="hidden md:table-header-group">
                  <TableRow>
                    <TableHead className="w-[60px] table-header-label">Level</TableHead>
                    <TableHead className="w-[180px] table-header-label">Move</TableHead>
                    <TableHead className="w-[80px] table-header-label">Type</TableHead>
                    <TableHead className="w-[80px] table-header-label">Cat.</TableHead>
                    <TableHead className="w-[60px] table-header-label">Power</TableHead>
                    <TableHead className="w-[60px] table-header-label">Acc.</TableHead>
                    <TableHead className="w-[60px] table-header-label">PP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFormData.movesets.levelUp
                    .sort((a, b) => a.level - b.level)
                    .map((move, index) => {
                      const moveInfo = move;
                      return (
                        <MoveRow
                          key={`levelup-${move.id}-${index}`}
                          id={move.id || ''}
                          level={move.level}
                          showTmColumn={false}
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
            </TableWrapper>
          </DetailCard>
        )}

        {/* Egg Moves */}
        {currentFormData?.movesets?.eggMoves && currentFormData.movesets.eggMoves.length > 0 && (
          <DetailCard icon={Egg} title={`Egg Moves (${currentFormData.movesets.eggMoves.length})`}>
            <TableWrapper>
              <Table className="data-table">
                <TableHeader className="hidden md:table-header-group">
                  <TableRow>
                    <TableHead className="w-[240px] table-header-label">Move</TableHead>
                    <TableHead className="w-[80px] table-header-label">Type</TableHead>
                    <TableHead className="w-[80px] table-header-label">Cat.</TableHead>
                    <TableHead className="w-[60px] table-header-label">Power</TableHead>
                    <TableHead className="w-[60px] table-header-label">Acc.</TableHead>
                    <TableHead className="w-[60px] table-header-label">PP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFormData.movesets.eggMoves.map((move, index) => {
                    const moveInfo = move;
                    return (
                      <MoveRow
                        key={`eggmove-${move.id}-${index}`}
                        id={move.id}
                        showTmColumn={false}
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
            </TableWrapper>
          </DetailCard>
        )}

        {/* TM/HM/Tutor Moves */}
        {currentFormData?.movesets?.tm && currentFormData.movesets.tm.length > 0 && (
          <DetailCard
            icon={Disc}
            title={`TM/HM/Tutor Moves (${currentFormData.movesets.tm.length})`}
          >
            <TableWrapper>
              <Table className="data-table">
                <TableHeader className="hidden md:table-header-group">
                  <TableRow>
                    <TableHead className="w-[240px] table-header-label">Move</TableHead>
                    <TableHead className="w-[80px] table-header-label">Type</TableHead>
                    <TableHead className="w-[80px] table-header-label">Cat.</TableHead>
                    <TableHead className="w-[60px] table-header-label">Power</TableHead>
                    <TableHead className="w-[60px] table-header-label">Acc.</TableHead>
                    <TableHead className="w-[60px] table-header-label">PP</TableHead>
                    <TableHead className="w-[60px] table-header-label"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFormData.movesets.tm.map((move, index) => {
                    const moveInfo = move;
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
                        tm={{
                          number: move.number!,
                        }}
                        showTmColumn={true}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrapper>
          </DetailCard>
        )}

        {/* Wild Encounters */}
        <PokemonEncountersCard encounters={locationData} selectedForm={selectedForm} />

        {/* Base Stats Section */}
          <DetailCard icon={MapPin} title={`Base Stats`}>
          {currentFormData?.baseStats ? (
            <StatsRadarChart stats={currentFormData.baseStats} />
          ) : (
            <p className="text-sm text-neutral-500">No base stat data available.</p>
          )}
        </DetailCard>



      </div>
    </>
  );
}
