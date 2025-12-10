'use client';

import { Suspense } from 'react';
import { ComprehensivePokemonData, StaticPokemon } from '@/types/new';
import PokemonFormClient from './pokemon-form-client';
import { PokemonLocationEncounter } from '@/utils/location-data-server';
import { EvolutionChain } from '@/utils/evolution-data-server';

interface EvolutionChainData {
  polished: EvolutionChain | null;
  faithful: EvolutionChain | null;
}

interface PokemonFormWrapperProps {
  pokemonData: ComprehensivePokemonData;
  locationData?: PokemonLocationEncounter[];
  staticPokemon?: StaticPokemon[];
  evolutionChainData?: EvolutionChainData;
}

function PokemonFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  );
}

export default function PokemonFormWrapper({
  pokemonData,
  locationData = [],
  staticPokemon = [],
  evolutionChainData,
}: PokemonFormWrapperProps) {
  return (
    <Suspense fallback={<PokemonFormSkeleton />}>
      <PokemonFormClient
        pokemonData={pokemonData}
        locationData={locationData}
        staticPokemon={staticPokemon}
        evolutionChainData={evolutionChainData}
      />
    </Suspense>
  );
}
