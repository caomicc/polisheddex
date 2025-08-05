'use client';

import React, { useState } from 'react';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonWithAbility } from '@/utils/loaders/ability-data-loader';
import PokemonWithAbilityDataTable from './pokemon-with-ability-data-table';

interface AbilityDetailClientProps {
  abilityData: {
    name?: string;
    description?: string;
  };
  pokemonWithAbility: PokemonWithAbility[];
  abilityName: string;
}

export default function AbilityDetailClient({ pokemonWithAbility }: AbilityDetailClientProps) {
  const [abilityTypeFilter, setAbilityTypeFilter] = useState<string>('all');
  const { showFaithful } = useFaithfulPreference();

  return (
    <PokemonWithAbilityDataTable
      pokemonWithAbility={pokemonWithAbility}
      abilityTypeFilter={abilityTypeFilter}
      onAbilityTypeFilterChange={setAbilityTypeFilter}
      showFaithful={showFaithful}
    />
  );
}
