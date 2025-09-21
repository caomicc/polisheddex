// pokemon columns for /pokemon route

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { PokemonManifest } from '@/types/new';
import { PokemonSprite } from './pokemon-sprite';
import { formatPokemonUrlWithForm } from '@/utils/pokemonFormUtils';

export const createPokemonListColumns = (version: string): ColumnDef<PokemonManifest>[] => [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const pokemon = row.original;
      // Use the extracted form name for proper sprite handling
      return (
        <div className="">
          <Link
            href={formatPokemonUrlWithForm(pokemon.name, pokemon.formName)}
            className="table-link"
          >
            <PokemonSprite
              hoverAnimate={true}
              pokemonName={pokemon.name}
              alt={`${pokemon.name} sprite`}
              variant="normal"
              type="static"
              form={pokemon.formName}
              size={'sm'}
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
    accessorKey: 'dexNo',
    id: 'dexNo',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-3 label-text"
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
      const dexNo = row.getValue('dexNo') as number | null;
      return (
        <div className="text-cell">
          {dexNo !== null ? `#${dexNo}` : <span className="text-cell text-cell-muted">—</span>}
        </div>
      );
    },
    size: 60,
  },
  {
    accessorKey: 'name',
    id: 'name',
    header: ({ column }) => {
      return (
        <Button
          className="-ml-3 label-text"
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

      return (
        <div className="min-w-0">
          <Link
            className="table-link"
            href={formatPokemonUrlWithForm(pokemon.name, pokemon.formName)}
          >
            {pokemon.name}
            {pokemon.formName && pokemon.formName !== 'plain' && (
              <span className={`text-xs text-muted-foreground block capitalize ml-1`}>
                ({pokemon.formName.replace(/_form$/, '').replace(/^./, (c) => c.toUpperCase())})
              </span>
            )}
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </Link>
        </div>
      );
    },
    filterFn: (row, value) => {
      const pokemon = row.original;
      const searchText = value.toLowerCase();

      // Extract base name for search
      const baseNameLower = pokemon.name.toLowerCase();
      const displayName = pokemon.name;
      const fullNameLower = pokemon.name.toLowerCase();
      const formNameLower = pokemon.formName ? pokemon.formName.toLowerCase() : '';

      return (
        baseNameLower.includes(searchText) ||
        displayName.includes(searchText) ||
        fullNameLower.includes(searchText) ||
        formNameLower.includes(searchText)
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

      const currentForm = pokemon.formName || 'plain';
      const displayTypes = pokemon.versions[version]?.[currentForm]?.types;
      const typesArray = Array.isArray(displayTypes)
        ? displayTypes
        : displayTypes
          ? [displayTypes]
          : [];

      return (
        <div className="flex gap-1">
          {typesArray.map((type, index) => (
            <Badge key={index} variant={type.toLowerCase()}>
              {type}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const pokemon = row.original;
      const searchText = value.toLowerCase();

      const currentForm = pokemon.formName || 'plain';

      const displayTypes = pokemon.versions[version]?.[currentForm]?.types;
      const typesArray = Array.isArray(displayTypes)
        ? displayTypes
        : displayTypes
          ? [displayTypes]
          : [];

      return typesArray.some((type) => type.toLowerCase().includes(searchText));
    },
    // size: 150,
  },
];
