import Link from 'next/link';
import React from 'react';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

export interface LocationCardProps {
  location: {
    area: string;
    types?: string[] | string;
    pokemonCount?: number;
    hasHiddenGrottoes?: boolean;
  };
}

const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  // Determine the primary type for styling
  const primaryType = typeof location.types === 'string'
    ? location.types.toLowerCase()
    : Array.isArray(location.types) && location.types.length > 0
      ? location.types[0].toLowerCase()
      : 'normal';

  return (
    <Link href={`/locations/${encodeURIComponent(location.area)}`}>
      <Card
        className={cn(
          'shadow-sm hover:shadow-md transition-shadow duration-400 border-0 md:mt-8 relative p-3 md:h-full',
          `bg-${primaryType}-20`,
          `shadow-${primaryType}`
        )}
      >
        <div className="flex flex-col gap-2 relative z-20">
          <h2 className="text-md md:text-lg font-bold leading-none line-clamp-1">{location.area}</h2>
          <div className='flex flex-wrap gap-1 justify-start'>
            <Badge variant='locations' className="text-[11px] md:text-sm capitalize tracking-[0]">
              {location.pokemonCount ?? 0} {(location.pokemonCount === 1) ? 'Pokémon' : 'Pokémon'}
            </Badge>
            {location.hasHiddenGrottoes && (
              <Badge variant='grotto' className="text-[11px] md:text-sm capitalize tracking-[0]">
                Hidden Grotto
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default LocationCard;
