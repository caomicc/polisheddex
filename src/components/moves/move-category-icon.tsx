import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface MoveCategoryIconProps {
  category: 'unknown' | 'physical' | 'special' | 'status';
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

const MoveCategoryIcon: React.FC<MoveCategoryIconProps> = ({
  category,
  size = 18,
  className,
  showTooltip = true,
}) => {
  // Convert category to lowercase and ensure it's a valid string
  const normalizedCategory = String(category || 'status').toLowerCase() as
    | 'unknown'
    | 'physical'
    | 'special'
    | 'status';

  const icon = (
    <div className={cn('flex items-center justify-center')}>
      <div
        className={cn(
          'inline-flex items-center justify-center px-2 w-auto rounded-sm mt-[1px]',
          `bg-${normalizedCategory} border-black/20 border-1`,
          className,
        )}
      >
        <Image
          src={`/sprites/attack-${normalizedCategory}.png`}
          alt={`${category} category`}
          width={size}
          height={size}
          className="object-contain aspect-square"
        />
      </div>
    </div>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{icon}</TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">{normalizedCategory}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return icon;
};

export default MoveCategoryIcon;
