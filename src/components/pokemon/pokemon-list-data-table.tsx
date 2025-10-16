// pokemon columns for /pokemon route
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
import { createPokemonListColumns } from './pokemon-list-columns';
import { cn } from '@/lib/utils';
import TableWrapper from '../ui/table-wrapper';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { PokemonManifest } from '@/types/new';

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
  pokemonData: PokemonManifest[];
  itemsPerPage?: number;
}

export function PokemonListDataTable({ pokemonData }: PokemonListDataTableProps) {
  // Storage key for persisting non-URL table state
  const STORAGE_KEY = 'pokemonListDataTable';

  const { showFaithful } = useFaithfulPreferenceSafe();

  const version = showFaithful ? 'faithful' : 'polished';

  // Create columns dynamically based on faithful preference
  const columns = React.useMemo(() => createPokemonListColumns(version), [version]);

  // URL-based state for filters that should persist across navigation
  const [urlState] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      type: parseAsString.withDefault('all'),
      showForms: parseAsBoolean.withDefault(false),
    },
    {
      shallow: true,
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
    storedState?.sorting || [{ id: 'dexNo', desc: false }],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    storedState?.columnVisibility || {},
  );

  // Extract URL state values
  const { search, type, showForms } = urlState;

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

  // Apply filters to the data and expand forms if needed
  const filteredData = React.useMemo(() => {
    // Define extended type for internal processing
    type PokemonWithCurrentForm = PokemonManifest;
    let dataToFilter: PokemonWithCurrentForm[] = [];

    if (showForms) {
      pokemonData.forEach((pokemon) => {
        const forms = Object.keys(pokemon.versions[version] || {});
        forms.forEach((formKey) => {
          // For forms, modify the name to include form designation for display

          dataToFilter.push({
            ...pokemon,
            formName: formKey,
            id: formKey === 'plain' ? pokemon.id : `${pokemon.id}_${formKey}`,
          });
        });
      });
    } else {
      // Just use the base pokemon data with plain form
      dataToFilter = pokemonData.map((pokemon) => ({
        ...pokemon,
        currentForm: 'plain',
      }));
    }

    // Now apply type filtering based on the current form
    const filtered = dataToFilter.filter((pokemon) => {
      const currentForm = pokemon.formName || 'plain';
      const displayTypes = pokemon.versions[version]?.[currentForm]?.types;
      const typesArray = Array.isArray(displayTypes)
        ? displayTypes
        : displayTypes
          ? [displayTypes]
          : [];
      const matchesType = type === 'all' || typesArray.some((t) => t === type);

      return matchesType;
    });

    // Return as PokemonManifest[] for compatibility with existing table code
    return filtered as PokemonManifest[];
  }, [pokemonData, version, type, showForms]);

  // URL-based pagination state
  const [{ pageIndex, pageSize }, setPagination] = usePaginationSearchParams();

  console.log('Pagination state:', { filteredData });

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
  }, [columnFilters, type, version, showForms, setPagination]);

  return (
    <div>
      <TableWrapper>
        <Table className="table-fixed w-full min-w-[500px]">
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
      </TableWrapper>

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
            <div className="text-sm text-muted-foreground px-2 min-w-[100px]">
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
