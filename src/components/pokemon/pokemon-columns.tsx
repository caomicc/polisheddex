'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
// import Link from 'next/link';
// import {
//   formatFormName,
//   formatPokemonBaseName,
//   formatPokemonDisplayWithForm,
//   formatPokemonUrlWithForm,
//   getFormTypeClass,
// } from '@/utils/pokemonFormUtils';
// import TimeIcon from './TimeIcon';
import { Badge } from '../ui/badge';
// import { PokemonEncounter } from '@/types/types';
// import { PokemonSprite } from './pokemon-sprite';
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
// export const pokemonColumns: ColumnDef<PokemonEncounter>[] = [
export const pokemonColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const { name, form } = row.original;
      console.log(name, form);
      // const primaryType =
      //   Array.isArray(pokemon.types) && pokemon.types.length > 0
      //     ? pokemon.types[0].toLowerCase()
      //     : 'unknown';

      return (
        <div className="">
          {/* <Link href={formatPokemonUrlWithForm(name, form || '')} className="table-link">
            <PokemonSprite
              hoverAnimate={true}
              pokemonName={formatPokemonBaseName(name)}
              alt={`${name} sprite`}
              primaryType={'ghost'}
              variant="normal"
              type="static"
              className="shadow-none"
              form={
                form
                  ? form
                      .toLowerCase()
                      .replace(/_?form$/g, '')
                      .replace(/^arbok/, '')
                      .replace(/^ekans/, '')
                      .replace(/^pikachu/, '')
                      .replace(/\s+/g, '')
                  : 'plain'
              }
              size={'sm'}
            />
          </Link> */}
          ghjkghulj
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
      // const { name, form } = pokemon;
      console.log(pokemon);
      return (
        <div className="flex flex-col items-start space-x-2 min-w-0">
          {/* <Link href={formatPokemonUrlWithForm(name, form || '')} className="table-link">
            {formatPokemonBaseName(name)}
            {form && (
              <span
                className={`text-xs text-muted-foreground block capitalize ml-2 ${getFormTypeClass(form)}`}
              >
                {formatFormName(
                  form
                    .toLowerCase()
                    .replace(/_form$/, '')
                    .replace(/form$/g, '')
                    .replace(/^arbok/, '')
                    .replace(/^ekans/, '')
                    .replace(/^pikachu/, '')
                    .replace(/arbok/g, ''),
                )}
              </span>
            )}
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </Link>
          eee */}
          eee
        </div>
      );
    },
    // filterFn: (row, id, value) => {
    //   const pokemon = row.original;
    //   const searchText = value.toLowerCase();
    //   const pokemonName = pokemon.name.toLowerCase();
    //   const fullPokemonName = pokemon.form
    //     ? `${pokemon.name}_${pokemon.form}`.toLowerCase()
    //     : pokemonName;

    //   return (
    //     pokemonName.includes(searchText) ||
    //     fullPokemonName.includes(searchText) ||
    //     formatPokemonDisplayWithForm(fullPokemonName).toLowerCase().includes(searchText)
    //   );
    // },
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
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="-ml-3 label-text">
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
      return <div className="text-cell">{method ? formatMethod(method) : '-'}</div>;
    },
  },
  {
    accessorKey: 'time',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="-ml-3 label-text">
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
      let time = row.getValue('time') as any;

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
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="-ml-3 label-text">
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
      return <div className="text-cell">Lv. {row.getValue('level')}</div>;
    },
  },
  {
    accessorKey: 'chance',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting()} className="-ml-3 label-text">
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
      return <div className="text-cell">{row.getValue('chance')}%</div>;
    },
  },
];
