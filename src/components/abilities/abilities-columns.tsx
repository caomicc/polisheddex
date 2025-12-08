'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { accentInsensitiveIncludes } from '@/utils/stringUtils';
import { AbilityData } from '@/types/new';

export const abilityColumns = (version: string): ColumnDef<AbilityData>[] => [
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
      const ability = row.original;
      const displayName =
        ability.name || ability.id.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return (
        <div className="flex items-center space-x-2 min-w-0">
          <Link href={`/abilities/${encodeURIComponent(ability.id)}`} className="table-link">
            {displayName}
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
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
          className="-ml-3 table-header-label"
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
        <div className="table-cell-text max-w-md truncate">
          {ability.versions[version].description || 'No description available'}
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
