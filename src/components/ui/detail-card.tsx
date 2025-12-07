import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface DetailCardProps {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function DetailCard({ title, icon: Icon, children, className }: DetailCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800',
        className
      )}
    >
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />}
          {title && (
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
              {title}
            </h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
