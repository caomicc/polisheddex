import { BaseData, PokemonType } from '@/types/types';
import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { getTypeGradientProps } from '@/utils/css-gradients';
import { TYPE_COLORS } from '@/contexts/PokemonTypeContext';

export interface PokemonCardProps {
  pokemon: BaseData & { formName?: string };
  sortType?: string;
  showUpdatedTypes?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  sortType = 'nationaldex',
  showUpdatedTypes = true,
}) => {
  // Get the appropriate types based on preference
  const displayTypes = showUpdatedTypes ? pokemon.updatedTypes || pokemon.types : pokemon.types;

  let displayName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

  if (pokemon.name) {
    // Handle special cases for names
    if (pokemon.name === 'nidoran-f') {
      displayName = 'Nidoran ♀';
    } else if (pokemon.name === 'nidoran-m') {
      displayName = 'Nidoran ♂';
    } else if (pokemon.name === 'Mr-Mime') {
      displayName = 'Mr. Mime';
    } else if (pokemon.name === 'Mime-Jr') {
      displayName = 'Mime Jr.';
    } else if (pokemon.name === 'Farfetchd') {
      displayName = "Farfetch'd";
    } else if (pokemon.name === 'Sirfetchd') {
      displayName = "Sirfetch'd";
    } else if (pokemon.name === 'Ho-Oh') {
      displayName = 'Ho-Oh';
    } else if (pokemon.name === 'mr-rime' || pokemon.name === 'Mr-Rime') {
      displayName = 'Mr. Rime';
    } else if (pokemon.name === 'Farigiraf') {
      displayName = 'Farigiraf';
    }
  }
  // Get the primary type for styling
  const primaryType = displayTypes
    ? typeof displayTypes === 'string'
      ? displayTypes.toLowerCase()
      : Array.isArray(displayTypes) && displayTypes.length > 0
        ? displayTypes[0].toLowerCase()
        : 'unknown'
    : 'unknown';

  const secondaryType =
    Array.isArray(displayTypes) && displayTypes.length > 1 ? displayTypes[1].toLowerCase() : null;

  // Generate CSS-based gradient props
  const gradientProps = getTypeGradientProps(primaryType, secondaryType || undefined);

  /**
   * Get color values for types from the type content.
   * Assumes you have a type color map available from your type content.
   * Example: { fire: '#F08030', water: '#6890F0', ... }
   */

  const primaryTypeInfo = TYPE_COLORS[(primaryType as keyof typeof TYPE_COLORS) || 'normal'];
  // const secondaryTypeInfo = secondaryType
  //   ? TYPE_COLORS[(secondaryType as keyof typeof TYPE_COLORS) || 'normal']
  //   : undefined;

  // Generate the correct URL with form parameter if needed

  return (
    <Card
      className={cn(
        'shadow-md md:shadow-lg md:hover:shadow-xl transition-shadow duration-400 md:text-center border-0 md:mt-8 relative p-3 md:p-4 md:pb-5 md:pt-[65px] h-[110px] md:h-auto gap-1 md:gap-6',
        gradientProps.className,
        `shadow-${primaryType.toLowerCase()}`,
      )}
      style={gradientProps.style}
    >
      <div
        className={cn(
          'bg-white absolute p-2 w-12 md:w-20 h-12 md:h-20 right-2 bottom-2 md:bottom-auto md:right-auto md:top-0 md:left-1/2 transform md:-translate-x-1/2 md:-translate-y-1/2 z-0 md:z-10 rounded-xl',
          `shadow-lg shadow-${primaryType.toLowerCase()}`,
        )}
      >
        <img
          src={
            pokemon.forms && pokemon.forms?.length
              ? `/sprites/pokemon/${pokemon.name.toLowerCase().replace(/-/g, '_')}/normal_front.png`
              : `/sprites/pokemon/${pokemon.name.toLowerCase().replace(/-/g, '_')}/normal_front.png`
          }
          alt={`${pokemon.name} sprite`}
          className="mx-auto relative top-1/2 -translate-y-1/2"
        />
      </div>
      <p
        className={cn(
          'text-xs md:text-lg md:absolute  md:top-4 md:left-4 ',
          pokemon.nationalDex === null && pokemon.johtoDex === null ? 'hidden' : '',
        )}
      >
        #
        {sortType === 'johtodex'
          ? pokemon.johtoDex !== null && pokemon.johtoDex < 999
            ? pokemon.johtoDex
            : '—'
          : pokemon.nationalDex !== null
            ? pokemon.nationalDex
            : '—'}
      </p>
      <div className="flex flex-col gap-0 relative z-20">
        <h2
          className="text-sm md:text-xl md:mb-4 font-bold leading-none mb-2 dark:text-white!"
          style={{ color: primaryTypeInfo?.text }}
        >
          {displayName}
        </h2>
        <div className="flex md:justify-center gap-1 md:gap-2 flex-col md:flex-row">
          {(Array.isArray(displayTypes) ? displayTypes : [displayTypes]).map((type) => (
            <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PokemonCard;
