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
import { Search, Plus, X } from 'lucide-react';
import { normalizePokemonNameToFileId, extractFormKeyFromName } from '@/utils/stringUtils';
import { Badge } from './ui/badge';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { PokemonSprite } from './pokemon/pokemon-sprite';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Slider } from './ui/slider';
import StatHexagon, { type StatData } from './pokemon/stat-hexagon';

export type MoveEntry = {
  name: string;
  type: string | null;
  category?: string;
};

export type MoveStats = {
  name: string;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  effectChance: number;
  category: string;
  description: string;
};

export type MoveData = {
  id: string;
  versions: {
    faithful: MoveStats;
    polished: MoveStats;
  };
};

export type ItemVersionData = {
  name: string;
  category: string;
  locationCount?: number;
  price?: number;
};

export type ItemData = {
  id: string;
  versions: {
    faithful: ItemVersionData;
    polished: ItemVersionData;
  };
};

export type AbilityVersionData = {
  description: string;
};

export type AbilityData = {
  id: string;
  name: string;
  versions: {
    faithful: AbilityVersionData;
    polished: AbilityVersionData;
  };
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

export const emptyPokemonEntry: PokemonEntry = {
  name: '',
  types: [],
  ability: '',
  nature: undefined,
  item: undefined,
  moves: [
    { name: '', type: null },
    { name: '', type: null },
    { name: '', type: null },
    { name: '', type: null },
  ],
  ivs: { hp: 31, attack: 31, defense: 31, spatk: 31, spdef: 31, speed: 31 },
  evs: { hp: 0, attack: 0, defense: 0, spatk: 0, spdef: 0, speed: 0 },
  level: 50,
};

export type PokemonSlotProps = {
  index: number;
  entry: PokemonEntry;
  onChange: (data: Partial<PokemonEntry>) => void;
};

export default function PokemonSlot({ index, entry, onChange }: PokemonSlotProps) {
  const [pokemonData, setPokemonData] = useState<any | null>(null);
  const [pokemonList, setPokemonList] = useState<
    {
      id: string;
      name: string;
      form: string; // 'plain', 'alolan', 'galarian', etc.
      displayName: string; // "Meowth" or "Meowth (Alolan)"
      versions: {
        polished?: { [form: string]: { types: string[] } };
        faithful?: { [form: string]: { types: string[] } };
      };
    }[]
  >([]);
  const [movesData, setMovesData] = useState<Record<string, MoveData> | null>(null);
  const [itemsData, setItemsData] = useState<Record<string, ItemData> | null>(null);
  const [abilitiesData, setAbilitiesData] = useState<Record<string, AbilityData> | null>(null);
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
      // Convert display name to ID format (e.g., "Thunder Shock" -> "thundershock")
      const moveKey = moveName.toLowerCase().replace(/[ '-]/g, '');
      const moveInfo = movesData[moveKey];

      if (!moveInfo) return null;

      const stats = showFaithful ? moveInfo.versions.faithful : moveInfo.versions.polished;
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

  // Filter Pokemon based on search query
  const filteredPokemonList = useMemo(() => {
    const version = showFaithful ? 'faithful' : 'polished';
    if (!pokemonSearchQuery.trim()) return pokemonList;

    const query = pokemonSearchQuery.toLowerCase();
    return pokemonList.filter((pokemon) => {
      const formData = pokemon.versions?.[version]?.[pokemon.form];
      const types = formData?.types || [];
      return (
        pokemon.displayName.toLowerCase().includes(query) ||
        pokemon.id.toLowerCase().includes(query) ||
        pokemon.form.toLowerCase().includes(query) ||
        types.some((type) => type?.toLowerCase().includes(query))
      );
    });
  }, [pokemonSearchQuery, pokemonList, showFaithful]);

  // Helper function to get ability description
  const getAbilityDescription = useCallback(
    (abilityName: string): string => {
      if (!abilitiesData) return '';

      // Convert ability name to ID format (e.g., "Lightning Rod" -> "lightningrod")
      const abilityKey = abilityName.toLowerCase().replace(/[\s'-]/g, '');

      const abilityInfo = abilitiesData[abilityKey];
      if (!abilityInfo) return '';

      const versionData = showFaithful
        ? abilityInfo.versions.faithful
        : abilityInfo.versions.polished;
      return versionData?.description || '';
    },
    [abilitiesData, showFaithful],
  );

  // Filter abilities based on search query
  const filteredAbilityOptions = useMemo(() => {
    if (!pokemonData) return [];

    // Get abilities from the transformed data structure - use current form
    const currentForm = pokemonData?.currentForm || 'plain';
    const formData = pokemonData?.forms?.[currentForm] || pokemonData?.forms?.plain;
    const abilities: string[] = formData?.abilities || [];

    // Convert kebab-case ability names to title case
    const abilityList = abilities
      .map((ability: string) => {
        if (!ability) return null;
        // Convert kebab-case to title case (e.g., "lightning-rod" -> "Lightning Rod")
        return ability
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      })
      .filter(Boolean) as string[];

    if (!abilitySearchQuery.trim()) return abilityList;

    const query = abilitySearchQuery.toLowerCase();
    return abilityList.filter(
      (ability: string) =>
        ability.toLowerCase().includes(query) ||
        getAbilityDescription(ability).toLowerCase().includes(query),
    );
  }, [pokemonData, abilitySearchQuery, getAbilityDescription]);

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

    // Categories that are typically held items
    const heldItemCategories = ['medicine', 'berry', 'battle', 'held'];
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

    const version = showFaithful ? 'faithful' : 'polished';
    const itemList = Object.entries(itemsData)
      .filter(([, item]) => {
        const versionData = item.versions[version] || item.versions.polished;
        if (!versionData) return false;
        const category = versionData.category?.toLowerCase() || '';
        // Include items from held-item categories or all if not strictly categorized
        const isHeldCategory =
          heldItemCategories.some((cat) => category.includes(cat)) || category === '';
        if (!isHeldCategory && category !== 'ball') return true; // Include most items except balls
        const itemName = versionData.name.toLowerCase();
        return !excludePatterns.some((pattern) => pattern.test(itemName));
      })
      .map(([, item]) => {
        const versionData = item.versions[version] || item.versions.polished;
        return {
          id: item.id,
          name: versionData.name,
          category: versionData.category,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!itemSearchQuery.trim()) return itemList;

    const query = itemSearchQuery.toLowerCase();
    return itemList.filter((item) => item.name.toLowerCase().includes(query));
  }, [itemsData, itemSearchQuery, showFaithful]);

  // Filter moves based on search query
  const filteredMoveOptions = useMemo(() => {
    if (!pokemonData || !movesData) return [];

    const currentForm = pokemonData?.currentForm || 'plain';
    const formData = pokemonData.forms?.[currentForm] || pokemonData.forms?.plain;
    if (!formData?.movesets) return [];

    // Get moves from the movesets structure
    const levelUpMoves = formData.movesets.levelUp || [];
    const eggMoves = formData.movesets.eggMoves || [];
    const tmMoves = formData.movesets.tm || [];

    // Helper function to get move type from moves data
    const getMoveType = (moveId: string): string => {
      if (!movesData || !moveId) {
        return 'Normal';
      }
      const moveInfo = movesData[moveId];
      if (!moveInfo?.versions) {
        return 'Normal';
      }
      const stats = showFaithful ? moveInfo.versions.faithful : moveInfo.versions.polished;
      const type = stats?.type || 'normal';
      // Capitalize first letter
      return type.charAt(0).toUpperCase() + type.slice(1);
    };

    // Helper function to convert move id to display name
    // slightly different than one in stringUtils to handle missing moves data
    const formatMoveName = (moveId: string): string => {
      // Check if we have the actual name from moves data
      if (movesData?.[moveId]) {
        const stats = showFaithful
          ? movesData[moveId].versions.faithful
          : movesData[moveId].versions.polished;
        return stats?.name || moveId;
      }
      // Fallback: convert ID to title case (e.g., "thundershock" -> "Thundershock")
      return moveId.charAt(0).toUpperCase() + moveId.slice(1);
    };

    // Combine all moves
    const allMoves = [
      ...levelUpMoves.map((move: { id: string; level?: number }) => ({
        name: formatMoveName(move.id),
        type: getMoveType(move.id),
        category: 'Level-up',
      })),
      ...eggMoves.map((move: { id: string }) => ({
        name: formatMoveName(move.id),
        type: getMoveType(move.id),
        category: 'Egg Move',
      })),
      ...tmMoves.map((move: { id: string }) => ({
        name: formatMoveName(move.id),
        type: getMoveType(move.id),
        category: 'TM/HM',
      })),
      ...evolutionChainMoves,
    ];

    const moveList = allMoves
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

  // Load moves, items, abilities, and pokemon data in parallel, only once
  useEffect(() => {
    const loadData = async () => {
      try {
        const [movesResponse, itemsResponse, abilitiesResponse, pokemonResponse] =
          await Promise.all([
            fetch('/new/moves_manifest.json'),
            fetch('/new/items_manifest.json'),
            fetch('/new/abilities_manifest.json'),
            fetch('/new/pokemon_manifest.json'),
          ]);

        if (movesResponse.ok) {
          const movesArray: MoveData[] = await movesResponse.json();
          // Transform array to object keyed by id for O(1) lookups
          const movesMap = movesArray.reduce(
            (acc, move) => {
              acc[move.id] = move;
              return acc;
            },
            {} as Record<string, MoveData>,
          );
          setMovesData(movesMap);
        }

        if (itemsResponse.ok) {
          const itemsArray: ItemData[] = await itemsResponse.json();
          // Transform array to object keyed by id for O(1) lookups
          const itemsMap = itemsArray.reduce(
            (acc, item) => {
              acc[item.id] = item;
              return acc;
            },
            {} as Record<string, ItemData>,
          );
          setItemsData(itemsMap);
        }

        if (abilitiesResponse.ok) {
          const abilitiesArray: AbilityData[] = await abilitiesResponse.json();
          // Transform array to object keyed by id for O(1) lookups
          const abilitiesMap = abilitiesArray.reduce(
            (acc, ability) => {
              acc[ability.id] = ability;
              return acc;
            },
            {} as Record<string, AbilityData>,
          );
          setAbilitiesData(abilitiesMap);
        }

        if (pokemonResponse.ok) {
          const rawPokemonData = await pokemonResponse.json();
          // Expand forms into separate entries
          const expandedList: typeof pokemonList = [];
          for (const pokemon of rawPokemonData) {
            // Get all unique forms from both versions
            const polishedForms = Object.keys(pokemon.versions?.polished || {});
            const faithfulForms = Object.keys(pokemon.versions?.faithful || {});
            const allForms = [...new Set([...polishedForms, ...faithfulForms])];
            
            for (const form of allForms) {
              const formLabel = form === 'plain' ? '' : ` (${form.charAt(0).toUpperCase() + form.slice(1)})`;
              expandedList.push({
                id: pokemon.id,
                name: pokemon.name,
                form: form,
                displayName: `${pokemon.name}${formLabel}`,
                versions: pokemon.versions,
              });
            }
          }
          setPokemonList(expandedList);
        }
      } catch (error) {
        console.error('Failed to load moves/items/abilities/pokemon data:', error);
      }
    };

    loadData();
  }, []); // Load once on mount

  // Load detailed Pokemon data when a Pokemon is selected
  useEffect(() => {
    if (entry.name && entry.name.trim() !== '') {
      // Extract form from name (e.g., "Meowth (Alolan)" -> "alolan", "Meowth" -> "plain")
      const formName = extractFormKeyFromName(entry.name);
      
      // Normalize name for file lookup (e.g., "Mr. Mime (Galarian)" -> "mrmime")
      const fileName = normalizePokemonNameToFileId(entry.name);

      fetch(`/new/pokemon/${fileName}.json`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          return res.json();
        })
        .then((data) => {
          // Transform new data structure to expected format
          const version = showFaithful ? 'faithful' : 'polished';
          // Try to get the specific form, fall back to plain
          const formData =
            data.versions?.[version]?.forms?.[formName] || 
            data.versions?.[version]?.forms?.plain ||
            data.versions?.polished?.forms?.[formName] ||
            data.versions?.polished?.forms?.plain;

          if (formData) {
            setPokemonData({
              forms: {
                [formName]: {
                  baseStats: formData.baseStats,
                  abilities: formData.abilities,
                  movesets: formData.movesets,
                  types: formData.types,
                },
              },
              currentForm: formName,
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load Pokemon data:', err);
          setPokemonData(null);
        });
    } else {
      setPokemonData(null);
    }
  }, [entry.name, showFaithful]);

  // Update ability when faithful preference changes
  useEffect(() => {
    // Only trigger when the faithful preference actually changes
    if (previousFaithfulRef.current !== null && previousFaithfulRef.current !== showFaithful) {
      if (pokemonData && entry.name && entry.ability) {
        // Check for forms structure (individual files) or direct structure (manifest)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentForm = pokemonData?.currentForm || 'plain';
        const formData: any = pokemonData?.forms?.[currentForm] || pokemonData?.forms?.plain || pokemonData;

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
          // Normalize name for file lookup (e.g., "Mr. Mime (Galarian)" -> "mrmime")
          const fileName = normalizePokemonNameToFileId(prevEvolutionName);
          const response = await fetch(`/new/pokemon/${fileName}.json`);
          if (response.ok) {
            const prevPokemonData = await response.json();
            // Use new data structure
            const version = showFaithful ? 'faithful' : 'polished';
            const formData =
              prevPokemonData.versions?.[version]?.forms?.plain ||
              prevPokemonData.versions?.polished?.forms?.plain;

            // Get level-up moves from movesets
            const levelUpMoves = formData?.movesets?.levelUp || [];

            levelUpMoves.forEach((move: { id: string; level: number }) => {
              if (!evolutionChainMoves.some((existing) => existing.name === move.id)) {
                evolutionChainMoves.push({
                  name: move.id,
                  type: null, // Type will be resolved from movesData if needed
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

    // Use the current form stored in pokemonData
    const formToUse = pokemonData?.currentForm || 'plain';
    const formData = pokemonData.forms?.[formToUse] || pokemonData.forms?.plain || pokemonData;

    // Get base stats - data is already transformed in useEffect based on faithful/polished preference
    const stats = formData.baseStats;

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
  }, [pokemonData]);
  // }, [pokemonData, matched, showFaithful]);

  // Check if a Pokemon is selected based on entry.name
  const isPokemonSelected = Boolean(entry.name && entry.name.trim() !== '');

  const setMove = (i: number, move: Partial<MoveEntry>) => {
    const copy = [...entry.moves];
    copy[i] = { ...copy[i], ...move };
    onChange({ moves: copy });
  };

  const autofillFromPokemon = (pokemon: (typeof pokemonList)[0]) => {
    const version = showFaithful ? 'faithful' : 'polished';
    const formData = pokemon.versions?.[version]?.[pokemon.form];
    const types = formData?.types || [];

    // Reset the ref when manually selecting a Pokemon
    previousTypesRef.current = null;

    onChange({
      name: pokemon.displayName,
      types: types,
    });

    // Close modal and clear search
    setSearchModalOpen(false);
    setPokemonSearchQuery('');
  };

  const clearSlot = () => {
    onChange({ ...emptyPokemonEntry });
  };

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
        {/* <Label htmlFor={`name-${index}`} className="table-header-label">
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
                    if (e.key === 'Enter' && filteredPokemonList.length === 1) {
                      autofillFromPokemon(filteredPokemonList[0]);
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
                <div className="p-2">
                  {filteredPokemonList.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      {pokemonList.length === 0
                        ? 'Loading Pokémon...'
                        : `No Pokémon found matching "${pokemonSearchQuery}"`}
                    </div>
                  ) : (
                    <div className="grid gap-1">
                      {filteredPokemonList.map((pokemon, idx) => {
                        // Build sprite name: for forms, use id_form format (e.g., "meowth_alolan")
                        const spriteName = pokemon.form === 'plain' 
                          ? pokemon.id 
                          : `${pokemon.id}_${pokemon.form}`;
                        return (
                          <Button
                            key={`pokemon-${idx}-${pokemon.id}-${pokemon.form}`}
                            variant="ghost"
                            className="w-full justify-start h-auto p-3"
                            onClick={() => autofillFromPokemon(pokemon)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex flex-row items-center gap-4">
                                <PokemonSprite pokemonName={spriteName} className="" size="sm" />
                                <span className="font-medium">{pokemon.displayName}</span>
                              </div>
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

      <div
        className={cn('flex flex-col md:flex-row gap-8 relative', !isPokemonSelected && 'hidden')}
      >
        <Button
          variant="destructive"
          size="icon"
          onClick={clearSlot}
          aria-label={`Clear slot ${index + 1}`}
          className="absolute -right-2 -top-2"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className={cn('flex flex-col gap-4 lg:gap-6 w-full md:w-1/2')}>
          <div className="flex flex-col items-center gap-4 relative">
            <PokemonSprite
              hoverAnimate={true}
              className="shadow-none lg:mt-6"
              primaryType={entry.types[0] || 'normal'}
              pokemonName={
                entry.name
                  ? entry.name
                      .toLowerCase()
                      .replace(/\s*\(([^)]+)\)/g, '_$1') // Convert "Slowking (Galarian)" to "slowking_galarian"
                      .replace(/\s+/g, '')
                  : 'egg'
              }
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
            <Label htmlFor={`ability-${index}`} className="table-header-label">
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
            <Label className="table-header-label">Moves</Label>
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
                                    <div className="table-header-label mb-2 px-2">{category}</div>
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
            <Label htmlFor={`nature-${index}`} className="table-header-label">
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
            <Label htmlFor={`item-${index}`} className="table-header-label">
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
                      src={`/sprites/items/${entry.item?.toLowerCase()?.replace(/[\s'-]/g, '') || 'unknown'}.png`}
                      width={24}
                      height={24}
                      alt={entry.item}
                      className="rounded-sm"
                      onError={(e) => {
                        e.currentTarget.src = '/sprites/items/pokeball.png';
                      }}
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
                                src={`/sprites/items/${item.id || 'unknown'}.png`}
                                width={24}
                                height={24}
                                alt={item.name}
                                className="rounded-sm"
                                onError={(e) => {
                                  e.currentTarget.src = '/sprites/items/pokeball.png';
                                }}
                              />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{item.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {item.category}
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
                          <label className="table-header-label w-10">{STAT_NAMES[stat]}</label>
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
