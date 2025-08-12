'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { POKEMON_LIST, emptyPokemonEntry, type PokemonBasic } from '@/lib/pokemon-data';
import { Ability, DetailedStats } from '@/types/types';
import { Badge } from './ui/badge';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';

export type MoveEntry = {
  name: string;
  type: string | null;
};

export type PokemonEntry = {
  name: string;
  types: (string | null)[]; // [type1, type2]
  ability: string;
  moves: MoveEntry[]; // 4 moves
};

export type PokemonSlotProps = {
  index: number;
  entry: PokemonEntry;
  onChange: (data: Partial<PokemonEntry>) => void;
};

export default function PokemonSlot({ index, entry, onChange }: PokemonSlotProps) {
  const [, setPokemonDetailData] = useState<DetailedStats | null>(null);
  const [individualPokemonData, setIndividualPokemonData] = useState<DetailedStats | null>(null);
  const { showFaithful } = useFaithfulPreference();

  const matched: PokemonBasic | undefined = useMemo(
    () => POKEMON_LIST.find((p) => p.name.toLowerCase() === (entry.name || '').toLowerCase()),
    [entry.name],
  );

  // Load detailed Pokemon data when a Pokemon is selected
  useEffect(() => {
    if (matched?.name) {
      // Load only the detailed stats file which contains all needed data
      fetch('/output/pokemon_detailed_stats.json')
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          return res.json();
        })
        .then((detailedStats) => {
          const pokemonData = detailedStats[matched.name];
          setPokemonDetailData(pokemonData || null);
          setIndividualPokemonData(pokemonData || null);
        })
        .catch((err) => {
          console.error('Failed to load Pokemon data:', err);
          setPokemonDetailData(null);
          setIndividualPokemonData(null);
        });
    } else {
      setPokemonDetailData(null);
      setIndividualPokemonData(null);
    }
  }, [matched?.name]);

  // Update types when detailed data loads or faithful preference changes
  useEffect(() => {
    if (individualPokemonData && matched?.name) {
      const correctTypes = showFaithful
        ? individualPokemonData.faithfulTypes || individualPokemonData.types || []
        : individualPokemonData.updatedTypes || individualPokemonData.types || [];

      // Always ensure types is [type1, type2] with nulls if missing
      const currentTypes = Array.isArray(entry.types)
        ? [entry.types[0] ?? null, entry.types[1] ?? null]
        : typeof entry.types === 'string'
          ? [entry.types, null]
          : [null, null];

      const newTypes = Array.isArray(correctTypes)
        ? [correctTypes[0] ?? null, correctTypes[1] ?? null]
        : typeof correctTypes === 'string'
          ? [correctTypes, null]
          : [null, null];

      // Only update if types actually changed
      if (currentTypes[0] !== newTypes[0] || currentTypes[1] !== newTypes[1]) {
        onChange({ types: newTypes });
      }
    }
  }, [individualPokemonData, showFaithful, matched?.name, entry.types, onChange]);

  const abilityOptions = useMemo(() => {
    // Use individual Pokemon data from detailed stats if available, fall back to matched data
    const sourceData = individualPokemonData || matched;
    if (!sourceData) return [];

    // Use faithful or polished abilities based on context
    const abilities: Ability[] = showFaithful
      ? (sourceData as DetailedStats).faithfulAbilities || sourceData.abilities || []
      : (sourceData as DetailedStats).updatedAbilities || sourceData.abilities || [];

    return abilities
      .map((ability) => {
        if (typeof ability === 'string') return ability;
        if (ability && ability.id) {
          // Convert kebab-case to title case
          return ability.id
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        return ability?.name || 'Unknown';
      })
      .filter(Boolean);
  }, [individualPokemonData, matched, showFaithful]);

  const availableMoves = useMemo(() => {
    // Use individual Pokemon data from detailed stats if available
    const sourceData = individualPokemonData;
    if (!sourceData && !matched) return [];

    if (!sourceData) {
      // Fallback: use basic data from POKEMON_LIST (no comprehensive moves)
      return [];
    }

    // Get moves based on faithful/polished preference
    const levelUpMoves = showFaithful
      ? sourceData.faithfulMoves || sourceData.moves || []
      : sourceData.updatedMoves || sourceData.moves || [];

    // Get egg moves and TM/HM moves (these don't have faithful versions)
    const eggMoves = sourceData.eggMoves || [];
    const tmHmMoves = sourceData.tmHmLearnset || [];

    // Combine all moves
    const allMoves = [
      ...levelUpMoves.map((move) => ({ ...move, category: 'Level-up' })),
      ...eggMoves.map((move) => ({ ...move, category: 'Egg Move' })),
      ...tmHmMoves.map((move) => ({ ...move, category: 'TM/HM' })),
    ];

    return (
      allMoves
        .map((move) => ({
          name: String(move.name || 'Unknown Move'),
          type: String(move.info?.type || 'Normal'),
          category: move.category || 'Level-up',
        }))
        .filter((move) => move.name && move.name !== 'Unknown Move')
        // Remove duplicates based on move name
        .filter((move, index, self) => index === self.findIndex((m) => m.name === move.name))
        // Sort by category then name
        .sort((a, b) => {
          if (a.category !== b.category) {
            const order = ['Level-up', 'Egg Move', 'TM/HM'];
            return order.indexOf(a.category) - order.indexOf(b.category);
          }
          return a.name.localeCompare(b.name);
        })
    );
  }, [individualPokemonData, matched, showFaithful]);

  const isPokemonSelected = Boolean(matched);

  const setMove = (i: number, move: Partial<MoveEntry>) => {
    const copy = [...entry.moves];
    copy[i] = { ...copy[i], ...move };
    onChange({ moves: copy });
  };

  const autofillFromPokemon = (pokemonName: string) => {
    const found = POKEMON_LIST.find((p) => p.name === pokemonName);
    if (!found) {
      onChange({ name: pokemonName });
      return;
    }

    // Use basic types as default - types will be updated when detailed data loads
    const types = [found.types[0] ?? null, found.types[1] ?? null];

    onChange({
      name: found.name,
      types: types,
    });
  };

  const clearSlot = () => {
    onChange({ ...emptyPokemonEntry });
  };

  return (
    <Card className="py-4">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-4 relative">
        <CardTitle>Slot {index + 1}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSlot}
          aria-label={`Clear slot ${index + 1}`}
          className="absolute right-2 -top-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div className="grid gap-3">
          <Label htmlFor={`name-${index}`}>Pokémon</Label>

          <Select value={entry.name} onValueChange={(value) => autofillFromPokemon(value)}>
            <SelectTrigger className="w-full" id={`name-${index}`}>
              <SelectValue placeholder={'Select a Pokemon'} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Pokemon</SelectLabel>
                {POKEMON_LIST.map((a, idx) => (
                  <SelectItem key={`name-${idx}-${a}`} value={a.name}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {matched && (
            <div className="flex items-center gap-2">
              {/* Show types from entry (which gets updated by useEffect) or fallback to matched types */}
              {Array.isArray(entry.types) && entry.types[0] && (
                <Badge variant={entry.types[0].toLowerCase() || 'any'}>{entry.types}</Badge>
              )}
              {Array.isArray(entry.types) &&
                entry.types[1] &&
                entry.types[1] !== entry.types[0] && (
                  <Badge variant={entry.types[1].toLowerCase() || 'any'}>{entry.types[1]}</Badge>
                )}
              {/* Fallback to matched types if entry.types are missing */}
              {!entry.types[0] && matched.types[0] && (
                <Badge variant={matched.types[0].toLowerCase() || 'any'}>{matched.types[0]}</Badge>
              )}
              {!entry.types[1] && matched.types[1] && matched.types[1] !== matched.types[0] && (
                <Badge variant={matched.types[1].toLowerCase() || 'any'}>{matched.types[1]}</Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`ability-${index}`}>Ability</Label>
          <Select
            disabled={!isPokemonSelected}
            value={entry.ability}
            onValueChange={(value) => onChange({ ability: value })}
          >
            <SelectTrigger className="w-full" id={`ability-${index}`}>
              <SelectValue
                placeholder={isPokemonSelected ? 'Select an ability' : 'Select Pokémon first'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Ability</SelectLabel>
                {abilityOptions.map((a: string, idx: number) => (
                  <SelectItem key={`ability-${idx}-${a}`} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Moves</Label>
          <div className="grid gap-2">
            {entry.moves.map((mv, i) => (
              <div key={i} className="flex gap-3">
                <Select
                  disabled={!isPokemonSelected}
                  value={mv.name}
                  onValueChange={(value) => {
                    const selectedMove = availableMoves.find(
                      (m: { name: string; type: string; category: string }) => m.name === value,
                    );
                    setMove(i, {
                      name: value,
                      type: selectedMove?.type || null,
                    });
                  }}
                >
                  <SelectTrigger className="w-full" id={`ability-${index}`}>
                    <SelectValue
                      placeholder={isPokemonSelected ? `Move ${i + 1}` : 'Select Pokémon first'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Group moves by category */}
                    {['Level-up', 'Egg Move', 'TM/HM'].map((category) => {
                      const movesInCategory = availableMoves.filter((m) => m.category === category);
                      if (movesInCategory.length === 0) return null;

                      return (
                        <SelectGroup key={category}>
                          <SelectLabel>{category}</SelectLabel>
                          {movesInCategory.map((move, idx) => (
                            <SelectItem
                              key={`move-${category}-${idx}-${move.name}`}
                              value={move.name}
                              className="flex justify-between"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{move.name}</span>
                                <Badge variant={move.type?.toLowerCase() || 'any'} className="ml-2">
                                  {move.type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
