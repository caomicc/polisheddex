import { BaseData, PokemonType } from '@/types/types';
import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { getTypeGradientProps } from '@/utils/css-gradients';
import { TYPE_COLORS } from '@/contexts/PokemonTypeContext';
import { PokemonSprite } from './pokemon-sprite';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';

export interface PokemonCardProps {
  pokemon: BaseData & { formName?: string };
  sortType?: string;
  showUpdatedTypes?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, sortType = 'johtodex' }) => {
  const { showFaithful } = useFaithfulPreference();

  console.log('PokemonCard', pokemon);

  // Get the appropriate types based on preference
  const displayTypes = showFaithful
    ? pokemon.faithfulTypes || pokemon.types
    : pokemon.updatedTypes || pokemon.types;

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

  const baseClassName = cn(
    'group/bento row-span-1 flex flex-row justify-start space-y-4 rounded-xl border border-neutral-200 bg-white p-4 transition duration-200 hover:shadow-xl dark:border-white/[0.2] dark:bg-black shadow-none relative gap-2',
    gradientProps.className,
    `shadow-${primaryType.toLowerCase()}`,
  );

  return (
    <Card className={baseClassName} style={gradientProps.style}>
      <PokemonSprite
        hoverAnimate={true}
        pokemonName={pokemon.name}
        alt={`${pokemon.name} sprite`}
        primaryType={primaryType as PokemonType['name']}
        variant="normal"
        type="static"
        form={typeof pokemon.form === 'string' ? pokemon.form : 'plain'}
        src={pokemon.frontSpriteUrl} // fallback for backward compatibility
        className="aspect-square mb-0"
        size="default"
      />
      <div className="flex w-auto justify-center flex-col ml-2">
        <p
          className={cn(
            'text-xs md:text-sm top-4 right-4 md:top-0 md:right-0 font-medium tracking-wide mb-1 absolute md:relative leading-[21px]',
            pokemon.nationalDex === null && pokemon.johtoDex === null ? 'hidden' : '',
          )}
        >
          #
          {sortType === 'johtodex' ? (
            pokemon.johtoDex !== null && pokemon.johtoDex < 999 ? (
              pokemon.johtoDex
            ) : (
              <span className="text-cell text-cell-muted">—</span>
            )
          ) : pokemon.nationalDex !== null ? (
            pokemon.nationalDex
          ) : (
            <span className="text-cell text-cell-muted">—</span>
          )}
        </p>

        {pokemon.form ? (
          <Badge
            variant="form"
            className={cn(
              'text-xxs md:rounded-sm absolute top-4 right-12 md:right-4',
              pokemon.nationalDex === null && pokemon.johtoDex === null ? 'hidden' : '',
            )}
          >
            {pokemon.form
              .toString()
              .replace(/_/g, ' ')
              .replace(/\bsegment\b/gi, 'seg.')}
          </Badge>
        ) : null}
        <h2
          className="text-sm md:text-lg md:mb-2 font-black leading-none mb-2 dark:text-white!"
          style={{ color: primaryTypeInfo?.text }}
        >
          {displayName}
        </h2>
        <div className="flex md:justify-start gap-1 md:gap-2 flex-row md:flex-row">
          {(Array.isArray(displayTypes) ? displayTypes : [displayTypes]).map((type, idx) => (
            <Badge key={type + idx} variant={type.toLowerCase() as PokemonType['name']}>
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PokemonCard;
