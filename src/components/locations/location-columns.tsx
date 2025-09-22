'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LocationManifest } from '@/types/new';

export const locationColumns: ColumnDef<LocationManifest>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
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

      return (
        <div className="flex items-center space-x-2 min-w-0 text-xs ">
          <Link href={`/locations/${encodeURIComponent(location.id)}`} className="table-link">
            {location.name}
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </Link>
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
          className="-ml-3 label-text"
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
      if (!region) return <span className="text-cell text-cell-muted">—</span>;
      return (
        <Badge variant={region.toLowerCase() as 'kanto' | 'johto' | 'orange'}>
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
      const types = row.getValue('type') as string[];
      if (!types || types.length === 0) return <span className="text-cell text-cell-muted">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {types.map((type, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {type}
            </Badge>
          ))}
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
          className="-ml-3 label-text"
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
            <span className="text-cell">{count}</span>
          ) : (
            <span className="text-cell text-cell-muted">—</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'eventCount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
        >
          Events
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
      const count = row.getValue('eventCount') as number;
      return (
        <div className="">
          {count && count > 0 ? (
            <span className="text-cell">{count}</span>
          ) : (
            <span className="text-cell text-cell-muted">—</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'order',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
        >
          Order
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
      const order = row.getValue('order') as number;
      return (
        <div className="">
          {order ? (
            <span className="text-cell">{order}</span>
          ) : (
            <span className="text-cell text-cell-muted">—</span>
          )}
        </div>
      );
    },
  },
];
