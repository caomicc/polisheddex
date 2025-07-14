import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PokemonType } from '@/types/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface TypeIconProps {
  type: PokemonType['name'] | string;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

const TypeIcon: React.FC<TypeIconProps> = ({ type, size = 16, className, showTooltip = true }) => {
  // Convert type to lowercase and ensure it's a valid string
  const normalizedType = String(type || 'normal').toLowerCase() as PokemonType['name'];

  const icon = (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full w-6 h-6 p-[6px] md:w-8 md:h-8 md:p-2',
        `bg-${normalizedType}`,
        className,
      )}
    >
      <Image
        src={`/icons/${normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)}_icon.png`}
        alt={`${type} type`}
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{icon}</TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">{normalizedType} type</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return icon;
};

export default TypeIcon;
