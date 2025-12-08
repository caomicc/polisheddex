'use client';

import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
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
      <Table className="info-table">
        <TableBody className="info-table-body">
          {/* Category */}
          <TableRow>
            <TableHead className="info-table-label">
              Category
            </TableHead>
            <TableCell className="info-table-cell">
              <Badge variant="secondary">{categoryLabel}</Badge>
            </TableCell>
          </TableRow>

          {/* Price */}
          <TableRow>
            <TableHead className="info-table-label">
              Price
            </TableHead>
            <TableCell className="info-table-cell">
              {price !== undefined && price > 0 ? (
                <span className="font-medium text-green-600 dark:text-green-400">₽{price.toLocaleString()}</span>
              ) : (
                <span className="text-neutral-500">Can't be sold</span>
              )}
            </TableCell>
          </TableRow>

          {/* Description */}
          <TableRow>
            <TableHead className="info-table-label">
              Effect
            </TableHead>
            <TableCell className="info-table-cell">
              {description}
            </TableCell>
          </TableRow>

          {/* Usage */}
          {usage && (
            <TableRow>
              <TableHead className="info-table-label">
                How to Use
              </TableHead>
              <TableCell className="info-table-cell">
                {usage}
              </TableCell>
            </TableRow>
          )}

          {/* TM/HM Move */}
          {isTmHm && moveName && (
            <TableRow>
              <TableHead className="info-table-label">
                Teaches
              </TableHead>
              <TableCell className="info-table-cell">
                <div className="space-y-2">
                  <Link
                    href={`/moves/${moveSlug}`}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline capitalize"
                  >
                    {moveName.replace(/_/g, ' ')}
                  </Link>
                  {moveData && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Badge variant={moveData.type.toLowerCase() as any}>{moveData.type}</Badge>
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
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
