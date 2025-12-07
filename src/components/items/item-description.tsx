import { cn } from '@/lib/utils';

interface ItemDescriptionProps {
  description: string;
  className?: string;
}

export function ItemDescription({ description, className }: ItemDescriptionProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800',
        className
      )}
    >
      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{description}</p>
    </div>
  );
}
