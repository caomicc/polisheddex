'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useQueryStates, parseAsBoolean, parseAsString } from 'nuqs';

import { Button } from '@/components/ui/button';
import { usePaginationSearchParams } from '@/hooks/use-pagination-search-params';
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
import TableWrapper from '../ui/table-wrapper';

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
  // Storage key for persisting non-URL table state
  const STORAGE_KEY = 'itemDataTable';

  // URL-based state for filters that should persist across navigation
  const [urlState, setUrlState] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      category: parseAsString.withDefault('all'),
      tmhm: parseAsBoolean.withDefault(false),
      price: parseAsBoolean.withDefault(false),
      locations: parseAsBoolean.withDefault(false),
    },
    {
      // Configure shallow routing to avoid full page reloads
      shallow: true,
      // Clear empty params from URL for cleaner URLs
      clearOnDefault: true,
    },
  );

  // Load initial state from localStorage for non-URL state
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    storedState?.columnVisibility || {},
  );

  // Extract URL state values
  const { search, category, tmhm, price, locations } = urlState;

  // Sync search value with table filter
  React.useEffect(() => {
    const nameColumn = columns.find((col) => 'accessorKey' in col && col.accessorKey === 'name');
    if (nameColumn) {
      setColumnFilters((prev) => {
        const otherFilters = prev.filter((filter) => filter.id !== 'name');
        if (search) {
          return [...otherFilters, { id: 'name', value: search }];
        }
        return otherFilters;
      });
    }
  }, [search, columns]);

  // Get unique categories from the data
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>();
    data.forEach((item) => {
      if (isRegularItem(item)) {
        if (item.attributes?.isKeyItem) {
          categorySet.add('Key Item');
        } else if (item.attributes?.category) {
          categorySet.add(item.attributes.category);
        }
      } else if (isTMHMItem(item)) {
        categorySet.add('TM/HM');
      }
    });
    return Array.from(categorySet).sort();
  }, [data]);

  // Apply checkbox filters and category filter to the data
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesTMHM = !tmhm || isTMHMItem(item);
      const matchesPrice = !price || (isRegularItem(item) && (item.attributes?.price || 0) > 0);
      const matchesLocations =
        !locations ||
        (isRegularItem(item) && (item.locations?.length || 0) > 0) ||
        (isTMHMItem(item) && item.location);

      const itemCategory = isRegularItem(item)
        ? item.attributes?.isKeyItem
          ? 'Key Item'
          : item.attributes?.category || 'Item'
        : isTMHMItem(item)
          ? 'TM/HM'
          : 'Unknown';
      const matchesCategory = category === 'all' || itemCategory === category;

      return matchesTMHM && matchesPrice && matchesLocations && matchesCategory;
    });
  }, [data, tmhm, price, locations, category]);

  // URL-based pagination state
  const [{ pageIndex, pageSize }, setPagination] = usePaginationSearchParams();

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
      pagination: { pageIndex, pageSize },
    },
    pageCount: Math.ceil(filteredData.length / pageSize),
  });

  // Save non-URL state to localStorage whenever it changes
  // React.useEffect(() => {
  //   if (typeof window === 'undefined') return;

  //   // Skip saving on initial render if we just loaded from storage
  //   const isInitialLoad =
  //     !storedState ||
  //     (JSON.stringify(sorting) === JSON.stringify(storedState.sorting) &&
  //       JSON.stringify(columnFilters) === JSON.stringify(storedState.columnFilters));

  //   if (isInitialLoad) return;

  //   const stateToSave = {
  //     sorting,
  //     columnFilters,
  //     columnVisibility,
  //   };

  //   try {
  //     localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  //   } catch (error) {
  //     console.warn('Failed to save table state to localStorage:', error);
  //   }
  // }, [sorting, columnFilters, columnVisibility, storedState]);

  // Reset page to 0 when filters change
  // React.useEffect(() => {
  //   setPagination({ pageIndex: 0 });
  // }, [columnFilters, tmhm, price, locations, category, setPagination]);

  return (
    <div className="w-full px-2 sm:px-0">
      <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 rounded-xl mb-4 dark:border-white/[0.2] dark:bg-black dark:shadow-none">
        {/* Primary search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <Label className="label-text" htmlFor="item-filter">
              Item Name
            </Label>
            <Input
              id="item-filter"
              placeholder="Search items..."
              value={search}
              onChange={(event) => setUrlState({ search: event.target.value || null })}
              className="max-w-sm bg-white"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-col gap-2">
            <Label className="label-text" htmlFor="category-select">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(value) => setUrlState({ category: value === 'all' ? null : value })}
            >
              <SelectTrigger id="category-select" className="bg-white w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((categoryItem) => (
                  <SelectItem key={categoryItem} value={categoryItem}>
                    {categoryItem}
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
              checked={tmhm}
              onCheckedChange={(checked) => setUrlState({ tmhm: checked ? true : null })}
            />
            <Label htmlFor="tm-hm" className="label-text">
              TMs/HMs only
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="with-price"
              checked={price}
              onCheckedChange={(checked) => setUrlState({ price: checked ? true : null })}
            />
            <Label htmlFor="with-price" className="label-text">
              Has price
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="with-locations"
              checked={locations}
              onCheckedChange={(checked) => setUrlState({ locations: checked ? true : null })}
            />
            <Label htmlFor="with-locations" className="label-text">
              Has locations
            </Label>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:items-start gap-2 label-text">
          {(Boolean(search) ||
            category !== 'all' ||
            sorting.length > 0 ||
            tmhm ||
            price ||
            locations) && (
            <Button
              size="sm"
              onClick={() => {
                setUrlState({
                  search: null,
                  category: null,
                  tmhm: null,
                  price: null,
                  locations: null,
                });
                setSorting([]);
                try {
                  localStorage.removeItem(STORAGE_KEY);
                } catch (error) {
                  console.warn('Failed to clear table state from localStorage:', error);
                }
              }}
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Clear filters & sort
            </Button>
          )}
          <span className="flex">
            Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} items
            {sorting.length > 0 && (
              <span className="ml-2">
                • Sorted by{' '}
                {sorting
                  .map((sort) => {
                    const direction = sort.desc ? 'desc' : 'asc';
                    return `${sort.id} (${direction === 'desc' ? 'Z-A' : 'A-Z'})`;
                  })
                  .join(', ')}
              </span>
            )}
            {(tmhm || price || locations || category !== 'all') && (
              <span className="ml-2">
                • Filtered:{' '}
                {[
                  tmhm && 'TMs/HMs only',
                  price && 'Has price',
                  locations && 'Has locations',
                  category !== 'all' && `Category: ${category}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}
          </span>
        </div>
      </div>
      <TableWrapper>
        <Table className="table-fixed w-full min-w-[500px]">
          {/* <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="label-text">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader> */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={
                        header.column.columnDef.size === 60
                          ? 'w-11 md:w-[60px]! max-w-16 text-center'
                          : 'label-text'
                      }
                    >
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
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
      </TableWrapper>

      {/* Pagination */}
      {/* <div className="flex items-center justify-between space-x-2 py-4">
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
      </div> */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {filteredData.length} items(s) shown
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="label-text">
              Items per page:
            </Label>
            <Select
              value={pageSize.toString()}
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
    </div>
  );
}
