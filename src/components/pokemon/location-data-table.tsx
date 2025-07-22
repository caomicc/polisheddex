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

export function LocationDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Checkbox filter states
  const [showOnlyPokemon, setShowOnlyPokemon] = React.useState(false);
  const [showOnlyFlyable, setShowOnlyFlyable] = React.useState(false);
  const [showOnlyGrottoes, setShowOnlyGrottoes] = React.useState(false);
  const [showOnlyTrainers, setShowOnlyTrainers] = React.useState(false);
  const [showOnlyItems, setShowOnlyItems] = React.useState(false);

  // Apply checkbox filters to the data
  const filteredData = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.filter((location: any) => {
      const matchesPokemon = !showOnlyPokemon || (location.pokemonCount && location.pokemonCount > 0);
      const matchesFlyable = !showOnlyFlyable || location.flyable;
      const matchesGrottoes = !showOnlyGrottoes || location.hasHiddenGrottoes;
      const matchesTrainers = !showOnlyTrainers || location.hasTrainers;
      const matchesItems = !showOnlyItems || (location.items && location.items.length > 0);

      return matchesPokemon && matchesFlyable && matchesGrottoes && matchesTrainers && matchesItems;
    });
  }, [data, showOnlyPokemon, showOnlyFlyable, showOnlyGrottoes, showOnlyTrainers, showOnlyItems]);

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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Get unique regions for filter
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
            value={(table.getColumn('region')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('region')?.setFilterValue(value === 'all' ? '' : value)
            }
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {table.getFilteredRowModel().rows.length} of{' '}
            {filteredData.length} locations
            {sorting.length > 0 && (
              <span className="ml-2">
                • Sorted by {sortOptions.find(opt => opt.value === getCurrentSortValue())?.label}
              </span>
            )}
            {(showOnlyPokemon || showOnlyTrainers || showOnlyFlyable || showOnlyGrottoes) && (
              <span className="ml-2">
                • Filtered: {[
                  showOnlyPokemon && 'Has Pokémon',
                  showOnlyTrainers && 'Has Trainers',
                  showOnlyFlyable && 'Flyable',
                  showOnlyGrottoes && 'Has Grottoes'
                ].filter(Boolean).join(', ')}
              </span>
            )}
          </span>
          {(Boolean(table.getColumn('displayName')?.getFilterValue()) ||
            Boolean(table.getColumn('region')?.getFilterValue()) ||
            sorting.length > 0 ||
            showOnlyPokemon ||
            showOnlyTrainers ||
            showOnlyFlyable ||
            showOnlyGrottoes) && (
            <Button
              size="sm"
              onClick={() => {
                table.getColumn('displayName')?.setFilterValue('');
                table.getColumn('region')?.setFilterValue('');
                setSorting([]);
                setShowOnlyPokemon(false);
                setShowOnlyTrainers(false);
                setShowOnlyFlyable(false);
                setShowOnlyGrottoes(false);
                setShowOnlyItems(false);
              }}
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Clear filters & sort
            </Button>
          )}
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
