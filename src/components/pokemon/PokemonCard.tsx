import { BaseData } from '@/types/types';
import Link from 'next/link';
import React from 'react';

export interface PokemonCardProps {
  pokemon: BaseData;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon }) => (
  <li key={pokemon.name} className="border rounded p-2 flex items-center justify-between">
    <div>
      <Link href={`/pokemon/${encodeURIComponent(pokemon.name)}`} className="text-blue-600 hover:underline font-semibold">
        {pokemon.name}
      </Link>
    </div>
    <span className="ml-2 text-xs text-gray-500">
      National: {pokemon.nationalDex !== Infinity ? pokemon.nationalDex : '—'}
    </span>
  </li>
);

export default PokemonCard;
