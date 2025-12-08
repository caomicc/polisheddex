'use client';

import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
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
    <div className="w-full mx-auto md:mx-0 relative z-10 rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Table className="w-full text-sm table-auto">
        <TableBody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {/* Type */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 w-[120px] align-top">
              Type
            </TableHead>
            <TableCell className="px-4 py-2">
              {type ? (
                <Badge variant={type.toLowerCase() as any}>{type}</Badge>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </TableCell>
          </TableRow>

          {/* Category */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Category
            </TableHead>
            <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200 capitalize">
              {category || '—'}
            </TableCell>
          </TableRow>

          {/* Power */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Power
            </TableHead>
            <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {power && power > 0 ? (
                <span className="font-medium">{power}</span>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </TableCell>
          </TableRow>

          {/* Accuracy */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Accuracy
            </TableHead>
            <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {accuracy && Number(accuracy) > 0 ? (
                <span className="font-medium">{accuracy}%</span>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </TableCell>
          </TableRow>

          {/* PP */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              PP
            </TableHead>
            <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {pp ? (
                <span className="font-medium">{pp}</span>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </TableCell>
          </TableRow>

          {/* Effect Chance */}
          {effectChance !== undefined && effectChance > 0 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Effect Chance
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                <span className="font-medium">{effectChance}%</span>
              </TableCell>
            </TableRow>
          )}

          {/* Description */}
          {description && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Effect
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                {description}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
