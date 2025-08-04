'use client';

import React, { Suspense } from 'react';
import { LocationDataTable } from './location-data-table';
import { locationColumns } from './location-columns';
import { LocationData } from '@/types/types';

interface LocationSearchProps {
  locations: LocationData[];
}

const LocationSearch: React.FC<LocationSearchProps> = ({ locations }) => {
  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading locations...</div>}>
      <LocationDataTable columns={locationColumns} data={locations} />
    </Suspense>
  );
};

export default LocationSearch;
