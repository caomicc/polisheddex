import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PokemonType } from '@/types/types';
import { SpriteVariant, SpriteType } from '@/types/spriteTypes';
import { useSpriteData } from '@/hooks/useSpriteData';
import { cva } from 'class-variance-authority';

interface PokemonSpriteProps {
  className?: string;
  pokemonName: string;
  alt?: string;
  primaryType?: PokemonType['name'];
  variant?: SpriteVariant;
  type?: SpriteType;
  form?: string; // Optional form prop for specific Pokemon forms
  // Legacy prop for backward compatibility
  src?: string;
  size?: 'default' | 'sm';
  // New hover animation prop
  hoverAnimate?: boolean;
}

const spriteVariants = cva('relative bg-white', {
  variants: {
    size: {
      default: 'aspect-square p-2 w-12 md:w-20 rounded-lg md:rounded-lg',
      sm: 'aspect-square w-10 p-1 rounded-md',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export function PokemonSprite({
  className,
  pokemonName,
  alt,
  primaryType,
  variant = 'normal',
  type = 'static',
  src,
  size,
  form, // Optional form prop for specific Pokemon forms
  hoverAnimate = false,
}: PokemonSpriteProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine the sprite type: use hover state if hoverAnimate is enabled, otherwise use the type prop
  const actualType = hoverAnimate ? (isHovered ? 'animated' : 'static') : type;

  const { spriteInfo, isLoading } = useSpriteData(pokemonName, variant, actualType, form);

  // Fallback to legacy src prop if provided and sprite data not available
  const finalSrc = spriteInfo?.url || src;
  const width = spriteInfo?.width || 64;
  const height = spriteInfo?.height || 64;

  if (isLoading) {
    return (
      <div
        className={cn(
          spriteVariants({ size }),
          `shadow-sm shadow-${primaryType?.toLowerCase()}`,
          'animate-pulse aspect-square',
          className,
        )}
      />
    );
  }

  if (!finalSrc) {
    return (
      <div
        className={cn(
          spriteVariants({ size }),
          `shadow-sm shadow-${primaryType?.toLowerCase()}`,
          'flex items-center justify-center text-gray-400',
          className,
        )}
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={cn(
        spriteVariants({ size }),
        `shadow-sm shadow-${primaryType?.toLowerCase()}`,
        className,
      )}
      onMouseEnter={hoverAnimate ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverAnimate ? () => setIsHovered(false) : undefined}
    >
      <Image
        src={
          finalSrc && !finalSrc.startsWith('http') && !finalSrc.startsWith('/')
            ? `/${finalSrc}`
            : finalSrc || ''
        }
        alt={alt || `${pokemonName} sprite`}
        width={width}
        height={height}
        className="mx-auto relative top-1/2 -translate-y-1/2 object-contain"
        priority={false}
        quality={85}
      />
    </div>
  );
}
