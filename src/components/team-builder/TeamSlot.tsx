'use client';

import { TeamPokemon } from '@/hooks/use-team-search-params';
import { X, Plus } from 'lucide-react';
import PokemonCard from '../pokemon/PokemonCard';
import { BaseData } from '@/types/types';
import Link from 'next/link';
import { normalizePokemonUrlKey } from '@/utils/pokemonUrlNormalizer';

interface TeamSlotProps {
  pokemon: TeamPokemon | null;
  slotNumber: number;
  onSlotClick: () => void;
  onRemove: () => void;
}

export function TeamSlot({ pokemon, slotNumber, onSlotClick, onRemove }: TeamSlotProps) {
  if (!pokemon) {
    return (
      <div
        onClick={onSlotClick}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-[110px] md:h-[175px] flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        <Plus className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500">Slot {slotNumber}</span>
      </div>
    );
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div className="relative cursor-pointer group">
      {/* <div onClick={onSlotClick} className="relative  cursor-pointer group"> */}
      <button
        onClick={handleRemoveClick}
        className="absolute top-2 md:top-0 right-2 md:right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 cursor-pointer z-20"
      >
        <X className="w-3 h-3 pointer-none" />
      </button>

      <Link
        href={
          pokemon.formName
            ? `/pokemon/${normalizePokemonUrlKey(pokemon.name)}?form=${encodeURIComponent(pokemon.formName)}`
            : `/pokemon/${normalizePokemonUrlKey(pokemon.name)}`
        }
      >
        <PokemonCard
          pokemon={
            {
              name: pokemon.name,
              nationalDex: pokemon.data.nationalDex || null,
              johtoDex: pokemon.data.johtoDex || null,
              // Use form-specific sprite if available
              frontSpriteUrl: pokemon.formName
                ? `/sprites/pokemon/${pokemon.name.replace(/-/g, '_')}_${pokemon.formName}/normal_front.png`
                : `/sprites/pokemon/${pokemon.name.replace(/-/g, '_')}/normal_front.png`,
              // Use form-specific types (already calculated in pokemon.types)
              types: pokemon.types,
              formName: pokemon.formName, // Pass form info for URL generation
            } as BaseData & { formName?: string }
          }
        />
      </Link>
    </div>
  );
}
