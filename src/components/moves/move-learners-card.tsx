'use client';

import { useState, useMemo } from 'react';
import { DetailCard } from '@/components/ui/detail-card';
import { PokemonDataTable } from '@/components/pokemon/pokemon-data-table';
import { pokemonWithMoveColumns } from './pokemon-with-move-columns';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MoveLearner } from '@/types/new';
import { Users } from 'lucide-react';

interface MoveLearnersCardProps {
  learners: MoveLearner[];
  className?: string;
}

export function MoveLearnersCard({ learners, className }: MoveLearnersCardProps) {
  const [learnMethodFilter, setLearnMethodFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    if (learnMethodFilter === 'all') return learners;

    return learners.filter((item) =>
      item.methods.some((method) => method.method === learnMethodFilter)
    );
  }, [learners, learnMethodFilter]);

  if (!learners || learners.length === 0) {
    return null;
  }

  return (
    <DetailCard icon={Users} title="Pokémon That Learn This Move" className={className}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <Label className="text-sm text-neutral-600 dark:text-neutral-400" htmlFor="method-filter">
              Learn Method
            </Label>
            <Select value={learnMethodFilter} onValueChange={setLearnMethodFilter}>
              <SelectTrigger className="bg-white dark:bg-neutral-800 w-[180px]" id="method-filter">
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
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {filteredData.length} Pokémon found
          </span>
        </div>

        <PokemonDataTable columns={pokemonWithMoveColumns} data={filteredData} />
      </div>
    </DetailCard>
  );
}
