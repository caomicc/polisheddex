'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { accentInsensitiveIncludes } from '@/utils/stringUtils';
import Image from 'next/image';
import { ItemsManifest } from '@/types/new';
import { getItemSpriteName } from '@/utils/spriteUtils';

export const itemColumns = (version: string): ColumnDef<ItemsManifest>[] => [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const item = row.original;

      // Check if this is a TM/HM item that should link to moves
      const isTM =
        item.versions[version].category === 'tm' || item.versions[version].category === 'hm';
      const linkHref =
        isTM && item.versions[version].name ? `TODO` : `/items/${encodeURIComponent(item.id)}`;

      const spriteUrl = isTM
        ? `/sprites/items/tm_hm.png`
        : `/sprites/items/${getItemSpriteName(item.versions[version].name)}.png`;

      return (
        <div className="">
          <Link href={linkHref}>
            <Image
              src={spriteUrl}
              alt={item.versions[version].name}
              width={24}
              height={24}
              className="rounded-sm dark:bg-white rounded-sm"
            />
          </Link>
        </div>
      );
    },
    enableSorting: false,
    size: 60,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
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
      // Check if this is a TM/HM item that should link to moves
      const linkHref =
        item.versions[version].category === 'tm' || item.versions[version].category === 'hm'
          ? `TODO`
          : `/items/${encodeURIComponent(item.id)}`;

      return (
        <div className="flex items-center space-x-2 min-w-0">
          <Link href={linkHref} className="table-link">
            {item.versions[version].name}
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </Link>
        </div>
      );
    },
    // Custom filter function for accent-insensitive search
    filterFn: (row, id, value) => {
      if (!value) return true;
      const itemName = row.getValue(id) as string;
      return accentInsensitiveIncludes(itemName, value);
    },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
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
      const price = item.versions[version]?.price;
      if (price)
        return <span className="text-cell text-green-600 dark:text-green-400">₽{price}</span>;
      return <span className="text-cell text-cell-muted">—</span>;
    },
    // Custom accessor for sorting
    accessorFn: (row) => {
      return row.versions[version]?.price || -1;
    },
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

      return (
        <Badge variant={'default'} className="text-xs">
          {item.versions[version].category}
        </Badge>
      );
    },
    // Custom accessor for sorting
    accessorFn: (row) => {
      return row.versions[version].category;
    },
    // Enable filtering on this column
    filterFn: (row, id, value) => {
      if (!value) return true;
      const category = row.getValue(id) as string;
      return category === value;
    },
  },

  {
    accessorKey: 'locationCount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 label-text"
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
      const locationCount = item.versions[version]?.locationCount || 0;
      return (
        <span className="">
          {locationCount > 0 ? (
            <span className="text-cell">{`${locationCount} location${locationCount !== 1 ? 's' : ''}`}</span>
          ) : (
            <span className="text-cell text-cell-muted">—</span>
          )}
        </span>
      );
    },
    // Custom accessor for sorting
    accessorFn: (row) => {
      return row.versions[version]?.locationCount || -1;
    },
  },
];
