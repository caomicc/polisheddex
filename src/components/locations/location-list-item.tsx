import { LocationEntry } from '@/types/types';
import Link from 'next/link';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { normalizeLocationKey, getLocationDisplayName } from '@/utils/locationUtils';
import { ExternalLink } from 'lucide-react';
import { Badge, BadgeVariant } from '../ui/badge';

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
          <Badge variant={time as BadgeVariant}>{time}</Badge>
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
          {area ? (
            <Link href={areaUrl} className="table-link">
              {getLocationDisplayName(area)}
              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
            </Link>
          ) : (
            getLocationDisplayName(formattedArea)
          )}
        </div>
      </TableCell>

      <TableCell className="align-middle py-2 px-1 text-xs">
        {/* <span className="font-medium text-xs text-muted-foreground mr-1">{chance}%</span> */}
        {method ? formatMethod(method) : <span className="text-gray-400 text-sm">—</span>}
      </TableCell>
      {/* Power - Always visible */}
      <TableCell className="align-middle p-2 text-center">
        {/* <TimeIcon time={time} /> */}
        <Badge variant={time as BadgeVariant}>{time}</Badge>
      </TableCell>
      <TableCell className={cn('text-xs px-2 pb-3 text-left')}>
        <span className="">Lv. {level ?? <span className="text-gray-400 text-sm">—</span>}</span>
      </TableCell>
      <TableCell className="align-middle py-2 px-1">
        <span className="font-medium text-xs">{chance}%</span>
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
