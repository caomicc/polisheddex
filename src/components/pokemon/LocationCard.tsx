import Link from 'next/link';
import React from 'react';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { getDisplayLocationName } from '../utils';
import { LocationData } from '@/types/types';
import { normalizeLocationKey } from '@/utils/locationUtils';

export interface LocationCardProps {
  location: {
    area: string;
    urlName?: string; // Add urlName for proper routing
    displayName?: string;
    types?: string[] | string;
    pokemonCount?: number;
    hasHiddenGrottoes?: boolean;
    region?: string;
    flyable?: boolean;
    connections?: Array<{
      direction: string;
      targetLocation: string;
      targetLocationDisplay: string;
      offset: number;
    }>;
    coordinates?: { x: number; y: number };
  };
}

const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  // Determine the primary type for styling
  const primaryType =
    typeof location.types === 'string'
      ? location.types.toLowerCase()
      : Array.isArray(location.types) && location.types.length > 0
        ? location.types[0].toLowerCase()
        : 'normal';

  const displayName = location.displayName || getDisplayLocationName(location.area);
  // Use urlName if available (should be pre-normalized), otherwise normalize the area as fallback
  const urlName =
    location.urlName || (location.area ? normalizeLocationKey(location.area) : location.area);

  return (
    <Link href={`/locations/${encodeURIComponent(urlName)}`}>
      <Card
        className={cn(
          'shadow-sm hover:shadow-md transition-shadow duration-400 border-0 relative p-3 md:h-full gap-0',
          `bg-${primaryType}-20`,
          `shadow-${primaryType}`,
        )}
      >
        <div className="flex flex-col gap-4 relative z-20">
          <div className="flex justify-between items-start gap-2">
            <h2 className="text-sm md:text-md font-bold py-1 leading-none flex-grow">
              {displayName}
            </h2>
            {location.region && (
              <Badge
                variant={location.region as LocationData['region']}
                className="text-[11px] capitalize tracking-[0]"
              >
                {location.region}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-start">
            <Badge variant="locations" className="text-[11px] capitalize tracking-[0]">
              {location.pokemonCount ?? 0} {location.pokemonCount === 1 ? 'Pokémon' : 'Pokémon'}
            </Badge>

            {location.flyable && (
              <Badge variant="default" className="text-[11px] capitalize tracking-[0]">
                Flyable
              </Badge>
            )}

            {location.hasHiddenGrottoes && (
              <Badge variant="grotto" className="text-[11px] capitalize tracking-[0]">
                Hidden Grotto
              </Badge>
            )}

            {/* {location.connections && location.connections.length > 0 && (
              <Badge variant='outline' className="text-[11px] capitalize tracking-[0]">
                {location.connections.length} connection{location.connections.length !== 1 ? 's' : ''}
              </Badge>
            )} */}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default LocationCard;
