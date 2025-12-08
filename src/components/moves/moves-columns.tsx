'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { accentInsensitiveIncludes } from '@/utils/stringUtils';
import { MoveData } from '@/types/new';

export const moveColumns: ColumnDef<MoveData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 table-header-label"
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
          className="-ml-3 table-header-label"
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
      // Use the new versions structure
      const type = move.versions?.polished?.type ?? move.versions?.faithful?.type ?? 'Unknown';
      return (
        <Badge variant="outline" className="text-xs">
          {type}
        </Badge>
      );
    },
    accessorFn: (row) => row.versions?.polished?.type ?? row.versions?.faithful?.type ?? 'Unknown',
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 table-header-label"
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
      const category =
        move.versions?.polished?.category ?? move.versions?.faithful?.category ?? 'Unknown';
      return (
        <Badge variant="secondary" className="text-xs">
          {category}
        </Badge>
      );
    },
    accessorFn: (row) =>
      row.versions?.polished?.category ?? row.versions?.faithful?.category ?? 'Unknown',
  },

  {
    accessorKey: 'power',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 table-header-label"
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
      const power = move.versions?.polished?.power ?? move.versions?.faithful?.power ?? (
        <span className="table-cell-text table-cell-muted">—</span>
      );
      return <span className="table-cell-text">{power}</span>;
    },
    accessorFn: (row) => row.versions?.polished?.power ?? row.versions?.faithful?.power ?? null,
  },
  {
    accessorKey: 'accuracy',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 table-header-label"
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
      const accuracy = move.versions?.polished?.accuracy ?? move.versions?.faithful?.accuracy ?? (
        <span className="table-cell-text table-cell-muted">—</span>
      );
      return <span className="table-cell-text">{accuracy}</span>;
    },
    accessorFn: (row) =>
      row.versions?.polished?.accuracy ?? row.versions?.faithful?.accuracy ?? null,
  },
  {
    accessorKey: 'pp',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 table-header-label"
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
      const pp = move.versions?.polished?.pp ?? move.versions?.faithful?.pp ?? (
        <span className="table-cell-text table-cell-muted">—</span>
      );
      return <span className="table-cell-text">{pp}</span>;
    },
    accessorFn: (row) => row.versions?.polished?.pp ?? row.versions?.faithful?.pp ?? null,
  },
  {
    accessorKey: 'tm',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 table-header-label"
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
        <span className="table-cell-text table-cell-muted">—</span>
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
