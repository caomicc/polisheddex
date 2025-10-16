import { NextRequest, NextResponse } from 'next/server';
import { getLocationData } from '@/utils/location-data-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const locationId = (await params).id;

  try {
    const locationData = await getLocationData(locationId);
    
    if (!locationData) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(locationData);
  } catch (error) {
    console.error('Error fetching location data:', error);
    return NextResponse.json({ error: 'Failed to fetch location data' }, { status: 500 });
  }
}