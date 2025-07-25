import { LocationEntry } from '@/types/types';
import Link from 'next/link';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import TimeIcon from './TimeIcon';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';
import { normalizeLocationKey, getLocationDisplayName } from '@/utils/locationUtils';

export function LocationListItem({ area, method, time, level, chance, rareItem }: LocationEntry) {
  const formattedArea = area || 'N/A';
  // Use the normalized area name for URL routing to match the detail page expectations
  const areaUrl = area ? `/locations/${encodeURIComponent(normalizeLocationKey(area))}` : '#';
  const desktopRows = [
    <TableRow
      key={`row-${formattedArea}-${level}`}
      className="hover:bg-muted/50 border-b-0 group hidden md:table-row"
    >
      <TableCell className="font-semibold">
        {area ? (
          <Link
            href={areaUrl}
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getLocationDisplayName(area)}
          </Link>
        ) : (
          getLocationDisplayName(formattedArea)
        )}
      </TableCell>
      <TableCell className="text-gray-600">{method ? formatMethod(method) : '-'}</TableCell>
      <TableCell className="text-sm text-gray-600">
        <TimeIcon
          time={time}
          className={'w-7 h-7 p-[6px]'}
          showTooltip={time === null ? false : true}
        />
      </TableCell>
      <TableCell className="text-sm">Lv. {level}</TableCell>
      <TableCell className="text-sm text-gray-500">{chance}%</TableCell>
      <TableCell className="text-amber-600 font-medium">
        {rareItem
          ? (() => {
              const itemId = getItemIdFromDisplayName(rareItem);
              return itemId ? (
                <Link
                  href={`/items/${itemId}`}
                  className="hover:text-amber-700 hover:underline transition-colors"
                >
                  Item: {rareItem}
                </Link>
              ) : (
                `Item: ${rareItem}`
              );
            })()
          : '-'}
      </TableCell>
    </TableRow>,
  ];

  const mobileRows = [
    <TableRow
      key={`row-${area || formattedArea}-${level}-mobile`}
      className="hover:bg-muted/50 border-b-0 md:hidden"
    >
      {/* Mobile combined cell for level and name */}
      <TableCell className="align-middle p-2">
        <div className="flex items-center">
          <span className="font-bold">
            {area ? (
              <Link
                href={areaUrl}
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
        <span className="">Lv. {level ?? '—'}</span>
      </TableCell>
    </TableRow>,
  ];
  // <TableRow className="hover:bg-gray-50 transition-colors">
  //   <TableCell className="font-semibold text-blue-700">
  //     {area ? (
  //       <Link
  //         href={areaUrl}
  //         className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
  //       >
  //         {formatAreaName(formattedArea)}
  //       </Link>
  //     ) : (
  //       formatAreaName(formattedArea)
  //     )}
  //   </TableCell>
  //   <TableCell className="text-gray-600">{method ? formatMethod(method) : '-'}</TableCell>
  //   <TableCell className="text-sm text-gray-600">{time ? formatTime(time) : '-'}</TableCell>
  //   <TableCell className="bg-gray-100 px-2 py-1 rounded text-sm">Lv. {level}</TableCell>
  //   <TableCell className="text-sm text-gray-500">{chance}%</TableCell>
  //   <TableCell className="text-amber-600 font-medium">
  //     {rareItem ? `Item: ${rareItem}` : '-'}
  //   </TableCell>
  // </TableRow>,
  // ];
  return [...mobileRows, ...desktopRows];
}

// Helper function to format area names from UPPER_SNAKE_CASE to Title Case
// function formatAreaName(area: string): string {
//   if (!area) return 'Unknown Area';
//   return area
//     .toLowerCase()
//     .replace(/_/g, ' ')
//     .replace(/\b\w/g, (c) => c.toUpperCase());
// }

// Helper function to format method names
function formatMethod(method: string): string {
  if (method === 'grass') return 'Wild Grass';
  if (method === 'water') return 'Surfing';
  return method.charAt(0).toUpperCase() + method.slice(1);
}
// function formatPokemonDisplayWithForm(formattedArea: string) {
//   throw new Error('Function not implemented.');
// }
