import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  try {
    const { slug } = await params;
    const page = slug.join('/') || 'Home';

    // Construct the GitHub raw URL for the wiki page
    const wikiUrl = `https://raw.githubusercontent.com/wiki/Rangi42/polishedcrystal/${page}.md`;

    // Fetch the markdown content from GitHub
    const response = await fetch(wikiUrl, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Wiki page not found' }, { status: 404 });
      }
      throw new Error(`Failed to fetch wiki page: ${response.status}`);
    }

    const markdown = await response.text();

    return NextResponse.json({
      content: markdown,
      page: page,
      lastFetched: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching wiki page:', error);
    return NextResponse.json({ error: 'Failed to fetch wiki page' }, { status: 500 });
  }
}
