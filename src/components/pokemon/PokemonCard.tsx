import { BaseData, PokemonType } from '@/types/types';
import Link from 'next/link';
import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import Image from 'next/image';

export interface PokemonCardProps {
  pokemon: BaseData;
  sortType?: string;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, sortType = 'nationaldex' }) => (
  <Link href={`/pokemon/${encodeURIComponent(pokemon.name)}`}>
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 md:text-center border-0 md:mt-8 relative p-3 md:p-4 md:pt-[48px] h-[100px] md:h-auto ">
      <Image
        src={pokemon.frontSpriteUrl ?? '/images/pokemon-placeholder.png'}
        alt={`${pokemon.name} sprite`}
        width={64}
        height={64}
        className="absolute max-w-12 md:max-w-16 right-2 bottom-2 md:bottom-auto md:right-auto md:top-0 md:left-1/2 transform md:-translate-x-1/2 md:-translate-y-1/2 z-0 md:z-10"
      />
      <div className="flex flex-col gap-0 relative z-20">
        <p className="text-xs md:text-lg md:mb-2">
          #
          {sortType === 'johtodex'
            ? pokemon.johtoDex !== null && pokemon.johtoDex < 999
              ? pokemon.johtoDex
              : '—'
            : pokemon.nationalDex !== null
            ? pokemon.nationalDex
            : '—'}
        </p>
        <h2 className="text-sm md:text-xl md:mb-8 font-bold leading-none mb-2">{pokemon.name}</h2>
        <div className="flex md:justify-center gap-1 md:gap-2 flex-col md:flex-row">
          {(Array.isArray(pokemon.types) ? pokemon.types : [pokemon.types]).map((type) => (
            <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  </Link>
);

export default PokemonCard;
