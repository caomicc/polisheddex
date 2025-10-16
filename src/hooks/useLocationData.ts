import { useState, useEffect } from 'react';
import { fetchMultipleLocationsData, fetchLocationsByRegion } from '@/utils/location-data-client';
import { LocationData } from '@/types/new';

interface UseLocationDataProps {
  locationIds?: string[];
  region?: string;
  enabled?: boolean;
}

interface UseLocationDataReturn {
  locationsData: Record<string, LocationData> | LocationData[];
  isLoading: boolean;
  error: string | null;
}

export function useLocationData({
  locationIds,
  region,
  enabled = true,
}: UseLocationDataProps): UseLocationDataReturn {
  const [locationsData, setLocationsData] = useState<Record<string, LocationData> | LocationData[]>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || (!locationIds?.length && !region)) {
      setLocationsData(locationIds ? {} : []);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (region) {
          // Fetch by region
          const data = await fetchLocationsByRegion(region);
          setLocationsData(data);
        } else if (locationIds && locationIds.length > 0) {
          // Fetch specific locations
          const data = await fetchMultipleLocationsData(locationIds);
          setLocationsData(data);
        }
      } catch (err) {
        console.error('Error fetching locations data:', err);
        setError('Failed to fetch locations data');
        setLocationsData(locationIds ? {} : []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [locationIds, region, enabled]);

  return {
    locationsData,
    isLoading,
    error,
  };
}
