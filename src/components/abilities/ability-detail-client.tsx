'use client';

import React, { useState } from 'react';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import PokemonWithAbilityDataTable from './pokemon-with-ability-data-table';
import { AbilityData } from '@/types/new';

interface AbilityDetailClientProps {
  abilityData: AbilityData;
}

export default function AbilityDetailClient({ abilityData }: AbilityDetailClientProps) {
  const [abilityTypeFilter, setAbilityTypeFilter] = useState<string>('all');
  const { showFaithful } = useFaithfulPreferenceSafe();
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
