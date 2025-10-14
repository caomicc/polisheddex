import { NextRequest, NextResponse } from 'next/server';
import { getMultipleMovesData } from '@/utils/move-data-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moveIds = searchParams.getAll('ids');
  const version = (searchParams.get('version') as 'faithful' | 'polished') || 'polished';

  if (!moveIds.length) {
    return NextResponse.json({ error: 'No move IDs provided' }, { status: 400 });
  }

  try {
    const movesData = await getMultipleMovesData(moveIds, version);
    return NextResponse.json(movesData);
  } catch (error) {
    console.error('Error fetching moves data:', error);
    return NextResponse.json({ error: 'Failed to fetch moves data' }, { status: 500 });
  }
}