'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MoveDescription } from '@/types/types';
import { accentInsensitiveIncludes } from '@/utils/stringUtils';

export const moveColumns: ColumnDef<MoveDescription>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
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
      const move = row.original;
      return (
        <div className="flex items-center space-x-2 min-w-0 word-wrap table-link">{move.name}</div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const itemName = row.getValue(id) as string;
      return accentInsensitiveIncludes(itemName, value);
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
        >
          Type
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
      const move = row.original;
      // Prefer updated, fallback to faithful, fallback to undefined
      const type = move.updated?.type ?? move.faithful?.type ?? move.type ?? 'Unknown';
      return (
        <Badge variant="outline" className="text-xs">
          {type}
        </Badge>
      );
    },
    accessorFn: (row) => row.updated?.type ?? row.faithful?.type ?? row.type ?? 'Unknown',
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
        >
          <span className="hidden md:inline">Category</span>
          <span className="inline md:hidden">Cat.</span>
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
      const move = row.original;
      const category = move.updated?.category ?? move.faithful?.category ?? 'Unknown';
      return (
        <Badge variant="secondary" className="text-xs">
          {category}
        </Badge>
      );
    },
    accessorFn: (row) => row.updated?.category ?? row.faithful?.category ?? 'Unknown',
  },

  {
    accessorKey: 'power',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
        >
          <span className="hidden md:inline">Power</span>
          <span className="inline md:hidden">Pwr.</span>
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
      const move = row.original;
      const power = move.updated?.power ?? move.faithful?.power ?? (
        <span className="text-cell text-cell-muted">—</span>
      );
      return <span className="text-cell">{power}</span>;
    },
    accessorFn: (row) => row.updated?.power ?? row.faithful?.power ?? null,
  },
  {
    accessorKey: 'accuracy',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
        >
          <span className="hidden md:inline">Accuracy</span>
          <span className="inline md:hidden">Acc.</span>
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
      const move = row.original;
      const accuracy = move.updated?.accuracy ?? move.faithful?.accuracy ?? (
        <span className="text-cell text-cell-muted">—</span>
      );
      return <span className="text-cell">{accuracy}</span>;
    },
    accessorFn: (row) => row.updated?.accuracy ?? row.faithful?.accuracy ?? null,
  },
  {
    accessorKey: 'pp',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
        >
          PP
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
      const move = row.original;
      const pp = move.updated?.pp ?? move.faithful?.pp ?? (
        <span className="text-cell text-cell-muted">—</span>
      );
      return <span className="text-cell">{pp}</span>;
    },
    accessorFn: (row) => row.updated?.pp ?? row.faithful?.pp ?? null,
  },
  {
    accessorKey: 'tm',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
        >
          TM/HM
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
      const move = row.original;
      const tm = move.tm?.number;
      return tm ? (
        <Badge variant="outline" className="text-xs font-mono">
          {tm}
        </Badge>
      ) : (
        <span className="text-cell text-cell-muted">—</span>
      );
    },
    accessorFn: (row) => {
      const tm = row.tm?.number;
      if (!tm) return null;

      // Extract numeric part for proper sorting (e.g., "TM01" -> 1, "HM02" -> 102)
      const match = tm.match(/^(TM|HM)(\d+)$/);
      if (match) {
        const [, type, number] = match;
        // HMs should sort after TMs, so add 100 to HM numbers
        return type === 'HM' ? parseInt(number) + 100 : parseInt(number);
      }
      return tm; // fallback to string sorting
    },
  },
];
