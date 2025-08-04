'use client';

import React, { Suspense } from 'react';
import { AbilitiesDataTable } from './abilities-data-table';
import { abilityColumns } from './abilities-columns';

interface Ability {
  id: string;
  name?: string;
  description?: string;
}

interface AbilitiesDataTableSearchProps {
  abilities: Ability[];
}

const AbilitiesDataTableSearch: React.FC<AbilitiesDataTableSearchProps> = ({ abilities }) => {
  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading abilities...</div>}>
      <AbilitiesDataTable columns={abilityColumns} data={abilities} />
    </Suspense>
  );
};

export default AbilitiesDataTableSearch;
