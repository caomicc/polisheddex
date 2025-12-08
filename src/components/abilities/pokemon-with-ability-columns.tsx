'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { normalizePokemonUrlKey } from '@/utils/pokemonUrlNormalizer';
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
      const normalizedName = normalizePokemonUrlKey(pokemon.name).toLowerCase();
      const pokemonUrl =
        pokemon.form && pokemon.form !== 'plain'
          ? `/pokemon/${normalizedName}?form=${encodeURIComponent(String(pokemon.form))}`
          : `/pokemon/${normalizedName}`;
      return (
        <div className="">
          <Link className="table-link" href={pokemonUrl}>
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
        <Button className="-ml-3 table-header-label" variant="ghost" onClick={() => column.toggleSorting()}>
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
      const normalizedName = normalizePokemonUrlKey(pokemon.name).toLowerCase();
      const pokemonUrl =
        pokemon.form && pokemon.form !== 'plain'
          ? `/pokemon/${normalizedName}?form=${encodeURIComponent(String(pokemon.form))}`
          : `/pokemon/${normalizedName}`;
      return (
        <Link href={pokemonUrl} className="table-link">
          {pokemon.name}
          {pokemon.form && pokemon.form !== 'plain' && (
            <span
              // className={`text-xs text-muted-foreground block capitalize ${getFormTypeClass(pokemon.form)}`}
              className={`text-xs text-muted-foreground block capitalize`}
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
        <Button className="-ml-3 table-header-label" variant="ghost" onClick={() => column.toggleSorting()}>
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
            <Badge key={abilityType} variant={abilityType as any}>
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
    header: ({ column }) => {
      return (
        <Button className="-ml-3 table-header-label" variant="ghost" onClick={() => column.toggleSorting()}>
          <>Type(s)</>
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
      const types = row.original.types;
      return (
        <div className="flex gap-1 flex-wrap">
          {types && types.length > 0 ? (
            types.map((type) => (
              <Badge key={type} variant={type.toLowerCase() as any}>
                {type}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Unknown</span>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const { types } = row.original;
      if (value === 'all') return true;
      return types?.includes(value) ?? false;
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.types ? rowA.original.types[0] : '';
      const b = rowB.original.types ? rowB.original.types[0] : '';
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    },
  },
];
