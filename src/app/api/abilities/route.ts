import { NextRequest, NextResponse } from 'next/server';
import { getMultipleAbilitiesData } from '@/utils/ability-data-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const abilityIds = searchParams.getAll('ids');
  const version = (searchParams.get('version') as 'faithful' | 'polished') || 'polished';

  if (!abilityIds.length) {
    return NextResponse.json({ error: 'No ability IDs provided' }, { status: 400 });
  }

  try {
    const abilitiesData = await getMultipleAbilitiesData(abilityIds, version);
    return NextResponse.json(abilitiesData);
  } catch (error) {
    console.error('Error fetching abilities data:', error);
    return NextResponse.json({ error: 'Failed to fetch abilities data' }, { status: 500 });
  }
}