import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LocationEntry, PokemonType } from '@/types/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface TypeIconProps {
  time: LocationEntry['time'] | string;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

const TimeIcon: React.FC<TypeIconProps> = ({ time, size = 16, className, showTooltip = true }) => {
  // Convert time to lowercase and ensure it's a valid, non-null string
  const normalizedTime: string = (typeof time === 'string' && time ? time : 'day').toLowerCase();

  const icon = (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full w-8 h-8 p-2',
        `bg-${normalizedTime}`,
        className,
      )}
    >
      <Image
        src={`/icons/${normalizedTime.charAt(0).toUpperCase() + normalizedTime.slice(1)}_icon.svg`}
        alt={`${normalizedTime} time`}
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
          <p className="capitalize">{normalizedTime}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return icon;
};

export default TimeIcon;
