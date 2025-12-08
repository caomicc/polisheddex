'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getItemSpriteName } from '@/utils/spriteUtils';
import { cn } from '@/lib/utils';

interface ItemSpriteProps {
  itemName: string;
  category?: string;
  size?: number;
  className?: string;
}

export function ItemSprite({ itemName, category, size = 24, className }: ItemSpriteProps) {
  const [hasError, setHasError] = useState(false);

  // Use TM/HM sprite for those categories
  const isTmHm = category === 'tm' || category === 'hm';
  const spriteUrl = isTmHm
    ? `/sprites/items/tm_hm.png`
    : `/sprites/items/${getItemSpriteName(itemName)}.png`;

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-sm text-gray-400',
          className
        )}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }

  return (
    <Image
      src={spriteUrl}
      alt={itemName}
      width={size}
      height={size}
      className={cn('rounded-sm dark:bg-white', className)}
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
