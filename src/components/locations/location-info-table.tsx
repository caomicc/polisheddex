'use client';

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConnectionInfo {
  direction: string;
  to: string;
  toId: string;
}

interface LocationInfoTableProps {
  region?: string;
  types?: string[];
  parent?: string;
  parentId?: string;
  connections?: ConnectionInfo[];
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

const directionLabels: Record<string, string> = {
  north: '↑ North',
  south: '↓ South',
  east: '→ East',
  west: '← West',
};

export function LocationInfoTable({
  region,
  types,
  parent,
  parentId,
  connections,
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
    <div className="info-table-wrapper">
      <Table className="info-table">
        <TableBody className="info-table-body">
          {/* Region */}
          {region && (
            <TableRow>
              <TableHead className="info-table-label">
                Region
              </TableHead>
              <TableCell className="info-table-cell">
                <Badge variant="outline" className={cn('border text-xs font-medium', regionColor)}>
                  {region}
                </Badge>
              </TableCell>
            </TableRow>
          )}

          {/* Location Types */}
          {types && types.length > 0 && (
            <TableRow>
              <TableHead className="info-table-label">
                Type
              </TableHead>
              <TableCell className="info-table-cell capitalize">
                {types.join(', ')}
              </TableCell>
            </TableRow>
          )}

          {/* Parent Location */}
          {parent && parentId && (
            <TableRow>
              <TableHead className="info-table-label">
                Part of
              </TableHead>
              <TableCell className="info-table-cell">
                <Link
                  href={`/locations/${parentId}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {parent}
                </Link>
              </TableCell>
            </TableRow>
          )}

          {/* Connections */}
          {connections && connections.length > 0 && (
            <TableRow>
              <TableHead className="info-table-label">
                Connections
              </TableHead>
              <TableCell className="info-table-cell">
                <div className="flex flex-col gap-2">
                  {connections.map((conn, index) => (
                    <Link
                      key={index}
                      href={`/locations/${conn.toId}`}
                      className="inline-flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 w-16">
                        {directionLabels[conn.direction] || conn.direction}
                      </span>
                      <span className="font-medium">{conn.to}</span>
                    </Link>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Wild Pokémon */}
          {encounterCount !== undefined && encounterCount > 0 && (
            <TableRow>
              <TableHead className="info-table-label">
                Wild Pokémon
              </TableHead>
              <TableCell className="info-table-cell">
                {encounterCount} species
              </TableCell>
            </TableRow>
          )}

          {/* Items */}
          {itemCount !== undefined && itemCount > 0 && (
            <TableRow>
              <TableHead className="info-table-label">
                Items
              </TableHead>
              <TableCell className="info-table-cell">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </TableCell>
            </TableRow>
          )}

          {/* Events */}
          {eventCount !== undefined && eventCount > 0 && (
            <TableRow>
              <TableHead className="info-table-label">
                Events
              </TableHead>
              <TableCell className="info-table-cell">
                {eventCount} event{eventCount !== 1 ? 's' : ''}
              </TableCell>
            </TableRow>
          )}

          {/* Trainers */}
          {trainerCount !== undefined && trainerCount > 0 && (
            <TableRow>
              <TableHead className="info-table-label">
                Trainers
              </TableHead>
              <TableCell className="info-table-cell">
                {trainerCount} trainer{trainerCount !== 1 ? 's' : ''}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
