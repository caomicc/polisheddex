'use client';

import React, { useState } from 'react';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
import PokemonWithAbilityDataTable from './pokemon-with-ability-data-table';
import { AbilityData } from '@/types/new';

interface AbilityDetailClientProps {
  abilityData: AbilityData;
}

export default function AbilityDetailClient({ abilityData }: AbilityDetailClientProps) {
  const [abilityTypeFilter, setAbilityTypeFilter] = useState<string>('all');
  const { showFaithful } = useFaithfulPreference();
  const version = showFaithful ? 'faithful' : 'polished';

  return (
    <PokemonWithAbilityDataTable
      abilityData={abilityData}
      abilityTypeFilter={abilityTypeFilter}
      onAbilityTypeFilterChange={setAbilityTypeFilter}
      version={version}
    />
  );
}
