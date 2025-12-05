'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
// import {
//   POKEMON_LIST,
//   emptyPokemonEntry,
//   normalizeTypeName,
//   type PokemonBasic,
// } from '@/lib/pokemon-data';
// import { Ability, BaseData, PokemonType } from '@/types/types';
import { Badge } from './ui/badge';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { PokemonSprite } from './pokemon/pokemon-sprite';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Slider } from './ui/slider';
import StatHexagon, { type StatData } from './pokemon/stat-hexagon';
// import { getItemSpriteName } from '@/utils/itemUtils';

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
  faithful?: {
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

export interface NatureData {
  name: Nature;
  increased?: 'attack' | 'defense' | 'spatk' | 'spdef' | 'speed';
  decreased?: 'attack' | 'defense' | 'spatk' | 'spdef' | 'speed';
}

export const NATURE_DATA: Record<Nature, NatureData> = {
  Hardy: { name: 'Hardy' }, // Neutral
  Lonely: { name: 'Lonely', increased: 'attack', decreased: 'defense' },
  Brave: { name: 'Brave', increased: 'attack', decreased: 'speed' },
  Adamant: { name: 'Adamant', increased: 'attack', decreased: 'spatk' },
  Naughty: { name: 'Naughty', increased: 'attack', decreased: 'spdef' },
  Bold: { name: 'Bold', increased: 'defense', decreased: 'attack' },
  Docile: { name: 'Docile' }, // Neutral
  Relaxed: { name: 'Relaxed', increased: 'defense', decreased: 'speed' },
  Impish: { name: 'Impish', increased: 'defense', decreased: 'spatk' },
  Lax: { name: 'Lax', increased: 'defense', decreased: 'spdef' },
  Timid: { name: 'Timid', increased: 'speed', decreased: 'attack' },
  Hasty: { name: 'Hasty', increased: 'speed', decreased: 'defense' },
  Serious: { name: 'Serious' }, // Neutral
  Jolly: { name: 'Jolly', increased: 'speed', decreased: 'spatk' },
  Naive: { name: 'Naive', increased: 'speed', decreased: 'spdef' },
  Modest: { name: 'Modest', increased: 'spatk', decreased: 'attack' },
  Mild: { name: 'Mild', increased: 'spatk', decreased: 'defense' },
  Quiet: { name: 'Quiet', increased: 'spatk', decreased: 'speed' },
  Bashful: { name: 'Bashful' }, // Neutral
  Rash: { name: 'Rash', increased: 'spatk', decreased: 'spdef' },
  Calm: { name: 'Calm', increased: 'spdef', decreased: 'attack' },
  Gentle: { name: 'Gentle', increased: 'spdef', decreased: 'defense' },
  Sassy: { name: 'Sassy', increased: 'spdef', decreased: 'speed' },
  Careful: { name: 'Careful', increased: 'spdef', decreased: 'spatk' },
  Quirky: { name: 'Quirky' }, // Neutral
};

export const getNatureModifiers = (nature: Nature | undefined) => {
  if (!nature) return { attack: 1, defense: 1, spatk: 1, spdef: 1, speed: 1 };

  const natureData = NATURE_DATA[nature];
  const modifiers = { attack: 1, defense: 1, spatk: 1, spdef: 1, speed: 1 };

  if (natureData.increased) {
    modifiers[natureData.increased] = 1.1;
  }
  if (natureData.decreased) {
    modifiers[natureData.decreased] = 0.9;
  }

  return modifiers;
};

export const getNatureDescription = (nature: Nature): string => {
  const natureData = NATURE_DATA[nature];

  if (!natureData.increased || !natureData.decreased) {
    return 'No stat changes (neutral nature)';
  }

  const statNames = {
    attack: 'Attack',
    defense: 'Defense',
    spatk: 'Sp. Attack',
    spdef: 'Sp. Defense',
    speed: 'Speed',
  };

  return `+${statNames[natureData.increased]}, -${statNames[natureData.decreased]}`;
};

export type StatType = 'hp' | 'attack' | 'defense' | 'spatk' | 'spdef' | 'speed';

export type IVs = {
  hp: number;
  attack: number;
  defense: number;
  spatk: number;
  spdef: number;
  speed: number;
};

export type EVs = {
  hp: number;
  attack: number;
  defense: number;
  spatk: number;
  spdef: number;
  speed: number;
};

// Pokemon stat constants
export const STAT_NAMES: Record<StatType, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  spatk: 'SpA',
  spdef: 'SpD',
  speed: 'Spe',
};

export const MAX_EV_TOTAL = 508;
export const MAX_EV_PER_STAT = 252;
export const MAX_IV = 31;

export type PokemonEntry = {
  name: string;
  types: any;
  ability: string;
  nature?: Nature;
  item?: string;
  moves: MoveEntry[]; // 4 moves
  ivs?: IVs;
  evs?: EVs;
  level?: number;
};

export type PokemonSlotProps = {
  index: number;
  entry: PokemonEntry;
  onChange: (data: Partial<PokemonEntry>) => void;
};

