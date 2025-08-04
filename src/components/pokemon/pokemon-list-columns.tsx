'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { BaseData, PokemonType } from '@/types/types';
import { PokemonSprite } from './pokemon-sprite';

// Helper function to format Pokemon names
function formatPokemonName(name: string): string {
  if (name === 'nidoran-f') return 'Nidoran ♀';
  if (name === 'nidoran-m') return 'Nidoran ♂';
  if (name === 'Mr-Mime') return 'Mr. Mime';
  if (name === 'Mime-Jr') return 'Mime Jr.';
  if (name === 'Farfetchd') return "Farfetch'd";
  if (name === 'Sirfetchd') return "Sirfetch'd";
  if (name === 'Ho-Oh') return 'Ho-Oh';
  if (name === 'mr-rime' || name === 'Mr-Rime') return 'Mr. Rime';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const createPokemonListColumns = (showFaithful: boolean): ColumnDef<BaseData>[] => [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const pokemon = row.original;
      const primaryType =
        Array.isArray(pokemon.types) && pokemon.types.length > 0
          ? pokemon.types[0].toLowerCase()
          : 'unknown';

      return (
        <div className="">
          <Link href={`/pokemon/${pokemon.normalizedUrl || pokemon.name.toLowerCase()}`}>
            <PokemonSprite
              pokemonName={pokemon.name}
              alt={`${pokemon.name} sprite`}
              primaryType={primaryType as PokemonType['name']}
              variant="normal"
              type="static"
              src={pokemon.frontSpriteUrl}
              className="w-10! h-10! p-1! rounded-md!"
            />
          </Link>
        </div>
      );
    },
    enableSorting: false,
    size: 60,
  },
  {
    accessorKey: 'johtoDex',
    id: 'johtoDex',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          #
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
      const johtoDex = row.getValue('johtoDex') as number | null;
      return (
        <div className="text-sm font-mono">
          {johtoDex !== null && johtoDex < 999 ? `#${johtoDex}` : '—'}
        </div>
      );
    },
    size: 60,
  },
  // {
  //   accessorKey: 'nationalDex',
  //   id: 'nationalDex',
  //   header: ({ column }) => {
  //     return (
  //       <Button className="-ml-3" variant="ghost" onClick={() => column.toggleSorting()}>
  //         National #
  //         {column.getIsSorted() === 'desc' ? (
  //           <ArrowDown className="size-3" />
  //         ) : column.getIsSorted() === 'asc' ? (
  //           <ArrowUp className="size-3" />
  //         ) : (
  //           <ArrowUpDown className="size-3" />
  //         )}
  //       </Button>
  //     );
  //   },
  //   cell: ({ row }) => {
  //     const nationalDex = row.getValue('nationalDex') as number | null;
  //     return (
  //       <div className="text-sm font-mono">{nationalDex !== null ? `#${nationalDex}` : '—'}</div>
  //     );
  //   },
  //   size: 100,
  // },
  {
    accessorKey: 'name',
    id: 'name',
    header: ({ column }) => {
      return (
        <Button
          className="-ml-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
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
      const displayName = formatPokemonName(pokemon.name);

      return (
        <div className="min-w-0">
          <Link
            href={`/pokemon/${pokemon.normalizedUrl || pokemon.name.toLowerCase()}`}
            className="font-semibold"
          >
            {displayName}
          </Link>
          {Array.isArray(pokemon.forms) && pokemon.forms.length > 1 && (
            <div className="text-xs text-muted-foreground">{pokemon.forms.length} forms</div>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const pokemon = row.original;
      const searchText = value.toLowerCase();
      const pokemonName = pokemon.name.toLowerCase();
      const displayName = formatPokemonName(pokemon.name).toLowerCase();
      // const types = row.getValue(id) as string[];
      return (
        // types.some((type) => type.toLowerCase().includes(value.toLowerCase())) ||
        pokemonName.includes(searchText) || displayName.includes(searchText)
      );
    },
    // size: 150,
  },
  {
    accessorKey: 'types',
    id: 'types',
    header: 'Types',
    cell: ({ row }) => {
      const pokemon = row.original;
      // Use faithful vs polished types based on context
      const displayTypes = showFaithful
        ? pokemon.faithfulTypes || pokemon.types
        : pokemon.updatedTypes || pokemon.types;
      const typesArray = Array.isArray(displayTypes) ? displayTypes : [displayTypes];

      return (
        <div className="flex gap-1">
          {typesArray.map((type, index) => (
            <Badge key={index} variant={type.toLowerCase() as PokemonType['name']}>
              {type}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const pokemon = row.original;
      const searchText = value.toLowerCase();
      const displayTypes = showFaithful
        ? pokemon.faithfulTypes || pokemon.types
        : pokemon.updatedTypes || pokemon.types;
      const typesArray = Array.isArray(displayTypes) ? displayTypes : [displayTypes];

      return typesArray.some((type) => type.toLowerCase().includes(searchText));
    },
    // size: 150,
  },
];

// Backwards compatibility - keep the old export for any existing usage
export const pokemonListColumns = createPokemonListColumns(false);
