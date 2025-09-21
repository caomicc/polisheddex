'use client';

import React, { Suspense } from 'react';
import { AbilitiesDataTable } from './abilities-data-table';
import { abilityColumns } from './abilities-columns';
import { AbilityData } from '@/types/new';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';

interface AbilitiesDataTableSearchProps {
  abilities: AbilityData[];
}

const AbilitiesDataTableSearch: React.FC<AbilitiesDataTableSearchProps> = ({ abilities }) => {
  const { showFaithful } = useFaithfulPreference();
  const version = showFaithful ? 'faithful' : 'polished';
  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading abilities...</div>}>
      <AbilitiesDataTable columns={abilityColumns(version)} data={abilities} />
    </Suspense>
  );
};

export default AbilitiesDataTableSearch;
