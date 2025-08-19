'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { CardTitle } from '@/components/ui/card';
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
import { BentoGridNoLink } from './ui/bento-box';

export type MoveEntry = {
  name: string;
  type: string | null;
  category?: string;
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

export type Nature =
  | 'Hardy'
  | 'Lonely'
  | 'Brave'
  | 'Adamant'
  | 'Naughty'
  | 'Bold'
  | 'Docile'
  | 'Relaxed'
  | 'Impish'
  | 'Lax'
  | 'Timid'
  | 'Hasty'
  | 'Serious'
  | 'Jolly'
  | 'Naive'
  | 'Modest'
  | 'Mild'
  | 'Quiet'
  | 'Bashful'
  | 'Rash'
  | 'Calm'
  | 'Gentle'
  | 'Sassy'
  | 'Careful'
  | 'Quirky';

export type PokemonEntry = {
  name: string;
  types: PokemonType['name'][]; // [type1, type2]
  ability: string;
  nature?: Nature;
  item?: string;
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
  const [itemsData, setItemsData] = useState<Record<
    string,
    { name: string; description: string; attributes?: { category: string } }
  > | null>(null);
  const [evolutionChainMoves, setEvolutionChainMoves] = useState<MoveEntry[]>([]);
  const { showFaithful } = useFaithfulPreference();
  const previousTypesRef = useRef<string | null>(null);

  const matched: PokemonBasic | undefined = useMemo(
    () => POKEMON_LIST.find((p) => p.name.toLowerCase() === (entry.name || '').toLowerCase()),
    [entry.name],
  );

  // Load moves and items data in parallel, only once
  useEffect(() => {
    const loadData = async () => {
      try {
        const [movesResponse, itemsResponse] = await Promise.all([
          fetch('/output/manifests/moves.json'),
          fetch('/output/manifests/items.json'),
        ]);

        if (movesResponse.ok) {
          const movesData = await movesResponse.json();
          setMovesData(movesData);
        }

        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItemsData(itemsData);
        }
      } catch (error) {
        console.error('Failed to load moves/items data:', error);
      }
    };

    loadData();
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
      // Determine which form to use - if matched has a formName, use that form, otherwise use plain
      const formToUse = matched.formName || 'plain';
      const formData = pokemonData.forms?.[formToUse] || pokemonData.forms?.plain || pokemonData;

      console.log('Using form:', formToUse, 'for Pokemon:', matched.name);
      console.log('Form data available:', Object.keys(pokemonData.forms || {}));

      // For plain forms, prefer base data if form data is empty
      let correctTypes = showFaithful
        ? formData.faithfulTypes || formData.types || []
        : formData.updatedTypes || formData.types || [];

      // If form data has empty types but base data has types, use base data (only for plain form)
      const isEmpty =
        !correctTypes ||
        (Array.isArray(correctTypes) && correctTypes.length === 0) ||
        (typeof correctTypes === 'string' && !correctTypes.trim());

      if (isEmpty && formToUse === 'plain' && pokemonData.forms?.plain) {
        console.log('Plain form data is empty, trying base data...');
        const detailedStats = pokemonData.detailedStats || {};
        const baseTypes = showFaithful
          ? (detailedStats as Record<string, unknown>)['faithfulTypes'] ||
            (detailedStats as Record<string, unknown>)['types']
          : (detailedStats as Record<string, unknown>)['updatedTypes'] ||
            (detailedStats as Record<string, unknown>)['types'];

        if (baseTypes) {
          correctTypes = baseTypes as string | string[];
        }
        console.log('Fallback correctTypes from base:', correctTypes);
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
  }, [pokemonData, showFaithful, matched?.name, matched?.formName, entry.types, onChange]);

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

  // Load evolution chain moves when Pokemon data changes
  useEffect(() => {
    const loadEvolutionChainMoves = async () => {
      if (!entry.name) {
        setEvolutionChainMoves([]);
        return;
      }

      // Try to get evolution chain from pokemonData first, then try hardcoded chains
      let evolutionChain: string[] | undefined;

      if (pokemonData?.evolution) {
        const evolution = pokemonData.evolution as { chain?: string[] };
        evolutionChain = evolution.chain;
      }

      // Fallback: hardcoded known evolution chains for testing
      if (!evolutionChain) {
        const knownChains: Record<string, string[]> = {
          Charmeleon: ['Charmander', 'Charmeleon', 'Charizard'],
          Charizard: ['Charmander', 'Charmeleon', 'Charizard'],
          Ivysaur: ['Bulbasaur', 'Ivysaur', 'Venusaur'],
          Venusaur: ['Bulbasaur', 'Ivysaur', 'Venusaur'],
          Wartortle: ['Squirtle', 'Wartortle', 'Blastoise'],
          Blastoise: ['Squirtle', 'Wartortle', 'Blastoise'],
        };
        evolutionChain = knownChains[entry.name];
      }

      if (!evolutionChain || evolutionChain.length === 0) {
        setEvolutionChainMoves([]);
        return;
      }

      const evolutionChainMoves: MoveEntry[] = [];
      const currentPokemonIndex = evolutionChain.indexOf(entry.name);

      if (currentPokemonIndex <= 0) {
        setEvolutionChainMoves([]);
        return;
      }

      // Load moves from all previous evolution stages
      for (let i = 0; i < currentPokemonIndex; i++) {
        const prevEvolutionName = evolutionChain[i];

        try {
          const fileName = prevEvolutionName.toLowerCase().replace(/[ -]/g, '-');
          const response = await fetch(`/output/pokemon/${fileName}.json`);
          if (response.ok) {
            const prevPokemonData = await response.json();
            const formData = prevPokemonData.forms?.plain || prevPokemonData;

            const prevMoves = showFaithful
              ? formData.faithfulMoves || formData.moves || []
              : formData.updatedMoves || formData.moves || [];

            prevMoves.forEach((move: { name: string; info?: { type: string } }) => {
              if (!evolutionChainMoves.some((existing) => existing.name === move.name)) {
                evolutionChainMoves.push({
                  name: move.name,
                  type: move.info?.type || 'Normal',
                  category: `Previous Evolution (${prevEvolutionName})`,
                });
              }
            });
          }
        } catch (error) {
          console.error(`Failed to load moves for ${prevEvolutionName}:`, error);
        }
      }

      setEvolutionChainMoves(evolutionChainMoves);
    };

    loadEvolutionChainMoves();
  }, [pokemonData, entry.name, showFaithful]);

  const availableItems = useMemo(() => {
    if (!itemsData) return [];

    // Filter items that are commonly used as held items
    // Exclude things like Poké Balls, Medicine, and Key Items
    const heldItemCategories = ['Item', 'Berry'];
    const excludePatterns = [
      /ball$/i,
      /potion$/i,
      /heal$/i,
      /revive$/i,
      /antidote$/i,
      /paralyze$/i,
      /burn$/i,
      /awakening$/i,
      /ice$/i,
      /repel$/i,
      /escape$/i,
      /card$/i,
      /mail$/i,
      /case$/i,
      /rod$/i,
      /ticket$/i,
      /pass$/i,
      /voucher$/i,
      /coupon$/i,
    ];

    return Object.entries(itemsData)
      .filter(([, item]) => {
        // Include items in held item categories
        if (!item.attributes?.category || !heldItemCategories.includes(item.attributes.category))
          return false;

        // Exclude items that match exclude patterns
        const itemName = item.name.toLowerCase();
        return !excludePatterns.some((pattern) => pattern.test(itemName));
      })
      .map(([itemKey, item]) => ({
        id: itemKey,
        name: item.name,
        description: item.description,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [itemsData]);

  const availableMoves = useMemo(() => {
    // Use individual Pokemon data if available
    const sourceData = pokemonData;
    if (!sourceData && !matched) return [];

    if (!sourceData) {
      // Fallback: use basic data from POKEMON_LIST (no comprehensive moves)
      return [];
    }

    // Check for forms structure (individual files) - use the specific form if available
    const formToUse = matched?.formName || 'plain';
    const formData = sourceData.forms?.[formToUse] || sourceData.forms?.plain || sourceData;

    console.log('Loading moves for form:', formToUse);

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
      ...evolutionChainMoves,
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
            const order = ['Level-up', 'Egg Move', 'TM/HM', 'Previous Evolution'];
            if (a.category?.startsWith('Previous Evolution')) {
              return b.category?.startsWith('Previous Evolution')
                ? a.category.localeCompare(b.category)
                : 1;
            }
            if (b.category?.startsWith('Previous Evolution')) {
              return -1;
            }
            return order.indexOf(a.category || '') - order.indexOf(b.category || '');
          }
          return a.name.localeCompare(b.name);
        })
    );
  }, [pokemonData, matched, showFaithful, movesData, evolutionChainMoves]);

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
    <BentoGridNoLink>
      <div className="flex flex-row gap-4 relative">
        <PokemonSprite
          // size="sm"
          className="shadow-none"
          primaryType={entry.types[0] || 'normal'}
          pokemonName={
            matched?.fileName
              ? matched.fileName.replace('.json', '')
              : (entry.name || 'egg')
                  .toLowerCase()
                  .replace(/\s*\([^)]*\).*/, '')
                  .replace(/\s+/g, '-')
          }
          // size={'sm'}
          form={matched?.formName} // Pass the form name for sprites
        />
        <div className="flex gap-2 flex-col">
          <p className="font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
            {entry.name ? entry.name : 'Add a Pokemon...'}
          </p>
          <div className="flex items-center gap-2">
            {Array.isArray(entry.types) && entry.types[0] && (
              <Badge variant={entry.types[0].toLowerCase() || 'any'}>{entry.types[0]}</Badge>
            )}
            {Array.isArray(entry.types) && entry.types[1] && entry.types[1] !== entry.types[0] && (
              <Badge variant={entry.types[1].toLowerCase() || 'any'}>{entry.types[1]}</Badge>
            )}
          </div>
        </div>
        {entry.name ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSlot}
            aria-label={`Clear slot ${index + 1}`}
            className="absolute -right-2 -top-2"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <></>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`name-${index}`} className="label-text">
          Pokémon
        </Label>

        <Select value={entry.name} onValueChange={(value) => autofillFromPokemon(value)}>
          <SelectTrigger className="w-full" id={`name-${index}`}>
            <SelectValue placeholder={'Select a Pokemon'} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`ability-${index}`} className="label-text">
          Ability
        </Label>
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
          <SelectContent className="max-h-[300px]">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor={`nature-${index}`} className="label-text">
          Nature
        </Label>
        <Select
          disabled={!isPokemonSelected}
          value={entry.nature || ''}
          onValueChange={(value) => onChange({ nature: value as Nature })}
        >
          <SelectTrigger className="w-full" id={`nature-${index}`}>
            <SelectValue
              placeholder={isPokemonSelected ? 'Select a nature' : 'Select Pokémon first'}
            />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectGroup>
              <SelectLabel>Nature</SelectLabel>
              {(
                [
                  'Hardy',
                  'Lonely',
                  'Brave',
                  'Adamant',
                  'Naughty',
                  'Bold',
                  'Docile',
                  'Relaxed',
                  'Impish',
                  'Lax',
                  'Timid',
                  'Hasty',
                  'Serious',
                  'Jolly',
                  'Naive',
                  'Modest',
                  'Mild',
                  'Quiet',
                  'Bashful',
                  'Rash',
                  'Calm',
                  'Gentle',
                  'Sassy',
                  'Careful',
                  'Quirky',
                ] as Nature[]
              ).map((nature) => (
                <SelectItem key={`nature-${nature}`} value={nature}>
                  {nature}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`item-${index}`} className="label-text">
          Held Item
        </Label>
        <Select
          disabled={!isPokemonSelected}
          value={entry.item || 'none'}
          onValueChange={(value) => onChange({ item: value === 'none' ? undefined : value })}
        >
          <SelectTrigger className="w-full" id={`item-${index}`}>
            <SelectValue
              placeholder={isPokemonSelected ? 'Select an item' : 'Select Pokémon first'}
            />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectGroup>
              <SelectLabel>Held Items</SelectLabel>
              <SelectItem value="none">None</SelectItem>
              {availableItems.map((item) => (
                <SelectItem key={`item-${item.id}`} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="label-text">Moves</Label>
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
                <SelectContent className="max-h-[300px]">
                  {/* Group moves by category */}
                  {(() => {
                    const categories = ['Level-up', 'Egg Move', 'TM/HM'];
                    const evolutionCategories = [
                      ...new Set(
                        availableMoves
                          .filter((m) => m.category?.startsWith('Previous Evolution'))
                          .map((m) => m.category!),
                      ),
                    ];

                    return [...categories, ...evolutionCategories].map((category) => {
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
                    });
                  })()}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </BentoGridNoLink>
  );
}
