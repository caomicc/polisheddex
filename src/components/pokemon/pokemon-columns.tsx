'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import {
  formatPokemonDisplayWithForm,
  formatPokemonUrlWithForm,
  getFormTypeClass,
} from '@/utils/pokemonFormUtils';
// import TimeIcon from './TimeIcon';
import { Badge } from '../ui/badge';
import { PokemonEncounter } from '@/types/types';
import { PokemonSprite } from './pokemon-sprite';
import { createPokemonUrl } from '@/utils/pokemonLinkHelper';
// import { P } from 'vitest/dist/reporters-5f784f42.js';

// Helper function to format method names (matching LocationListItem)
function formatMethod(method: string): string {
  if (method === 'grass') return 'Wild Grass';
  if (method === 'water') return 'Surfing';
  if (method === 'headbutt_rare') return 'Headbutt (Rare)';
  if (method === 'headbutt_common') return 'Headbutt (Common)';
  if (method === 'rocksmash') return 'Rock Smash';
  if (method === 'swarm') return 'Swarm';
  if (method === 'fish_super') return 'Fishing - Super Rod';
  if (method === 'fish_good') return 'Fishing - Good Rod';
  if (method === 'fish_old') return 'Fishing - Old Rod';
  return method.charAt(0).toUpperCase() + method.slice(1);
}
export const pokemonColumns: ColumnDef<PokemonEncounter>[] = [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const { name, form } = row.original;
      // const primaryType =
      //   Array.isArray(pokemon.types) && pokemon.types.length > 0
      //     ? pokemon.types[0].toLowerCase()
      //     : 'unknown';

      return (
        <div className="">
          <Link href={`${createPokemonUrl(name)}${form ? `?form=${form}` : ''}`}>
            <PokemonSprite
              pokemonName={name}
              alt={`${name} sprite`}
              primaryType={'ghost'}
              variant="normal"
              type="static"
              form={typeof form === 'string' ? form : 'plain'}
              // src={pokemon.frontSpriteUrl}
              size={'sm'}
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
    cell: ({ row }) => {
      const pokemon = row.original;
      const { form } = pokemon;

      return (
        <div className="flex flex-col items-start space-x-2 min-w-0">
          <Link
            href={formatPokemonUrlWithForm(pokemon.name, form || '')}
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 font-black"
          >
            {formatPokemonDisplayWithForm(pokemon.name)}
            {form && (
              <span
                className={`text-xs text-muted-foreground block capitalize ${getFormTypeClass(form)}`}
              >
                {formatPokemonDisplayWithForm(form.replace(/_form$/, '')) || form}
              </span>
            )}
          </Link>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const pokemon = row.original;
      const searchText = value.toLowerCase();
      const pokemonName = pokemon.name.toLowerCase();
      const fullPokemonName = pokemon.form
        ? `${pokemon.name}_${pokemon.form}`.toLowerCase()
        : pokemonName;

      return (
        pokemonName.includes(searchText) ||
        fullPokemonName.includes(searchText) ||
        formatPokemonDisplayWithForm(fullPokemonName).toLowerCase().includes(searchText)
      );
    },
    sortingFn: (rowA, rowB) => {
      // Sort by base name, then by form if present
      const a = rowA.original;
      const b = rowB.original;
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      if (aName < bName) return -1;
      if (aName > bName) return 1;

      // If names are equal, sort by form (if any)
      const aForm = a.form ? a.form.toLowerCase() : '';
      const bForm = b.form ? b.form.toLowerCase() : '';
      if (aForm < bForm) return -1;
      if (aForm > bForm) return 1;
      return 0;
    },
  },
  {
    accessorKey: 'method',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="-ml-3">
          Method
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
      const method = row.getValue('method') as string | undefined;
      return <div className="text-foreground">{method ? formatMethod(method) : '-'}</div>;
    },
  },
  {
    accessorKey: 'time',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="-ml-3">
          Time
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
      let time = row.getValue('time') as PokemonEncounter['time'];

      console.log('Encounter time:', row.getValue('time'));

      if (time === null || time === undefined || time === 'null') time = 'any';

      return (
        <Badge variant={time === 'all' ? 'any' : time || 'any'} className="flex items-center gap-1">
          {time === 'all' ? 'any' : time}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'level',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="-ml-3">
          Level
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
      return <div className="text-sm">Lv. {row.getValue('level')}</div>;
    },
  },
  {
    accessorKey: 'chance',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="-ml-3">
          Chance
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
      return <div className="text-sm text-foreground">{row.getValue('chance')}%</div>;
    },
  },
];
