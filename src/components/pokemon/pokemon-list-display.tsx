// pokemon columns for /pokemon route
'use client';
import { PokemonListDataTable } from './pokemon-list-data-table';
import LazyPokemonCardGrid from './lazy-pokemon-card-grid';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { Button } from '../ui/button';
import React from 'react';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
import { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { usePaginationSearchParams } from '@/hooks/use-pagination-search-params';
import { createPokemonListColumns } from './pokemon-list-columns';
import { Badge } from '../ui/badge';
import { PokemonManifest } from '@/types/new';

export default function PokemonListDisplay({ pokemonList }: { pokemonList: PokemonManifest[] }) {
  const [tableView, setTableView] = React.useState(false);
  const STORAGE_KEY = 'pokemonListDataTable';
  const { showFaithful } = useFaithfulPreference();

  const version = showFaithful ? 'faithful' : 'polished';

  const columns = React.useMemo(() => createPokemonListColumns(version), [version]);

  // Added `view` parameter to URL state for persisting list vs card view
  const [urlState, setUrlState] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      type: parseAsString.withDefault('all'),
      showForms: parseAsBoolean.withDefault(false), // Added show forms toggle
      view: parseAsString.withDefault('card'), // Added view parameter
    },
    {
      shallow: true,
      clearOnDefault: true,
    },
  );

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

  const { search, type, showForms, view } = urlState;

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

  const types = React.useMemo(() => {
    const typeSet = new Set<string>();

    pokemonList.forEach((pokemon) => {
      const currentForm = 'plain';
      const displayTypes = pokemon.versions[version]?.[currentForm]?.types;
      const typesArray = Array.isArray(displayTypes)
        ? displayTypes
        : displayTypes
          ? [displayTypes]
          : [];
      typesArray.forEach((type) => {
        if (type) typeSet.add(type);
      });
    });

    return Array.from(typeSet).sort();
  }, [pokemonList, version]);

  // Apply filters to the data
  const filteredData = React.useMemo(() => {
    return pokemonList.filter((pokemon) => {
      const matchesSearch = !search || pokemon.name.toLowerCase().includes(search.toLowerCase());

      // Type filter - get types for the current form and version
      const currentForm = 'plain';
      const displayTypes = pokemon.versions[version]?.[currentForm]?.types;
      const typesArray = Array.isArray(displayTypes)
        ? displayTypes
        : displayTypes
          ? [displayTypes]
          : [];
      const matchesType = type === 'all' || typesArray.some((t) => t === type);

      return matchesSearch && matchesType;
    });
  }, [pokemonList, search, type, version]);

  // Apply sorting to the filtered data
  const sortedData = React.useMemo(() => {
    console.log(`Sorting ${filteredData.length} filtered Pokemon entries`);
    // Sort by dexNo for consistent ordering
    return [...filteredData].sort((a, b) => a.dexNo - b.dexNo);
  }, [filteredData]);

  // Fixed `setPagination` usage by correctly destructuring the returned object
  const [, setPagination] = usePaginationSearchParams();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const isInitialLoad =
      !storedState ||
      (JSON.stringify(sorting) === JSON.stringify(storedState.sorting) &&
        JSON.stringify(columnFilters) === JSON.stringify(storedState.columnFilters));

    if (isInitialLoad) return;

    const stateToSave = {
      sorting,
      columnFilters,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save table state to localStorage:', error);
    }
  }, [sorting, columnFilters, storedState]);

  React.useEffect(() => {
    setPagination({ pageIndex: 0 });
  }, [columnFilters, type, showForms, setPagination]);

  React.useEffect(() => {
    setTableView(view === 'table');
  }, [view]);

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
      <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 rounded-xl mb-2 md:mb-4 dark:border-white/[0.2] dark:bg-black dark:shadow-none">
        {/* Primary search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 ">
          <div className="flex flex-col gap-2 flex-1">
            <Label className="label-text" htmlFor="pokemon-filter">
              Pokémon Name
            </Label>
            <Input
              id="pokemon-filter"
              placeholder="Search by name..."
              value={search}
              onChange={(event) => setUrlState({ search: event.target.value || null })}
              className="max-w-sm bg-white"
            />
          </div>

          {/* Type filter */}
          <div className="flex flex-row gap-4 flex-1">
            <div className="flex flex-col gap-2 w-full">
              <Label className="label-text" htmlFor="type-select">
                Type
              </Label>
              <Select
                value={type}
                onValueChange={(value) => setUrlState({ type: value === 'all' ? null : value })}
              >
                <SelectTrigger id="type-select" className="bg-white w-full md:w-full">
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

          {/* Form visibility toggle */}
          <div className="flex flex-row gap-4 w-full sm:w-auto flex-1">
            <div className="flex flex-col items-start gap-2 w-1/2 md:w-auto">
              <Label className="label-text" htmlFor="forms-toggle">
                Show Forms
              </Label>
              <Checkbox
                id="forms-toggle"
                className="mt-2"
                checked={showForms}
                onCheckedChange={(checked) => setUrlState({ showForms: checked === true })}
                aria-label="Toggle form visibility"
              />
            </div>
          </div>

          <div className={'flex items-center gap-2 ml-auto'}>
            <Label htmlFor="table-toggle" className="text-sm whitespace-nowrap">
              <Badge className="w-[45px]">{tableView ? 'Table' : 'Cards'}</Badge>
            </Label>
            <Switch
              id="table-toggle"
              checked={tableView}
              onCheckedChange={(checked) => setUrlState({ view: checked ? 'table' : 'card' })}
              aria-label="Toggle between table and card views"
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:items-start gap-2 text-sm text-muted-foreground">
          {(Boolean(search) || type !== 'all' || sorting.length > 0 || !showForms) && (
            <Button
              size="sm"
              onClick={() => {
                setUrlState({
                  search: null,
                  type: null,
                  showForms: null,
                });
                setSorting([{ id: 'dexNo', desc: false }]);
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
          <span className="flex flex-col md:flex-row text-xs text-muted-foreground">
            Showing {filteredData.length} Pokémon
          </span>
        </div>
      </div>
      {tableView ? (
        <PokemonListDataTable pokemonData={sortedData} />
      ) : (
        <LazyPokemonCardGrid pokemonData={sortedData} itemsPerPage={24} showForms={showForms} />
      )}
    </div>
  );
}
