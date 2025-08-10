'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { PokemonWithMove } from '@/utils/loaders/move-data-loader';
// import { normalizePokemonUrlKey } from '@/utils/pokemonUrlNormalizer';
import { cn } from '@/lib/utils';
import {
  formatPokemonDisplayWithForm,
  formatPokemonUrlWithForm,
  getFormTypeClass,
} from '@/utils/pokemonFormUtils';
import { createPokemonUrl } from '@/utils/pokemonLinkHelper';
import { PokemonSprite } from '../pokemon/pokemon-sprite';
import { PokemonType } from '@/types/types';

export const pokemonWithMoveColumns: ColumnDef<PokemonWithMove>[] = [
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
    accessorKey: 'pokemon',
    id: 'pokemon',
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
      const { pokemon } = row.original;
      return (
        <Link
          href={formatPokemonUrlWithForm(pokemon.name, pokemon.formName || '')}
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 font-black"
        >
          {formatPokemonDisplayWithForm(pokemon.name)}
          {pokemon.formName && pokemon.formName !== 'plain' && (
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
    accessorKey: 'learnMethod',
    id: 'learnMethod',
    header: ({ column }) => {
      return (
        <Button className="-ml-3" variant="ghost" onClick={() => column.toggleSorting()}>
          <>Method</>
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
      const { learnMethod } = row.original;

      return (
        <Badge
          variant="secondary"
          className={cn(
            'text-xs',
            learnMethod === 'level' && 'bg-blue-100 text-blue-800',
            learnMethod === 'tm' && 'bg-purple-100 text-purple-800',
            learnMethod === 'egg' && 'bg-green-100 text-green-800',
            learnMethod === 'tutor' && 'bg-orange-100 text-orange-800',
          )}
        >
          {learnMethod}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const { learnMethod } = row.original;
      if (value === 'all') return true;
      return learnMethod === value;
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original;
      const b = rowB.original;

      // Sort by method first
      if (a.learnMethod !== b.learnMethod) {
        const methodOrder = { level: 0, tm: 1, egg: 2, tutor: 3 };
        return (
          (methodOrder[a.learnMethod as keyof typeof methodOrder] || 999) -
          (methodOrder[b.learnMethod as keyof typeof methodOrder] || 999)
        );
      }

      // If same method and it's level, sort by level
      if (a.learnMethod === 'level' && b.learnMethod === 'level') {
        const aLevel = typeof a.level === 'number' ? a.level : parseInt(String(a.level)) || 0;
        const bLevel = typeof b.level === 'number' ? b.level : parseInt(String(b.level)) || 0;
        return aLevel - bLevel;
      }

      return 0;
    },
  },
  {
    accessorKey: 'level',
    id: 'level',
    header: ({ column }) => {
      return (
        <Button className="-ml-3" variant="ghost" onClick={() => column.toggleSorting()}>
          <>Level</>
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
      const { learnMethod, level } = row.original;

      if (learnMethod !== 'level' || !level) {
        return <span className="text-muted-foreground">—</span>;
      }

      return <span className="font-mono">{level}</span>;
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original;
      const b = rowB.original;

      // Non-level moves go to the end
      if (a.learnMethod !== 'level' && b.learnMethod !== 'level') return 0;
      if (a.learnMethod !== 'level') return 1;
      if (b.learnMethod !== 'level') return -1;

      const aLevel = typeof a.level === 'number' ? a.level : parseInt(String(a.level)) || 0;
      const bLevel = typeof b.level === 'number' ? b.level : parseInt(String(b.level)) || 0;
      return aLevel - bLevel;
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
