import Link from 'next/link';

interface LocationEntryProps {
  area: string | null;
  method: string | null;
  time: string | null;
  level: string;
  chance: number;
}

export default function LocationListItem({ area, method, time, level, chance }: LocationEntryProps) {
  const formattedArea = area || 'Unknown Area';

  return (
    <li className="py-2 hover:bg-gray-50 transition-colors">
      <Link
        href={area ? `/locations/${encodeURIComponent(formatAreaName(area))}` : '#'}
        className="block"
      >
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold text-blue-700">{formatAreaName(formattedArea)}</span>
            {method && <span className="ml-2 text-gray-600">({formatMethod(method)})</span>}
          </div>
          <div>
            <span className="bg-gray-100 px-2 py-1 rounded text-sm">Lv. {level}</span>
            {time && <span className="ml-2 text-sm text-gray-600">{formatTime(time)}</span>}
            <span className="ml-2 text-sm text-gray-500">{chance}% chance</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

// Helper function to format area names from UPPER_SNAKE_CASE to Title Case
function formatAreaName(area: string): string {
  if (!area) return 'Unknown Area';

  return area
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
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
