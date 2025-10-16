import { NextRequest, NextResponse } from 'next/server';
import { getLocationsByRegion } from '@/utils/location-data-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ region: string }> }
) {
  const region = (await params).region;

  try {
    const locations = await getLocationsByRegion(region);
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations by region:', error);
    return NextResponse.json({ error: 'Failed to fetch locations by region' }, { status: 500 });
  }
}