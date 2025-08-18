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
import { PokemonSprite } from '../pokemon/pokemon-sprite';
import { createPokemonUrl } from '@/utils/pokemonLinkHelper';
import { PokemonType } from '@/types/types';

export const pokemonWithAbilityColumns: ColumnDef<PokemonWithAbility>[] = [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const { pokemon } = row.original;
      const primaryType =
        Array.isArray(pokemon.types) && pokemon.types.length > 0
          ? pokemon.types[0].toLowerCase()
          : 'unknown';

      return (
        <div className="">
          <Link
            href={`${createPokemonUrl(pokemon.name)}${pokemon.form ? `?form=${pokemon.form}` : ''}`}
          >
            <PokemonSprite
              pokemonName={pokemon.name}
              alt={`${pokemon.name} sprite`}
              primaryType={primaryType as PokemonType['name']}
              variant="normal"
              type="static"
              form={typeof pokemon.form === 'string' ? pokemon.form : 'plain'}
              src={pokemon.frontSpriteUrl}
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
    header: () => <span className="label-text">Types</span>,
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
