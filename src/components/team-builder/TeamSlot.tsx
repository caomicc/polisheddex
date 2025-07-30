'use client';

import { TeamPokemon } from '@/hooks/use-team-search-params';
import { Badge } from '@/components/ui/badge';
import { PokemonType } from '@/types/types';
import { X, Plus } from 'lucide-react';
import Image from 'next/image';

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
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
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
    <div
      onClick={onSlotClick}
      className="relative border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all bg-white group"
    >
      <button
        onClick={handleRemoveClick}
        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
      >
        <X className="w-3 h-3" />
      </button>
      
      <div className="flex flex-col items-center space-y-2">
        {pokemon.data.frontSpriteUrl && (
          <Image
            src={pokemon.data.frontSpriteUrl}
            alt={pokemon.name}
            width={64}
            height={64}
            className="w-16 h-16 object-contain"
          />
        )}
        
        <div className="text-center">
          <div className="font-medium text-sm capitalize">
            {pokemon.formName 
              ? `${pokemon.name} (${pokemon.formName.charAt(0).toUpperCase() + pokemon.formName.slice(1)})`
              : pokemon.name
            }
          </div>
          
          <div className="flex flex-wrap gap-1 justify-center mt-1">
            {pokemon.types.map((type) => (
              <Badge
                key={type}
                variant={type.toLowerCase() as PokemonType['name']}
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
}