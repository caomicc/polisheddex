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
    <div className="info-table-wrapper">
      <Table className="info-table">
        <TableBody className="info-table-body">
          {/* Type */}
          <TableRow>
            <TableHead className="info-table-label">
              Type
            </TableHead>
            <TableCell className="info-table-cell">
              {type ? (
                <Badge variant={type.toLowerCase() as any}>{type}</Badge>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </TableCell>
          </TableRow>

          {/* Category */}
          <TableRow>
            <TableHead className="info-table-label">
              Category
            </TableHead>
            <TableCell className="info-table-cell capitalize">
              {category || '—'}
            </TableCell>
          </TableRow>

          {/* Power */}
          <TableRow>
            <TableHead className="info-table-label">
              Power
            </TableHead>
            <TableCell className="info-table-cell">
              {power && power > 0 ? (
                <span className="font-medium">{power}</span>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </TableCell>
          </TableRow>

          {/* Accuracy */}
          <TableRow>
            <TableHead className="info-table-label">
              Accuracy
            </TableHead>
            <TableCell className="info-table-cell">
              {accuracy && Number(accuracy) > 0 ? (
                <span className="font-medium">{accuracy}%</span>
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </TableCell>
          </TableRow>

          {/* PP */}
          <TableRow>
            <TableHead className="info-table-label">
              PP
            </TableHead>
            <TableCell className="info-table-cell">
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
              <TableHead className="info-table-label">
                Effect Chance
              </TableHead>
              <TableCell className="info-table-cell">
                <span className="font-medium">{effectChance}%</span>
              </TableCell>
            </TableRow>
          )}

          {/* Description */}
          {description && (
            <TableRow>
              <TableHead className="info-table-label">
                Effect
              </TableHead>
              <TableCell className="info-table-cell">
                {description}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
