'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { displayName, formatPokemonUrlWithForm, getFormTypeClass } from '@/utils/pokemonFormUtils';
import { PokemonSprite } from '../pokemon/pokemon-sprite';
import { AbilityData } from '@/types/new';

// Define the type for individual Pokemon with ability entries
type PokemonWithAbility = NonNullable<AbilityData['versions'][string]['pokemon']>[number];

export const pokemonWithAbilityColumns: ColumnDef<PokemonWithAbility>[] = [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const pokemon = row.original;
      return (
        <div className="">
          <Link
            className="table-link"
            href={formatPokemonUrlWithForm(
              pokemon.name,
              pokemon.form ? pokemon.form.toString() : 'plain',
            )}
          >
            <PokemonSprite
              hoverAnimate={true}
              pokemonName={pokemon.name}
              alt={`${pokemon.name} sprite`}
              variant="normal"
              type="static"
              form={typeof pokemon.form === 'string' ? pokemon.form : 'plain'}
              size="sm"
              className="shadow-none"
            />
          </Link>
        </div>
      );
    },
    enableSorting: false,
    size: 60,
  },
  {
    accessorKey: 'pokemon',
    id: 'pokemon',
    header: ({ column }) => {
      return (
        <Button className="-ml-3 label-text" variant="ghost" onClick={() => column.toggleSorting()}>
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

    cell: ({ row }) => {
      const pokemon = row.original;
      return (
        <Link
          href={formatPokemonUrlWithForm(pokemon.name, pokemon.form || '')}
          className="table-link"
        >
          {displayName(pokemon.name)}
          {pokemon.form && pokemon.form !== 'plain' && (
            <span
              className={`text-xs text-muted-foreground block capitalize ${getFormTypeClass(pokemon.form)}`}
            >
              ({pokemon.form})
            </span>
          )}
        </Link>
      );
    },

    filterFn: (row, id, value) => {
      const pokemon = row.original;
      const searchText = value.toLowerCase();
      const pokemonName = pokemon.name.toLowerCase();
      return pokemonName.includes(searchText);
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.name.toLowerCase();
      const b = rowB.original.name.toLowerCase();
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
        <Button className="-ml-3 label-text" variant="ghost" onClick={() => column.toggleSorting()}>
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
          {abilityTypes.map((abilityType: string) => (
            <Badge key={abilityType} variant={abilityType}>
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
];
