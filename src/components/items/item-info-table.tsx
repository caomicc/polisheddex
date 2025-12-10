'use client';

import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface MoveInfo {
  name: string;
  type: string;
  category: string;
  power: number;
  accuracy: number | string;
  pp: number;
}

interface ItemInfoTableProps {
  name: string;
  description: string;
  category?: string;
  price?: number;
  usage?: string;
  moveName?: string;
  moveData?: MoveInfo | null;
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

export function ItemInfoTable({
  description,
  category,
  price,
  usage,
  moveName,
  moveData,
}: ItemInfoTableProps) {
  const categoryKey = category?.toLowerCase() || 'item';
  const categoryLabel = categoryLabels[categoryKey] || category || 'Item';
  const isTmHm = category === 'tm' || category === 'hm';
  const moveSlug = moveName?.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');

  return (
    <div className="info-table-wrapper">
      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {/* Category */}
        <div className="info-row">
          <div className="info-row-label">Category</div>
          <div className="info-row-value">
            <Badge variant={category}>{categoryLabel}</Badge>
          </div>
        </div>

        {/* Price */}
        <div className="info-row">
          <div className="info-row-label">Price</div>
          <div className="info-row-value">
            {price !== undefined && price > 0 ? (
              <span className="font-medium text-green-600 dark:text-green-400">₽{price.toLocaleString()}</span>
            ) : (
              <span className="text-neutral-500">Can't be sold</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="info-row">
          <div className="info-row-label">Effect</div>
          <div className="info-row-value">{description}</div>
        </div>

        {/* Usage */}
        {usage && (
          <div className="info-row">
            <div className="info-row-label">How to Use</div>
            <div className="info-row-value">{usage}</div>
          </div>
        )}

        {/* TM/HM Move */}
        {isTmHm && moveName && (
          <div className="info-row">
            <div className="info-row-label">Teaches</div>
            <div className="info-row-value">
              <div className="space-y-2">
                <Link
                  href={`/moves/${moveSlug}`}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline capitalize"
                >
                  {moveName.replace(/_/g, ' ')}
                </Link>
                {moveData && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Badge variant={moveData.type.toLowerCase()}>{moveData.type}</Badge>
                    <span>•</span>
                    <span>{moveData.category}</span>
                    <span>•</span>
                    <span>Power: {moveData.power > 0 ? moveData.power : '—'}</span>
                    <span>•</span>
                    <span>Acc: {moveData.accuracy && moveData.accuracy !== 0 ? `${moveData.accuracy}%` : '—'}</span>
                    <span>•</span>
                    <span>PP: {moveData.pp}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
