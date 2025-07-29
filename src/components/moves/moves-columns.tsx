'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MoveDescription } from '@/types/types';
import { accentInsensitiveIncludes } from '@/utils/textUtils';

export const moveColumns: ColumnDef<MoveDescription>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Move Name
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
      return <div className="flex items-center space-x-2 min-w-0">{move.name}</div>;
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
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
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
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Category
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
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Power
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
      const power = move.updated?.power ?? move.faithful?.power ?? '-';
      return <span>{power}</span>;
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
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Accuracy
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
      const accuracy = move.updated?.accuracy ?? move.faithful?.accuracy ?? '-';
      return <span>{accuracy}</span>;
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
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
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
      const pp = move.updated?.pp ?? move.faithful?.pp ?? '-';
      return <span>{pp}</span>;
    },
    accessorFn: (row) => row.updated?.pp ?? row.faithful?.pp ?? null,
  },
];
