'use client';

import { BaseData } from '@/types/types';
import React, { useState } from 'react';
import PokemonCard from './PokemonCard';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { cn } from '@/lib/utils';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';

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

  // Filter Pokemon based on search query (name or type)
  const filteredPokemon = pokemon.filter((p) => {
    const query = searchQuery.toLowerCase();

    // Check if name matches
    if (p.name.toLowerCase().includes(query)) {
      return true;
    }

    // Get the appropriate types based on user preference
    const selectedTypes = showUpdatedTypes ? p.updatedTypes || p.types : p.types;

    // Check if any type matches
    const types = Array.isArray(selectedTypes) ? selectedTypes : [selectedTypes];
    if (types.some((type: string) => type.toLowerCase().includes(query))) {
      return true;
    }

    // Check if any form type matches
    if (p.forms) {
      for (const formName in p.forms) {
        const formSelectedTypes = showUpdatedTypes
          ? p.forms[formName].updatedTypes || p.forms[formName].types
          : p.forms[formName].faithfulTypes || p.forms[formName].types;

        const formTypes = Array.isArray(formSelectedTypes)
          ? formSelectedTypes
          : [formSelectedTypes];

        if (formTypes.some((type: string) => type.toLowerCase().includes(query))) {
          return true;
        }
      }
    }

    return false;
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

      {filteredPokemon.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No Pokémon found matching your search.</p>
      ) : (
        <ul className="grid gap-4 md:gap-8 grid-cols-2 md:grid-cols-3">
          {filteredPokemon.map((p) => (
            <li key={p.name}>
              <PokemonCard pokemon={p} sortType={sortType} showUpdatedTypes={showUpdatedTypes} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
