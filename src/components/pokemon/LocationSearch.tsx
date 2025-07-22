'use client';

import React from 'react';
import { LocationDataTable } from './location-data-table';
import { locationColumns } from './location-columns';
import { LocationData } from '@/types/types';

interface LocationSearchProps {
  locations: LocationData[];
}

const LocationSearch: React.FC<LocationSearchProps> = ({ locations }) => {
  return (
    <LocationDataTable columns={locationColumns} data={locations} />
  );
};

export default LocationSearch;
