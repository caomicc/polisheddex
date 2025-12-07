import { DetailCard } from '@/components/ui/detail-card';
import { cn } from '@/lib/utils';
import { Map } from 'lucide-react';

interface LocationMapPlaceholderProps {
  locationName?: string;
  className?: string;
}

export function LocationMapPlaceholder({ locationName, className }: LocationMapPlaceholderProps) {
  return (
    <DetailCard icon={Map} title="Map" className={className}>
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 rounded-lg',
          'bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-600'
        )}
      >
        <Map className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Map coming soon</p>
        {locationName && (
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">{locationName}</p>
        )}
      </div>
    </DetailCard>
  );
}
