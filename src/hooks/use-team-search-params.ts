import { useQueryState } from 'nuqs';
import { useMemo, useCallback } from 'react';
import { DetailedStats } from '@/types/types';

// Helper function to get types based on faithful preference and form
const getTypesForMode = (
  data: DetailedStats,
  showFaithful: boolean,
  formName?: string,
): string[] => {
  let types;

  // If form is specified and exists, use form types
  if (formName && data.forms && data.forms[formName]) {
    const formData = data.forms[formName];
    types = showFaithful
      ? formData.faithfulTypes || formData.types || data.faithfulTypes || data.types
      : formData.updatedTypes || formData.types || data.updatedTypes || data.types;
  } else {
    // Use base Pokemon types
    types = showFaithful ? data.faithfulTypes || data.types : data.updatedTypes || data.types;
  }

  if (typeof types === 'string') {
    return types.split('/').map((t) => t.trim().toLowerCase());
  }
  return Array.isArray(types) ? types.map((t) => t.toLowerCase()) : [];
};

export interface TeamPokemon {
  name: string;
  formName?: string;
  data: DetailedStats;
  types: string[];
}

export function useTeamSearchParams(
  pokemonData: Record<string, DetailedStats>,
  showFaithful: boolean,
) {
  // Store team as comma-separated Pokemon names in URL
  const [teamParam, setTeamParam] = useQueryState('team');

  // Convert URL parameter to team array
  const team = useMemo((): (TeamPokemon | null)[] => {
    if (!teamParam || !pokemonData) {
      return Array(6).fill(null);
    }

    const pokemonEntries = teamParam.split(',').filter((entry) => entry.trim());
    const teamArray: (TeamPokemon | null)[] = Array(6).fill(null);

    pokemonEntries.forEach((entry, index) => {
      if (index < 6) {
        // Parse name:form format
        const [name, formName] = entry.split(':');
        if (pokemonData[name]) {
          teamArray[index] = {
            name,
            formName,
            data: pokemonData[name],
            types: getTypesForMode(pokemonData[name], showFaithful, formName),
          };
        }
      }
    });

    return teamArray;
  }, [teamParam, pokemonData, showFaithful]);

  // Update team in URL
  const setTeam = useCallback(
    (newTeam: (TeamPokemon | null)[]) => {
      // Create comma-separated string, but only include up to the last non-empty slot
      let lastIndex = -1;
      newTeam.forEach((pokemon, index) => {
        if (pokemon) lastIndex = index;
      });

      const urlTeam = newTeam
        .slice(0, lastIndex + 1)
        .map((pokemon) => {
          if (!pokemon) return '';
          return pokemon.formName ? `${pokemon.name}:${pokemon.formName}` : pokemon.name;
        })
        .join(',');

      setTeamParam(urlTeam || null);
    },
    [setTeamParam],
  );

  // Add Pokemon to specific slot
  const setPokemonInSlot = useCallback(
    (index: number, name: string, data: DetailedStats, formName?: string) => {
      const newTeam = [...team];
      newTeam[index] = {
        name,
        formName,
        data,
        types: getTypesForMode(data, showFaithful, formName),
      };
      setTeam(newTeam);
    },
    [team, setTeam, showFaithful],
  );

  // Remove Pokemon from specific slot
  const removePokemonFromSlot = useCallback(
    (index: number) => {
      const newTeam = [...team];
      newTeam[index] = null;
      setTeam(newTeam);
    },
    [team, setTeam],
  );

  // Load team from URL parameter string
  const setTeamFromUrl = useCallback((teamParam: string) => {
    setTeamParam(teamParam || null);
  }, [setTeamParam]);

  return {
    team,
    setTeam,
    setPokemonInSlot,
    removePokemonFromSlot,
    setTeamFromUrl,
  };
}
