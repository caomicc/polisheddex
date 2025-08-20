import { LocationEntry } from '@/types/types';
import Link from 'next/link';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import TimeIcon from '../pokemon/time-icon';
import { normalizeLocationKey, getLocationDisplayName } from '@/utils/locationUtils';

export function LocationListItem({ area, method, time, level, chance }: LocationEntry) {
  const formattedArea = area || 'N/A';
  // Use the normalized area name for URL routing to match the detail page expectations
  const areaUrl = area ? `/locations/${encodeURIComponent(normalizeLocationKey(area))}` : '#';
  const desktopRows = [
    <TableRow
      key={`row-${formattedArea}-${level}`}
      className="hover:bg-muted/50 group hidden md:table-row"
    >
      <TableCell className="font-semibold">
        {area ? (
          <Link href={areaUrl} className="table-link">
            {getLocationDisplayName(area)}
          </Link>
        ) : (
          getLocationDisplayName(formattedArea)
        )}
      </TableCell>
      <TableCell className="text-xs">
        {method ? formatMethod(method) : <span className="text-gray-400 text-sm">—</span>}
      </TableCell>
      <TableCell className="text-xs">
        {time ? (
          <TimeIcon
            time={time}
            className={'w-7 h-7 p-[6px]'}
            showTooltip={time === null ? false : true}
          />
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        {level ? <span>Lv. {level}</span> : <span className="text-gray-400 text-sm">—</span>}
      </TableCell>
      <TableCell className="text-xs">
        {chance ? <span>{chance}%</span> : <span className="text-gray-400 text-sm">—</span>}
      </TableCell>
    </TableRow>,
  ];

  const mobileRows = [
    <TableRow
      key={`row-${area || formattedArea}-${level}-mobile`}
      className="hover:bg-muted/50 md:hidden"
    >
      {/* Mobile combined cell for level and name */}
      <TableCell className="align-middle p-2">
        <div className="flex items-center">
          <span className="font-bold">
            {area ? (
              <Link href={areaUrl} className="table-link">
                {getLocationDisplayName(area)}
              </Link>
            ) : (
              getLocationDisplayName(formattedArea)
            )}
          </span>
        </div>
      </TableCell>

      <TableCell className="align-middle py-2 px-1 w-8">
        <span className="font-medium text-xs text-muted-foreground mr-1">{chance}%</span>
      </TableCell>
      {/* Power - Always visible */}
      <TableCell className="align-middle p-2 text-center w-16">
        <TimeIcon time={time} />
      </TableCell>
    </TableRow>,
    <TableRow key={`desc-${area || formattedArea}-${level}-mobile`} className="md:hidden">
      <TableCell className={cn('text-muted-foreground text-xs px-2 pb-3 italic')} colSpan={4}>
        <span className="">Lv. {level ?? <span className="text-gray-400 text-sm">—</span>}</span>
      </TableCell>
    </TableRow>,
  ];

  return [...mobileRows, ...desktopRows];
}

// Helper function to format method names
function formatMethod(method: string): string {
  if (method === 'grass') return 'Wild Grass';
  if (method === 'water') return 'Surfing';
  if (method === 'fish_good') return 'Good Rod';
  if (method === 'fish_super') return 'Super Rod';
  if (method === 'fish_old') return 'Old Rod';
  if (method === 'gift') return 'Gift';
  return method.charAt(0).toUpperCase() + method.slice(1);
}
