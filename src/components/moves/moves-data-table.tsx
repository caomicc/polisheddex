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
import { MoveDescription } from '@/types/types';
import { useFaithfulPreference } from '@/contexts';
import MoveRow from './move-row';
import TableWrapper from '../ui/table-wrapper';

/**
 * MovesDataTable - A data table component for move data with persistent state
 *
 * This component automatically saves and restores:
 * - Current page number
 * - Applied filters (search, type, category, version)
 * - Sort order
 * - Column visibility
 *
 * State is persisted to localStorage and restored when users return to the page.
 */

interface MovesDataTableProps {
  columns: ColumnDef<MoveDescription, unknown>[];
  data: MoveDescription[];
}

export function MovesDataTable({ columns, data }: MovesDataTableProps) {
  // Storage key for persisting non-URL table state
  const STORAGE_KEY = 'movesDataTable';

  const { showFaithful } = useFaithfulPreference();

  // URL-based state for filters that should persist across navigation
  const [urlState, setUrlState] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      tmSearch: parseAsString.withDefault(''),
      type: parseAsString.withDefault('all'),
      category: parseAsString.withDefault('all'),
      // version: parseAsString.withDefault('updated'),
      physical: parseAsBoolean.withDefault(false),
      special: parseAsBoolean.withDefault(false),
      status: parseAsBoolean.withDefault(false),
      hasFaithful: parseAsBoolean.withDefault(false),
      highPower: parseAsBoolean.withDefault(false),
      perfectAccuracy: parseAsBoolean.withDefault(false),
      hasTm: parseAsBoolean.withDefault(false),
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
  const {
    search,
    tmSearch,
    type,
    category,
    // version,
    physical,
    special,
    status,
    hasFaithful,
    highPower,
    perfectAccuracy,
    hasTm,
  } = urlState;

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

  // Sync description search with table filter for description column
  React.useEffect(() => {
    const descColumn = columns.find(
      (col) => 'accessorKey' in col && col.accessorKey === 'description',
    );
    if (descColumn) {
      setColumnFilters((prev) => {
        const otherFilters = prev.filter((filter) => filter.id !== 'description');
        if (tmSearch) {
          return [...otherFilters, { id: 'description', value: tmSearch }];
        }
        return otherFilters;
      });
    }
  }, [tmSearch, columns]);

  // Get unique types and categories from the data
  const { types, categories } = React.useMemo(() => {
    const typeSet = new Set<string>();
    const categorySet = new Set<string>();

    data.forEach((move) => {
      // Get type from updated, faithful, or base
      const moveType = move.updated?.type ?? move.faithful?.type ?? move.type;
      if (moveType) typeSet.add(moveType);

      // Get category from updated, faithful, or base
      const moveCategory = move.updated?.category ?? move.faithful?.category;
      if (moveCategory) categorySet.add(moveCategory);
    });

    return {
      types: Array.from(typeSet).sort(),
      categories: Array.from(categorySet).sort(),
    };
  }, [data]);

  // Apply filters to the data
  const filteredData = React.useMemo(() => {
    return data.filter((move) => {
      // Get move stats based on version preference
      const moveData = showFaithful
        ? (move.faithful ?? move.updated)
        : (move.updated ?? move.faithful);

      // Type filter
      const moveType = moveData?.type ?? move.type;
      const matchesType = type === 'all' || moveType === type;

      // Category filter
      const moveCategory = moveData?.category;
      const matchesCategory = category === 'all' || moveCategory === category;

      // Category checkboxes
      const matchesPhysical = !physical || moveCategory === 'Physical';
      const matchesSpecial = !special || moveCategory === 'Special';
      const matchesStatus = !status || moveCategory === 'Status';

      // Has faithful version filter
      const matchesHasFaithful = !hasFaithful || move.faithful !== undefined;

      // Power and accuracy filters
      const movePower =
        typeof moveData?.power === 'number'
          ? moveData.power
          : parseInt(String(moveData?.power || '0'));
      // const moveAccuracy =
      //   typeof moveData?.accuracy === 'number'
      //     ? moveData.accuracy
      //     : moveData?.accuracy === '--'
      //       ? 100
      //       : parseInt(String(moveData?.accuracy || '0'));

      const matchesHighPower = !highPower || movePower >= 80;
      // const matchesPerfectAccuracy = !perfectAccuracy || moveAccuracy >= 100;

      const matchesHasTM = !hasTm || move.tm;

      return (
        matchesType &&
        matchesCategory &&
        matchesPhysical &&
        matchesSpecial &&
        matchesStatus &&
        matchesHasFaithful &&
        matchesHighPower &&
        matchesHasTM
        // matchesPerfectAccuracy
      );
    });
  }, [
    data,
    type,
    category,
    showFaithful,
    physical,
    special,
    status,
    hasFaithful,
    highPower,
    hasTm,
    // perfectAccuracy,
  ]);

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
    category,
    showFaithful,
    physical,
    special,
    status,
    hasFaithful,
    highPower,
    perfectAccuracy,
    setPagination,
    hasTm,
  ]);

  return (
    <div className="w-full px-2 sm:px-0">
      <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 rounded-xl mb-4 dark:border-white/[0.2] dark:bg-black dark:shadow-none">
        {/* Primary search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="move-filter">Move Name</Label>
            <Input
              id="move-filter"
              placeholder="Search by name..."
              value={search}
              onChange={(event) => setUrlState({ search: event.target.value || null })}
              className="max-w-sm bg-white"
            />
          </div>
          {/* <div className="flex flex-col gap-2">
            <Label htmlFor="desc-filter">TM/HM</Label>
            <Input
              id="desc-filter"
              placeholder="Search by TM..."
              value={tmSearch}
              onChange={(event) => setUrlState({ tmSearch: event.target.value || null })}
              className="max-w-sm bg-white"
            />
          </div> */}
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
                  {types.map((moveType) => (
                    <SelectItem key={moveType} value={moveType}>
                      {moveType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category filter */}
            <div className="flex flex-col gap-2 w-1/2 md:w-auto">
              <Label htmlFor="category-select">Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setUrlState({ category: value === 'all' ? null : value })}
              >
                <SelectTrigger id="category-select" className="bg-white w-[140px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((moveCategory) => (
                    <SelectItem key={moveCategory} value={moveCategory}>
                      {moveCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Version selector */}
          {/* <div className="flex flex-col gap-2">
            <Label htmlFor="version-select">Version</Label>
            <Select value={version} onValueChange={(value) => setUrlState({ version: value })}>
              <SelectTrigger id="version-select" className="bg-white w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="faithful">Faithful</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>

        {/* Checkbox Filters */}
        <div className="flex flex-wrap gap-4">
          {/* <div className="flex items-center space-x-2">
            <Checkbox
              id="physical"
              checked={physical}
              onCheckedChange={(checked) => setUrlState({ physical: checked ? true : null })}
            />
            <Label htmlFor="physical" className="text-sm">
              Physical moves only
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="special"
              checked={special}
              onCheckedChange={(checked) => setUrlState({ special: checked ? true : null })}
            />
            <Label htmlFor="special" className="text-sm">
              Special moves only
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="status"
              checked={status}
              onCheckedChange={(checked) => setUrlState({ status: checked ? true : null })}
            />
            <Label htmlFor="status" className="text-sm">
              Status moves only
            </Label>
          </div> */}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-faithful"
              checked={hasFaithful}
              onCheckedChange={(checked) => setUrlState({ hasFaithful: checked ? true : null })}
            />
            <Label htmlFor="has-faithful" className="text-sm">
              Has faithful version
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="high-power"
              checked={highPower}
              onCheckedChange={(checked) => setUrlState({ highPower: checked ? true : null })}
            />
            <Label htmlFor="high-power" className="text-sm">
              High power (80+)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tm-hm"
              checked={hasTm}
              onCheckedChange={(checked) => setUrlState({ hasTm: checked ? true : null })}
            />
            <Label htmlFor="tm-hm" className="text-sm">
              Has TM/HM
            </Label>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:items-start gap-2 text-sm text-muted-foreground">
          {(Boolean(search) ||
            Boolean(tmSearch) ||
            type !== 'all' ||
            category !== 'all' ||
            sorting.length > 0 ||
            physical ||
            special ||
            status ||
            hasFaithful ||
            highPower ||
            hasTm ||
            perfectAccuracy) && (
            <Button
              size="sm"
              onClick={() => {
                setUrlState({
                  search: null,
                  tmSearch: null,
                  type: null,
                  category: null,
                  physical: null,
                  special: null,
                  status: null,
                  hasFaithful: null,
                  highPower: null,
                  perfectAccuracy: null,
                  hasTm: null,
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
            Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} moves
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
            {(physical ||
              special ||
              status ||
              hasFaithful ||
              highPower ||
              perfectAccuracy ||
              hasTm ||
              type !== 'all' ||
              category !== 'all') && (
              <span className="ml-2">
                • Filtered:{' '}
                {[
                  physical && 'Physical only',
                  special && 'Special only',
                  status && 'Status only',
                  hasFaithful && 'Has faithful version',
                  highPower && 'High power (80+)',
                  perfectAccuracy && 'Perfect accuracy',
                  type !== 'all' && `Type: ${type}`,
                  category !== 'all' && `Category: ${category}`,
                  hasTm && 'Has TM/HM',
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}
            {/* {version !== 'updated' && <span className="ml-2">• Showing: {version} version</span>} */}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <TableWrapper>
        <Table className="table-fixed w-full min-w-[500px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  // Hide the "name" column on mobile
                  const isNameColumn =
                    'accessorKey' in header.column.columnDef &&
                    header.column.columnDef.accessorKey === 'name';
                  return (
                    <TableHead
                      key={header.id}
                      className={isNameColumn ? 'hidden sm:table-cell' : ''}
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
              table
                .getRowModel()
                .rows.map((row) => (
                  <MoveRow
                    key={row.id}
                    name={row.original.name || ''}
                    level={undefined}
                    info={row.original}
                  />
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No moves found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {filteredData.length} moves shown
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="text-sm whitespace-nowrap">
              Moves per page:
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
