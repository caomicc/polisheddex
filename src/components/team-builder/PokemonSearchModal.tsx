'use client';

import { useState, useMemo } from 'react';
import { DetailedStats, PokemonType } from '@/types/types';
import { TeamPokemon } from '@/hooks/use-team-search-params';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import Image from 'next/image';
import { Input } from '../ui/input';

// Helper functions
const normalizeTypes = (types: string | string[]): string[] => {
  if (typeof types === 'string') {
    return types.split('/').map((t) => t.trim().toLowerCase());
  }
  return Array.isArray(types) ? types.map((t) => t.toLowerCase()) : [];
};

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

  return normalizeTypes(types || []);
};

interface PokemonEntry {
  name: string;
  formName?: string;
  data: DetailedStats;
  displayName: string;
}

interface PokemonSearchModalProps {
  pokemonData: Record<string, DetailedStats>;
  onSelect: (name: string, data: DetailedStats, formName?: string) => void;
  onClose: () => void;
  currentTeam: (TeamPokemon | null)[];
  showFaithful: boolean;
}

export function PokemonSearchModal({
  pokemonData,
  onSelect,
  onClose,
  currentTeam,
  showFaithful,
}: PokemonSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const allTypes = [
    'normal',
    'fire',
    'water',
    'electric',
    'grass',
    'ice',
    'fighting',
    'poison',
    'ground',
    'flying',
    'psychic',
    'bug',
    'rock',
    'ghost',
    'dragon',
    'dark',
    'steel',
    'fairy',
  ];

  const filteredPokemon = useMemo(() => {
    const alreadySelected = new Set(
      currentTeam
        .filter(Boolean)
        .map((p) => {
          const pokemon = p!;
          return pokemon.formName ? `${pokemon.name}:${pokemon.formName}` : pokemon.name;
        })
        .map((s) => s.toLowerCase()),
    );

    const allEntries: PokemonEntry[] = [];

    // Generate entries for each Pokemon and their forms
    Object.entries(pokemonData).forEach(([name, data]) => {
      // Add base Pokemon entry (if no forms exist or as fallback)
      const baseKey = name.toLowerCase();
      if (!alreadySelected.has(baseKey)) {
        allEntries.push({
          name,
          data,
          displayName: name,
        });
      }

      // Add form entries if they exist
      if (data.forms) {
        Object.keys(data.forms).forEach((formName) => {
          const formKey = `${name}:${formName}`.toLowerCase();
          if (!alreadySelected.has(formKey)) {
            const displayName = `${name} (${formName
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')})`;
            allEntries.push({
              name,
              formName,
              data,
              displayName,
            });
          }
        });
      }
    });

    return allEntries
      .filter((entry) => {
        const matchesSearch = entry.displayName.toLowerCase().includes(searchTerm.toLowerCase());

        if (selectedTypes.length === 0) return matchesSearch;

        const pokemonTypes = getTypesForMode(entry.data, showFaithful, entry.formName);
        const hasSelectedType = selectedTypes.some((type) =>
          pokemonTypes.includes(type.toLowerCase()),
        );

        return matchesSearch && hasSelectedType;
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [pokemonData, searchTerm, selectedTypes, currentTeam, showFaithful]);

  const handlePokemonSelect = (name: string, data: DetailedStats, formName?: string) => {
    onSelect(name, data, formName);
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Select a Pokémon</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {allTypes.map((type) => (
              <Badge
                key={type}
                variant={selectedTypes.includes(type) ? (type as PokemonType['name']) : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTypeFilter(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Pokemon List */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPokemon.map((entry) => {
              const types = getTypesForMode(entry.data, showFaithful, entry.formName);
              const key = entry.formName ? `${entry.name}:${entry.formName}` : entry.name;

              return (
                <div
                  key={key}
                  onClick={() => handlePokemonSelect(entry.name, entry.data, entry.formName)}
                  className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex flex-col items-center space-y-2">
                    {entry.data.frontSpriteUrl && (
                      <Image
                        src={
                          entry.formName
                            ? `/sprites/pokemon/${entry.name}_${entry.formName}/front_cropped.png`
                            : `/sprites/pokemon/${entry.name}/front_cropped.png`
                        }
                        alt={entry.displayName}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain"
                      />
                    )}

                    <div className="text-center">
                      <div className="font-medium text-sm capitalize">{entry.displayName}</div>

                      <div className="flex flex-wrap gap-1 justify-center mt-1">
                        {types.map((type) => (
                          <Badge
                            key={type}
                            variant={type as PokemonType['name']}
                            className="text-xs px-1 py-0"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPokemon.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No Pokémon found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
