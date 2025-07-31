import * as React from 'react';
import { cn } from '@/lib/utils';
import { PokemonType } from '@/types/types';

interface PokemonSpriteProps {
  className?: string;
  src: string;
  alt?: string;
  primaryType?: PokemonType['name']; // Optional, can be used for styling or additional features
}

export function PokemonSprite({ className, src, alt, primaryType }: PokemonSpriteProps) {
  return (
    <div
      className={cn(
        'relative bg-white p-2 w-12 md:w-20 h-12 md:h-20 rounded-xl',
        `shadow-lg shadow-${primaryType?.toLowerCase()}`,
        className,
      )}
    >
      <img src={src} alt={alt} className="mx-auto relative top-1/2 -translate-y-1/2" />
    </div>
  );
}
