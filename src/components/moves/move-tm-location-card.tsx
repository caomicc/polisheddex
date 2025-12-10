import Link from 'next/link';
import { DetailCard } from '@/components/ui/detail-card';
import { MapPin } from 'lucide-react';

interface MoveTmLocationCardProps {
  tmNumber?: string;
  location?: string;
  locationName?: string;
  locationExists?: boolean;
  className?: string;
}

export function MoveTmLocationCard({
  tmNumber,
  location,
  locationName,
  locationExists = true,
  className,
}: MoveTmLocationCardProps) {
  if (!tmNumber) {
    return null;
  }

  const locationSlug = location?.toLowerCase() || '';
  const displayName = locationName || location || 'Unknown location';

  return (
    <DetailCard icon={MapPin} title={`${tmNumber.toUpperCase()} Location`} className={className}>
      {location ? (
        locationExists ? (
          <Link
            href={`/locations/${encodeURIComponent(locationSlug)}`}
            className="inline-flex items-center gap-2 text-neutral-800 dark:text-neutral-100 hover:text-primary dark:hover:text-primary transition-colors font-medium"
          >
            <MapPin className="h-4 w-4 text-blue-500" />
            {displayName}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 text-neutral-800 dark:text-neutral-100 font-medium">
            <MapPin className="h-4 w-4 text-blue-500" />
            {displayName}
          </span>
        )
      ) : (
        <span className="text-neutral-500 dark:text-neutral-400">Unknown location</span>
      )}
    </DetailCard>
  );
}
