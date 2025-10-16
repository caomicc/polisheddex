export interface LocationData {
  id: string;
  name: string;
  region: string;
  type?: string[];
  order?: number;
  connectionCount?: number;
  parent?: string;
  constantName?: string;
  items?: Array<{
    name: string;
    type: string;
    coordinates?: {
      x: number;
      y: number;
    };
  }>;
  events?: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  trainers?: Array<{
    name: string;
    type: string;
  }>;
}

/**
 * Client-side function to fetch location data via API
 */
export async function fetchLocationData(locationId: string): Promise<LocationData | null> {
  try {
    const response = await fetch(`/api/locations/${locationId}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching location data:', error);
    return null;
  }
}

/**
 * Client-side function to fetch multiple locations data via API
 */
export async function fetchMultipleLocationsData(locationIds: string[]): Promise<Record<string, LocationData>> {
  try {
    const queryString = locationIds.map(id => `ids=${encodeURIComponent(id)}`).join('&');
    const response = await fetch(`/api/locations?${queryString}`);
    if (!response.ok) {
      return {};
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching locations data:', error);
    return {};
  }
}

/**
 * Client-side function to fetch locations by region
 */
export async function fetchLocationsByRegion(region: string): Promise<LocationData[]> {
  try {
    const response = await fetch(`/api/locations/region/${region}`);
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching locations by region:', error);
    return [];
  }
}