import { PokemonType } from '@/types/types';
import { PokemonManifest } from '@/types/new';
import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { getTypeGradientProps } from '@/utils/css-gradients';
import { TYPE_COLORS } from '@/contexts/PokemonTypeContext';
import { PokemonSprite } from './pokemon-sprite';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';

/**
 * Local helper function to get Pokemon types from the manifest structure
 * (Duplicate of server-side function to avoid importing server code in client component)
 */
function getPokemonTypes(
  pokemon: PokemonManifest,
  version: 'polished' | 'faithful' = 'polished',
  form: string = 'plain',
): string[] {
  return pokemon.versions?.[version]?.[form]?.types || [];
}

export interface PokemonCardProps {
  pokemon: PokemonManifest & {
    formName?: string;
    frontSpriteUrl?: string; // For backward compatibility
  };
  sortType?: string;
  showUpdatedTypes?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, sortType = 'johtodex' }) => {
  const { showFaithful } = useFaithfulPreference();

  console.log('PokemonCard', pokemon);

  // Get the appropriate types based on preference using helper function
  const version = showFaithful ? 'faithful' : 'polished';
  const form = pokemon.formName || 'plain';
  const displayTypes = getPokemonTypes(pokemon, version, form);

  console.log('Display Types', displayTypes);

  const displayName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

  // Get the primary type for styling (getPokemonTypes always returns an array)
  const primaryType = displayTypes.length > 0 ? displayTypes[0].toLowerCase() : 'unknown';
  const secondaryType = displayTypes.length > 1 ? displayTypes[1].toLowerCase() : null;

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
        pokemonName={pokemon.id} // Use id for sprite naming
        alt={`${pokemon.name} sprite`}
        primaryType={primaryType as PokemonType['name']}
        variant="normal"
        type="static"
        form={pokemon.formName || 'plain'}
        src={pokemon.frontSpriteUrl || `/sprites/pokemon/${pokemon.id}.png`} // fallback
        className="aspect-square mb-0"
        size="default"
      />
      <div className="flex w-auto justify-center flex-col ml-2">
        <p
          className={cn(
            'text-xs md:text-sm top-4 right-4 md:top-0 md:right-0 font-medium tracking-wide mb-1 absolute md:relative leading-[21px]',
            pokemon.dexNo === null && pokemon.johtoDex === null ? 'hidden' : '',
          )}
        >
          #
          {sortType === 'johtodex' ? (
            pokemon.johtoDex !== null && pokemon.johtoDex < 999 ? (
              pokemon.johtoDex
            ) : (
              <span className="text-cell text-cell-muted">—</span>
            )
          ) : pokemon.dexNo !== null ? (
            pokemon.dexNo
          ) : (
            <span className="text-cell text-cell-muted">—</span>
          )}
        </p>

        {pokemon.formName && pokemon.formName !== 'plain' ? (
          <Badge
            variant="form"
            className={cn(
              'text-xxs md:rounded-sm absolute top-4 right-12 md:right-4',
              pokemon.dexNo === null && pokemon.johtoDex === null ? 'hidden' : '',
            )}
          >
            {pokemon.formName
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
          {displayTypes.map((type, idx) => (
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
