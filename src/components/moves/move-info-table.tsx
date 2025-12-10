'use client';

import { Badge } from '@/components/ui/badge';

interface MoveInfoTableProps {
  type?: string;
  category?: string;
  power?: number;
  accuracy?: number | string;
  pp?: number;
  effectChance?: number;
  description?: string;
}

export function MoveInfoTable({
  type,
  category,
  power,
  accuracy,
  pp,
  effectChance,
  description,
}: MoveInfoTableProps) {
  return (
    <div className="info-table-wrapper">
      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {/* Type */}
        <div className="info-row">
          <div className="info-row-label">Type</div>
          <div className="info-row-value">
            {type ? (
              <Badge variant={type.toLowerCase() as any}>{type}</Badge>
            ) : (
              <span className="text-neutral-500">—</span>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="info-row">
          <div className="info-row-label">Category</div>
          <div className="info-row-value capitalize">{category || '—'}</div>
        </div>

        {/* Power */}
        <div className="info-row">
          <div className="info-row-label">Power</div>
          <div className="info-row-value">
            {power && power > 0 ? (
              <span className="font-medium">{power}</span>
            ) : (
              <span className="text-neutral-500">—</span>
            )}
          </div>
        </div>

        {/* Accuracy */}
        <div className="info-row">
          <div className="info-row-label">Accuracy</div>
          <div className="info-row-value">
            {accuracy && Number(accuracy) > 0 ? (
              <span className="font-medium">{accuracy}%</span>
            ) : (
              <span className="text-neutral-500">—</span>
            )}
          </div>
        </div>

        {/* PP */}
        <div className="info-row">
          <div className="info-row-label">PP</div>
          <div className="info-row-value">
            {pp ? (
              <span className="font-medium">{pp}</span>
            ) : (
              <span className="text-neutral-500">—</span>
            )}
          </div>
        </div>

        {/* Effect Chance */}
        {effectChance !== undefined && effectChance > 0 && (
          <div className="info-row">
            <div className="info-row-label">Effect Chance</div>
            <div className="info-row-value">
              <span className="font-medium">{effectChance}%</span>
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="info-row">
            <div className="info-row-label">Effect</div>
            <div className="info-row-value">{description}</div>
          </div>
        )}
      </div>
    </div>
  );
}
