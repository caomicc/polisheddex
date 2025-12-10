'use client';

import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BADGE_LEVEL_THRESHOLDS, formatBadgeLevelWithOffsets } from '@/data/badge-levels';
import { cn } from '@/lib/utils';

interface BadgeLevelLegendProps {
  /** Array of offsets from badge-relative encounters (e.g., [-1, 0, +2]) */
  offsets: number[];
  className?: string;
}

/**
 * A collapsible legend showing badge level thresholds with gym leader names.
 * Displays in 2 columns: Johto (0-8 badges) and Kanto (9-16 badges).
 * Shows levels with ± offset notation when multiple offsets exist.
 */
export function BadgeLevelLegend({ offsets, className }: BadgeLevelLegendProps) {
  const [isOpen, setIsOpen] = useState(false);

  const minOffset = Math.min(...offsets);
  const maxOffset = Math.max(...offsets);

  const johtoThresholds = BADGE_LEVEL_THRESHOLDS.filter((t) => t.region === 'johto');
  const kantoThresholds = BADGE_LEVEL_THRESHOLDS.filter((t) => t.region === 'kanto');

  const formatThresholdLevel = (baseLevel: number) => {
    return formatBadgeLevelWithOffsets(baseLevel, minOffset, maxOffset);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('mb-4', className)}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-left text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          <span>Badge Level Scaling</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            (Wild Pokémon levels scale with your badges)
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-neutral-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Johto Column */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Johto
            </h4>
            <div className="space-y-1.5">
              {johtoThresholds.map((threshold) => (
                <div
                  key={threshold.badges}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {threshold.gymLeader
                      ? `After ${threshold.gymLeader}`
                      : '0 badges'}
                  </span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {formatThresholdLevel(threshold.level)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kanto Column */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Kanto
            </h4>
            <div className="space-y-1.5">
              {kantoThresholds.map((threshold) => (
                <div
                  key={threshold.badges}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-600 dark:text-neutral-400">
                    After {threshold.gymLeader}
                  </span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {formatThresholdLevel(threshold.level)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
