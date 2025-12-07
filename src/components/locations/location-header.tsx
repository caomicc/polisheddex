import { Badge } from '@/components/ui/badge';
import { DetailCard } from '@/components/ui/detail-card';
import { cn } from '@/lib/utils';
import { Info, MapPin, Link as LinkIcon } from 'lucide-react';

interface LocationHeaderProps {
  region?: string;
  types?: string[];
  connectionCount?: number;
  className?: string;
}

const typeColors: Record<string, string> = {
  route: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
  town: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  city: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  indoor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  cave: 'bg-stone-500/20 text-stone-700 dark:text-stone-300 border-stone-500/30',
  dungeon: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  forest: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  water: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  gym: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
};

const regionColors: Record<string, string> = {
  johto: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  kanto: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
  orange: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
};

export function LocationHeader({
  region,
  types,
  connectionCount,
  className,
}: LocationHeaderProps) {
  // Return null if there's no meaningful metadata to display
  if (!region && (!types || types.length === 0) && !connectionCount) {
    return null;
  }

  const regionKey = region?.toLowerCase() || '';
  const regionColor =
    regionColors[regionKey] ||
    'bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 border-neutral-500/30';

  return (
    <DetailCard icon={Info} title="Location Info" className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {region && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-neutral-400" />
            <Badge variant="outline" className={cn('border text-xs font-medium', regionColor)}>
              {region}
            </Badge>
          </div>
        )}

        {types && types.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {types.map((type) => {
              const typeKey = type.toLowerCase();
              const typeColor =
                typeColors[typeKey] ||
                'bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 border-neutral-500/30';
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn('border text-xs font-medium capitalize', typeColor)}
                >
                  {type}
                </Badge>
              );
            })}
          </div>
        )}

        {connectionCount !== undefined && connectionCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            <LinkIcon className="h-4 w-4" />
            <span>
              {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </DetailCard>
  );
}
