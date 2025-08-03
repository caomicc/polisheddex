'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { normalizeLocationKey } from '@/utils/locationUtils';

export interface ItemLocation {
  area: string;
  details?: string;
}

interface ItemLocationDataTableProps {
  locations: ItemLocation[];
}

const columns: ColumnDef<ItemLocation>[] = [
  {
    accessorKey: 'area',
    id: 'area',
    header: ({ column }) => {
      return (
        <Button
          className="-ml-3 text-foreground font-medium hover:bg-gray-200 hover:text-gray-900"
          variant="ghost"
          onClick={() => column.toggleSorting()}
        >
          Location
        </Button>
      );
    },
    cell: ({ row }) => {
      const location = row.original;
      const shouldLink =
        location.details?.toLowerCase() === 'hidden item' ||
        location.details?.toLowerCase() === 'visible item';
      
      return (
        <div className="min-w-0">
          {shouldLink ? (
            <Link
              href={`/locations/${normalizeLocationKey(location.area)}`}
              className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-blue-600 dark:text-blue-400"
            >
              {location.area}
            </Link>
          ) : (
            <span className="font-medium">{location.area}</span>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const area = row.original.area.toLowerCase();
      const searchText = value.toLowerCase();
      return area.includes(searchText);
    },
    sortingFn: (rowA, rowB) => {
      return rowA.original.area.localeCompare(rowB.original.area);
    },
  },
  {
    accessorKey: 'details',
    id: 'method',
    header: ({ column }) => {
      return (
        <Button
          className="-ml-3 text-foreground font-medium hover:bg-gray-200 hover:text-gray-900"
          variant="ghost"
          onClick={() => column.toggleSorting()}
        >
          Method
        </Button>
      );
    },
    cell: ({ row }) => {
      const method = row.original.details || 'Unknown';
      
      return (
        <Badge variant="secondary" className="text-xs">
          {method}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const method = row.original.details || 'Unknown';
      if (value === 'all') return true;
      return method === value;
    },
    sortingFn: (rowA, rowB) => {
      const methodA = rowA.original.details || 'Unknown';
      const methodB = rowB.original.details || 'Unknown';
      return methodA.localeCompare(methodB);
    },
  },
];

export default function ItemLocationDataTable({ locations }: ItemLocationDataTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Get unique methods for the filter dropdown
  const uniqueMethods = useMemo(() => {
    const methods = Array.from(new Set(locations.map(loc => loc.details || 'Unknown')));
    return methods.sort();
  }, [locations]);

  const table = useReactTable({
    data: locations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      columnFilters: methodFilter === 'all' ? [] : [{ id: 'method', value: methodFilter }],
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, value) => {
      const location = row.original;
      const searchText = value.toLowerCase();
      return Boolean(
        location.area.toLowerCase().includes(searchText) ||
        (location.details && location.details.toLowerCase().includes(searchText))
      );
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} locations
        </div>
        <div className="flex gap-4 items-center">
          <div className="min-w-[200px]">
            <Label htmlFor="location-search" className="sr-only">
              Search locations
            </Label>
            <Input
              id="location-search"
              placeholder="Search locations..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="min-w-[150px]">
            <Label htmlFor="method-filter" className="sr-only">
              Filter by method
            </Label>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {uniqueMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full px-2 sm:px-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-muted/50 border-b border-b-gray-100 dark:border-b-gray-700"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-2 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No locations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}