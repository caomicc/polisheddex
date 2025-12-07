import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import TypeBadge from '@/components/type-badge';
import { Sparkles } from 'lucide-react';

interface MoveInfo {
  name: string;
  type: string;
  category: string;
  power: number;
  accuracy: number | string;
  pp: number;
}

interface ItemEffectCardProps {
  category?: string;
  moveName?: string;
  moveData?: MoveInfo | null;
  className?: string;
}

export function ItemEffectCard({ category, moveName, moveData, className }: ItemEffectCardProps) {
  const isTmHm = category === 'tm' || category === 'hm';

  if (!isTmHm || !moveName) {
    return null;
  }

  const moveSlug = moveName.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
          Teaches Move
        </h3>
      </div>

      <Link
        href={`/moves/${moveSlug}`}
        className="inline-block text-xl font-bold text-neutral-800 dark:text-neutral-100 hover:text-primary dark:hover:text-primary transition-colors capitalize mb-3"
      >
        {moveName.replace(/_/g, ' ')}
      </Link>

      {moveData && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <TypeBadge type={moveData.type} />
            <Badge
              variant="outline"
              className="border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 text-xs"
            >
              {moveData.category}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <span className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Power
              </span>
              <span className="block text-lg font-bold text-neutral-800 dark:text-neutral-100">
                {moveData.power > 0 ? moveData.power : '—'}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Accuracy
              </span>
              <span className="block text-lg font-bold text-neutral-800 dark:text-neutral-100">
                {moveData.accuracy && moveData.accuracy !== 0 ? `${moveData.accuracy}%` : '—'}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">PP</span>
              <span className="block text-lg font-bold text-neutral-800 dark:text-neutral-100">
                {moveData.pp}
              </span>
            </div>
          </div>
        </>
      )}

      {!moveData && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          View move details →
        </p>
      )}
    </div>
  );
}
