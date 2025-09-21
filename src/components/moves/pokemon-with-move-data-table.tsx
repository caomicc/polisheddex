'use client';

import React, { useMemo } from 'react';
import { PokemonDataTable } from '@/components/pokemon/pokemon-data-table';
import { pokemonWithMoveColumns } from './pokemon-with-move-columns';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
import { MoveLearner } from '@/types/new';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';

interface PokemonWithMoveDataTableProps {
  learners: MoveLearner[];
  learnMethodFilter: string;
  onLearnMethodFilterChange: (value: string) => void;
  showFaithful: boolean;
}

export default function PokemonWithMoveDataTable({
  learners,
  learnMethodFilter,
  onLearnMethodFilterChange,
}: PokemonWithMoveDataTableProps) {
  const { showFaithful } = useFaithfulPreference();

  const version = showFaithful ? 'faithful' : 'polished';
  // Filter Pokemon based on faithful preference and learn method
  const filteredData = useMemo(() => {
    return learners.filter((item) => {
      // Filter by faithful preference - check if this entry exists for the selected version
      if (!version) return false;

      // Filter by learn method
      if (
        learnMethodFilter !== 'all' &&
        !item.methods.some((method) => method.method === learnMethodFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [learners, version, learnMethodFilter]);

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
      <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-1">
        <BentoGridNoLink>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 flex-col">
              <Label className="label-text" htmlFor="method-filter">
                Learn Method
              </Label>
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

          <div className="text-xs">{filteredData.length} pokemon found</div>
        </BentoGridNoLink>
        <PokemonDataTable columns={pokemonWithMoveColumns} data={filteredData} />
      </BentoGrid>
    </div>
  );
}
