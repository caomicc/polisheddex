import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MoveDescription } from '@/types/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface MoveCategoryIconProps {
  category: MoveDescription['category'];
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

const MoveCategoryIcon: React.FC<MoveCategoryIconProps> = ({
  category,
  size = 16,
  className,
  showTooltip = true,
}) => {
  // Convert category to lowercase and ensure it's a valid string
  const normalizedCategory = String(
    category || 'status',
  ).toLowerCase() as MoveDescription['category'];

  const icon = (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full w-6 h-6 p-[6px] md:w-8 md:h-8 md:p-2',
        `bg-${normalizedCategory}`,
        className,
      )}
    >
      <Image
        src={`/sprites/attack-${normalizedCategory}.svg`}
        alt={`${category} category`}
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
          <p className="capitalize">{normalizedCategory}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return icon;
};

export default MoveCategoryIcon;
