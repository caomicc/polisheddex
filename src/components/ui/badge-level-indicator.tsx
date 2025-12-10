'use client';

import { Shield } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BadgeLevelIndicatorProps {
  /** The level range string, e.g., "Badge +2" or "Badge -1 to +3" */
  levelRange: string;
  className?: string;
}

/**
 * Inline indicator for badge-relative wild Pokémon levels.
 * Shows a Shield icon with tooltip explaining the scaling mechanic.
 */
export function BadgeLevelIndicator({ levelRange, className }: BadgeLevelIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center gap-1 cursor-help', className)}>
          <Shield className="h-3.5 w-3.5 text-blue-500" />
          <span>{levelRange}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Level scales with badges earned</p>
      </TooltipContent>
    </Tooltip>
  );
}
