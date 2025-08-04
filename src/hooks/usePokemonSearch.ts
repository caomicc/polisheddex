import { useMemo } from 'react';
import { BaseData } from '@/types/types';
import { useDebounce } from './useDebounce';

interface UsePokemonSearchProps {
  pokemon: BaseData[];
  searchQuery: string;
  showUpdatedTypes: boolean;
}

export function usePokemonSearch({
  pokemon,
  searchQuery,
  showUpdatedTypes,
}: UsePokemonSearchProps) {
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredPokemon = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return pokemon;
    }

    return pokemon.filter((p) => {
      const query = debouncedSearchQuery.toLowerCase();

      // Check if name matches
      if (p.name.toLowerCase().includes(query)) {
        return true;
      }

      // Get the appropriate types based on user preference
      const selectedTypes = showUpdatedTypes ? p.updatedTypes || p.types : p.types;

      // Check if any type matches
      const types = Array.isArray(selectedTypes) ? selectedTypes : [selectedTypes];
      if (types.some((type: string) => type?.toLowerCase().includes(query))) {
        return true;
      }

      // Check if any form type matches
      if (p.forms) {
        for (const formName in p.forms) {
          const formSelectedTypes = showUpdatedTypes
            ? p.forms[formName].updatedTypes || p.forms[formName].types
            : p.forms[formName].faithfulTypes || p.forms[formName].types;

          const formTypes = Array.isArray(formSelectedTypes)
            ? formSelectedTypes
            : [formSelectedTypes];

          if (formTypes.some((type: string) => type?.toLowerCase().includes(query))) {
            return true;
          }
        }
      }

      return false;
    });
  }, [pokemon, debouncedSearchQuery, showUpdatedTypes]);

  const isSearching = searchQuery !== debouncedSearchQuery;

  return {
    filteredPokemon,
    isSearching,
    debouncedSearchQuery,
  };
}
