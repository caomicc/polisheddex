import React from 'react';
import { TableCell, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';
import { Move, MoveDescription, PokemonType } from '@/types/types';
import { Badge } from '../ui/badge';
import TypeIcon from '../pokemon/TypeIcon';
import MoveCategoryIcon from './MoveCategoryIcon';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';

const MoveRow: React.FC<Move> = ({ name, level, info }) => {
  console.log('MoveRow rendered:', name, level, info);
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
    category: 'unknown',
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

      <TableCell rowSpan={2} className="align-middle font-medium p-2 ">
        {name}
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
          category={effectiveInfo?.category?.toLowerCase() || 'unknown'}
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

      {/* <TableCell className="align-middle p-2">{info?.effectPercent ?? '--'}</TableCell> */}
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

  // Mobile version uses a compact layout with each row
  const mobileRows = [
    <TableRow
      key={`row-${name}-${level}-mobile`}
      className="hover:bg-muted/50 border-b-0 md:hidden"
    >
      {/* Mobile combined cell for level and name */}
      <TableCell className="align-middle px-2 py-1">
        <div className="flex items-center gap-2 ">
          {level !== undefined ? <span className="font-semibold">Lv. {level}</span> : <></>}
          <span className="font-bold">{name}</span>
        </div>
      </TableCell>

      {/* Power - Always visible */}
      <TableCell className="align-middle p-1 text-center w-16 text-xs">
        {/* <span className="font-medium text-xs text-muted-foreground mr-1">PWR</span> */}
        <span>{effectiveInfo?.power ?? '--'}</span>/<span>{effectiveInfo?.accuracy ?? '--'}</span>
      </TableCell>
      {/* Type - Always visible */}
      <TableCell className="align-middle py-1 px-1 w-8">
        <Badge
          variant={String(effectiveInfo?.type ?? '-').toLowerCase() as PokemonType['name']}
          className="hidden sm:inline-flex"
        >
          {effectiveInfo?.type ? String(effectiveInfo.type) : '-'}
        </Badge>
        <div className="sm:hidden text-center">
          {effectiveInfo?.type ? (
            <TypeIcon type={String(effectiveInfo.type)} size={20} />
          ) : (
            <span>-</span>
          )}
        </div>
      </TableCell>
      <TableCell className="align-middle py-1 w-8 px-1 text-center">
        <MoveCategoryIcon category={effectiveInfo?.category?.toLowerCase() || 'unknown'} />
      </TableCell>
    </TableRow>,
    <TableRow key={`desc-${name}-${level}-mobile`} className="md:hidden">
      <TableCell
        className={cn(
          'text-muted-foreground text-xs px-2 pb-3 italic text-left',
          !info?.description?.trim() && 'text-error',
        )}
        colSpan={4}
      >
        {info?.description?.trim() ? info.description : 'No description found.'}
      </TableCell>
    </TableRow>,
  ];

  return [...mobileRows, ...desktopRows];
};

export default MoveRow;
