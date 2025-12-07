'use client';

import { useState, useMemo } from 'react';
import { DetailCard } from '@/components/ui/detail-card';
import { PokemonDataTable } from '@/components/pokemon/pokemon-data-table';
import { pokemonWithAbilityColumns } from './pokemon-with-ability-columns';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface AbilityPokemon {
  id: string;
  name: string;
  form?: string;
  abilityTypes: string[];
  types?: string[];
}

interface AbilityPokemonCardProps {
  pokemon: AbilityPokemon[];
  className?: string;
}

export function AbilityPokemonCard({ pokemon, className }: AbilityPokemonCardProps) {
  const [abilityTypeFilter, setAbilityTypeFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    if (abilityTypeFilter === 'all') return pokemon;

    return pokemon.filter((item) =>
      item.abilityTypes.includes(abilityTypeFilter as 'primary' | 'secondary' | 'hidden')
    );
  }, [pokemon, abilityTypeFilter]);

  if (!pokemon || pokemon.length === 0) {
    return null;
  }

  return (
    <DetailCard icon={Users} title="Pokémon With This Ability" className={className}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <Label className="text-sm text-neutral-600 dark:text-neutral-400" htmlFor="ability-type-filter">
              Ability Slot
            </Label>
            <Select value={abilityTypeFilter} onValueChange={setAbilityTypeFilter}>
              <SelectTrigger className="bg-white dark:bg-neutral-800 w-[180px]" id="ability-type-filter">
                {abilityTypeFilter === 'all'
                  ? 'All Slots'
                  : abilityTypeFilter.charAt(0).toUpperCase() + abilityTypeFilter.slice(1)}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Slots</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {filteredData.length} Pokémon found
          </span>
        </div>

        <PokemonDataTable columns={pokemonWithAbilityColumns} data={filteredData} />
      </div>
    </DetailCard>
  );
}
