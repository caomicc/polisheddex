'use client';

import { PokemonManifest } from '@/types/new';
import React, { useState, useMemo } from 'react';
import PokemonCard from './pokemon-card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { cn } from '@/lib/utils';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import Link from 'next/link';
import { normalizePokemonUrlKey } from '@/utils/pokemonUrlNormalizer';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import { PokemonGridSkeleton } from './pokemon-card-skeleton';

interface PokemonSearchProps {
  pokemon: PokemonManifest[];
  sortType?: string;
}

export default function PokemonSearch({
  pokemon,
  sortType: initialSortType = 'johtodex',
}: PokemonSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState(initialSortType);
  const { showFaithful } = useFaithfulPreferenceSafe();

  // For backward compatibility, we'll use the inverse of showFaithful
  // since the original logic was "showUpdatedTypes" (true = updated, false = faithful)
  const showUpdatedTypes = !showFaithful;

  // Sort pokemon based on selected sort type
  const sortedPokemon = useMemo(() => {
    return [...pokemon].sort((a, b) => {
      if (sortType === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (sortType === 'nationaldex') {
        return (a.dexNo ?? 0) - (b.dexNo ?? 0) || a.name.localeCompare(b.name);
      }
      if (sortType === 'johtodex') {
        return (a.dexNo ?? 999) - (b.dexNo ?? 999) || a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [pokemon, sortType]);

  const { filteredPokemon, isSearching } = usePokemonSearch({
    pokemon: sortedPokemon,
    searchQuery,
    showUpdatedTypes,
  });

  return (
    <>
      <div className="grid w-full items-center gap-2">
        <Label className="table-header-label" htmlFor="pokemon-search">
          Search Pokémon
        </Label>
        <Input
          id="pokemon-search"
          placeholder="Search by name or type..."
          className=" bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="my-4 flex items-center gap-2 relative flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="table-header-label" htmlFor="sort-select">
            Sort:
          </Label>
          <Select value={sortType} onValueChange={(value) => setSortType(value)}>
            <SelectTrigger
              className={cn(
                'w-full sm:w-[180px]', // full width on mobile, fixed on larger screens
                'max-w-[180px]',
                'bg-white',
              )}
              id="sort-select"
            >
              {sortType.charAt(0).toUpperCase() + sortType.slice(1).replace('dex', ' Dex')}
            </SelectTrigger>
            <SelectContent
              className={cn(
                'w-full right-0 max-w-[180px]', // ensure dropdown is full width and right aligned
                'sm:w-[180px]',
              )}
            >
              <SelectItem value="johtodex">Johto Dex</SelectItem>
              <SelectItem value="nationaldex">National Dex</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isSearching ? (
        <PokemonGridSkeleton count={12} />
      ) : filteredPokemon.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No Pokémon found matching your search.</p>
      ) : (
        <ul className="grid gap-4 md:gap-8 grid-cols-2 md:grid-cols-3">
          {filteredPokemon.map((p) => {
            // Use pre-computed normalized URL if available, otherwise fallback to runtime normalization
            const normalizedName = normalizePokemonUrlKey(p.name).toLowerCase();
            // const normalizedName = p.normalizedUrl || normalizePokemonUrlKey(p.name).toLowerCase();
            const pokemonUrl = p.formName
              ? `/pokemon/${normalizedName}?form=${encodeURIComponent(p.formName)}`
              : `/pokemon/${normalizedName}`;
            return (
              <li key={p.name}>
                <Link href={pokemonUrl}>
                  <PokemonCard pokemon={p} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
