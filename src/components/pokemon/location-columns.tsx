'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

// Define the interface for location data
export interface LocationData {
  area: string;
  urlName?: string;
  displayName: string;
  types: string[] | string;
  pokemonCount?: number;
  hasHiddenGrottoes?: boolean;
  region?: string;
  flyable?: boolean;
  connections?: Array<{
    direction: string;
    targetLocation: string;
    targetLocationDisplay: string;
    offset: number;
  }>;
  coordinates?: { x: number; y: number };
}

export const locationColumns: ColumnDef<LocationData>[] = [
  {
    accessorKey: 'displayName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-gray-100"
        >
          Location
        </Button>
      );
    },
    cell: ({ row }) => {
      const location = row.original;
      return (
        <div className="flex items-center space-x-2 min-w-0">
          {location.urlName ? (
            <Link
              href={`/locations/${location.urlName}`}
              className="hover:text-blue-600 hover:underline  truncate"
            >
              {location.displayName || location.area}
            </Link>
          ) : (
            <span className=" truncate text-sm ">{location.displayName || location.area}</span>
          )}
          {location.urlName && (
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          )}
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
          className="hover:bg-gray-100"
        >
          Region
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const region = row.getValue('region') as string;
      if (!region) return <span className="text-gray-400 text-sm">-</span>;
      return (
        <span className="text-sm ">
          {region.charAt(0).toUpperCase() + region.slice(1)}
        </span>
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
          className="hover:bg-gray-100"
        >
          Pokémon
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const count = row.getValue('pokemonCount') as number;
      return (
        <div className="text-center">
          {count && count > 0 ? (
            <span className="text-sm  ">{count}</span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'hasHiddenGrottoes',
    header: () => {
      return <span className='text-center w-full block'>Hidden Grotto</span>
     },
    cell: ({ row }) => {
      const hasGrotto = row.getValue('hasHiddenGrottoes') as boolean;
      return (
        <div className="text-center">
          {hasGrotto ? (
            <span className="text-green-600 text-sm  ">Yes</span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'flyable',
    header: () => {
      return <span className='text-center w-full block'>Flyable</span>
     },
    cell: ({ row }) => {
      const flyable = row.getValue('flyable') as boolean;
      return (
        <div className="text-center">
          {flyable ? (
            <span className="text-blue-600 text-sm  ">Yes</span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      );
    },
  },
];
