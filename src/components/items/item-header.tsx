'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ItemSprite } from './item-sprite';

interface ItemHeaderProps {
  name: string;
  category?: string;
  price?: number;
  className?: string;
}

const categoryLabels: Record<string, string> = {
  tm: 'TM',
  hm: 'HM',
  item: 'Item',
  medicine: 'Medicine',
  ball: 'Poké Ball',
  keyitem: 'Key Item',
  berries: 'Berry',
  mail: 'Mail',
  candy: 'Candy',
};

const categoryColors: Record<string, string> = {
  tm: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  hm: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  item: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  medicine: 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30',
  ball: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  keyitem: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
  berries: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
  mail: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  candy: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
};

export function ItemHeader({ name, category, price, className }: ItemHeaderProps) {
  const categoryKey = category?.toLowerCase() || 'item';
  const categoryLabel = categoryLabels[categoryKey] || category || 'Item';
  const categoryColor =
    categoryColors[categoryKey] || 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex-shrink-0 rounded-xl bg-white dark:bg-neutral-800 p-3 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <ItemSprite itemName={name} category={category} size={48} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 md:text-3xl">
          {name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn('border text-xs font-medium', categoryColor)}>
            {categoryLabel}
          </Badge>
          {price !== undefined && price > 0 ? (
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              ₽{price.toLocaleString()}
            </span>
          ) : (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Can&apos;t be sold</span>
          )}
        </div>
      </div>
    </div>
  );
}
