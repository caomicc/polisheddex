// pokemon columns for /pokemon route

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { BaseData, PokemonType } from '@/types/types';
import { PokemonSprite } from './pokemon-sprite';
import {
  getFormTypeClass,
  extractPokemonForm,
  formatPokemonUrlWithForm,
} from '@/utils/pokemonFormUtils';

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

      // Extract base name and form for proper sprite handling
      const { baseName, formName } = extractPokemonForm(pokemon.name);
      const actualFormName = formName || pokemon.form;

      return (
        <div className="">
          <Link
            href={formatPokemonUrlWithForm(
              baseName,
              actualFormName ? actualFormName.toString() : 'plain',
            )}
            className="table-link"
          >
            <PokemonSprite
              hoverAnimate={true}
              pokemonName={baseName}
              alt={`${baseName} sprite`}
              primaryType={primaryType as PokemonType['name']}
              variant="normal"
              type="static"
              form={typeof actualFormName === 'string' ? actualFormName : 'plain'}
              src={pokemon.frontSpriteUrl}
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
    accessorKey: 'johtoDex',
    id: 'johtoDex',
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
      const johtoDex = row.getValue('johtoDex') as number | null;
      return (
        <div className="text-cell">
          {johtoDex !== null && johtoDex < 999 ? (
            `#${johtoDex}`
          ) : (
            <span className="text-cell text-cell-muted">—</span>
          )}
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

      // Extract base name and form from the pokemon name
      const { baseName, formName } = extractPokemonForm(pokemon.name);
      const displayName = formatPokemonName(baseName);

      // Use the extracted form name or the stored form property, ensuring it's a string when used in JSX
      const rawActualForm = formName ?? pokemon.form;
      const actualFormName =
        typeof rawActualForm === 'string' && rawActualForm !== '' ? rawActualForm : undefined;

      return (
        <div className="min-w-0">
          <Link
            className="table-link"
            href={formatPokemonUrlWithForm(
              baseName,
              actualFormName ? actualFormName.toString() : 'plain',
            )}
          >
            {displayName}
            {actualFormName && actualFormName !== 'plain' && (
              <span
                className={`text-xs text-muted-foreground block capitalize ml-1 ${getFormTypeClass(actualFormName)}`}
              >
                ({actualFormName.replace(/_form$/, '').replace(/^./, (c) => c.toUpperCase())})
              </span>
            )}
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </Link>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const pokemon = row.original;
      const searchText = value.toLowerCase();

      // Extract base name for search
      const { baseName, formName } = extractPokemonForm(pokemon.name);
      const baseNameLower = baseName.toLowerCase();
      const displayName = formatPokemonName(baseName).toLowerCase();
      const fullNameLower = pokemon.name.toLowerCase();
      const formNameLower = formName ? formName.toLowerCase() : '';

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
