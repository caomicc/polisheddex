'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { accentInsensitiveIncludes } from '@/utils/stringUtils';

interface Ability {
  id: string;
  name?: string;
  description?: string;
}

export const abilityColumns: ColumnDef<Ability>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3"
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
      const ability = row.original;
      const displayName =
        ability.name || ability.id.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return (
        <div className="flex items-center space-x-2 min-w-0]">
          <Link
            href={`/abilities/${encodeURIComponent(ability.id)}`}
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium capitalize truncate"
          >
            {displayName}
          </Link>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const ability = row.original;
      const searchName = ability.name || ability.id;
      return accentInsensitiveIncludes(searchName, value);
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.name || rowA.original.id;
      const b = rowB.original.name || rowB.original.id;
      return a.localeCompare(b);
    },
    size: 200,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3"
        >
          Description
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
      const ability = row.original;
      return (
        <div className="text-sm text-muted-foreground max-w-md truncate">
          {ability.description || 'No description available'}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const description = row.getValue(id) as string;
      return accentInsensitiveIncludes(description || '', value);
    },
  },
];
