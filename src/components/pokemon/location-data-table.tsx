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

export function LocationDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // Storage key for persisting table state
  const STORAGE_KEY = 'locationDataTable';

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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(storedState?.columnFilters || []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(storedState?.columnVisibility || {});
  // const [pageIndex, setPageIndex] = React.useState(storedState?.pageIndex || 0);

  // Checkbox filter states
  const [showOnlyPokemon, setShowOnlyPokemon] = React.useState(storedState?.showOnlyPokemon || false);
  const [showOnlyFlyable, setShowOnlyFlyable] = React.useState(storedState?.showOnlyFlyable || false);
  const [showOnlyGrottoes, setShowOnlyGrottoes] = React.useState(storedState?.showOnlyGrottoes || false);
  const [showOnlyTrainers, setShowOnlyTrainers] = React.useState(storedState?.showOnlyTrainers || false);
  const [showOnlyItems, setShowOnlyItems] = React.useState(storedState?.showOnlyItems || false);

  // Additional state for region filter (handled separately from table's columnFilters)
  const [regionFilter, setRegionFilter] = React.useState(storedState?.regionFilter || 'all');

  // Apply checkbox filters and region filter to the data
  const filteredData = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.filter((location: any) => {
      const matchesPokemon = !showOnlyPokemon || (location.pokemonCount && location.pokemonCount > 0);
      const matchesFlyable = !showOnlyFlyable || location.flyable;
      const matchesGrottoes = !showOnlyGrottoes || location.hasHiddenGrottoes;
      const matchesTrainers = !showOnlyTrainers || location.hasTrainers;
      const matchesItems = !showOnlyItems || (location.items && location.items.length > 0);
      const matchesRegion = regionFilter === 'all' || location.region === regionFilter;

      return matchesPokemon && matchesFlyable && matchesGrottoes && matchesTrainers && matchesItems && matchesRegion;
    });
  }, [data, showOnlyPokemon, showOnlyFlyable, showOnlyGrottoes, showOnlyTrainers, showOnlyItems, regionFilter]);

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize
    }),
    [pageIndex, pageSize]
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
    const isInitialLoad = !storedState || (
      JSON.stringify(sorting) === JSON.stringify(storedState.sorting) &&
      JSON.stringify(columnFilters) === JSON.stringify(storedState.columnFilters) &&
      pageIndex === storedState.pageIndex &&
      showOnlyPokemon === storedState.showOnlyPokemon &&
      showOnlyFlyable === storedState.showOnlyFlyable &&
      showOnlyGrottoes === storedState.showOnlyGrottoes &&
      showOnlyTrainers === storedState.showOnlyTrainers &&
      showOnlyItems === storedState.showOnlyItems &&
      regionFilter === storedState.regionFilter
    );

    if (isInitialLoad) return;

    const stateToSave = {
      sorting,
      columnFilters,
      columnVisibility,
      pageIndex,
      showOnlyPokemon,
      showOnlyFlyable,
      showOnlyGrottoes,
      showOnlyTrainers,
      showOnlyItems,
      regionFilter,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save table state to localStorage:', error);
    }
  }, [sorting, columnFilters, columnVisibility, pageIndex, showOnlyPokemon, showOnlyFlyable, showOnlyGrottoes, showOnlyTrainers, showOnlyItems, regionFilter, storedState]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [showOnlyPokemon, showOnlyFlyable, showOnlyGrottoes, showOnlyTrainers, showOnlyItems, regionFilter, columnFilters]);

  // // Get unique regions for filter
  const availableRegions = React.useMemo(() => {
    const regions = new Set(
      (data as { region?: string }[])
        .map((loc) => loc.region)
        .filter((region): region is string => Boolean(region))
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
      <div className="flex flex-col gap-4 py-4">
        {/* Primary search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="location-filter">
              Location Name
            </Label>
            <Input
              placeholder="Filter locations..."
              id="location-filter"
              value={(table.getColumn('displayName')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('displayName')?.setFilterValue(event.target.value)
              }
              className="max-w-sm bg-white"
            />
          </div>

          {/* Region filter */}
          <div className="flex flex-col gap-2">
                                <Label htmlFor="region-filter">
              Region
            </Label>
<Select
            value={regionFilter}
            onValueChange={(value) => {
              setRegionFilter(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-white">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {availableRegions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region.charAt(0).toUpperCase() + region.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>

          {/* Sort options */}
          <div className="flex flex-col gap-2">
          <Label htmlFor="sort-select">
            Sort By
          </Label>
          <Select
            value={getCurrentSortValue()}
            onValueChange={handleSortChange}
          >
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
              checked={showOnlyPokemon}
              onCheckedChange={(checked) => setShowOnlyPokemon(checked === true)}
            />
            <Label htmlFor="has-pokemon" className="text-xs sm:text-sm cursor-pointer">
              Has Pokémon encounters
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-trainers"
              checked={showOnlyTrainers}
              onCheckedChange={(checked) => setShowOnlyTrainers(checked === true)}
            />
            <Label htmlFor="has-trainers" className="text-xs sm:text-sm cursor-pointer">
              Has trainers
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="flyable"
              checked={showOnlyFlyable}
              onCheckedChange={(checked) => setShowOnlyFlyable(checked === true)}
            />
            <Label htmlFor="flyable" className="text-xs sm:text-sm cursor-pointer">
              Flyable locations
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hidden-grotto"
              checked={showOnlyGrottoes}
              onCheckedChange={(checked) => setShowOnlyGrottoes(checked === true)}
            />
            <Label htmlFor="hidden-grotto" className="text-xs sm:text-sm cursor-pointer">
              Has Hidden Grottoes
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-items"
              checked={showOnlyItems}
              onCheckedChange={(checked) => setShowOnlyItems(checked === true)}
            />
            <Label htmlFor="has-items" className="text-xs sm:text-sm cursor-pointer">
              Has Items
            </Label>
          </div>
        </div>

        {/* Filter summary */}
        <div className="flex flex-col sm:items-start gap-2 text-sm text-muted-foreground">

          {(Boolean(table.getColumn('displayName')?.getFilterValue()) ||
            regionFilter !== 'all' ||
            sorting.length > 0 ||
            showOnlyPokemon ||
            showOnlyTrainers ||
            showOnlyFlyable ||
            showOnlyGrottoes ||
            showOnlyItems) && (
            <Button
              size="sm"
              onClick={() => {
                table.getColumn('displayName')?.setFilterValue('');
                setSorting([]);
                // setPageIndex(0);
                setShowOnlyPokemon(false);
                setShowOnlyTrainers(false);
                setShowOnlyFlyable(false);
                setShowOnlyGrottoes(false);
                setShowOnlyItems(false);
                setRegionFilter('all');

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
          <span className="flex">
            Showing {table.getFilteredRowModel().rows.length} of{' '}
            {filteredData.length} locations
            {sorting.length > 0 && (
              <span className="ml-2">
                • Sorted by {
                  (() => {
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
                      return sortOptions.find(opt => opt.value === currentSortValue)?.label;
                    }
                  })()
                }
              </span>
            )}
            {(showOnlyPokemon || showOnlyTrainers || showOnlyFlyable || showOnlyGrottoes || showOnlyItems || regionFilter !== 'all') && (
              <span className="ml-2">
                • Filtered: {[
                  showOnlyPokemon && 'Has Pokémon',
                  showOnlyTrainers && 'Has Trainers',
                  showOnlyFlyable && 'Flyable',
                  showOnlyGrottoes && 'Has Grottoes',
                  showOnlyItems && 'Has Items',
                  regionFilter !== 'all' && `Region: ${regionFilter.charAt(0).toUpperCase() + regionFilter.slice(1)}`
                ].filter(Boolean).join(', ')}
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="rounded-md border bg-white overflow-x-auto border-border">
        <Table className="table-fixed w-full min-w-[600px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap text-sm"
                      style={{ width: getColumnWidth(header.id) }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-sm align-middle"
                      // style={{ width: getColumnWidth(cell.column.id) }}
                    >
                      <div className="overflow-hidden text-ellipsis">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {filteredData.length} location(s) shown
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
  );
}
