'use client';

import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LocationInfoTableProps {
  region?: string;
  types?: string[];
  connectionCount?: number;
  encounterCount?: number;
  itemCount?: number;
  eventCount?: number;
  trainerCount?: number;
}

const regionColors: Record<string, string> = {
  johto: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  kanto: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
  orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
};

export function LocationInfoTable({
  region,
  types,
  connectionCount,
  encounterCount,
  itemCount,
  eventCount,
  trainerCount,
}: LocationInfoTableProps) {
  const regionKey = region?.toLowerCase() || '';
  const regionColor =
    regionColors[regionKey] ||
    'bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 border-neutral-500/30';

  return (
    <div className="w-full mx-auto md:mx-0 relative z-10 rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Table className="w-full text-sm table-auto">
        <TableBody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {/* Region */}
          {region && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 w-[120px] align-top">
                Region
              </TableHead>
              <TableCell className="px-4 py-2">
                <Badge variant="outline" className={cn('border text-xs font-medium', regionColor)}>
                  {region}
                </Badge>
              </TableCell>
            </TableRow>
          )}

          {/* Location Types */}
          {types && types.length > 0 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Type
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200 capitalize">
                {types.join(', ')}
              </TableCell>
            </TableRow>
          )}

          {/* Connections */}
          {connectionCount !== undefined && connectionCount > 0 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Connections
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                {connectionCount} connected location{connectionCount !== 1 ? 's' : ''}
              </TableCell>
            </TableRow>
          )}

          {/* Wild Pokémon */}
          {encounterCount !== undefined && encounterCount > 0 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Wild Pokémon
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                {encounterCount} species
              </TableCell>
            </TableRow>
          )}

          {/* Items */}
          {itemCount !== undefined && itemCount > 0 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Items
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </TableCell>
            </TableRow>
          )}

          {/* Events */}
          {eventCount !== undefined && eventCount > 0 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Events
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                {eventCount} event{eventCount !== 1 ? 's' : ''}
              </TableCell>
            </TableRow>
          )}

          {/* Trainers */}
          {trainerCount !== undefined && trainerCount > 0 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Trainers
              </TableHead>
              <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                {trainerCount} trainer{trainerCount !== 1 ? 's' : ''}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
