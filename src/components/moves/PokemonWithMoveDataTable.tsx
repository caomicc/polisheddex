'use client';

import React, { useMemo } from 'react';
import { PokemonDataTable } from '@/components/pokemon/pokemon-data-table';
import { pokemonWithMoveColumns } from './pokemon-with-move-columns';
import { PokemonWithMove } from '@/utils/loaders/move-data-loader';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PokemonWithMoveDataTableProps {
  pokemonWithMove: PokemonWithMove[];
  learnMethodFilter: string;
  onLearnMethodFilterChange: (value: string) => void;
  showFaithful: boolean;
}

export default function PokemonWithMoveDataTable({
  pokemonWithMove,
  learnMethodFilter,
  onLearnMethodFilterChange,
  showFaithful,
}: PokemonWithMoveDataTableProps) {
  // Filter Pokemon based on faithful preference and learn method
  const filteredData = useMemo(() => {
    return pokemonWithMove.filter((item) => {
      // Filter by faithful preference - check if this entry exists for the selected version
      const versionMatch = showFaithful ? item.faithful : item.updated;
      if (!versionMatch) return false;

      // Filter by learn method
      if (learnMethodFilter !== 'all' && item.learnMethod !== learnMethodFilter) {
        return false;
      }

      return true;
    });
  }, [pokemonWithMove, showFaithful, learnMethodFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} Pokémon
        </div>
        <div className="min-w-[180px]">
          <Label htmlFor="method-filter">Learn Method</Label>
          <Select value={learnMethodFilter} onValueChange={onLearnMethodFilterChange}>
            <SelectTrigger className="bg-white" id="method-filter">
              {learnMethodFilter === 'all' ? 'All Methods' : 
               learnMethodFilter.charAt(0).toUpperCase() + learnMethodFilter.slice(1)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="level">Level Up</SelectItem>
              <SelectItem value="tm">TM/HM</SelectItem>
              <SelectItem value="egg">Egg Move</SelectItem>
              <SelectItem value="tutor">Move Tutor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <PokemonDataTable 
        columns={pokemonWithMoveColumns} 
        data={filteredData}
      />
    </div>
  );
}