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
import { usePaginationSearchParams } from '@/hooks/use-pagination-search-params';
import TableWrapper from '../ui/table-wrapper';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

/**
 * LocationDataTable - A data table component with persistent state
 *
 * This component automatically saves and restores:
 * - Current page number
 * - Applied filters (search, region, checkboxes)
 * - Sort order
 * - Column visibility
 *
 * State is persisted to localStorage and restored when users return to the page.
 */

export function LocationDataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  // Storage key for persisting non-URL table state
  const STORAGE_KEY = 'locationDataTable';

  // URL-based state for filters that should persist across navigation
  const [urlState, setUrlState] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      region: parseAsString.withDefault('all'),
      pokemon: parseAsBoolean.withDefault(false),
      trainers: parseAsBoolean.withDefault(false),
      flyable: parseAsBoolean.withDefault(false),
      grottoes: parseAsBoolean.withDefault(false),
      items: parseAsBoolean.withDefault(false),
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
  const { search, region, pokemon, trainers, flyable, grottoes, items } = urlState;

  // Sync search value with table filter
  React.useEffect(() => {
    const nameColumn = columns.find(
      (col) => 'accessorKey' in col && col.accessorKey === 'displayName',
    );
    if (nameColumn) {
      setColumnFilters((prev) => {
        const otherFilters = prev.filter((filter) => filter.id !== 'displayName');
        if (search) {
          return [...otherFilters, { id: 'displayName', value: search }];
        }
        return otherFilters;
      });
    }
  }, [search, columns]);

  // Apply checkbox filters and region filter to the data
  const filteredData = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.filter((location: any) => {
      const matchesPokemon = !pokemon || (location.pokemonCount && location.pokemonCount > 0);
      const matchesFlyable = !flyable || location.flyable;
      const matchesGrottoes = !grottoes || location.hasHiddenGrottoes;
      const matchesTrainers = !trainers || location.hasTrainers;
      const matchesItems = !items || (location.items && location.items.length > 0);
      const matchesRegion = region === 'all' || location.region === region;

      return (
        matchesPokemon &&
        matchesFlyable &&
        matchesGrottoes &&
        matchesTrainers &&
        matchesItems &&
        matchesRegion
      );
    });
  }, [data, pokemon, flyable, grottoes, trainers, items, region]);

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
  //       JSON.stringify(columnFilters) === JSON.stringify(storedState.columnFilters) &&
  //       pageIndex === storedState.pageIndex);

  //   if (isInitialLoad) return;

  //   const stateToSave = {
  //     sorting,
  //     columnFilters,
  //     columnVisibility,
  //     pageIndex,
  //   };

  //   try {
  //     localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  //   } catch (error) {
  //     console.warn('Failed to save table state to localStorage:', error);
  //   }
  // }, [sorting, columnFilters, columnVisibility, pageIndex, storedState]);

  // Reset to first page when filters change
  // React.useEffect(() => {
  //   setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  // }, [pokemon, flyable, grottoes, trainers, items, region, columnFilters]);

  // // Get unique regions for filter
  const availableRegions = React.useMemo(() => {
    const regions = new Set(
      (data as { region?: string }[])
        .map((loc) => loc.region)
        .filter((region): region is string => Boolean(region)),
    );
    return Array.from(regions).sort();
  }, [data]);

  // Sort options
  const sortOptions = [
    { value: 'default', label: 'Default Order' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'region-asc', label: 'Region (A-Z)' },
    { value: 'region-desc', label: 'Region (Z-A)' },
    { value: 'pokemon-desc', label: 'Most Pokémon First' },
    { value: 'pokemon-asc', label: 'Least Pokémon First' },
    { value: 'trainers-desc', label: 'Most Trainers First' },
    { value: 'trainers-asc', label: 'Least Trainers First' },
  ];

  const handleSortChange = (value: string) => {
    if (value === 'default') {
      setSorting([]);
    } else {
      const [field, direction] = value.split('-');
      const columnId =
        field === 'name'
          ? 'displayName'
          : field === 'region'
            ? 'region'
            : field === 'trainers'
              ? 'trainerCount'
              : 'pokemonCount';
      setSorting([{ id: columnId, desc: direction === 'desc' }]);
    }
  };

  const getCurrentSortValue = () => {
    if (sorting.length === 0) return 'default';
    const sort = sorting[0];

    // Only return a dropdown value for columns that have dropdown options
    const validDropdownColumns = ['displayName', 'region', 'trainerCount', 'pokemonCount'];
    if (!validDropdownColumns.includes(sort.id)) {
      return 'default';
    }

    const field =
      sort.id === 'displayName'
        ? 'name'
        : sort.id === 'region'
          ? 'region'
          : sort.id === 'trainerCount'
            ? 'trainers'
            : 'pokemon';
    const direction = sort.desc ? 'desc' : 'asc';
    return `${field}-${direction}`;
  };

  // Fixed column widths to prevent shifting between pages
  const getColumnWidth = (columnId: string): string => {
    switch (columnId) {
      case 'displayName':
        return '35%'; // Slightly smaller to make room for trainers column
      // case 'region':
      //   return '18%'; // Medium for region
      // case 'pokemonCount':
      //   return '12%'; // Small for count
      // case 'trainerCount':
      //   return '12%'; // Small for trainer count
      // // case 'hasHiddenGrottoes':
      // //   return '14%'; // Small for yes/no
      // case 'flyable':
      //   return '12%'; // Small for yes/no
      default:
        return 'auto';
    }
  };

  return (
    <div className="w-full px-2 sm:px-0">
      <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 rounded-xl mb-4 dark:border-white/[0.2] dark:bg-black dark:shadow-none">
        {/* Primary search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <Label className="label-text" htmlFor="location-filter">
              Location Name
            </Label>
            <Input
              placeholder="Filter locations..."
              id="location-filter"
              value={search}
              onChange={(event) => setUrlState({ search: event.target.value || null })}
              className="max-w-sm bg-white"
            />
          </div>

          {/* Region filter */}
          <div className="flex flex-col gap-2">
            <Label className="label-text" htmlFor="region-filter">
              Region
            </Label>
            <Select
              value={region}
              onValueChange={(value) => setUrlState({ region: value === 'all' ? null : value })}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {availableRegions.map((regionItem) => (
                  <SelectItem key={regionItem} value={regionItem}>
                    {regionItem.charAt(0).toUpperCase() + regionItem.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort options */}
          <div className="flex flex-col gap-2">
            <Label className="label-text" htmlFor="sort-select">
              Sort By
            </Label>
            <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkbox filters */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-pokemon"
              checked={pokemon}
              onCheckedChange={(checked) => setUrlState({ pokemon: checked ? true : null })}
            />
            <Label htmlFor="has-pokemon" className="label-text">
              Has Pokémon encounters
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-trainers"
              checked={trainers}
              onCheckedChange={(checked) => setUrlState({ trainers: checked ? true : null })}
            />
            <Label htmlFor="has-trainers" className="label-text">
              Has trainers
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="flyable"
              checked={flyable}
              onCheckedChange={(checked) => setUrlState({ flyable: checked ? true : null })}
            />
            <Label htmlFor="flyable" className="label-text">
              Flyable locations
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hidden-grotto"
              checked={grottoes}
              onCheckedChange={(checked) => setUrlState({ grottoes: checked ? true : null })}
            />
            <Label htmlFor="hidden-grotto" className="label-text">
              Has Hidden Grottoes
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-items"
              checked={items}
              onCheckedChange={(checked) => setUrlState({ items: checked ? true : null })}
            />
            <Label htmlFor="has-items" className="label-text">
              Has Items
            </Label>
          </div>
        </div>

        {/* Filter summary */}
        <div className="flex flex-col sm:items-start gap-2 text-sm text-muted-foreground">
          {(Boolean(search) ||
            region !== 'all' ||
            sorting.length > 0 ||
            pokemon ||
            trainers ||
            flyable ||
            grottoes ||
            items) && (
            <Button
              size="sm"
              onClick={() => {
                setUrlState({
                  search: null,
                  region: null,
                  pokemon: null,
                  trainers: null,
                  flyable: null,
                  grottoes: null,
                  items: null,
                });
                setSorting([]);

                // Clear localStorage
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
          <span className="flex text-xs text-muted-foreground">
            Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} locations
            {sorting.length > 0 && (
              <span className="ml-2">
                • Sorted by{' '}
                {(() => {
                  const currentSortValue = getCurrentSortValue();
                  if (currentSortValue === 'default') {
                    // Handle column sorts not in dropdown
                    const sort = sorting[0];
                    const direction = sort.desc ? 'desc' : 'asc';

                    // Handle boolean columns
                    if (sort.id === 'hasItems') {
                      return `Items (${direction === 'desc' ? 'Has Items First' : 'No Items First'})`;
                    } else if (sort.id === 'flyable') {
                      return `Flyable (${direction === 'desc' ? 'Flyable First' : 'Not Flyable First'})`;
                    } else {
                      // Fallback for other columns
                      const columnName = sort.id;
                      return `${columnName} (${direction === 'desc' ? 'Z-A' : 'A-Z'})`;
                    }
                  } else {
                    return sortOptions.find((opt) => opt.value === currentSortValue)?.label;
                  }
                })()}
              </span>
            )}
            {(pokemon || trainers || flyable || grottoes || items || region !== 'all') && (
              <span className="ml-2">
                • Filtered:{' '}
                {[
                  pokemon && 'Has Pokémon',
                  trainers && 'Has Trainers',
                  flyable && 'Flyable',
                  grottoes && 'Has Grottoes',
                  items && 'Has Items',
                  region !== 'all' && `Region: ${region.charAt(0).toUpperCase() + region.slice(1)}`,
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
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap label-text"
                      style={{ width: getColumnWidth(header.id) }}
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
                    <TableCell
                      key={cell.id}
                      className="text-sm align-middle"
                      // style={{ width: getColumnWidth(cell.column.id) }}
                    >
                      <div className="overflow-hidden text-ellipsis">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-20 text-center text-muted-foreground"
                >
                  No locations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableWrapper>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {filteredData.length} location(s) shown
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="label-text">
              Areas per page:
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

          <div className="flex items-center justify-center sm:justify-end space-x-2">
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
