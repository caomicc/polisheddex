import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch FAQ.md directly from the repository root
    const faqUrl = 'https://raw.githubusercontent.com/Rangi42/polishedcrystal/master/FAQ.md';
    
    const response = await fetch(faqUrl, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'FAQ.md not found in repository' },
          { status: 404 }
        );
      }
      throw new Error(`Failed to fetch FAQ.md: ${response.status}`);
    }
    
    const markdown = await response.text();
    
    return NextResponse.json({
      content: markdown,
      source: 'https://github.com/Rangi42/polishedcrystal/blob/master/FAQ.md',
      lastFetched: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching FAQ.md:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQ.md' },
      { status: 500 }
    );
  }
}