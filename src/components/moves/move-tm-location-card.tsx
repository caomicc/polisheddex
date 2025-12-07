import Link from 'next/link';
import { DetailCard } from '@/components/ui/detail-card';
import { MapPin } from 'lucide-react';

interface MoveTmLocationCardProps {
  tmNumber?: string;
  location?: string;
  className?: string;
}

export function MoveTmLocationCard({ tmNumber, location, className }: MoveTmLocationCardProps) {
  if (!tmNumber) {
    return null;
  }

  const locationSlug = location?.toLowerCase().replace(/\s+/g, '_') || '';

  return (
    <DetailCard icon={MapPin} title={`${tmNumber.toUpperCase()} Location`} className={className}>
      {location ? (
        <Link
          href={`/locations/${encodeURIComponent(locationSlug)}`}
          className="inline-flex items-center gap-2 text-neutral-800 dark:text-neutral-100 hover:text-primary dark:hover:text-primary transition-colors font-medium"
        >
          <MapPin className="h-4 w-4 text-blue-500" />
          {location.replace(/_/g, ' ')}
        </Link>
      ) : (
        <span className="text-neutral-500 dark:text-neutral-400">Unknown location</span>
      )}
    </DetailCard>
  );
}
