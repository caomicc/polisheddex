import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface ItemUsageCardProps {
  usage: string;
  className?: string;
}

export function ItemUsageCard({ usage, className }: ItemUsageCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
          How to Use
        </h3>
      </div>
      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{usage}</p>
    </div>
  );
}
