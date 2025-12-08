'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SpriteVariant, SpriteType, SpriteFacing } from '@/types/spriteTypes';
import { useSpriteData } from '@/hooks/useSpriteData';
import { cva } from 'class-variance-authority';

interface PokemonSpriteProps {
  className?: string;
  pokemonName: string;
  alt?: string;
  primaryType?: string;
  variant?: SpriteVariant;
  type?: SpriteType;
  facing?: SpriteFacing;
  form?: string | null; // Optional form prop for specific Pokemon forms
  // Legacy prop for backward compatibility
  src?: string;
  size?: 'default' | 'sm';
  // New hover animation prop
  hoverAnimate?: boolean;
}

export type { PokemonSpriteProps };

const spriteVariants = cva('relative bg-white flex', {
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
...props
}: PokemonSpriteProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);


const {className,
  pokemonName,
  alt,
  primaryType,
  variant = 'normal',
  type = 'static',
  facing = 'front',
  src,
  size,
  form, // Optional form prop for specific Pokemon forms
  hoverAnimate = false } = props;

  // Determine the sprite type: use hover state if hoverAnimate is enabled, otherwise use the type prop
  const actualType = hoverAnimate ? (isHovered ? 'animated' : 'static') : type;

  const { spriteInfo, isLoading } = useSpriteData(pokemonName, variant, actualType, form, facing);

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

  if (!finalSrc || hasError) {
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
        className="mx-auto relative object-contain"
        priority={false}
        quality={85}
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  );
}
