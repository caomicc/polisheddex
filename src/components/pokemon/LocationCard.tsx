import Link from 'next/link';
import React from 'react';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { getDisplayLocationName } from '../utils';

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

  const displayName = getDisplayLocationName(location.area);

  return (
    <Link href={`/locations/${encodeURIComponent(location.area)}`}>
      <Card
        className={cn(
          'shadow-sm hover:shadow-md transition-shadow duration-400 border-0 relative p-3 md:h-full gap-0',
          `bg-${primaryType}-20`,
          `shadow-${primaryType}`
        )}
      >
        <div className="flex flex-col gap-4 relative z-20">
          <h2 className="text-sm md:text-md font-bold leading-none line-clamp-1">{displayName}</h2>
          <div className='flex flex-wrap gap-2 justify-start'>
            <Badge variant='locations' className="text-[11px] capitalize tracking-[0]">
              {location.pokemonCount ?? 0} {(location.pokemonCount === 1) ? 'Pokémon' : 'Pokémon'}
            </Badge>
            {location.hasHiddenGrottoes && (
              <Badge variant='grotto' className="text-[11px] capitalize tracking-[0]">
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
