'use client';

import React, { useMemo } from 'react';
import { PokemonDataTable } from '@/components/pokemon/pokemon-data-table';
import { pokemonWithAbilityColumns } from './pokemon-with-ability-columns';
import { AbilityData } from '@/types/new';

interface PokemonWithAbilityDataTableProps {
  abilityData: AbilityData;
  abilityTypeFilter: string;
  onAbilityTypeFilterChange: (value: string) => void;
  version: string;
}

export default function PokemonWithAbilityDataTable({
  abilityData,
  abilityTypeFilter,
  version,
}: PokemonWithAbilityDataTableProps) {
  // Filter Pokemon based on faithful preference and ability type
  const filteredData = useMemo(() => {
    return (
      abilityData.versions[version].pokemon?.filter((item) => {
        // Filter by faithful preference - check if this entry exists for the selected version
        if (!item) return false;

        // Filter by ability type
        if (
          abilityTypeFilter !== 'all' &&
          !item.abilityTypes.includes(abilityTypeFilter as 'primary' | 'secondary' | 'hidden')
        ) {
          return false;
        }

        return true;
      }) || []
    );
  }, [abilityData, version, abilityTypeFilter]);

  return (
    <div className="space-y-4">
      <PokemonDataTable columns={pokemonWithAbilityColumns} data={filteredData} />
    </div>
  );
}
