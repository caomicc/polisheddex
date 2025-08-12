'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
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
import {
  POKEMON_LIST,
  emptyPokemonEntry,
  normalizeTypeName,
  type PokemonBasic,
} from '@/lib/pokemon-data';
import { Ability, BaseData, PokemonType } from '@/types/types';
import { Badge } from './ui/badge';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonSprite } from './pokemon/pokemon-sprite';

export type MoveEntry = {
  name: string;
  type: string | null;
};

export type MoveData = {
  name: string;
  description?: string;
  type?: string;
  updated?: {
    type: string;
    category: string;
    power: number;
    accuracy: number;
    pp: number;
  };
  tm?: {
    number: string;
    location?: {
      area: string;
    };
  };
  [key: string]: unknown;
};

export type PokemonEntry = {
  name: string;
  types: PokemonType['name'][]; // [type1, type2]
  ability: string;
  moves: MoveEntry[]; // 4 moves
};

export type PokemonSlotProps = {
  index: number;
  entry: PokemonEntry;
  onChange: (data: Partial<PokemonEntry>) => void;
};

export default function PokemonSlot({ index, entry, onChange }: PokemonSlotProps) {
  const [pokemonData, setPokemonData] = useState<BaseData | null>(null);
  const [movesData, setMovesData] = useState<Record<string, MoveData> | null>(null);
  const { showFaithful } = useFaithfulPreference();
  const previousTypesRef = useRef<string | null>(null);

  const matched: PokemonBasic | undefined = useMemo(
    () => POKEMON_LIST.find((p) => p.name.toLowerCase() === (entry.name || '').toLowerCase()),
    [entry.name],
  );

  // Load moves data once for type lookups
  useEffect(() => {
    const loadMoves = async () => {
      try {
        const response = await fetch('/output/manifests/moves.json');
        if (response.ok) {
          const data = await response.json();
          setMovesData(data);
        }
      } catch (error) {
        console.error('Failed to load moves data:', error);
      }
    };

    loadMoves();
  }, []); // Load once on mount

  // Load detailed Pokemon data when a Pokemon is selected
  useEffect(() => {
    if (matched?.name) {
      // Use fileName if available, otherwise fall back to name transformation
      const fileName = matched.fileName
        ? matched.fileName.replace('.json', '')
        : matched.name.toLowerCase().replace(/[ -]/g, '-');
      console.log('Loading Pokemon data for:', fileName, 'from matched:', matched);

      fetch(`/output/pokemon/${fileName}.json`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          return res.json();
        })
        .then((data) => {
          setPokemonData(data);
        })
        .catch((err) => {
          console.error('Failed to load Pokemon data:', err);
          setPokemonData(null);
        });
    } else {
      setPokemonData(null);
    }
  }, [matched, showFaithful]);

  // Update types when detailed data loads or faithful preference changes
  useEffect(() => {
    if (pokemonData && matched?.name) {
      // Get types from individual data, checking for forms structure
      const formData = pokemonData.forms?.plain || pokemonData;

      // For plain forms, prefer base data if form data is empty
      let correctTypes = showFaithful
        ? formData.faithfulTypes || formData.types || []
        : formData.updatedTypes || formData.types || [];

      // console.log('Initial correctTypes from form:', correctTypes);
      // console.log(
      //   'Is array?',
      //   Array.isArray(correctTypes),
      //   'Length:',
      //   Array.isArray(correctTypes) ? correctTypes.length : 'N/A',
      // );
      // console.log('Has pokemonData.forms?.plain?', !!pokemonData.forms?.plain);

      // If form data has empty types but base data has types, use base data
      const isEmpty =
        !correctTypes ||
        (Array.isArray(correctTypes) && correctTypes.length === 0) ||
        (typeof correctTypes === 'string' && !correctTypes.trim());

      if (isEmpty && pokemonData.forms?.plain) {
        // console.log('Form data is empty, trying base data...');
        const detailedStats = pokemonData.detailedStats || {};
        const baseTypes = showFaithful
          ? (detailedStats as Record<string, unknown>)['faithfulTypes'] ||
            (detailedStats as Record<string, unknown>)['types']
          : (detailedStats as Record<string, unknown>)['updatedTypes'] ||
            (detailedStats as Record<string, unknown>)['types'];

        if (baseTypes) {
          correctTypes = baseTypes as string | string[];
        }
        // console.log('Fallback correctTypes from base:', correctTypes);
      }

      // console.log('Type update effect - Pokemon:', matched.name);
      // console.log('Form data:', formData);
      // console.log(
      //   'Base data types:',
      //   pokemonData.types,
      //   pokemonData.updatedTypes,
      //   pokemonData.faithfulTypes,
      // );
      // console.log('Detailed stats types:', pokemonData.detailedStats);
      // console.log('Correct types found:', correctTypes);
      // console.log('Show faithful:', showFaithful);

      // Always ensure types is [type1, type2] with nulls if missing, and normalize them
      const newTypes = Array.isArray(correctTypes)
        ? [
            correctTypes[0] ? normalizeTypeName(correctTypes[0]) : null,
            correctTypes[1] ? normalizeTypeName(correctTypes[1]) : null,
          ]
        : typeof correctTypes === 'string'
          ? [normalizeTypeName(correctTypes), null]
          : [null, null];

      // console.log('New types processed:', newTypes);

      // Normalize current types for comparison
      const normalizedCurrentTypes = [
        entry.types[0] ? normalizeTypeName(entry.types[0]) : null,
        entry.types[1] ? normalizeTypeName(entry.types[1]) : null,
      ];

      // Create a string representation for comparison
      const newTypesString = JSON.stringify(newTypes);
      const currentTypesString = JSON.stringify(normalizedCurrentTypes);

      console.log('Types comparison - current:', currentTypesString, 'new:', newTypesString);
      console.log('Previous ref:', previousTypesRef.current);

      // Only update if we found valid types AND they're different from current
      if (newTypesString !== currentTypesString && previousTypesRef.current !== newTypesString) {
        // Only update if we actually have valid types, don't clear existing ones
        const validTypes = newTypes.filter(
          (t): t is PokemonType['name'] =>
            typeof t === 'string' &&
            [
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
            ].includes(t),
        );

        // Only update if we have valid types or if current types are empty
        if (validTypes.length > 0 || entry.types.length === 0) {
          previousTypesRef.current = newTypesString;
          console.log('Setting valid types:', validTypes);
          onChange({ types: validTypes });
        } else {
          console.log('Skipping type update - would clear valid types with empty types');
        }
      } else {
        console.log('Skipping type update - no change or already set');
      }
    }
  }, [pokemonData, showFaithful, matched?.name, entry.types, onChange]);

  const abilityOptions = useMemo(() => {
    // Use individual Pokemon data if available, fall back to matched data
    const sourceData = pokemonData || matched;
    if (!sourceData) return [];

    // Check for forms structure (individual files) or direct structure (manifest)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formData: any = pokemonData?.forms?.plain || sourceData;

    // Use faithful or polished abilities based on context
    const abilities: Ability[] = showFaithful
      ? formData.detailedStats?.faithfulAbilities || formData.abilities || []
      : formData.detailedStats?.updatedAbilities || formData.abilities || [];

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
  }, [pokemonData, matched, showFaithful]);

  const availableMoves = useMemo(() => {
    // Use individual Pokemon data if available
    const sourceData = pokemonData;
    if (!sourceData && !matched) return [];

    if (!sourceData) {
      // Fallback: use basic data from POKEMON_LIST (no comprehensive moves)
      return [];
    }

    // Check for forms structure (individual files) - moves are in the forms.plain
    const formData = sourceData.forms?.plain || sourceData;

    // console.log('Form data for moves:', formData);

    // Get moves based on faithful/polished preference
    const levelUpMoves = showFaithful
      ? formData.faithfulMoves || formData.moves || []
      : formData.updatedMoves || formData.moves || [];

    // Get egg moves and TM/HM moves (these don't have faithful versions)
    const eggMoves = formData.eggMoves || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tmHmMoves = (formData as any).tmHmMoves || [];

    // Helper function to get move type from moves data
    const getMoveType = (moveName: string): string => {
      if (!movesData || !moveName) return 'Normal';

      // Convert move name to a key format (lowercase, replace spaces/special chars with hyphens)
      const moveKey = moveName.toLowerCase().replace(/[ '-.]/g, '-');

      // Try different key variations to find the move
      const moveInfo =
        movesData[moveKey] ||
        movesData[moveName.toLowerCase()] ||
        movesData[moveName.replace(/\s+/g, '-').toLowerCase()] ||
        movesData[moveName];

      // Extract type from the updated field, fall back to base type
      const moveType = moveInfo?.updated?.type || moveInfo?.type || 'Normal';

      // Debug logging for egg moves
      if (moveInfo) {
        console.log(`Found move ${moveName} (key: ${moveKey}) -> type: ${moveType}`);
      } else {
        console.log(`Move not found: ${moveName} (tried key: ${moveKey})`);
      }

      return moveType;
    };

    // Combine all moves
    const allMoves = [
      ...levelUpMoves.map((move) => ({ ...move, category: 'Level-up' })),
      ...eggMoves.map((move) => ({
        name: typeof move === 'string' ? move : move.name || 'Unknown Move',
        type: getMoveType(typeof move === 'string' ? move : move.name || 'Unknown Move'),
        category: 'Egg Move',
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...tmHmMoves.map((move: any) => ({ ...move, category: 'TM/HM' })),
    ];

    return (
      allMoves
        .map((move) => ({
          name: String(move.name || 'Unknown Move'),
          type: String(move.info?.type || move.type || 'Normal'),
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
  }, [pokemonData, matched, showFaithful, movesData]);

  console.log('Available moves:', availableMoves);

  const isPokemonSelected = Boolean(matched);

  const setMove = (i: number, move: Partial<MoveEntry>) => {
    const copy = [...entry.moves];
    copy[i] = { ...copy[i], ...move };
    onChange({ moves: copy });
  };

  const autofillFromPokemon = (pokemonName: string) => {
    console.log('autofillFromPokemon called with:', pokemonName);
    const found = POKEMON_LIST.find((p) => p.name === pokemonName);
    if (!found) {
      console.log('Pokemon not found in POKEMON_LIST, setting name only');
      onChange({ name: pokemonName });
      return;
    }

    console.log('Found Pokemon in POKEMON_LIST:', found);
    console.log('Found types:', found.types);

    // Use basic types as default - types will be updated when detailed data loads
    const validTypes = [found.types[0], found.types[1]].filter(
      (t): t is PokemonType['name'] =>
        typeof t === 'string' &&
        [
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
        ].includes(t),
    );

    console.log('Setting autofill types:', validTypes);
    // Reset the ref when manually selecting a Pokemon
    previousTypesRef.current = null;

    onChange({
      name: found.name,
      types: validTypes,
    });
  };

  const clearSlot = () => {
    onChange({ ...emptyPokemonEntry });
  };

  return (
    <Card className="py-4">
      <CardHeader className="flex flex-row items-center gap-3 justify-start space-y-0 px-4 relative">
        <PokemonSprite
          primaryType={entry.types[0] || 'normal'}
          pokemonName={entry.name || 'egg'}
          size={'sm'}
        />
        <CardTitle>{entry.name ? entry.name : 'Add a Pokemon...'}</CardTitle>
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
          <div className="flex items-center gap-2">
            {Array.isArray(entry.types) && entry.types[0] && (
              <Badge variant={entry.types[0].toLowerCase() || 'any'}>{entry.types[0]}</Badge>
            )}
            {Array.isArray(entry.types) && entry.types[1] && entry.types[1] !== entry.types[0] && (
              <Badge variant={entry.types[1].toLowerCase() || 'any'}>{entry.types[1]}</Badge>
            )}
          </div>
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
                      // console.log('Moves in category', category, movesInCategory);
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
