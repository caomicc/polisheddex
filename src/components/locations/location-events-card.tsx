import Link from 'next/link';
import { DetailCard } from '@/components/ui/detail-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface LocationEvent {
  name: string;
  description: string;
  type: string;
  item?: string;
}

interface LocationEventsCardProps {
  events: LocationEvent[];
  className?: string;
}

const eventTypeColors: Record<string, string> = {
  battle: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  gift: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
  itemball: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'fruit tree': 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  trade: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  phone_call: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
};

export function LocationEventsCard({ events, className }: LocationEventsCardProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <DetailCard icon={Calendar} title="Events" className={className}>
      <div className="grid grid-cols-1 gap-3">
        {events.map((event, index) => {
          const typeKey = event.type.toLowerCase();
          const typeColor =
            eventTypeColors[typeKey] ||
            'bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 border-neutral-500/30';

          return (
            <div
              key={index}
              className="p-3 bg-neutral-50 rounded-lg dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium capitalize text-neutral-800 dark:text-neutral-100">
                  {event.name.replace(/([a-z])([A-Z])/g, '$1 $2')}
                </span>
                <Badge variant="outline" className={cn('border text-xs font-medium', typeColor)}>
                  {event.type.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{event.description}</p>
              {event.item && (
                <Link
                  href={`/items/${event.item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  Item: {event.item}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </DetailCard>
  );
}
