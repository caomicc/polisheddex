import { DetailCard } from '@/components/ui/detail-card';
import { Zap, Crosshair, Battery, FolderOpen } from 'lucide-react';

interface MoveStatsCardProps {
  power?: number;
  accuracy?: number | string;
  pp?: number;
  category?: string;
  className?: string;
}

export function MoveStatsCard({ power, accuracy, pp, category, className }: MoveStatsCardProps) {
  return (
    <DetailCard title="Move Stats" icon={Zap} className={className}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <FolderOpen className="h-4 w-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Category</span>
          </div>
          <span className="block text-lg font-bold text-neutral-800 dark:text-neutral-100 capitalize">
            {category || '—'}
          </span>
        </div>

        <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Zap className="h-4 w-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Power</span>
          </div>
          <span className="block text-lg font-bold text-neutral-800 dark:text-neutral-100">
            {power && power > 0 ? power : '—'}
          </span>
        </div>

        <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Crosshair className="h-4 w-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Accuracy</span>
          </div>
          <span className="block text-lg font-bold text-neutral-800 dark:text-neutral-100">
            {accuracy && Number(accuracy) > 0 ? `${accuracy}%` : '—'}
          </span>
        </div>

        <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Battery className="h-4 w-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">PP</span>
          </div>
          <span className="block text-lg font-bold text-neutral-800 dark:text-neutral-100">
            {pp || '—'}
          </span>
        </div>
      </div>
    </DetailCard>
  );
}
