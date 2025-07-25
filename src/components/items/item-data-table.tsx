'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnyItemData, isRegularItem, isTMHMItem } from '@/types/types';

/**
 * ItemDataTable - A data table component with persistent state
 *
 * This component automatically saves and restores:
 * - Current page number
 * - Applied filters (search, category, checkboxes)
 * - Sort order
 * - Column visibility
 *
 * State is persisted to localStorage and restored when users return to the page.
 */

interface ItemDataTableProps {
  columns: ColumnDef<AnyItemData, unknown>[];
  data: AnyItemData[];
}

export function ItemDataTable({ columns, data }: ItemDataTableProps) {
  // Storage key for persisting table state
  const STORAGE_KEY = 'itemDataTable';

  // Load initial state from localStorage
  const loadStoredState = () => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const storedState = loadStoredState();

  const [sorting, setSorting] = React.useState<SortingState>(storedState?.sorting || []);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    storedState?.columnFilters || [],
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    storedState?.columnVisibility || {},
  );

  // Checkbox filter states
  const [showOnlyTMHM, setShowOnlyTMHM] = React.useState(storedState?.showOnlyTMHM || false);
  const [showOnlyWithPrice, setShowOnlyWithPrice] = React.useState(
    storedState?.showOnlyWithPrice || false,
  );
  const [showOnlyWithLocations, setShowOnlyWithLocations] = React.useState(
    storedState?.showOnlyWithLocations || false,
  );

  // Additional state for category filter (handled separately from table's columnFilters)
  const [categoryFilter, setCategoryFilter] = React.useState(storedState?.categoryFilter || 'all');

  // Get unique categories from the data
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>();
    data.forEach((item) => {
      if (isRegularItem(item) && item.attributes?.category) {
        categorySet.add(item.attributes.category);
      } else if (isTMHMItem(item)) {
        categorySet.add('TM/HM');
      }
    });
    return Array.from(categorySet).sort();
  }, [data]);

  // Apply checkbox filters and category filter to the data
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesTMHM = !showOnlyTMHM || isTMHMItem(item);
      const matchesPrice =
        !showOnlyWithPrice || (isRegularItem(item) && (item.attributes?.price || 0) > 0);
      const matchesLocations =
        !showOnlyWithLocations ||
        (isRegularItem(item) && (item.locations?.length || 0) > 0) ||
        (isTMHMItem(item) && item.location);

      const itemCategory = isRegularItem(item)
        ? item.attributes?.category || 'Item'
        : isTMHMItem(item)
          ? 'TM/HM'
          : 'Unknown';
      const matchesCategory = categoryFilter === 'all' || itemCategory === categoryFilter;

      return matchesTMHM && matchesPrice && matchesLocations && matchesCategory;
    });
  }, [data, showOnlyTMHM, showOnlyWithPrice, showOnlyWithLocations, categoryFilter]);

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: storedState?.pageIndex || 0,
    pageSize: 20,
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    pageCount: Math.ceil(filteredData.length / pageSize),
  });

  // Save state to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip saving on initial render if we just loaded from storage
    const isInitialLoad =
      !storedState ||
      (JSON.stringify(sorting) === JSON.stringify(storedState.sorting) &&
        JSON.stringify(columnFilters) === JSON.stringify(storedState.columnFilters) &&
        pageIndex === storedState.pageIndex &&
        showOnlyTMHM === storedState.showOnlyTMHM &&
        showOnlyWithPrice === storedState.showOnlyWithPrice &&
        showOnlyWithLocations === storedState.showOnlyWithLocations &&
        categoryFilter === storedState.categoryFilter);

    if (isInitialLoad) return;

    const stateToSave = {
      sorting,
      columnFilters,
      columnVisibility,
      pageIndex,
      showOnlyTMHM,
      showOnlyWithPrice,
      showOnlyWithLocations,
      categoryFilter,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save table state to localStorage:', error);
    }
  }, [
    sorting,
    columnFilters,
    columnVisibility,
    pageIndex,
    showOnlyTMHM,
    showOnlyWithPrice,
    showOnlyWithLocations,
    categoryFilter,
    storedState,
  ]);

  // Reset page to 0 when filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [columnFilters, showOnlyTMHM, showOnlyWithPrice, showOnlyWithLocations, categoryFilter]);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 py-4">
        {/* Primary search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-filter">Item Name</Label>
            <Input
              placeholder="Search items..."
              value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
              onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
              className="max-w-sm bg-white"
            />
          </div>

          {/* Region filter */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-select">Category:</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category-select" className="bg-white w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkbox Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tm-hm"
              checked={showOnlyTMHM}
              onCheckedChange={setShowOnlyTMHM}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="tm-hm" className="text-sm">
              TMs/HMs only
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="with-price"
              checked={showOnlyWithPrice}
              onCheckedChange={setShowOnlyWithPrice}
              className="data-[state=checked]:bg-green-600"
            />
            <Label htmlFor="with-price" className="text-sm">
              Has price
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="with-locations"
              checked={showOnlyWithLocations}
              onCheckedChange={setShowOnlyWithLocations}
              className="data-[state=checked]:bg-purple-600"
            />
            <Label htmlFor="with-locations" className="text-sm">
              Has locations
            </Label>
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} items
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border bg-white overflow-x-auto border-border">
        <Table className="table-fixed w-full min-w-[600px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-slate-50">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-slate-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No items found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
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
    </div>
  );
}
