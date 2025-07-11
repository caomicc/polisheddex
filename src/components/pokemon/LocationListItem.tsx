import { LocationEntryProps } from '@/types/types';
import Link from 'next/link';
import { TableRow, TableCell } from '@/components/ui/table';

export function LocationListItem({
  area,
  method,
  time,
  level,
  chance,
  rareItem,
}: LocationEntryProps) {
  const formattedArea = area || 'Unknown Area';
  const areaUrl = area ? `/locations/${encodeURIComponent(formatAreaName(area))}` : '#';

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="font-semibold text-blue-700">
        {area ? (
          <Link
            href={areaUrl}
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {formatAreaName(formattedArea)}
          </Link>
        ) : (
          formatAreaName(formattedArea)
        )}
      </TableCell>
      <TableCell className="text-gray-600">{method ? formatMethod(method) : '-'}</TableCell>
      <TableCell className="text-sm text-gray-600">{time ? formatTime(time) : '-'}</TableCell>
      <TableCell className="bg-gray-100 px-2 py-1 rounded text-sm">Lv. {level}</TableCell>
      <TableCell className="text-sm text-gray-500">{chance}%</TableCell>
      <TableCell className="text-amber-600 font-medium">
        {rareItem ? `Item: ${rareItem}` : '-'}
      </TableCell>
    </TableRow>
  );
}

// Helper function to format area names from UPPER_SNAKE_CASE to Title Case
function formatAreaName(area: string): string {
  if (!area) return 'Unknown Area';
  return area
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Helper function to format method names
function formatMethod(method: string): string {
  if (method === 'grass') return 'Wild Grass';
  if (method === 'water') return 'Surfing';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

// Helper function to format time of day
function formatTime(time: string): string {
  if (time === 'morn') return 'Morning';
  if (time === 'day') return 'Day';
  if (time === 'nite') return 'Night';
  if (time === 'eve') return 'Evening';
  return time.charAt(0).toUpperCase() + time.slice(1);
}
