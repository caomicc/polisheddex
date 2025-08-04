'use client';

import { BaseData } from '@/types/types';
import React, { useState } from 'react';
import PokemonCard from './pokemon-card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { cn } from '@/lib/utils';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import Link from 'next/link';
import { normalizePokemonUrlKey } from '@/utils/pokemonUrlNormalizer';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import { PokemonGridSkeleton } from './pokemon-card-skeleton';

interface PokemonSearchProps {
  pokemon: BaseData[];
  sortType: string;
}

export default function PokemonSearch({ pokemon, sortType }: PokemonSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { showFaithful } = useFaithfulPreference();

  // For backward compatibility, we'll use the inverse of showFaithful
  // since the original logic was "showUpdatedTypes" (true = updated, false = faithful)
  const showUpdatedTypes = !showFaithful;

  const { filteredPokemon, isSearching } = usePokemonSearch({
    pokemon,
    searchQuery,
    showUpdatedTypes,
  });

  return (
    <>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="pokemon-search">Search Pokémon</Label>
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
          <Label htmlFor="sort-select" className="">
            Sort:
          </Label>
          <Select
            value={sortType}
            onValueChange={(value) => {
              window.location.search = `?sort=${value}`;
            }}
          >
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

        {/* <div className="flex items-center gap-2 ml-auto">
          <Label htmlFor="type-toggle" className="text-sm whitespace-nowrap">
            <span className={!showUpdatedTypes ? 'font-bold' : 'text-gray-500'}>Faithful</span>
            {' / '}
            <span className={showUpdatedTypes ? 'font-bold' : 'text-gray-500'}>Updated</span>
            {' Types'}
          </Label>
          <Switch
            id="type-toggle"
            checked={showUpdatedTypes}
            onCheckedChange={() => toggleFaithful()}
            aria-label="Toggle between faithful and updated Pokémon types"
          />
        </div> */}
      </div>

      {/* <div className="flex items-center gap-2 mb-4">
        <Label htmlFor="type-display-toggle" className="cursor-pointer">
          {showUpdatedTypes ? 'Show Faithful Types' : 'Show Updated Types'}
        </Label>
        <Switch
          id="type-display-toggle"
          checked={showUpdatedTypes}
          onCheckedChange={(checked) => setShowUpdatedTypes(checked)}
        />
      </div> */}

      {isSearching ? (
        <PokemonGridSkeleton count={12} />
      ) : filteredPokemon.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No Pokémon found matching your search.</p>
      ) : (
        <ul className="grid gap-4 md:gap-8 grid-cols-2 md:grid-cols-3">
          {filteredPokemon.map((p) => {
            // Use pre-computed normalized URL if available, otherwise fallback to runtime normalization
            const normalizedName = p.normalizedUrl || normalizePokemonUrlKey(p.name).toLowerCase();
            const pokemonUrl = p.formName
              ? `/pokemon/${normalizedName}?form=${encodeURIComponent(p.formName)}`
              : `/pokemon/${normalizedName}`;
            return (
              <li key={p.name}>
                <Link href={pokemonUrl}>
                  <PokemonCard
                    pokemon={p}
                    sortType={sortType}
                    showUpdatedTypes={showUpdatedTypes}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
