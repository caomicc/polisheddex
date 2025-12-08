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
    <div className="w-full mx-auto md:mx-0 relative z-10 rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Table className="w-full text-sm table-auto">
        <TableBody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {/* Category */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 w-[120px] align-top">
              Category
            </TableHead>
            <TableCell className="px-4 py-2">
              <Badge variant="secondary">{categoryLabel}</Badge>
            </TableCell>
          </TableRow>

          {/* Price */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Price
            </TableHead>
            <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {price !== undefined && price > 0 ? (
                <span className="font-medium text-green-600 dark:text-green-400">₽{price.toLocaleString()}</span>
              ) : (
                <span className="text-neutral-500">Can't be sold</span>
              )}
            </TableCell>
          </TableRow>

          {/* Description */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Effect
            </TableHead>
            <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {description}
            </TableCell>
          </TableRow>

          {/* Usage */}
          {usage && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                How to Use
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                {usage}
              </TableCell>
            </TableRow>
          )}

          {/* TM/HM Move */}
          {isTmHm && moveName && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Teaches
              </TableHead>
              <TableCell className="px-4 py-2">
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
