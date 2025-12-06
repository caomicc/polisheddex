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
  PaginationState,
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
import TableWrapper from '../ui/table-wrapper';
import { ItemData } from '@/types/new';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface ItemLocationDataTableProps {
  locations: NonNullable<ItemData['locations']>;
}

type LocationItem = NonNullable<ItemData['locations']>[0];

const columns: ColumnDef<LocationItem>[] = [
  {
    accessorKey: 'area',
    id: 'area',
    header: ({ column }) => {
      return (
        <Button className="-ml-3 label-text" variant="ghost" onClick={() => column.toggleSorting()}>
          Location
        </Button>
      );
    },
    cell: ({ row }) => {
      const location = row.original;

      // Display the area name, or name if available
      const displayName = location.name;

      return (
        <div className="flex items-center space-x-2 min-w-0">
          <span className="table-lead-column-text" style={{ textDecoration: 'none !important' }}>
            {location.parentId ? (
              <Link
                href={`/locations/${location.parentId}`}
                className="text-muted-foreground hover:text-primary transition-colors"
                title={`View details for ${displayName}`}
              >
                {displayName}
                <ExternalLink className="inline-block ml-1 mb-0.5 w-3 h-3" />
              </Link>
            ) : (
              displayName
            )}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const area = (row.original.name || row.original.area).toLowerCase();
      const searchText = value.toLowerCase();
      return area.includes(searchText);
    },
    sortingFn: (rowA, rowB) => {
      const nameA = rowA.original.name || rowA.original.area;
      const nameB = rowB.original.name || rowB.original.area;
      return nameA.localeCompare(nameB);
    },
  },
  {
    accessorKey: 'method',
    id: 'method',
    header: ({ column }) => {
      return (
        <Button className="-ml-3 label-text" variant="ghost" onClick={() => column.toggleSorting()}>
          Method
        </Button>
      );
    },
    cell: ({ row }) => {
      // const method = row.original.method || 'Unknown';
      return <span className="text-cell">{row.original?.method || 'Unknown'}</span>;
    },
    filterFn: (row, id, value) => {
      const method = row.original.method || 'Unknown';
      if (value === 'all') return true;
      return method === value;
    },
    sortingFn: (rowA, rowB) => {
      const methodA = rowA.original.method || 'Unknown';
      const methodB = rowB.original.method || 'Unknown';
      return methodA.localeCompare(methodB);
    },
  },
];

export default function ItemLocationDataTable({ locations }: ItemLocationDataTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Filter out Players House2 F locations with NPC methods
  const filteredLocations = useMemo(() => {
    if (!locations || !Array.isArray(locations)) {
      return [];
    }
    
    return locations.filter((location) => {
      const isPlayersHouse2F = location.area?.toLowerCase() === 'playershouse2f';
      const isNpcMethod = location.method?.toLowerCase().includes('npc');

      // Exclude if it's Players House2 F AND involves an NPC
      return !(isPlayersHouse2F && isNpcMethod);
    });
  }, [locations]);

  // Get unique methods for the filter dropdown
  const uniqueMethods = useMemo(() => {
    if (!filteredLocations || filteredLocations.length === 0) {
      return [];
    }
    const methods = Array.from(new Set(filteredLocations.map((loc) => loc.method || 'Unknown')));
    return methods.sort();
  }, [filteredLocations]);

  // Use local state for pagination instead of URL params to avoid conflicts
  // when this table is embedded in item detail pages
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const table = useReactTable({
    data: filteredLocations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, value) => {
      const location = row.original;
      const searchText = value.toLowerCase();
      const areaName = (location.name || location.area).toLowerCase();
      const method = location.method?.toLowerCase() || '';

      return areaName.includes(searchText) || method.includes(searchText);
    },
    state: {
      pagination,
      globalFilter,
      columnFilters: methodFilter !== 'all' ? [{ id: 'method', value: methodFilter }] : [],
    },
    pageCount: filteredLocations.length > 0 ? Math.ceil(filteredLocations.length / pagination.pageSize) : 1,
  });

  return (
    <>
      <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 rounded-xl mb-2 md:mb-4 dark:border-white/[0.2] dark:bg-black dark:shadow-none">
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-2">
            <Label htmlFor="location-search" className="label-text">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="method-filter" className="label-text">
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
        <div className="text-xs text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} locations
        </div>
      </div>

      {/* Table */}
      <TableWrapper>
        <Table className="table-fixed w-full min-w-[500px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="label-text">
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
                    <TableCell key={cell.id} className="p-2 align-middle text-xs ">
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
      </TableWrapper>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {filteredLocations.length} locations shown
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="label-text">
              Locations per page:
            </Label>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => setPagination({ pageSize: parseInt(value), pageIndex: 0 })}
            >
              <SelectTrigger id="page-size" className="bg-white w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1.5 text-sm"
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground px-2">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <Button
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1.5 text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
