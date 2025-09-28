import { useMemo } from 'react';
import { PokemonManifest } from '@/types/new';
import { useDebounce } from './useDebounce';

interface UsePokemonSearchProps {
  pokemon: PokemonManifest[];
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

      // Get the appropriate version based on user preference
      const version = showUpdatedTypes ? 'polished' : 'faithful';
      const versionData = p.versions[version];

      if (!versionData) {
        return false;
      }

      // Check types in all forms for this version
      for (const formName in versionData) {
        const formData = versionData[formName];
        const types = formData.types || [];

        if (types.some((type: string) => type?.toLowerCase().includes(query))) {
          return true;
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
