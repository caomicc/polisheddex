import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';

import MoveDetailClient from '@/components/moves/move-detail-client';
import { PokemonGridSkeleton } from '@/components/pokemon/pokemon-card-skeleton';

async function loadMoveData(moveName: string) {
  const moveFilePath = path.join(process.cwd(), 'public/new/moves', `${moveName}.json`);
  try {
    const moveFileData = await fs.readFile(moveFilePath, 'utf-8');
    return JSON.parse(moveFileData);
  } catch (error) {
    console.error(`Error loading move data for ${moveName}:`, error);
    return null;
  }
}

async function checkLocationExists(locationId: string | undefined): Promise<boolean> {
  if (!locationId) return false;
  const locationFilePath = path.join(process.cwd(), 'public/new/locations', `${locationId}.json`);
  try {
    await fs.access(locationFilePath);
    return true;
  } catch {
    return false;
  }
}

export default async function MoveDetail({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const moveName = decodeURIComponent(nameParam);

  const moveData = await loadMoveData(moveName);

  if (!moveData) {
    return notFound();
  }

  // Check if TM/HM location exists
  const tmLocationExists = await checkLocationExists(moveData.tm?.location);

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto">
      <Suspense fallback={<PokemonGridSkeleton count={4} />}>
        <MoveDetailClient moveData={moveData} tmLocationExists={tmLocationExists} />
      </Suspense>
    </div>
  );
}

// Disable dynamic params - only pre-generated routes are valid
export const dynamicParams = false;

// Generate static params for all moves
export async function generateStaticParams() {
  try {
    // Load moves directly from manifest
    const manifestPath = path.join(process.cwd(), 'public/new/moves_manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf-8');
    const movesManifest = JSON.parse(manifestData);

    const moveKeys = movesManifest.map((move: any) => move.id);
    console.log(`Generated static params for ${moveKeys.length} moves from manifest`);

    return moveKeys.map((moveKey: string) => ({
      name: moveKey.toLowerCase(),
    }));
  } catch (error) {
    console.error('Error generating static params for moves:', error);
    return [];
  }
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const moveName = decodeURIComponent(nameParam);

  const moveData = await loadMoveData(moveName);

  if (!moveData) {
    return {
      title: 'Move Not Found',
      description: 'The requested move could not be found.',
    };
  }

  const title = `${moveData.versions['polished'].name} | PolishedDex`;
  const description = `${moveData.versions['polished'].description || 'Move details'} View all Pokémon that can learn ${moveData.versions['polished'].name} in Pokémon Polished Crystal.`;
  const url = `https://www.polisheddex.app/moves/${nameParam}`;

  // Build move stats text
  const moveStats = moveData.versions['polished'];
  const statsText = moveStats
    ? ` Type: ${moveStats.type}, Power: ${moveStats.power || 'N/A'}, Accuracy: ${moveStats.accuracy || 'N/A'}, PP: ${moveStats.pp || 'N/A'}.`
    : '';

  const socialDescription = `${moveData.versions['polished'].description || 'Move details'}.${statsText}`;

  return {
    title,
    description,
    keywords: [
        'pokemon polished crystal',
        moveData.versions['polished'].name?.toLowerCase() || moveName.toLowerCase(),
        'move',
        'pokemon moves',
        'polisheddex',
        moveStats?.type?.toLowerCase() || '',
        moveStats?.category?.toLowerCase() || '',
      ].filter(Boolean),

      // Open Graph metadata
      openGraph: {
        title,
        description: socialDescription,
        url,
        siteName: 'PolishedDex',
        type: 'website',
        images: [
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: `${moveData.versions['polished'].name} - PolishedDex`,
          },
        ],
        locale: 'en_US',
      },

      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title,
        description: socialDescription,
        images: ['/og-image.png'],
        creator: '@polisheddex',
        site: '@polisheddex',
      },

      // Additional metadata
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },

      // Canonical URL
      alternates: {
        canonical: url,
      },
    };
}

// Export viewport separately as required by Next.js 15+
export const viewport = 'width=device-width, initial-scale=1';
