'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { formatPokemonUrlWithForm, getFormTypeClass } from '@/utils/pokemonFormUtils';
import { PokemonSprite } from '../pokemon/pokemon-sprite';
import { MoveLearner } from '@/types/new';

export const pokemonWithMoveColumns: ColumnDef<MoveLearner>[] = [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const { id, name, form, types } = row.original;

      return (
        <div className="">
          <Link href={formatPokemonUrlWithForm(name || id, form || 'plain')} className="table-link">
            <PokemonSprite
              hoverAnimate={true}
              pokemonName={name || id}
              alt={`${name} sprite`}
              primaryType={types && types.length > 0 ? types[0].toLowerCase() : ''}
              variant="normal"
              type="static"
              form={typeof form === 'string' ? form : 'plain'}
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
    accessorKey: 'pokemon',
    id: 'pokemon',
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
      const { id, name, form } = row.original;
      return (
        <Link href={formatPokemonUrlWithForm(id, form)} className="table-link">
          {name}
          {form && form !== 'plain' && (
            <span
              className={`text-xs text-muted-foreground block capitalize ${getFormTypeClass(form)}`}
            >
              ({form})
            </span>
          )}
          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
        </Link>
      );
    },
    filterFn: (row, id, value) => {
      const searchText = value.toLowerCase();
      return row.original.id.includes(searchText);
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.id.toLowerCase();
      const b = rowB.original.id.toLowerCase();
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
        <Button className="-ml-3 label-text" variant="ghost" onClick={() => column.toggleSorting()}>
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
      const { methods } = row.original;
      const primaryMethod = Array.isArray(methods) ? methods[0]?.method : methods;

      return (
        <Badge
          variant="secondary"
          className={cn(
            'text-xs',
            primaryMethod === 'levelUp' && 'bg-blue-100 text-blue-800',
            primaryMethod === 'tm' && 'bg-purple-100 text-purple-800',
            primaryMethod === 'eggMove' && 'bg-green-100 text-green-800',
          )}
        >
          {primaryMethod === 'levelUp'
            ? 'Level'
            : primaryMethod === 'eggMove'
              ? 'Egg'
              : primaryMethod}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const { methods } = row.original;
      if (value === 'all') return true;
      const primaryMethod = Array.isArray(methods) ? methods[0]?.method : methods;
      return primaryMethod === value;
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original;
      const b = rowB.original;

      // Extract method strings for comparison
      const aMethod = Array.isArray(a.methods) ? a.methods[0]?.method : a.methods;
      const bMethod = Array.isArray(b.methods) ? b.methods[0]?.method : b.methods;

      // Sort by method first
      if (aMethod !== bMethod) {
        const methodOrder = { levelUp: 0, tm: 1, eggMove: 2, tutor: 3 };
        return (
          (methodOrder[aMethod as keyof typeof methodOrder] || 999) -
          (methodOrder[bMethod as keyof typeof methodOrder] || 999)
        );
      }

      // If same method and it's level, sort by level
      if (aMethod === 'levelUp' && bMethod === 'levelUp') {
        const aLevel = Array.isArray(a.methods) ? a.methods[0]?.level || 0 : 0;
        const bLevel = Array.isArray(b.methods) ? b.methods[0]?.level || 0 : 0;
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
        <Button className="-ml-3 label-text" variant="ghost" onClick={() => column.toggleSorting()}>
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
      const { methods } = row.original;
      const primaryMethod = Array.isArray(methods) ? methods[0]?.method : methods;

      if (primaryMethod !== 'levelUp') {
        return <span className="text-cell text-cell-muted">—</span>;
      }
      return <span className="text-cell">Level: {row.original.methods[0]?.level}</span>;
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original;
      const b = rowB.original;

      // Extract method strings for comparison
      const aMethod = Array.isArray(a.methods) ? a.methods[0]?.method : a.methods;
      const bMethod = Array.isArray(b.methods) ? b.methods[0]?.method : b.methods;

      // Non-level moves go to the end
      if (aMethod !== 'levelUp' && bMethod !== 'levelUp') return 0;
      if (aMethod !== 'levelUp') return 1;
      if (bMethod !== 'levelUp') return -1;

      const aLevel = Array.isArray(a.methods) ? a.methods[0]?.level || 0 : 0;
      const bLevel = Array.isArray(b.methods) ? b.methods[0]?.level || 0 : 0;
      return aLevel - bLevel;
    },
  },
  {
    accessorKey: 'types',
    id: 'types',
    header: () => <span className="text-foreground font-medium">Types</span>,
    cell: ({ row }) => {
      console.log('row.original:', row.original); // Debugging line
      const { types } = row.original;
      const typesArray = Array.isArray(types) ? types : [types];

      return (
        <div className="flex gap-1 flex-wrap">
          {typesArray.map((type) => (
            <Badge key={type} variant={type} className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
];
