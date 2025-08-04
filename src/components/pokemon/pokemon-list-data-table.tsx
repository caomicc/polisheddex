'use client';

import * as React from 'react';
import {
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
import { BaseData } from '@/types/types';
import { useFaithfulPreference } from '@/contexts';
import { createPokemonListColumns } from './pokemon-list-columns';
import { cn } from '@/lib/utils';

/**
 * PokemonListDataTable - A data table component for Pokemon list data with persistent state
 *
 * This component automatically saves and restores:
 * - Current page number
 * - Applied filters (search, type, generation)
 * - Sort order
 * - Column visibility
 *
 * State is persisted to localStorage and restored when users return to the page.
 */

interface PokemonListDataTableProps {
  data: BaseData[];
}

export function PokemonListDataTable({ data }: PokemonListDataTableProps) {
  // Storage key for persisting non-URL table state
  const STORAGE_KEY = 'pokemonListDataTable';

  const { showFaithful } = useFaithfulPreference();

  // Create columns dynamically based on faithful preference
  const columns = React.useMemo(() => createPokemonListColumns(showFaithful), [showFaithful]);

  // URL-based state for filters that should persist across navigation
  const [urlState, setUrlState] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      type: parseAsString.withDefault('all'),
      generation: parseAsString.withDefault('all'),
      hasJohtoDex: parseAsBoolean.withDefault(false),
      hasNationalDex: parseAsBoolean.withDefault(false),
      hasForms: parseAsBoolean.withDefault(false),
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

  const [sorting, setSorting] = React.useState<SortingState>(
    storedState?.sorting || [{ id: 'johtoDex', desc: false }],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    storedState?.columnVisibility || {},
  );

  // Extract URL state values
  const { search, type, generation, hasJohtoDex, hasNationalDex, hasForms } = urlState;

  // Sync search value with table filter for name column
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

  // Get unique types from the data
  const types = React.useMemo(() => {
    const typeSet = new Set<string>();

    data.forEach((pokemon) => {
      const displayTypes = showFaithful
        ? pokemon.faithfulTypes || pokemon.types
        : pokemon.updatedTypes || pokemon.types;
      const typesArray = Array.isArray(displayTypes) ? displayTypes : [displayTypes];
      typesArray.forEach((type) => {
        if (type) typeSet.add(type);
      });
    });

    return Array.from(typeSet).sort();
  }, [data, showFaithful]);

  // Apply filters to the data
  const filteredData = React.useMemo(() => {
    return data.filter((pokemon) => {
      // Type filter
      const displayTypes = showFaithful
        ? pokemon.faithfulTypes || pokemon.types
        : pokemon.updatedTypes || pokemon.types;
      const typesArray = Array.isArray(displayTypes) ? displayTypes : [displayTypes];
      const matchesType = type === 'all' || typesArray.some((t) => t === type);

      // Generation filter (based on national dex ranges)
      let matchesGeneration = true;
      if (generation !== 'all') {
        const nationalDex = pokemon.nationalDex;
        if (nationalDex) {
          switch (generation) {
            case 'gen1':
              matchesGeneration = nationalDex >= 1 && nationalDex <= 151;
              break;
            case 'gen2':
              matchesGeneration = nationalDex >= 152 && nationalDex <= 251;
              break;
            case 'gen3':
              matchesGeneration = nationalDex >= 252 && nationalDex <= 386;
              break;
            case 'gen4':
              matchesGeneration = nationalDex >= 387 && nationalDex <= 493;
              break;
            case 'gen5':
              matchesGeneration = nationalDex >= 494 && nationalDex <= 649;
              break;
            case 'gen6':
              matchesGeneration = nationalDex >= 650 && nationalDex <= 721;
              break;
            case 'gen7':
              matchesGeneration = nationalDex >= 722 && nationalDex <= 809;
              break;
            case 'gen8':
              matchesGeneration = nationalDex >= 810 && nationalDex <= 905;
              break;
            case 'gen9':
              matchesGeneration = nationalDex >= 906;
              break;
            default:
              matchesGeneration = true;
          }
        } else {
          matchesGeneration = false;
        }
      }

      // Checkbox filters
      const matchesJohtoDex = !hasJohtoDex || (pokemon.johtoDex !== null && pokemon.johtoDex < 999);
      const matchesNationalDex = !hasNationalDex || pokemon.nationalDex !== null;
      const matchesForms = !hasForms || (Array.isArray(pokemon.forms) && pokemon.forms.length > 1);

      return (
        matchesType && matchesGeneration && matchesJohtoDex && matchesNationalDex && matchesForms
      );
    });
  }, [data, type, generation, showFaithful, hasJohtoDex, hasNationalDex, hasForms]);

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
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip saving on initial render if we just loaded from storage
    const isInitialLoad =
      !storedState ||
      (JSON.stringify(sorting) === JSON.stringify(storedState.sorting) &&
        JSON.stringify(columnFilters) === JSON.stringify(storedState.columnFilters));

    if (isInitialLoad) return;

    const stateToSave = {
      sorting,
      columnFilters,
      columnVisibility,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save table state to localStorage:', error);
    }
  }, [sorting, columnFilters, columnVisibility, storedState]);

  // Reset page to 0 when filters change
  React.useEffect(() => {
    setPagination({ pageIndex: 0 });
  }, [
    columnFilters,
    type,
    generation,
    showFaithful,
    hasJohtoDex,
    hasNationalDex,
    hasForms,
    setPagination,
  ]);

  return (
    <div className="w-full px-2 sm:px-0">
      <div className="flex flex-col gap-4 py-4">
        {/* Primary search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pokemon-filter">Pokémon Name</Label>
            <Input
              id="pokemon-filter"
              placeholder="Search by name..."
              value={search}
              onChange={(event) => setUrlState({ search: event.target.value || null })}
              className="max-w-sm bg-white"
            />
          </div>

          {/* Type filter */}
          <div className="flex flex-row gap-4 w-full sm:w-auto">
            <div className="flex flex-col gap-2 w-1/2 md:w-auto">
              <Label htmlFor="type-select">Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setUrlState({ type: value === 'all' ? null : value })}
              >
                <SelectTrigger id="type-select" className="bg-white w-[140px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((pokemonType) => (
                    <SelectItem key={pokemonType} value={pokemonType}>
                      {pokemonType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Checkbox Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-forms"
              checked={hasForms}
              onCheckedChange={(checked) => setUrlState({ hasForms: checked ? true : null })}
            />
            <Label htmlFor="has-forms" className="text-sm">
              Has multiple forms
            </Label>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:items-start gap-2 text-sm text-muted-foreground">
          {(Boolean(search) ||
            type !== 'all' ||
            generation !== 'all' ||
            sorting.length > 0 ||
            hasJohtoDex ||
            hasNationalDex ||
            hasForms) && (
            <Button
              size="sm"
              onClick={() => {
                setUrlState({
                  search: null,
                  type: null,
                  generation: null,
                  hasJohtoDex: null,
                  hasNationalDex: null,
                  hasForms: null,
                });
                setSorting([{ id: 'johtoDex', desc: false }]);
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
            Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} Pokémon
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
            {(hasJohtoDex ||
              hasNationalDex ||
              hasForms ||
              type !== 'all' ||
              generation !== 'all') && (
              <span className="ml-2">
                • Filtered:{' '}
                {[
                  hasJohtoDex && 'In Johto Dex',
                  hasNationalDex && 'Has National Dex',
                  hasForms && 'Has multiple forms',
                  type !== 'all' && `Type: ${type}`,
                  generation !== 'all' && `Generation: ${generation.replace('gen', 'Gen ')}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border bg-white dark:bg-white/10 overflow-x-auto border-border">
        <Table className="table-fixed w-full lg:min-w-[500px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    // <TableHead
                    //   key={header.id}
                    //   className="w-[60px]!"
                    //   // style={{
                    //   //   width: header.column.columnDef.size ?? 'auto',
                    //   //   maxWidth: header.column.columnDef.maxSize ?? 'auto',
                    //   // }}
                    // >
                    //   {header.isPlaceholder
                    //     ? null
                    //     : flexRender(header.column.columnDef.header, header.getContext())}
                    // </TableHead>
                    <TableHead
                      key={header.id}
                      className={
                        header.column.columnDef.size === 60
                          ? 'w-11 md:w-[60px]! max-w-16 text-center'
                          : ''
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
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.size === 60 ? 'w-[60px]!  max-w-16 text-center' : '',
                        'p-1 md:p-2',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No Pokémon found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {filteredData.length} Pokémon shown
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="text-sm whitespace-nowrap">
              Pokémon per page:
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
