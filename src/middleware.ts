import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a pokemon page route
  if (pathname.startsWith('/pokemon/')) {
    const pokemonName = pathname.split('/pokemon/')[1];
    
    if (pokemonName) {
      // Decode URL-encoded characters
      const decodedName = decodeURIComponent(pokemonName);
      
      // Check if the name contains uppercase letters or needs normalization
      const normalizedName = normalizeForUrl(decodedName);
      
      // If the normalized name is different from the current name, redirect
      if (normalizedName !== decodedName && normalizedName !== pokemonName) {
        const newUrl = new URL(`/pokemon/${normalizedName}`, request.url);
        return NextResponse.redirect(newUrl, 301); // Permanent redirect
      }
    }
  }

  return NextResponse.next();
}

// Helper function to normalize Pokemon names for URLs (matching your existing logic)
function normalizeForUrl(name: string): string {
  if (!name) return '';
  
  // Trim whitespace
  name = name.trim();
  
  // Special cases for hyphenated Pokemon
  const hyphenatedCases: Record<string, string> = {
    'nidoran-f': 'nidoran-f',
    'nidoran-m': 'nidoran-m',
    'mr-mime': 'mr-mime',
    'mime-jr': 'mime-jr',
    'ho-oh': 'ho-oh',
    'porygon-z': 'porygon-z',
    'farfetch-d': 'farfetch-d',
    'sirfetch-d': 'sirfetch-d',
    'mr-rime': 'mr-rime'
  };
  
  const lowerName = name.toLowerCase();
  if (hyphenatedCases[lowerName]) {
    return hyphenatedCases[lowerName];
  }
  
  // Handle special cases without hyphens that should have them
  const specialCases: Record<string, string> = {
    'nidoranf': 'nidoran-f',
    'nidoranm': 'nidoran-m',
    'mrmime': 'mr-mime',
    'mrrime': 'mr-rime',
    'mimejr': 'mime-jr',
    'farfetchd': 'farfetch-d',
    'hooh': 'ho-oh',
    'sirfetchd': 'sirfetch-d',
    'porygonz': 'porygon-z'
  };
  
  if (specialCases[lowerName]) {
    return specialCases[lowerName];
  }
  
  // General normalization: lowercase, spaces to hyphens, remove special chars
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const config = {
  matcher: [
    // Match pokemon routes but exclude API routes and static files
    '/pokemon/:path*'
  ]
};