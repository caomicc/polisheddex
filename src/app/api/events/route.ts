import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read the events.json file from the output directory
    const filePath = path.join(process.cwd(), 'output', 'events.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Events data not found' },
        { status: 404 }
      );
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const eventsData = JSON.parse(data);

    return NextResponse.json(eventsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error reading events data:', error);
    return NextResponse.json(
      { error: 'Failed to load events data' },
      { status: 500 }
    );
  }
}