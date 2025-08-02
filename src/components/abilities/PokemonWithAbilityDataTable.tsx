'use client';

import React, { useMemo } from 'react';
import { PokemonDataTable } from '@/components/pokemon/pokemon-data-table';
import { pokemonWithAbilityColumns } from './pokemon-with-ability-columns';
import { PokemonWithAbility } from '@/utils/loaders/ability-data-loader';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PokemonWithAbilityDataTableProps {
  pokemonWithAbility: PokemonWithAbility[];
  abilityTypeFilter: string;
  onAbilityTypeFilterChange: (value: string) => void;
  showFaithful: boolean;
}

export default function PokemonWithAbilityDataTable({
  pokemonWithAbility,
  abilityTypeFilter,
  onAbilityTypeFilterChange,
  showFaithful,
}: PokemonWithAbilityDataTableProps) {
  // Filter Pokemon based on faithful preference and ability type
  const filteredData = useMemo(() => {
    return pokemonWithAbility.filter((item) => {
      // Filter by faithful preference - check if this entry exists for the selected version
      const versionMatch = showFaithful ? item.faithful : item.updated;
      if (!versionMatch) return false;

      // Filter by ability type
      if (abilityTypeFilter !== 'all' && !item.abilityTypes.includes(abilityTypeFilter as 'primary' | 'secondary' | 'hidden')) {
        return false;
      }

      return true;
    });
  }, [pokemonWithAbility, showFaithful, abilityTypeFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} Pokémon
        </div>
        <div className="min-w-[180px]">
          <Label htmlFor="ability-type-filter">Ability Type</Label>
          <Select value={abilityTypeFilter} onValueChange={onAbilityTypeFilterChange}>
            <SelectTrigger className="bg-white" id="ability-type-filter">
              {abilityTypeFilter === 'all' ? 'All Types' : 
               abilityTypeFilter === 'primary' ? 'Primary' :
               abilityTypeFilter === 'secondary' ? 'Secondary' : 'Hidden'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <PokemonDataTable 
        columns={pokemonWithAbilityColumns} 
        data={filteredData}
      />
    </div>
  );
}