'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { PokemonWithAbility } from '@/utils/loaders/ability-data-loader';
// import { normalizePokemonUrlKey } from '@/utils/pokemonUrlNormalizer';
import { cn } from '@/lib/utils';
import {
  formatPokemonDisplayWithForm,
  formatPokemonUrlWithForm,
  getFormTypeClass,
} from '@/utils/pokemonFormUtils';

export const pokemonWithAbilityColumns: ColumnDef<PokemonWithAbility>[] = [
  {
    accessorKey: 'pokemon',
    id: 'pokemon',
    header: ({ column }) => {
      return (
        <Button className="-ml-3" variant="ghost" onClick={() => column.toggleSorting()}>
          <>Pokémon</>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="size-3" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowUpDown className="size-3" />
          )}
        </Button>
      );
    },
    // cell: ({ row }) => {
    //   const { pokemon } = row.original;
    //   const pokemonUrl = pokemon.formName
    //     ? `${createPokemonUrl(pokemon.name)}?form=${encodeURIComponent(pokemon.formName)}`
    //     : createPokemonUrl(pokemon.name);

    //   return (
    //     <div className="flex items-center space-x-2 min-w-0">
    //       <Link
    //         href={pokemonUrl}
    //         className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 font-black capitalize"
    //       >
    //         {pokemon.name}
    //       </Link>
    //     </div>
    //   );
    // },
    cell: ({ row }) => {
      const { pokemon } = row.original;
      return (
        <Link
          href={formatPokemonUrlWithForm(pokemon.name, pokemon.formName || '')}
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 font-black"
        >
          {formatPokemonDisplayWithForm(pokemon.name)}
          {pokemon.formName && (
            <span
              className={`text-xs text-muted-foreground block capitalize ${getFormTypeClass(pokemon.formName)}`}
            >
              {formatPokemonDisplayWithForm(pokemon.formName.replace(/_form$/, '')) ||
                pokemon.formName}
            </span>
          )}
        </Link>
      );
    },

    filterFn: (row, id, value) => {
      const { pokemon } = row.original;
      const searchText = value.toLowerCase();
      const pokemonName = pokemon.name.toLowerCase();
      return pokemonName.includes(searchText);
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.pokemon.name.toLowerCase();
      const b = rowB.original.pokemon.name.toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    },
  },
  {
    accessorKey: 'abilityTypes',
    id: 'abilityTypes',
    header: ({ column }) => {
      return (
        <Button className="-ml-3" variant="ghost" onClick={() => column.toggleSorting()}>
          <>Ability Type</>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="size-3" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowUpDown className="size-3" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const { abilityTypes } = row.original;

      return (
        <div className="flex gap-1 flex-wrap">
          {abilityTypes.map((abilityType) => (
            <Badge
              key={abilityType}
              variant="secondary"
              className={cn(
                'text-xs',
                abilityType === 'primary' && 'bg-blue-100 text-blue-800',
                abilityType === 'secondary' && 'bg-green-100 text-green-800',
                abilityType === 'hidden' && 'bg-purple-100 text-purple-800',
              )}
            >
              {abilityType === 'primary' && 'Primary'}
              {abilityType === 'secondary' && 'Secondary'}
              {abilityType === 'hidden' && 'Hidden'}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const { abilityTypes } = row.original;
      if (value === 'all') return true;
      return abilityTypes.includes(value);
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original;
      const b = rowB.original;

      // Sort by first (highest priority) ability type
      const typeOrder = { primary: 0, secondary: 1, hidden: 2 };
      const aFirstType = a.abilityTypes[0];
      const bFirstType = b.abilityTypes[0];
      return (
        (typeOrder[aFirstType as keyof typeof typeOrder] || 999) -
        (typeOrder[bFirstType as keyof typeof typeOrder] || 999)
      );
    },
  },
  {
    accessorKey: 'types',
    id: 'types',
    header: () => <span className="text-foreground font-medium">Types</span>,
    cell: ({ row }) => {
      const { pokemon } = row.original;
      const types = Array.isArray(pokemon.types) ? pokemon.types : [pokemon.types];

      return (
        <div className="flex gap-1 flex-wrap">
          {types.filter(Boolean).map((type: string) => (
            <Badge
              key={type}
              variant={
                type.toLowerCase() as
                  | 'normal'
                  | 'fire'
                  | 'water'
                  | 'electric'
                  | 'grass'
                  | 'ice'
                  | 'fighting'
                  | 'poison'
                  | 'ground'
                  | 'flying'
                  | 'psychic'
                  | 'bug'
                  | 'rock'
                  | 'ghost'
                  | 'dragon'
                  | 'dark'
                  | 'steel'
                  | 'fairy'
              }
              className="text-xs"
            >
              {type}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
];
