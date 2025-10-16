import { NextRequest, NextResponse } from 'next/server';
import { getMultipleLocationsData } from '@/utils/location-data-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locationIds = searchParams.getAll('ids');

  if (!locationIds.length) {
    return NextResponse.json({ error: 'No location IDs provided' }, { status: 400 });
  }

  try {
    const locationsData = await getMultipleLocationsData(locationIds);
    return NextResponse.json(locationsData);
  } catch (error) {
    console.error('Error fetching locations data:', error);
    return NextResponse.json({ error: 'Failed to fetch locations data' }, { status: 500 });
  }
}