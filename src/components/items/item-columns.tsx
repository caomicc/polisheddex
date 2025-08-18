'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AnyItemData, isRegularItem, isTMHMItem } from '@/types/types';
import { accentInsensitiveIncludes } from '@/utils/stringUtils';
import { getItemSpriteName, getMoveUrlFromName } from '@/utils/itemUtils';
import Image from 'next/image';

export const itemColumns: ColumnDef<AnyItemData>[] = [
  {
    accessorKey: 'sprite',
    id: 'sprite',
    header: '',
    cell: ({ row }) => {
      const item = row.original;

      // Check if this is a TM/HM item that should link to moves
      const isTM = isTMHMItem(item);
      const linkHref =
        isTM && 'moveName' in item
          ? `/moves/${getMoveUrlFromName(item.moveName)}`
          : `/items/${encodeURIComponent(item.id)}`;

      const spriteUrl = isTM
        ? `/sprites/items/tm_hm.png`
        : `/sprites/items/${getItemSpriteName(item.name)}.png`;

      return (
        <div className="">
          <Link href={linkHref}>
            <Image src={spriteUrl} alt={item.name} width={24} height={24} className="rounded-sm" />
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
      const isTM = isTMHMItem(item);
      const linkHref =
        isTM && 'moveName' in item
          ? `/moves/${getMoveUrlFromName(item.moveName)}`
          : `/items/${encodeURIComponent(item.id)}`;

      return (
        <div className="flex items-center space-x-2 min-w-0">
          <Link
            href={linkHref}
            className="hover:text-blue-600 hover:underline truncate flex items-center gap-1"
          >
            {item.name}
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
      const category = isRegularItem(item)
        ? item.attributes?.category || 'Item'
        : isTMHMItem(item)
          ? 'TM/HM'
          : 'Unknown';

      let variant: 'default' | 'tm' | 'hm' | 'pokeball' | 'item' | 'berry' | 'medicine';
      switch (category) {
        case 'TM/HM':
          variant = 'tm';
          break;
        case 'Item':
          variant = 'item';
          break;
        case 'Medicine':
          variant = 'medicine';
          break;
        case 'Berry':
          variant = 'berry';
          break;
        case 'Poké Ball':
          variant = 'pokeball';
          break;
        default:
          variant = 'default';
          break;
      }

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
