import Link from 'next/link';
import { DetailCard } from '@/components/ui/detail-card';
import { cn } from '@/lib/utils';
import { MapPin, ShoppingCart, Gift, Search, Coins, Trophy } from 'lucide-react';

interface LocationEntry {
  area: string;
  method: string;
  name?: string;
  parentId?: string;
}

interface ItemLocationsCardProps {
  locations: LocationEntry[];
  className?: string;
}

function getMethodIcon(method?: string) {
  if (!method) return <MapPin className="h-4 w-4" />;

  const methodLower = method.toLowerCase();
  if (
    methodLower.includes('buy') ||
    methodLower.includes('purchase') ||
    methodLower.includes('shop') ||
    methodLower.includes('mart')
  ) {
    return <ShoppingCart className="h-4 w-4" />;
  }
  if (
    methodLower.includes('gift') ||
    methodLower.includes('given') ||
    methodLower.includes('receive') ||
    methodLower.includes('npc')
  ) {
    return <Gift className="h-4 w-4" />;
  }
  if (
    methodLower.includes('hidden') ||
    methodLower.includes('find') ||
    methodLower.includes('found') ||
    methodLower.includes('pickup')
  ) {
    return <Search className="h-4 w-4" />;
  }
  if (
    methodLower.includes('prize') ||
    methodLower.includes('coin') ||
    methodLower.includes('game corner') ||
    methodLower.includes('casino')
  ) {
    return <Coins className="h-4 w-4" />;
  }
  if (methodLower.includes('gym') || methodLower.includes('badge') || methodLower.includes('reward')) {
    return <Trophy className="h-4 w-4" />;
  }
  return <MapPin className="h-4 w-4" />;
}

function getMethodColor(method?: string): string {
  if (!method) return 'text-neutral-400';

  const methodLower = method.toLowerCase();
  if (
    methodLower.includes('buy') ||
    methodLower.includes('purchase') ||
    methodLower.includes('shop') ||
    methodLower.includes('mart')
  ) {
    return 'text-green-500';
  }
  if (
    methodLower.includes('gift') ||
    methodLower.includes('given') ||
    methodLower.includes('receive') ||
    methodLower.includes('npc')
  ) {
    return 'text-pink-500';
  }
  if (
    methodLower.includes('hidden') ||
    methodLower.includes('find') ||
    methodLower.includes('found') ||
    methodLower.includes('pickup')
  ) {
    return 'text-yellow-500';
  }
  if (
    methodLower.includes('prize') ||
    methodLower.includes('coin') ||
    methodLower.includes('game corner') ||
    methodLower.includes('casino')
  ) {
    return 'text-purple-500';
  }
  if (methodLower.includes('gym') || methodLower.includes('badge') || methodLower.includes('reward')) {
    return 'text-orange-500';
  }
  return 'text-blue-500';
}

function formatMethod(method?: string): string {
  if (!method) return 'Unknown';
  // Capitalize first letter and format underscores
  return method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ItemLocationsCard({ locations, className }: ItemLocationsCardProps) {
  if (!locations || locations.length === 0) {
    return null;
  }

  // Filter out problematic locations (like player's house NPC interactions)
  const filteredLocations = locations.filter((location) => {
    const isPlayersHouse2F = location.area?.toLowerCase() === 'playershouse2f';
    const isNpcMethod = location.method?.toLowerCase().includes('npc');
    return !(isPlayersHouse2F && isNpcMethod);
  });

  if (filteredLocations.length === 0) {
    return null;
  }

  return (
    <DetailCard icon={MapPin} title="Where to Find" className={className}>
      <div className="space-y-2">
        {filteredLocations.map((location, index) => {
          const displayName = location.name || location.area;
          const linkPath = location.parentId
            ? `/locations/${location.parentId}`
            : `/locations/${location.area}`;

          return (
            <div
              key={`${location.area}-${location.method}-${index}`}
              className="flex items-start gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 p-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <div className={cn('mt-0.5 flex-shrink-0', getMethodColor(location.method))}>
                {getMethodIcon(location.method)}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={linkPath}
                  className="font-medium text-neutral-800 dark:text-neutral-100 hover:text-primary dark:hover:text-primary transition-colors block truncate"
                >
                  {displayName}
                </Link>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatMethod(location.method)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </DetailCard>
  );
}
