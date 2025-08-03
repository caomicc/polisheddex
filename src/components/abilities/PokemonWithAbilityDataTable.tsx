'use client';

import React, { useMemo } from 'react';
import { PokemonDataTable } from '@/components/pokemon/pokemon-data-table';
import { pokemonWithAbilityColumns } from './pokemon-with-ability-columns';
import { PokemonWithAbility } from '@/utils/loaders/ability-data-loader';

interface PokemonWithAbilityDataTableProps {
  pokemonWithAbility: PokemonWithAbility[];
  abilityTypeFilter: string;
  onAbilityTypeFilterChange: (value: string) => void;
  showFaithful: boolean;
}

export default function PokemonWithAbilityDataTable({
  pokemonWithAbility,
  abilityTypeFilter,
  showFaithful,
}: PokemonWithAbilityDataTableProps) {
  // Filter Pokemon based on faithful preference and ability type
  const filteredData = useMemo(() => {
    return pokemonWithAbility.filter((item) => {
      // Filter by faithful preference - check if this entry exists for the selected version
      const versionMatch = showFaithful ? item.faithful : item.updated;
      if (!versionMatch) return false;

      // Filter by ability type
      if (
        abilityTypeFilter !== 'all' &&
        !item.abilityTypes.includes(abilityTypeFilter as 'primary' | 'secondary' | 'hidden')
      ) {
        return false;
      }

      return true;
    });
  }, [pokemonWithAbility, showFaithful, abilityTypeFilter]);

  return (
    <div className="space-y-4">
      <PokemonDataTable columns={pokemonWithAbilityColumns} data={filteredData} />
    </div>
  );
}
