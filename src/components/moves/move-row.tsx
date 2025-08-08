import React from 'react';
import { TableCell, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';
import { Move, MoveDescription, PokemonType } from '@/types/types';
import { Badge } from '../ui/badge';
import MoveCategoryIcon from './move-category-icon';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const MoveRow: React.FC<Move> = ({ name, level, info }) => {
  // Desktop version uses the original two-row layout

  const { showFaithful } = useFaithfulPreference();

  const effectiveInfo: MoveDescription['updated'] | MoveDescription['faithful'] = (showFaithful
    ? info?.faithful || info?.updated || undefined
    : info?.updated || info?.faithful) ?? {
    type: '-',
    pp: '--',
    power: '--',
    accuracy: '--',
    effectPercent: '--',
    category: 'Unknown',
  };

  const desktopRows = [
    <TableRow
      key={`row-${name}-${level}`}
      id={name?.toLowerCase().replace(/\s+/g, '-') ?? `row-${name}-${level}`}
      className="hover:bg-muted/0 border-b-0 group hidden md:table-row"
    >
      {level !== undefined && (
        <TableCell rowSpan={2} className="align-middle font-semibold w-12 p-2 ">
          {level ?? '—'}
        </TableCell>
      )}

      <TableCell
        rowSpan={2}
        className="align-middle font-medium p-2 text-center md:text-left text-xs md:text-md"
      >
        <Link
          href={`/moves/${name.toLowerCase().replace(/\s+/g, '-')}`}
          className="flex items-center"
        >
          {name}
          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />
        </Link>
      </TableCell>

      <TableCell className="align-middle p-2">
        <Badge
          variant={String(effectiveInfo?.type ?? '-').toLowerCase() as PokemonType['name']}
          // className="w-full md:w-auto text-center"
          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
        >
          {effectiveInfo?.type ? String(effectiveInfo.type) : '-'}
        </Badge>
      </TableCell>

      <TableCell className="align-middle p-2 text-center">
        <MoveCategoryIcon
          category={
            (effectiveInfo?.category?.toLowerCase() as
              | 'unknown'
              | 'physical'
              | 'special'
              | 'status') || 'unknown'
          }
          className={'w-4 h-4 p-[4px]'}
        />
        {/* <Badge
          variant={info?.category?.toLowerCase() as MoveDescription['category']}
          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px] mx-auto"
        >
          {info?.category ? String(info.category) : '-'}
        </Badge> */}
      </TableCell>

      <TableCell className="align-middle p-2 ">{effectiveInfo?.power ?? '--'}</TableCell>

      <TableCell className="align-middle p-2 ">{effectiveInfo?.accuracy ?? '--'}</TableCell>

      <TableCell className="align-middle p-2 ">{effectiveInfo?.pp ?? '--'}</TableCell>
      <TableCell className="align-middle p-2">
        {info?.tm?.number ? (
          info.tm.number.toLowerCase().startsWith('mt') ? (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/locations/${encodeURIComponent((info.tm.location as any).area?.toLowerCase().replace(/\s+/g, '_'))}`}
              className="flex items-center"
            >
              <Badge
                variant={'berry'}
                className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
              >
                {info.tm.number}
              </Badge>
              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />
            </Link>
          ) : (
            <Link href={`/items/${info.tm.number.toLowerCase()}`} className="flex items-center">
              <Badge
                variant={info.tm.number.startsWith('TM') ? 'tm' : 'hm'}
                className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
              >
                {info.tm.number}
              </Badge>
              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />
            </Link>
          )
        ) : (
          <span className="text-muted-foreground">--</span>
        )}
      </TableCell>
    </TableRow>,
    <TableRow
      key={`desc-${name}-${level}-desktop`}
      className="group-hover:bg-muted/0 hover:bg-muted/0 hidden md:table-row"
    >
      <TableCell
        className={cn(
          'text-muted-foreground text-xs p-2 pb-4',
          !info?.description?.trim() && 'text-error',
        )}
        // colSpan={1}
      >
        {info?.description?.trim() ? info.description : 'No description found.'}
      </TableCell>
    </TableRow>,
  ];

  const mobileRows = [
    <TableRow
      className="md:hidden group border-b-0 hover:bg-muted/0 pt-2"
      key={`mobile-header-${name}-${level}`}
      id={`mobile-header-${name}-${level}`}
    >
      <TableCell
        colSpan={6}
        className="align-middle font-bold p-1 md:p-2 text-left text-xs md:text-md col-span-2"
      >
        <Link
          href={`/moves/${name.toLowerCase().replace(/\s+/g, '-')}`}
          className="flex items-center"
        >
          {name}
          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />
        </Link>
        {level !== undefined && (
          <span className="text-xs text-muted-foreground ml-2">Level: {level}</span>
        )}
      </TableCell>
    </TableRow>,
    <TableRow
      key={`row-${name}-${level}-mobile`}
      id={name?.toLowerCase().replace(/\s+/g, '-') ?? `row-${name}-${level}`}
      className="hover:bg-muted/0 border-b-0 group md:hidden"
    >
      <TableCell className="align-middle p-1 md:p-2 ">
        <Badge
          variant={String(effectiveInfo?.type ?? '-').toLowerCase() as PokemonType['name']}
          // className="w-full md:w-auto text-center"
          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
        >
          {effectiveInfo?.type ? String(effectiveInfo.type) : '-'}
        </Badge>
      </TableCell>

      <TableCell className="align-middle p-1 md:p-2 text-center">
        <MoveCategoryIcon
          category={
            (effectiveInfo?.category?.toLowerCase() as
              | 'unknown'
              | 'physical'
              | 'special'
              | 'status') || 'unknown'
          }
          className={'w-4 h-4 p-[4px]'}
        />
        {/* <Badge
          variant={info?.category?.toLowerCase() as MoveDescription['category']}
          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px] mx-auto"
        >
          {info?.category ? String(info.category) : '-'}
        </Badge> */}
      </TableCell>

      <TableCell className="align-middle p-1 md:p-2">{effectiveInfo?.power ?? '--'}</TableCell>

      <TableCell className="align-middle p-1 md:p-2">{effectiveInfo?.accuracy ?? '--'}</TableCell>

      <TableCell className="align-middle p-1 md:p-2">{effectiveInfo?.pp ?? '--'}</TableCell>
      <TableCell className="align-middle p-1 md:p-2 ">
        {info?.tm?.number ? (
          <Link href={`/items/${info.tm.number.toLowerCase()}`} className="flex items-center">
            <Badge
              variant={info.tm.number.startsWith('TM') ? 'tm' : 'hm'}
              className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
            >
              {info.tm.number}
            </Badge>
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />
          </Link>
        ) : (
          <span className="text-muted-foreground">--</span>
        )}
      </TableCell>
    </TableRow>,
    <TableRow
      key={`desc-${name}-${level}-mobile`}
      className="group-hover:bg-muted/0 hover:bg-muted/0 md:hidden"
    >
      <TableCell
        className={cn(
          'text-muted-foreground text-xs p-1 md:p-2 pb-2',
          !info?.description?.trim() && 'text-error',
        )}
        colSpan={6}
      >
        {info?.description?.trim() ? info.description : 'No description found.'}
      </TableCell>
    </TableRow>,
  ];

  return [...desktopRows, ...mobileRows];
};

export default MoveRow;
