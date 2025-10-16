import { NextRequest, NextResponse } from 'next/server';
import { getMoveData } from '@/utils/move-data-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const version = (searchParams.get('version') as 'faithful' | 'polished') || 'polished';
  const moveId = (await params).id;

  if (!moveId) {
    return NextResponse.json({ error: 'Move ID is required' }, { status: 400 });
  }

  try {
    const moveData = await getMoveData(moveId, version);
    
    if (!moveData) {
      return NextResponse.json({ error: 'Move not found' }, { status: 404 });
    }

    return NextResponse.json(moveData);
  } catch (error) {
    console.error('Error fetching move data:', error);
    return NextResponse.json({ error: 'Failed to fetch move data' }, { status: 500 });
  }
}