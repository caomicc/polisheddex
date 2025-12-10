'use client';

import { LocationData } from '@/utils/location-data-server';
import { ComprehensiveTrainerData } from '@/types/new';
import { LocationInfoTable } from './location-info-table';
import { LocationMap } from './location-map';
import { LocationEncountersCard } from './location-encounters-card';
import { LocationItemsCard } from './location-items-card';
import { LocationEventsCard } from './location-events-card';
import { LocationTrainersCard } from './location-trainers-card';

interface LocationDetailClientProps {
  location: LocationData;
  trainers: ComprehensiveTrainerData[];
}

export function LocationDetailClient({ location, trainers }: LocationDetailClientProps) {
  const hasAnyContent =
    (location.encounters && location.encounters.length > 0) ||
    (location.items && location.items.length > 0) ||
    (location.events && location.events.length > 0) ||
    (trainers && trainers.length > 0);

  return (
    <div className="space-y-4">
      {/* Location Info Table */}
      <LocationInfoTable
        region={location.region}
        types={location.type}
        parent={location.parentName}
        parentId={location.parent}
        children={location.children}
        connections={location.connections}
        encounterCount={location.encounters?.length}
        itemCount={location.items?.length}
        eventCount={location.events?.length}
        trainerCount={trainers?.length}
      />

      {/* Map */}
      <LocationMap locationId={location.id} locationName={location.name} />

      {/* Wild Pokemon encounters */}
      <LocationEncountersCard encounters={location.encounters || []} />

      {/* Items found at this location */}
      <LocationItemsCard items={location.items || []} />

      {/* Events */}
      <LocationEventsCard events={location.events || []} />

      {/* Trainers */}
      <LocationTrainersCard trainers={trainers} />

      {/* Empty state if no content */}
      {!hasAnyContent && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 text-center">
          <p className="text-neutral-500 dark:text-neutral-400">
            There doesn&apos;t seem to be any relevant information available for this location.
          </p>
        </div>
      )}

      {/* Debug section - dev only */}
      {process.env.NODE_ENV === 'development' && (
        <details className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <summary className="cursor-pointer font-semibold text-neutral-700 dark:text-neutral-300">
            View Raw Data (Dev Only)
          </summary>
          <pre className="mt-4 text-xs overflow-auto bg-neutral-100 p-4 rounded-lg dark:bg-neutral-900 max-h-96">
            {JSON.stringify(location, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
