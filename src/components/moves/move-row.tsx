import React from 'react';
import { TableCell, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import MoveCategoryIcon from './move-category-icon';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { MoveStats } from '@/types/new';

type MoveRowProps = {
  level?: number;
  id: string;
  info: MoveStats;
  tm?: {
    number: string;
    location?: string;
  };
};

const MoveRow: React.FC<MoveRowProps> = ({ level, id, info, tm }) => {
  // Guard against undefined info
  if (!info) {
    return null;
  }

  // Desktop version uses the original two-row layout

  const desktopRows = [
    <TableRow
      key={`row-${info.name}-${level}`}
      id={info.name?.toLowerCase().replace(/\s+/g, '-') ?? `row-${info.name}-${level}`}
      className="table-row-no-hover border-b-0 group hidden md:table-row"
    >
      {level !== undefined && (
        <TableCell rowSpan={2} className="align-middle font-semibold w-12 p-2 table-cell-text">
          {level ?? <span className="table-cell-text table-cell-muted">—</span>}
        </TableCell>
      )}

      <TableCell
        rowSpan={2}
        className="align-middle font-medium p-2 text-center md:text-left text-xs md:text-md md:w-[238px]"
      >
        <Link href={`/moves/${id}`} className="table-link">
          {info.name}
          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
        </Link>
      </TableCell>

      <TableCell className="align-middle p-2">
        <Badge
          variant={String(info?.type ?? '-').toLowerCase() as any}
          // className="w-full md:w-auto text-center"
          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
        >
          {info?.type ? String(info.type) : '-'}
        </Badge>
      </TableCell>

      <TableCell className="align-middle p-2 text-center">
        <MoveCategoryIcon
          category={
            (info?.category?.toLowerCase() as 'unknown' | 'physical' | 'special' | 'status') ||
            'unknown'
          }
        />
      </TableCell>

      <TableCell className="align-middle p-2 table-cell-text">
        {info?.power ?? <span className="table-cell-text table-cell-muted">—</span>}
      </TableCell>

      <TableCell className="align-middle p-2 table-cell-text">
        {info?.accuracy ?? <span className="table-cell-text table-cell-muted">—</span>}
      </TableCell>

      <TableCell className="align-middle p-2 table-cell-text">
        {info?.pp ?? <span className="table-cell-text table-cell-muted">—</span>}
      </TableCell>
      <TableCell className="align-middle p-2 table-cell-text">
        {tm?.number ? (
          tm.number.toLowerCase().startsWith('mt') ? (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/locations/${encodeURIComponent((tm.location as any).area?.toLowerCase().replace(/\s+/g, '_'))}`}
              className="table-link"
            >
              <Badge
                variant={'berry'}
                className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
              >
                {tm.number}
              </Badge>
              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
            </Link>
          ) : (
            <Link href={`/items/${tm.number.toLowerCase()}`} className="table-link">
              <Badge
                variant={tm.number.startsWith('TM') ? 'tm' : 'hm'}
                className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
              >
                {tm.number}
              </Badge>
              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
            </Link>
          )
        ) : (
          <span className="table-cell-text table-cell-muted">—</span>
        )}
      </TableCell>
    </TableRow>,
    <TableRow
      key={`desc-${info.name}-${level}-desktop`}
      className="table-row-no-hover hidden md:table-row"
    >
      <TableCell
        className={cn('table-cell-text p-2 pb-3 md:pt-0', !info?.description && 'text-error')}
        // colSpan={1}
      >
        {info?.description}
      </TableCell>
    </TableRow>,
  ];

  const mobileRows = [
    <TableRow
      className="md:hidden group border-b-0 table-row-no-hover"
      key={`mobile-header-${info.name}-${level}`}
      id={`mobile-header-${info.name}-${level}`}
    >
      <TableCell
        colSpan={6}
        className="align-middle font-bold p-1 md:p-2 text-left text-xs md:text-md col-span-2"
      >
        <Link
          href={`/moves/${info.name?.toLowerCase().replace(/\s+/g, '-')}`}
          className="table-link pt-2"
        >
          {info.name}
          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
        </Link>
        {level !== undefined && (
          <span className="text-xs text-muted-foreground ml-2">Level: {level}</span>
        )}
      </TableCell>
    </TableRow>,
    <TableRow
      key={`row-${info.name}-${level}-mobile`}
      id={info.name?.toLowerCase().replace(/\s+/g, '-') ?? `row-${info.name}-${level}`}
      className="table-row-no-hover border-b-0 group md:hidden"
    >
      <TableCell className="align-middle p-1 md:p-2 ">
        <Badge
          variant={String(info?.type ?? '-').toLowerCase() as any}
          // className="w-full md:w-auto text-center"
          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
        >
          {info?.type ? String(info.type) : '-'}
        </Badge>
      </TableCell>

      <TableCell className="align-middle p-1 md:p-2 text-center">
        <MoveCategoryIcon
          category={
            (info?.category?.toLowerCase() as 'unknown' | 'physical' | 'special' | 'status') ||
            'unknown'
          }
          className={'w-4 h-4 p-[4px]'}
        />
        <Badge
          variant={info?.category?.toLowerCase() as any}
          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px] mx-auto"
        >
          {info?.category ? String(info.category) : '-'}
        </Badge>
      </TableCell>

      <TableCell className="align-middle p-1 md:p-2 table-cell-text ">
        {info?.power ?? <span className="table-cell-text table-cell-muted">—</span>}
      </TableCell>

      <TableCell className="align-middle p-1 md:p-2 table-cell-text">
        {info?.accuracy ?? <span className="table-cell-text table-cell-muted">—</span>}
      </TableCell>

      <TableCell className="align-middle p-1 md:p-2 table-cell-text">
        {info?.pp ?? <span className="table-cell-text table-cell-muted">—</span>}
      </TableCell>
      <TableCell className="align-middle p-1 md:p-2 table-cell-text ">
        {tm?.number ? (
          <Link href={`/items/${tm.number.toLowerCase()}`} className="table-link">
            <Badge
              variant={tm.number.startsWith('TM') ? 'tm' : 'hm'}
              className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
            >
              {tm.number}
            </Badge>
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </Link>
        ) : (
          <span className="table-cell-text table-cell-muted">—</span>
        )}
      </TableCell>
    </TableRow>,
    <TableRow
      key={`desc-${info.name}-${level}-mobile`}
      className="table-row-no-hover md:hidden"
    >
      <TableCell
        className={cn(
          'table-cell-muted table-cell-text p-1 md:p-2 pb-4',
          !info?.description && 'text-error',
        )}
        colSpan={6}
      >
        {info?.description}
      </TableCell>
    </TableRow>,
  ];

  return [...desktopRows, ...mobileRows];
};

export default MoveRow;
