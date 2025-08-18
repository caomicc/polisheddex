'use client';
import { BaseData } from '@/types/types';
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
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { usePaginationSearchParams } from '@/hooks/use-pagination-search-params';
import { createPokemonListColumns } from './pokemon-list-columns';
import { Badge } from '../ui/badge';

export default function PokemonListDisplay({ pokemonList }: { pokemonList: BaseData[] }) {
  const [tableView, setTableView] = React.useState(false);
  const STORAGE_KEY = 'pokemonListDataTable';
  const { showFaithful } = useFaithfulPreference();

  const columns = React.useMemo(() => createPokemonListColumns(showFaithful), [showFaithful]);

  // Added `view` parameter to URL state for persisting list vs card view
  const [urlState, setUrlState] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      type: parseAsString.withDefault('all'),
      generation: parseAsString.withDefault('all'),
      hasJohtoDex: parseAsBoolean.withDefault(false),
      hasNationalDex: parseAsBoolean.withDefault(false),
      hasForms: parseAsBoolean.withDefault(false),
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
    storedState?.sorting || [{ id: 'johtoDex', desc: false }],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const { search, type, generation, hasJohtoDex, hasNationalDex, hasForms, showForms, view } =
    urlState;

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
      const displayTypes = showFaithful
        ? pokemon.faithfulTypes || pokemon.types
        : pokemon.updatedTypes || pokemon.types;
      const typesArray = Array.isArray(displayTypes) ? displayTypes : [displayTypes];
      typesArray.forEach((type) => {
        if (type) typeSet.add(type);
      });
    });

    return Array.from(typeSet).sort();
  }, [pokemonList, showFaithful]);

  // Apply filters to the data
  const filteredData = React.useMemo(() => {
    return pokemonList.filter((pokemon) => {
      const matchesSearch = !search || pokemon.name.toLowerCase().includes(search.toLowerCase());

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

      // Form visibility filter - hide forms if showForms is false
      const matchesFormVisibility = showForms || !pokemon.isForm;

      return (
        matchesSearch &&
        matchesType &&
        matchesGeneration &&
        matchesJohtoDex &&
        matchesNationalDex &&
        matchesForms &&
        matchesFormVisibility
      );
    });
  }, [
    pokemonList,
    search,
    type,
    generation,
    showFaithful,
    hasJohtoDex,
    hasNationalDex,
    hasForms,
    showForms,
  ]);

  // Apply sorting to the filtered data
  const sortedData = React.useMemo(() => {
    return [...filteredData].sort((a, b) => {
      for (const sort of sorting) {
        const { id, desc } = sort;
        const aValue = a[id] as string | number;
        const bValue = b[id] as string | number;

        if (aValue < bValue) return desc ? 1 : -1;
        if (aValue > bValue) return desc ? -1 : 1;
      }
      return 0;
    });
  }, [filteredData, sorting]);

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
  }, [
    columnFilters,
    type,
    generation,
    showFaithful,
    hasJohtoDex,
    hasNationalDex,
    hasForms,
    showForms,
    setPagination,
  ]);

  React.useEffect(() => {
    setTableView(view === 'table');
  }, [view]);

  return (
    <div className="relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 rounded-xl mb-4 dark:border-white/[0.2] dark:bg-black dark:shadow-none">
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
          {(Boolean(search) ||
            type !== 'all' ||
            generation !== 'all' ||
            sorting.length > 0 ||
            hasJohtoDex ||
            hasNationalDex ||
            hasForms ||
            !showForms) && (
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
                  showForms: null,
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
          <span className="flex flex-col md:flex-row">
            Showing {filteredData.length} Pokémon
            {/* {sorting.length > 0 && (
              <span className="">
                Sorted by{' '}
                {sorting
                  .map((sort) => {
                    const direction = sort.desc ? 'desc' : 'asc';
                    return `${sort.id} (${direction === 'desc' ? 'Z-A' : 'A-Z'})`;
                  })
                  .join(', ')}
              </span>
            )} */}
            {/* {(hasJohtoDex ||
              hasNationalDex ||
              hasForms ||
              type !== 'all' ||
              generation !== 'all' ||
              showForms) &&
              showForms && (
                <span className="ml-2">
                  Filtered:{' '}
                  {[
                    hasJohtoDex && 'In Johto Dex',
                    hasNationalDex && 'Has National Dex',
                    hasForms && 'Has multiple forms',
                    type !== 'all' && `Type: ${type}`,
                    generation !== 'all' && `Generation: ${generation.replace('gen', 'Gen ')}`,
                    showForms && 'Forms visible',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )} */}
          </span>
        </div>
      </div>
      {tableView ? (
        <PokemonListDataTable data={sortedData} />
      ) : (
        <LazyPokemonCardGrid pokemonData={sortedData} itemsPerPage={24} />
      )}
    </div>
  );
}
