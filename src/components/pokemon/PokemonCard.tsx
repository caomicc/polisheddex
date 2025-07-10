import Link from 'next/link';
import React from 'react';

export interface PokemonCardProps {

}

const PokemonCard: React.FC<PokemonCardProps> = ({ }: ) => (
  <li key={p.name} className="border rounded p-2 flex items-center justify-between">
    <div>
      <Link href={`/pokemon/${encodeURIComponent(p.name)}`} className="text-blue-600 hover:underline font-semibold">
        {p.name}
      </Link>
    </div>
    <span className="ml-2 text-xs text-gray-500">
      National: {p.nationalDex !== Infinity ? p.nationalDex : '—'}
    </span>
  </li>
);

export default PokemonCard;
