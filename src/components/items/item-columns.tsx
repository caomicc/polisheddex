'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AnyItemData, isRegularItem, isTMHMItem } from '@/types/types';

export const itemColumns: ColumnDef<AnyItemData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Item Name
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
      const item = row.original;
      return (
        <div className="flex items-center space-x-2 min-w-0">
          <Link
            href={`/items/${encodeURIComponent(item.id)}`}
            className="hover:text-blue-600 hover:underline truncate"
          >
            {item.name}
          </Link>
          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
        </div>
      );
    },
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
      const item = row.original;
      const category = isRegularItem(item)
        ? item.attributes?.category || 'Item'
        : isTMHMItem(item)
          ? 'TM/HM'
          : 'Unknown';

      const variant = category === 'TM/HM' ? 'secondary' : 'outline';

      return (
        <Badge variant={variant} className="text-xs">
          {category}
        </Badge>
      );
    },
    // Custom accessor for sorting
    accessorFn: (row) => {
      return isRegularItem(row)
        ? row.attributes?.category || 'Item'
        : isTMHMItem(row)
          ? 'TM/HM'
          : 'Unknown';
    },
    // Enable filtering on this column
    filterFn: (row, id, value) => {
      if (!value) return true;
      const category = isRegularItem(row.original)
        ? row.original.attributes?.category || 'Item'
        : isTMHMItem(row.original)
          ? 'TM/HM'
          : 'Unknown';
      return category === value;
    },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Price
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
      const item = row.original;
      if (isRegularItem(item)) {
        const price = item.attributes?.price || 0;
        return (
          <span className="font-medium text-green-600 dark:text-green-400">
            ₽{price.toLocaleString()}
          </span>
        );
      } else {
        return <span className="text-gray-400 text-sm">-</span>;
      }
    },
    // Custom accessor for sorting
    accessorFn: (row) => {
      return isRegularItem(row) ? row.attributes?.price || 0 : -1;
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
      const item = row.original;
      if (isTMHMItem(item)) {
        return (
          <Badge variant="default" className="text-xs">
            {item.type}
          </Badge>
        );
      } else {
        return <span className="text-gray-400 text-sm">-</span>;
      }
    },
    // Custom accessor for sorting
    accessorFn: (row) => {
      return isTMHMItem(row) ? row.type : '';
    },
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
      const item = row.original;
      if (isTMHMItem(item)) {
        return <span className="text-sm">{item.power > 0 ? item.power : '-'}</span>;
      } else {
        return <span className="text-gray-400 text-sm">-</span>;
      }
    },
    // Custom accessor for sorting
    accessorFn: (row) => {
      return isTMHMItem(row) ? row.power : -1;
    },
  },
  {
    accessorKey: 'locationCount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 text-muted-foreground hover:bg-gray-200 hover:text-gray-900"
        >
          Locations
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
      const item = row.original;
      let locationCount = 0;

      if (isRegularItem(item)) {
        locationCount = item.locations?.length || 0;
      } else if (isTMHMItem(item) && item.location) {
        locationCount = 1;
      }

      return (
        <span className="text-sm">
          {locationCount > 0 ? (
            `${locationCount} location${locationCount !== 1 ? 's' : ''}`
          ) : (
            <span className="text-gray-400">No locations</span>
          )}
        </span>
      );
    },
    // Custom accessor for sorting
    accessorFn: (row) => {
      if (isRegularItem(row)) {
        return row.locations?.length || 0;
      } else if (isTMHMItem(row) && row.location) {
        return 1;
      }
      return 0;
    },
  },
];