export default function PokemonSlot({ index, entry, onChange }: PokemonSlotProps) {
  const [pokemonData, setPokemonData] = useState<any | null>(null);
  const [movesData, setMovesData] = useState<Record<string, MoveData> | null>(null);
  const [itemsData, setItemsData] = useState<Record<
    string,
    { name: string; description: string; attributes?: { category: string } }
  > | null>(null);
  const [abilitiesData, setAbilitiesData] = useState<Record<
    string,
    { name: string; description: string }
  > | null>(null);
  const [evolutionChainMoves, setEvolutionChainMoves] = useState<MoveEntry[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [pokemonSearchQuery, setPokemonSearchQuery] = useState('');
  const [abilityModalOpen, setAbilityModalOpen] = useState(false);
  const [abilitySearchQuery, setAbilitySearchQuery] = useState('');
  const [natureModalOpen, setNatureModalOpen] = useState(false);
  const [natureSearchQuery, setNatureSearchQuery] = useState('');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [moveModalOpen, setMoveModalOpen] = useState(false); // Single modal for all moves
  const [moveSearchQuery, setMoveSearchQuery] = useState('');
  const [selectedMoveSlot, setSelectedMoveSlot] = useState<number | null>(null); // Track which slot we're editing
  const [selectedLevel, setSelectedLevel] = useState(entry.level || 50); // Use saved level or default to 50
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abilitySearchInputRef = useRef<HTMLInputElement>(null);
  const natureSearchInputRef = useRef<HTMLInputElement>(null);
  const itemSearchInputRef = useRef<HTMLInputElement>(null);
  const moveSearchInputRef = useRef<HTMLInputElement>(null);
  const { showFaithful } = useFaithfulPreferenceSafe();
  const previousTypesRef = useRef<string | null>(null);
  const previousFaithfulRef = useRef<boolean | null>(null);

  // Memoize nature modifiers to ensure reactivity
  const natureModifiers = useMemo(() => getNatureModifiers(entry.nature), [entry.nature]);

  // Helper function to get move stats
  const getMoveStats = useCallback(
    (moveName: string) => {
      if (!movesData || !moveName) return null;
      const moveKey = moveName.toLowerCase().replace(/[ '-.]/g, '-');
      const moveInfo =
        movesData[moveKey] ||
        movesData[moveName.toLowerCase()] ||
        movesData[moveName.replace(/\s+/g, '-').toLowerCase()] ||
        movesData[moveName];

      const stats = showFaithful ? moveInfo?.faithful : moveInfo?.updated;
      return stats
        ? {
            power: stats.power,
            accuracy: stats.accuracy,
            pp: stats.pp,
            category: stats.category,
          }
        : null;
    },
    [movesData, showFaithful],
  );

  // const matched: PokemonBasic | undefined = useMemo(
  //   () => POKEMON_LIST.find((p) => p.name.toLowerCase() === (entry.name || '').toLowerCase()),
  //   [entry.name],
  // );

  // Filter Pokemon based on search query
  // const filteredPokemonList = useMemo(() => {
  //   if (!pokemonSearchQuery.trim()) return POKEMON_LIST;

  //   const query = pokemonSearchQuery.toLowerCase();
  //   return POKEMON_LIST.filter(
  //     (pokemon) =>
  //       pokemon.name.toLowerCase().includes(query) ||
  //       pokemon.types.some((type) => type?.toLowerCase().includes(query)),
  //   );
  // }, [pokemonSearchQuery]);

  // Helper function to get ability description
  const getAbilityDescription = useCallback(
    (abilityName: string): string => {
      if (!abilitiesData) return '';

      // Convert ability name to kebab-case to match the abilities data keys
      const abilityKey = abilityName.toLowerCase().replace(/\s+/g, '-').replace(/[.']/g, '');

      return abilitiesData[abilityKey]?.description || '';
    },
    [abilitiesData],
  );

  // Filter abilities based on search query
  const filteredAbilityOptions = useMemo(() => {
    // Use individual Pokemon data if available, fall back to matched data
    // const sourceData = pokemonData || matched;
    const sourceData = pokemonData;
    if (!sourceData) return [];

    // Check for forms structure (individual files) or direct structure (manifest)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formData: any = pokemonData?.forms?.plain || sourceData;

    // Use faithful or polished abilities based on context
    const abilities = showFaithful
      ? formData.detailedStats?.faithfulAbilities || formData.abilities || []
      : formData.detailedStats?.updatedAbilities || formData.updatedAbilities || [];

    const abilityList = abilities
      .map((ability: any) => {
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

    if (!abilitySearchQuery.trim()) return abilityList;

    const query = abilitySearchQuery.toLowerCase();
    return abilityList.filter(
      (ability: any) =>
        ability.toLowerCase().includes(query) ||
        getAbilityDescription(ability).toLowerCase().includes(query),
    );
  }, [pokemonData, showFaithful, abilitySearchQuery, getAbilityDescription]);

  // Filter natures based on search query
  const filteredNatureOptions = useMemo(() => {
    const natures = [
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
    ] as Nature[];

    if (!natureSearchQuery.trim()) return natures;

    const query = natureSearchQuery.toLowerCase();
    return natures.filter((nature) => nature.toLowerCase().includes(query));
  }, [natureSearchQuery]);

  // Filter items based on search query
  const filteredItemOptions = useMemo(() => {
    if (!itemsData) return [];

    // Filter items that are commonly used as held items
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

    const itemList = Object.entries(itemsData)
      .filter(([, item]) => {
        if (!item.attributes?.category || !heldItemCategories.includes(item.attributes.category))
          return false;
        const itemName = item.name.toLowerCase();
        return !excludePatterns.some((pattern) => pattern.test(itemName));
      })
      .map(([itemKey, item]) => ({
        id: itemKey,
        name: item.name,
        description: item.description,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!itemSearchQuery.trim()) return itemList;

    const query = itemSearchQuery.toLowerCase();
    return itemList.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
    );
  }, [itemsData, itemSearchQuery]);

  // Filter moves based on search query
  const filteredMoveOptions = useMemo(() => {
    // Use individual Pokemon data if available
    const sourceData = pokemonData;
    // if (!sourceData && !matched) return [];
    if (!sourceData) return [];

    if (!sourceData) {
      return [];
    }

    // Check for forms structure (individual files) - use the specific form if available
    // const formToUse = matched?.formName || 'plain';

    const formToUse = 'plain';
    const formData = sourceData.forms?.[formToUse] || sourceData.forms?.plain || sourceData;

    // Get moves based on faithful/polished preference
    const levelUpMoves = showFaithful
      ? formData.faithfulMoves || formData.moves || []
      : formData.updatedMoves || formData.moves || [];

    // Get egg moves and TM/HM moves
    const eggMoves = formData.eggMoves || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tmHmMoves = (formData as any).tmHmMoves || [];

    // Helper function to get move type from moves data
    const getMoveType = (moveName: string): string => {
      if (!movesData || !moveName) return 'Normal';
      const moveKey = moveName.toLowerCase().replace(/[ '-.]/g, '-');
      const moveInfo =
        movesData[moveKey] ||
        movesData[moveName.toLowerCase()] ||
        movesData[moveName.replace(/\s+/g, '-').toLowerCase()] ||
        movesData[moveName];
      return moveInfo?.updated?.type || moveInfo?.type || 'Normal';
    };

    // Combine all moves
    const allMoves = [
      ...levelUpMoves.map((move: any) => ({ ...move, category: 'Level-up' })),
      ...eggMoves.map((move: any) => ({
        name: typeof move === 'string' ? move : move.name || 'Unknown Move',
        type: getMoveType(typeof move === 'string' ? move : move.name || 'Unknown Move'),
        category: 'Egg Move',
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...tmHmMoves.map((move: any) => ({ ...move, category: 'TM/HM' })),
      ...evolutionChainMoves,
    ];

    const moveList = allMoves
      .map((move) => ({
        name: String(move.name || 'Unknown Move'),
        type: String(move.info?.type || move.type || 'Normal'),
        category: move.category || 'Level-up',
      }))
      .filter((move) => move.name && move.name !== 'Unknown Move')
      .filter((move, index, self) => index === self.findIndex((m) => m.name === move.name))
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
      });

    if (!moveSearchQuery.trim()) return moveList;

    const query = moveSearchQuery.toLowerCase();
    return moveList.filter(
      (move) =>
        move.name.toLowerCase().includes(query) ||
        move.type.toLowerCase().includes(query) ||
        move.category?.toLowerCase().includes(query),
    );
    // }, [pokemonData, matched, showFaithful, movesData, evolutionChainMoves, moveSearchQuery]);
  }, [pokemonData, showFaithful, movesData, evolutionChainMoves, moveSearchQuery]);

  // Load moves, items, and abilities data in parallel, only once
  useEffect(() => {
    const loadData = async () => {
      try {
        const [movesResponse, itemsResponse, abilitiesResponse] = await Promise.all([
          fetch('/new/moves_manifest.json'),
          fetch('/new/items_manifest.json'),
          fetch('/new/abilities_manifest.json'),
        ]);

        if (movesResponse.ok) {
          const movesData = await movesResponse.json();
          setMovesData(movesData);
        }

        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItemsData(itemsData);
        }

        if (abilitiesResponse.ok) {
          const abilitiesData = await abilitiesResponse.json();
          setAbilitiesData(abilitiesData);
        }
      } catch (error) {
        console.error('Failed to load moves/items/abilities data:', error);
      }
    };

    loadData();
  }, []); // Load once on mount

  // Load detailed Pokemon data when a Pokemon is selected
  // useEffect(() => {
  //   if (matched?.name) {
  //     // Use fileName if available, otherwise fall back to name transformation
  //     const fileName = matched.fileName
  //       ? matched.fileName.replace('.json', '')
  //       : matched.name.toLowerCase().replace(/[ -]/g, '-');
  //     console.log('Loading Pokemon data for:', fileName, 'from matched:', matched);

  //     fetch(`/output/pokemon/${fileName}.json`)
  //       .then((res) => {
  //         if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  //         return res.json();
  //       })
  //       .then((data) => {
  //         setPokemonData(data);
  //       })
  //       .catch((err) => {
  //         console.error('Failed to load Pokemon data:', err);
  //         setPokemonData(null);
  //       });
  //   } else {
  //     setPokemonData(null);
  //   }
  // }, [matched, showFaithful]);

  // Update types when detailed data loads or faithful preference changes
  // useEffect(() => {
  //   if (pokemonData && matched?.name) {
  //     // Determine which form to use - if matched has a formName, use that form, otherwise use plain
  //     const formToUse = matched.formName || 'plain';
  //     const formData = pokemonData.forms?.[formToUse] || pokemonData.forms?.plain || pokemonData;

  //     console.log('Using form:', formToUse, 'for Pokemon:', matched.name);
  //     console.log('Form data available:', Object.keys(pokemonData.forms || {}));

  //     // For plain forms, prefer base data if form data is empty
  //     let correctTypes = showFaithful
  //       ? formData.faithfulTypes || formData.types || []
  //       : formData.updatedTypes || formData.types || [];

  //     // If form data has empty types but base data has types, use base data (only for plain form)
  //     const isEmpty =
  //       !correctTypes ||
  //       (Array.isArray(correctTypes) && correctTypes.length === 0) ||
  //       (typeof correctTypes === 'string' && !correctTypes.trim());

  //     if (isEmpty && formToUse === 'plain' && pokemonData.forms?.plain) {
  //       console.log('Plain form data is empty, trying base data...');
  //       const detailedStats = pokemonData.detailedStats || {};
  //       const baseTypes = showFaithful
  //         ? (detailedStats as Record<string, unknown>)['faithfulTypes'] ||
  //           (detailedStats as Record<string, unknown>)['types']
  //         : (detailedStats as Record<string, unknown>)['updatedTypes'] ||
  //           (detailedStats as Record<string, unknown>)['types'];

  //       if (baseTypes) {
  //         correctTypes = baseTypes as string | string[];
  //       }
  //       console.log('Fallback correctTypes from base:', correctTypes);
  //     }

  //     // console.log('Type update effect - Pokemon:', matched.name);
  //     // console.log('Form data:', formData);
  //     // console.log(
  //     //   'Base data types:',
  //     //   pokemonData.types,
  //     //   pokemonData.updatedTypes,
  //     //   pokemonData.faithfulTypes,
  //     // );
  //     // console.log('Detailed stats types:', pokemonData.detailedStats);
  //     // console.log('Correct types found:', correctTypes);
  //     // console.log('Show faithful:', showFaithful);

  //     // Always ensure types is [type1, type2] with nulls if missing, and normalize them
  //     const newTypes = Array.isArray(correctTypes)
  //       ? [
  //           correctTypes[0] ? normalizeTypeName(correctTypes[0]) : null,
  //           correctTypes[1] ? normalizeTypeName(correctTypes[1]) : null,
  //         ]
  //       : typeof correctTypes === 'string'
  //         ? [normalizeTypeName(correctTypes), null]
  //         : [null, null];

  //     // console.log('New types processed:', newTypes);

  //     // Normalize current types for comparison
  //     const normalizedCurrentTypes = [
  //       entry.types[0] ? normalizeTypeName(entry.types[0]) : null,
  //       entry.types[1] ? normalizeTypeName(entry.types[1]) : null,
  //     ];

  //     // Create a string representation for comparison
  //     const newTypesString = JSON.stringify(newTypes);
  //     const currentTypesString = JSON.stringify(normalizedCurrentTypes);

  //     console.log('Types comparison - current:', currentTypesString, 'new:', newTypesString);
  //     console.log('Previous ref:', previousTypesRef.current);

  //     // Only update if we found valid types AND they're different from current
  //     if (newTypesString !== currentTypesString && previousTypesRef.current !== newTypesString) {
  //       // Only update if we actually have valid types, don't clear existing ones
  //       const validTypes = newTypes.filter(
  //         (t): t is PokemonType['name'] =>
  //           typeof t === 'string' &&
  //           [
  //             'normal',
  //             'fire',
  //             'water',
  //             'electric',
  //             'grass',
  //             'ice',
  //             'fighting',
  //             'poison',
  //             'ground',
  //             'flying',
  //             'psychic',
  //             'bug',
  //             'rock',
  //             'ghost',
  //             'dragon',
  //             'dark',
  //             'steel',
  //             'fairy',
  //           ].includes(t),
  //       );

  //       // Only update if we have valid types or if current types are empty
  //       if (validTypes.length > 0 || entry.types.length === 0) {
  //         previousTypesRef.current = newTypesString;
  //         console.log('Setting valid types:', validTypes);
  //         onChange({ types: validTypes });
  //       } else {
  //         console.log('Skipping type update - would clear valid types with empty types');
  //       }
  //     } else {
  //       console.log('Skipping type update - no change or already set');
  //     }
  //   }
  // }, [pokemonData, showFaithful, matched?.name, matched?.formName, entry.types, onChange]);

  // Update ability when faithful preference changes
  useEffect(() => {
    // Only trigger when the faithful preference actually changes
    if (previousFaithfulRef.current !== null && previousFaithfulRef.current !== showFaithful) {
      if (pokemonData && entry.name && entry.ability) {
        // Check for forms structure (individual files) or direct structure (manifest)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formData: any = pokemonData?.forms?.plain || pokemonData;

        // Get abilities for current context
        const abilities = showFaithful
          ? formData.detailedStats?.faithfulAbilities || formData.abilities || []
          : formData.detailedStats?.updatedAbilities || formData.updatedAbilities || [];

        const abilityList = abilities
          .map((ability: any) => {
            if (typeof ability === 'string') return ability;
            if (ability && ability.id) {
              // Convert kebab-case to title case
              return ability.id
                .split('-')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
            if (ability && ability.name) return ability.name;
            return null;
          })
          .filter(Boolean) as string[];

        // Update to the first available ability in the new context
        if (abilityList.length > 0) {
          const newAbility = abilityList[0];
          console.log(
            `Context changed: Updating ${entry.name} ability to ${newAbility} for ${showFaithful ? 'faithful' : 'polished'} mode`,
          );
          onChange({ ability: newAbility });
        }
      }
    }

    // Update the ref to track the current faithful preference
    previousFaithfulRef.current = showFaithful;
  }, [pokemonData, showFaithful, entry.name, entry.ability, onChange]);

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

  // Helper function to calculate total EVs
  const getTotalEVs = (evs: EVs): number => {
    return Object.values(evs).reduce((sum, value) => sum + value, 0);
  };

  // Calculate total EVs for validation and display
  const totalEVs = useMemo(() => {
    return getTotalEVs(entry.evs || { hp: 0, attack: 0, defense: 0, spatk: 0, spdef: 0, speed: 0 });
  }, [entry.evs]);

  // Extract base stats from Pokemon data for hexagon
  const baseStats: StatData = useMemo(() => {
    // if (!pokemonData || !matched) {
    //   return { hp: 0, attack: 0, defense: 0, spatk: 0, spdef: 0, speed: 0 };
    // }
    if (!pokemonData) {
      return { hp: 0, attack: 0, defense: 0, spatk: 0, spdef: 0, speed: 0 };
    }

    // const formToUse = matched.formName || 'plain';
    const formToUse = 'plain';
    const formData = pokemonData.forms?.[formToUse] || pokemonData.forms?.plain || pokemonData;

    // Get base stats based on faithful/polished preference
    const stats = showFaithful
      ? formData.faithfulBaseStats || formData.baseStats
      : formData.polishedBaseStats || formData.baseStats;

    if (!stats) {
      return { hp: 0, attack: 0, defense: 0, spatk: 0, spdef: 0, speed: 0 };
    }

    return {
      hp: stats.hp || 0,
      attack: stats.attack || 0,
      defense: stats.defense || 0,
      spatk: stats.specialAttack || 0,
      spdef: stats.specialDefense || 0,
      speed: stats.speed || 0,
    };
  }, [pokemonData, showFaithful]);
  // }, [pokemonData, matched, showFaithful]);

  // const isPokemonSelected = Boolean(matched);
  const isPokemonSelected = false;

  const setMove = (i: number, move: Partial<MoveEntry>) => {
    const copy = [...entry.moves];
    copy[i] = { ...copy[i], ...move };
    onChange({ moves: copy });
  };

  // const autofillFromPokemon = (pokemonName: string) => {
  //   console.log('autofillFromPokemon called with:', pokemonName);
  //   const found = POKEMON_LIST.find((p) => p.name === pokemonName);
  //   if (!found) {
  //     console.log('Pokemon not found in POKEMON_LIST, setting name only');
  //     onChange({ name: pokemonName });
  //     setSearchModalOpen(false);
  //     setPokemonSearchQuery('');
  //     return;
  //   }

  //   console.log('Found Pokemon in POKEMON_LIST:', found);
  //   console.log('Found types:', found.types);

  //   // Use basic types as default - types will be updated when detailed data loads
  //   const validTypes = [found.types[0], found.types[1]].filter(
  //     (t): t is string =>
  //       typeof t === 'string' &&
  //       [
  //         'normal',
  //         'fire',
  //         'water',
  //         'electric',
  //         'grass',
  //         'ice',
  //         'fighting',
  //         'poison',
  //         'ground',
  //         'flying',
  //         'psychic',
  //         'bug',
  //         'rock',
  //         'ghost',
  //         'dragon',
  //         'dark',
  //         'steel',
  //         'fairy',
  //       ].includes(t),
  //   );

  //   console.log('Setting autofill types:', validTypes);
  //   // Reset the ref when manually selecting a Pokemon
  //   previousTypesRef.current = null;

  //   onChange({
  //     name: found.name,
  //     types: validTypes,
  //   });

  //   // Close modal and clear search
  //   setSearchModalOpen(false);
  //   setPokemonSearchQuery('');
  // };

  // const clearSlot = () => {
  //   onChange({ ...emptyPokemonEntry });
  // };

  // Helper function to update IVs
  const updateIV = (stat: StatType, value: number) => {
    const clampedValue = Math.max(0, Math.min(MAX_IV, value));
    const currentIVs = entry.ivs || {
      hp: 31,
      attack: 31,
      defense: 31,
      spatk: 31,
      spdef: 31,
      speed: 31,
    };
    const newIVs = { ...currentIVs, [stat]: clampedValue };
    onChange({ ivs: newIVs });
  };

  // Helper function to update EVs with validation
  const updateEV = (stat: StatType, value: number) => {
    const currentEVs = entry.evs || { hp: 0, attack: 0, defense: 0, spatk: 0, spdef: 0, speed: 0 };
    const currentTotal = getTotalEVs(currentEVs);
    const currentStatValue = currentEVs[stat];
    const difference = value - currentStatValue;

    // Calculate what the new total would be
    const newTotal = currentTotal + difference;

    // If the new total would exceed the max, calculate the maximum allowed value for this stat
    if (newTotal > MAX_EV_TOTAL) {
      // Calculate maximum possible value for this stat given current total of other stats
      const otherStatsTotal = currentTotal - currentStatValue;
      const maxPossible = Math.min(MAX_EV_PER_STAT, MAX_EV_TOTAL - otherStatsTotal);
      value = Math.max(0, maxPossible);
    }

    // Clamp to valid range
    const clampedValue = Math.max(0, Math.min(MAX_EV_PER_STAT, value));
    const newEVs = { ...currentEVs, [stat]: clampedValue };
    onChange({ evs: newEVs });
  };

  return (
    <div className="bg-white border border-border dark:bg-black/20 p-4 lg:p-8 rounded-xl">
      <div
        className={cn(
          'flex flex-col gap-2 min-h-[200px] justify-center items-center',
          isPokemonSelected && 'hidden',
        )}
      >
        {/* <Label htmlFor={`name-${index}`} className="label-text">
          Pokémon
        </Label> */}

        <Dialog
          open={searchModalOpen}
          onOpenChange={(open) => {
            setSearchModalOpen(open);
            if (open) {
              setPokemonSearchQuery(''); // Clear search when opening modal
              // Focus the search input after modal opens
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 100);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="load"
              size={'lg'}
              className="justify-center w-[200px]"
              id={`name-${index}`}
            >
              {entry.name || 'Select a Pokemon'} <Plus />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select a Pokémon</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search Pokémon by name or type..."
                  value={pokemonSearchQuery}
                  onChange={(e) => setPokemonSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    // Allow Enter to select the first filtered Pokemon if only one result
                    // if (e.key === 'Enter' && filteredPokemonList.length === 1) {
                    //   autofillFromPokemon(filteredPokemonList[0].name);
                    // }
                  }}
                  className="pl-10"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
                <div className="p-2">
                  {/* {filteredPokemonList.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No Pokémon found matching &ldquo;{pokemonSearchQuery}&rdquo;
                    </div>
                  ) : (
                    <div className="grid gap-1">
                      {filteredPokemonList.map((pokemon, idx) => (
                        <Button
                          key={`pokemon-${idx}-${pokemon.name}`}
                          variant="ghost"
                          className="w-full justify-start h-auto p-3"
                          onClick={() => autofillFromPokemon(pokemon.name)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex flex-row items-center gap-4">
                              <PokemonSprite pokemonName={pokemon.name} className="" size="sm" />
                              <span className="font-medium">{pokemon.name}</span>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div
        className={cn('flex flex-col md:flex-row gap-8 relative', !isPokemonSelected && 'hidden')}
      >
        {/* <Button
          variant="destructive"
          size="icon"
          onClick={clearSlot}
          aria-label={`Clear slot ${index + 1}`}
          className="absolute -right-2 -top-2"
        >
          <X className="h-4 w-4" />
        </Button> */}
        <div className={cn('flex flex-col gap-4 lg:gap-6 w-full md:w-1/2')}>
          <div className="flex flex-col items-center gap-4 relative">
            <PokemonSprite
              hoverAnimate={true}
              className="shadow-none lg:mt-6"
              primaryType={entry.types[0] || 'normal'}
              pokemonName={entry.name || 'egg'}
              // pokemonName={
              //   matched?.fileName
              //     ? matched.fileName.replace('.json', '')
              //     : (entry.name || 'egg')
              //         .toLowerCase()
              //         .replace(/\s*\([^)]*\).*/, '')
              //         .replace(/\s+/g, '-')
              // }
              // form={matched?.formName}
            />
            <div className="flex gap-2 text-center flex-col w-full items-center">
              <h2 className="text-xl font-bold">{entry.name}</h2>
              <div className="flex items-center gap-2">
                {Array.isArray(entry.types) && entry.types[0] && (
                  <Badge variant={entry.types[0].toLowerCase() || 'any'}>{entry.types[0]}</Badge>
                )}
                {Array.isArray(entry.types) &&
                  entry.types[1] &&
                  entry.types[1] !== entry.types[0] && (
                    <Badge variant={entry.types[1].toLowerCase() || 'any'}>{entry.types[1]}</Badge>
                  )}
              </div>
            </div>
          </div>
          <div className={cn('flex flex-col gap-2')}>
            <Label htmlFor={`ability-${index}`} className="label-text">
              Ability
            </Label>
            <Dialog
              open={abilityModalOpen}
              onOpenChange={(open) => {
                setAbilityModalOpen(open);
                if (open) {
                  setAbilitySearchQuery('');
                  setTimeout(() => {
                    abilitySearchInputRef.current?.focus();
                  }, 100);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size={'lg'}
                  variant="secondary"
                  className="w-full justify-start text-left"
                  id={`ability-${index}`}
                  disabled={!isPokemonSelected}
                >
                  {entry.ability ||
                    (isPokemonSelected ? 'Select an ability' : 'Select Pokémon first')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Select an Ability</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={abilitySearchInputRef}
                      placeholder="Search abilities..."
                      value={abilitySearchQuery}
                      onChange={(e) => setAbilitySearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredAbilityOptions.length === 1) {
                          onChange({ ability: filteredAbilityOptions[0] });
                          setAbilityModalOpen(false);
                          setAbilitySearchQuery('');
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
                    <div className="p-2">
                      {filteredAbilityOptions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          No abilities found matching &ldquo;{abilitySearchQuery}&rdquo;
                        </div>
                      ) : (
                        <div className="grid gap-1">
                          {filteredAbilityOptions.map((ability: any, idx: number) => {
                            const description = getAbilityDescription(ability);
                            return (
                              <Button
                                size={'lg'}
                                key={`ability-${idx}-${ability}`}
                                variant="ghost"
                                className="w-full justify-start h-auto p-3"
                                onClick={() => {
                                  onChange({ ability });
                                  setAbilityModalOpen(false);
                                  setAbilitySearchQuery('');
                                }}
                              >
                                <div className="flex flex-col items-start w-full">
                                  <span className="font-medium">{ability}</span>
                                  {description && (
                                    <span className="text-xs text-muted-foreground mt-1 text-left">
                                      {description.replace(/\t/g, ' ')}
                                    </span>
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="label-text">Moves</Label>
            <Dialog
              open={moveModalOpen}
              onOpenChange={(open) => {
                setMoveModalOpen(open);
                setSelectedMoveSlot(null);
                if (open) {
                  setMoveSearchQuery('');
                  setTimeout(() => {
                    moveSearchInputRef.current?.focus();
                  }, 100);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size={'lg'}
                  variant="secondary"
                  className="w-full justify-start text-left p-2 h-auto"
                  disabled={!isPokemonSelected}
                >
                  <div className="flex flex-col gap-2 items-start w-full">
                    {/* <span className="font-medium">
                      {isPokemonSelected ? 'Configure Moves' : 'Select Pokémon first'}
                    </span> */}
                    {isPokemonSelected && (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        {entry.moves.map((mv, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-white/90 dark:bg-black/40 p-2 rounded-md"
                          >
                            <Badge
                              variant={mv.type?.toLowerCase() as any}
                              className="text-xs w-[20px]"
                            >
                              {i + 1}
                            </Badge>
                            <span className="truncate">{mv.name || 'Empty'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Configure Moves</DialogTitle>
                </DialogHeader>
                <div className="flex gap-6 h-[70vh]">
                  {/* Left side - Current moves */}
                  {/* <div className="w-1/3 flex flex-col gap-4">
                    <h3 className="font-medium">Current Moves</h3>
                    <div className="space-y-2">
                      {entry.moves.map((mv, i) => (
                        <div key={i} className="relative">
                          <Button
                            variant={selectedMoveSlot === i ? 'default' : 'outline'}
                            className="w-full justify-start text-left h-auto p-3"
                            onClick={() => setSelectedMoveSlot(selectedMoveSlot === i ? null : i)}
                          >
                            <div className="flex flex-col items-start gap-1 w-full">
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-xs bg-muted px-1 rounded">Move {i + 1}</span>
                                {mv.name && mv.type && (
                                  <Badge
                                    variant={mv.type.toLowerCase() || 'any'}
                                    className="text-xs"
                                  >
                                    {mv.type}
                                  </Badge>
                                )}
                              </div>
                              <span className="font-medium">{mv.name || 'Click to select'}</span>
                            </div>
                          </Button>
                          {mv.name && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-1 -right-1 h-6 w-6"
                              onClick={() => setMove(i, { name: '', type: null })}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedMoveSlot !== null && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Select a move from the right to assign to Move {selectedMoveSlot + 1}
                        </p>
                      </div>
                    )}
                  </div> */}

                  {/* Right side - Available moves */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          ref={moveSearchInputRef}
                          placeholder="Search moves by name, type, or category..."
                          value={moveSearchQuery}
                          onChange={(e) => setMoveSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-border rounded-md">
                      <div className="p-2">
                        {filteredMoveOptions.length === 0 ? (
                          <div className="text-center text-muted-foreground py-4">
                            No moves found matching &ldquo;{moveSearchQuery}&rdquo;
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Group moves by category */}
                            {(() => {
                              const categories = ['Level-up', 'Egg Move', 'TM/HM'];
                              const evolutionCategories = [
                                ...new Set(
                                  filteredMoveOptions
                                    .filter((m) => m.category?.startsWith('Previous Evolution'))
                                    .map((m) => m.category!),
                                ),
                              ];

                              return [...categories, ...evolutionCategories].map((category) => {
                                const movesInCategory = filteredMoveOptions.filter(
                                  (m) => m.category === category,
                                );
                                if (movesInCategory.length === 0) return null;

                                return (
                                  <div key={category}>
                                    <div className="label-text mb-2 px-2">{category}</div>
                                    <div className="grid gap-1 mb-4">
                                      {movesInCategory.map((move, idx) => {
                                        const moveStats = getMoveStats(move.name);
                                        const isSelected = entry.moves.some(
                                          (mv) => mv.name === move.name,
                                        );
                                        return (
                                          <Button
                                            key={`move-${category}-${idx}-${move.name}`}
                                            variant={isSelected ? 'secondary' : 'ghost'}
                                            className="w-full justify-start h-auto p-3"
                                            onClick={() => {
                                              // Check if move is already selected
                                              const currentMoveIndex = entry.moves.findIndex(
                                                (mv) => mv.name === move.name,
                                              );

                                              if (currentMoveIndex !== -1) {
                                                // Move is already selected - remove it (deselect)
                                                setMove(currentMoveIndex, { name: '', type: null });
                                              } else if (selectedMoveSlot !== null) {
                                                // Assign to selected slot
                                                setMove(selectedMoveSlot, {
                                                  name: move.name,
                                                  type: move.type || null,
                                                });
                                                // Auto-select next empty slot if available
                                                const nextEmptySlot = entry.moves.findIndex(
                                                  (mv, index) =>
                                                    index > selectedMoveSlot && !mv.name,
                                                );
                                                setSelectedMoveSlot(
                                                  nextEmptySlot !== -1 ? nextEmptySlot : null,
                                                );
                                              } else {
                                                // Auto-assign to first empty slot
                                                const emptySlot = entry.moves.findIndex(
                                                  (mv) => !mv.name,
                                                );
                                                if (emptySlot !== -1) {
                                                  setMove(emptySlot, {
                                                    name: move.name,
                                                    type: move.type || null,
                                                  });
                                                }
                                              }
                                            }}
                                          >
                                            <div className="flex items-center justify-between w-full">
                                              <div className="flex flex-col items-start">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold">{move.name}</span>
                                                  {isSelected && (
                                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                      ✓ Selected
                                                    </span>
                                                  )}
                                                </div>
                                                {moveStats && (
                                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                    <span>Power: {moveStats.power || '—'}</span>
                                                    <span>Acc: {moveStats.accuracy || '—'}%</span>
                                                    <span>PP: {moveStats.pp}</span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge
                                                  variant={move.type?.toLowerCase() as any}
                                                  className="text-xs"
                                                >
                                                  {move.type}
                                                </Badge>
                                                {moveStats?.category && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    {moveStats.category}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`nature-${index}`} className="label-text">
              Nature
            </Label>
            <Dialog
              open={natureModalOpen}
              onOpenChange={(open) => {
                setNatureModalOpen(open);
                if (open) {
                  setNatureSearchQuery('');
                  setTimeout(() => {
                    natureSearchInputRef.current?.focus();
                  }, 100);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size={'lg'}
                  className="w-full justify-start text-left"
                  id={`nature-${index}`}
                  disabled={!isPokemonSelected}
                >
                  {entry.nature || (isPokemonSelected ? 'Select a nature' : 'Select Pokémon first')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Select a Nature</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={natureSearchInputRef}
                      placeholder="Search natures..."
                      value={natureSearchQuery}
                      onChange={(e) => setNatureSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredNatureOptions.length === 1) {
                          onChange({ nature: filteredNatureOptions[0] });
                          setNatureModalOpen(false);
                          setNatureSearchQuery('');
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
                    <div className="p-2">
                      {filteredNatureOptions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          No natures found matching &ldquo;{natureSearchQuery}&rdquo;
                        </div>
                      ) : (
                        <div className="grid gap-1">
                          {filteredNatureOptions.map((nature) => (
                            <Button
                              key={`nature-${nature}`}
                              variant="ghost"
                              size={'lg'}
                              className="w-full justify-start h-auto p-3"
                              onClick={() => {
                                onChange({ nature });
                                setNatureModalOpen(false);
                                setNatureSearchQuery('');
                              }}
                            >
                              <div className="flex flex-col items-start w-full">
                                <span className="font-medium">{nature}</span>
                                <span className="text-xs text-muted-foreground">
                                  {getNatureDescription(nature)}
                                </span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`item-${index}`} className="label-text">
              Held Item
            </Label>
            <Dialog
              open={itemModalOpen}
              onOpenChange={(open) => {
                setItemModalOpen(open);
                if (open) {
                  setItemSearchQuery('');
                  setTimeout(() => {
                    itemSearchInputRef.current?.focus();
                  }, 100);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size={'lg'}
                  className="w-full justify-start text-left"
                  id={`item-${index}`}
                  disabled={!isPokemonSelected}
                >
                  {entry.item ? (
                    <Image
                      src={`/sprites/items/${entry.item?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown'}.png`}
                      width={24}
                      height={24}
                      alt={entry.item}
                      className="rounded-sm"
                    />
                  ) : (
                    <></>
                  )}
                  {entry.item || (isPokemonSelected ? 'Select an item' : 'Select Pokémon first')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Select a Held Item</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={itemSearchInputRef}
                      placeholder="Search items..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredItemOptions.length === 1) {
                          onChange({ item: filteredItemOptions[0].name });
                          setItemModalOpen(false);
                          setItemSearchQuery('');
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
                    <div className="p-2">
                      {filteredItemOptions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          No items found matching &ldquo;{itemSearchQuery}&rdquo;
                        </div>
                      ) : (
                        <div className="grid gap-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto p-3"
                            onClick={() => {
                              onChange({ item: undefined });
                              setItemModalOpen(false);
                              setItemSearchQuery('');
                            }}
                          >
                            <span className="font-medium">None</span>
                          </Button>
                          {filteredItemOptions.map((item) => (
                            <Button
                              key={`item-${item.id}`}
                              variant="ghost"
                              className="w-full justify-start h-auto p-3 flex-row gap-3"
                              onClick={() => {
                                onChange({ item: item.name });
                                setItemModalOpen(false);
                                setItemSearchQuery('');
                              }}
                            >
                              <Image
                                src={`/sprites/items/${item.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown'}.png`}
                                width={24}
                                height={24}
                                alt={item.name}
                                className="rounded-sm"
                              />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className={cn('flex flex-col gap-2 w-full md:w-1/2')}>
          {/* IV/EV Section */}
          <div className="flex flex-col gap-2">
            <div className="space-y-3">
              {/* Level Selector and Hexagonal Stat Diagram */}
              {isPokemonSelected && (
                <div className="flex flex-col items-center gap-4">
                  {/* Hexagonal Stat Diagram */}
                  <StatHexagon
                    baseStats={baseStats}
                    ivs={
                      entry.ivs || {
                        hp: 31,
                        attack: 31,
                        defense: 31,
                        spatk: 31,
                        spdef: 31,
                        speed: 31,
                      }
                    }
                    evs={
                      entry.evs || { hp: 0, attack: 0, defense: 0, spatk: 0, spdef: 0, speed: 0 }
                    }
                    level={selectedLevel}
                    nature={natureModifiers}
                    size={300}
                    showLayers={{ base: false, ivs: true, evs: true, total: true }}
                  />

                  {/* Level Selector */}
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium">Level:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={selectedLevel}
                        onChange={(e) => {
                          const newLevel = Math.max(
                            1,
                            Math.min(100, parseInt(e.target.value) || 1),
                          );
                          setSelectedLevel(newLevel);
                          onChange({ level: newLevel });
                        }}
                        className="w-16 h-8 text-sm text-center"
                      />
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedLevel(1);
                            onChange({ level: 1 });
                          }}
                          className={cn(selectedLevel === 1 && 'bg-blue-100 dark:bg-blue-900')}
                        >
                          Lv. 1
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedLevel(50);
                            onChange({ level: 50 });
                          }}
                          className={cn(selectedLevel === 50 && 'bg-blue-100 dark:bg-blue-900')}
                        >
                          Lv. 50
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedLevel(100);
                            onChange({ level: 100 });
                          }}
                          className={cn(selectedLevel === 100 && 'bg-blue-100 dark:bg-blue-900')}
                        >
                          Lv. 100
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(Object.keys(STAT_NAMES) as StatType[]).map((stat) => {
                const currentIV = entry.ivs?.[stat] ?? 31;
                const currentEV = entry.evs?.[stat] ?? 0;

                return (
                  <div key={stat} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="label-text w-10">{STAT_NAMES[stat]}</label>
                          <span className="text-xs w-8 text-center">{currentEV}</span>
                          <Slider
                            value={[currentEV]}
                            max={MAX_EV_PER_STAT}
                            onValueChange={(value) => updateEV(stat, value[0])}
                            step={1}
                            disabled={!isPokemonSelected}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Input
                          type="number"
                          min="0"
                          max={MAX_IV}
                          value={currentIV}
                          onChange={(e) => updateIV(stat, parseInt(e.target.value) || 0)}
                          className="w-16"
                          disabled={!isPokemonSelected}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* EV Total Display */}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span
                    className={cn(
                      'font-bold',
                      totalEVs > MAX_EV_TOTAL
                        ? 'text-destructive'
                        : totalEVs === MAX_EV_TOTAL
                          ? 'text-green-600'
                          : 'text-neutral-600 dark:text-neutral-200',
                    )}
                  >
                    {totalEVs} / {MAX_EV_TOTAL}
                  </span>
                </div>
                {totalEVs > MAX_EV_TOTAL && (
                  <p className="text-xs text-destructive mt-1">
                    EVs exceed maximum limit! Please reduce some values.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
