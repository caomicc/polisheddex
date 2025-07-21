'use client';

import React from 'react';
import { LocationDataTable } from './location-data-table';
import { locationColumns, type LocationData } from './location-columns';

interface LocationSearchProps {
  locations: LocationData[];
}

const LocationSearch: React.FC<LocationSearchProps> = ({ locations }) => {
  return (
    <LocationDataTable columns={locationColumns} data={locations} />
  );
};

export default LocationSearch;
