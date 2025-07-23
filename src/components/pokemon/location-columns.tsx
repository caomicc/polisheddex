'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { normalizeLocationKey } from '@/utils/locationUtils';
import { Badge } from '../ui/badge';
import { LocationData } from '@/types/types';

export const locationColumns: ColumnDef<LocationData>[] = [
  {
    accessorKey: 'displayName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Location
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
      const location = row.original;
      // Use urlName if available (should be pre-normalized), otherwise normalize the area as fallback
      const urlPath =
        location.urlName || (location.area ? normalizeLocationKey(location.area) : null);

      return (
        <div className="flex items-center space-x-2 min-w-0">
          {urlPath ? (
            <Link
              href={`/locations/${encodeURIComponent(urlPath)}`}
              className="hover:text-blue-600 hover:underline  truncate"
            >
              {location.displayName || location.area}
            </Link>
          ) : (
            <span className=" truncate text-sm ">{location.displayName || location.area}</span>
          )}
          {urlPath && <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />}
        </div>
      );
    },
  },
  {
    accessorKey: 'region',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Region
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
      const region = row.getValue('region') as string;
      if (!region) return <span className="text-gray-400 text-sm">-</span>;
      return (
        <Badge variant={region as 'kanto' | 'johto' | 'orange'}>
          {region.charAt(0).toUpperCase() + region.slice(1)}
        </Badge>
      );
    },
    // Enable filtering on this column
    filterFn: (row, id, value) => {
      if (!value) return true;
      const region = row.getValue(id) as string;
      return region === value;
    },
  },
  {
    accessorKey: 'pokemonCount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Pokémon
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
      const count = row.getValue('pokemonCount') as number;
      return (
        <div className="">
          {count && count > 0 ? (
            <span className="text-sm">{count}</span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'trainerCount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Trainers
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
      const count = row.getValue('trainerCount') as number;
      return (
        <div className="">
          {count && count > 0 ? (
            <span className="text-sm">{count}</span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'hasItems',
    header: () => {
      return (
        <span className="text-muted-foreground hover:bg-gray-200 hover:text-gray-900">Items?</span>
      );
    },
    cell: ({ row }) => {
      const location = row.original;
      const hasItems = location.items && location.items.length > 0;
      return (
        <div className="">
          {hasItems ? (
            <span className="text-sm">Yes</span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'flyable',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Fly?
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
      const flyable = row.getValue('flyable') as boolean;
      return <div className="">{flyable ? <span>Yes</span> : <span>-</span>}</div>;
    },
  },
];
