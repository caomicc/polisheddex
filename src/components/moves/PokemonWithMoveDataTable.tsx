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
      <div className="flex flex-col sm:flex-col gap-4 items-start sm:items-start justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-col">
            <Label htmlFor="method-filter">Learn Method</Label>
            <Select value={learnMethodFilter} onValueChange={onLearnMethodFilterChange}>
              <SelectTrigger className="bg-white w-full sm:w-[180px]" id="method-filter">
                {learnMethodFilter === 'all'
                  ? 'All Methods'
                  : learnMethodFilter.charAt(0).toUpperCase() + learnMethodFilter.slice(1)}
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

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredData.length} item{filteredData.length !== 1 ? 's' : ''} found
        </div>
      </div>
      {/* Data Table */}
      <PokemonDataTable columns={pokemonWithMoveColumns} data={filteredData} />
    </div>
  );
}
