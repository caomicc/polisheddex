import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { loadManifest } from '@/utils/manifest-resolver';
import MoveDetailClient from '@/components/moves/move-detail-client';
import { PokemonGridSkeleton } from '@/components/pokemon/pokemon-card-skeleton';
import { MoveManifest, getPokemonThatCanLearnMove } from '@/utils/loaders/move-data-loader';
import { Move, MoveDescription } from '@/types/types';

export default async function MoveDetail({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const moveName = decodeURIComponent(nameParam);

  // Load move data
  const moveData = await loadManifest<MoveManifest>('moves').then(
    (movesData) => movesData[moveName.toLowerCase()] || null,
  );

  if (!moveData) {
    return notFound();
  }

  // Load Pokemon that can learn this move using the proper function
  // Use the display name from the move data, not the URL parameter
  const pokemonWithMove = await getPokemonThatCanLearnMove(moveData.name || moveName);

  return (
    <>
      <div className="max-w-xl md:max-w-4xl mx-auto">
        <Suspense fallback={<PokemonGridSkeleton count={8} />}>
          <MoveDetailClient
            moveData={moveData}
            pokemonWithMove={pokemonWithMove}
            moveName={moveData.name || moveName}
          />
        </Suspense>
      </div>
    </>
  );
}

// Generate static params for all moves
export async function generateStaticParams() {
  try {
    const movesData = await loadManifest<Record<string, Move>>('moves');
    return Object.keys(movesData).map((moveKey) => ({
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

  try {
    const moveData = await loadManifest<Record<string, MoveDescription>>('moves').then(
      (movesData) => movesData[moveName.toLowerCase()] || null,
    );

    if (!moveData) {
      return {
        title: 'Move Not Found',
        description: 'The requested move could not be found.',
      };
    }

    const pokemonWithMoveForCount = await getPokemonThatCanLearnMove(moveData.name || moveName);
    const pokemonCount = pokemonWithMoveForCount.length;

    const pokemonCountText =
      pokemonCount > 0 ? ` ${pokemonCount} Pokémon can learn this move.` : '';

    const title = `${moveData.name || moveName} | PolishedDex`;
    const description = `${moveData.description || 'Move details'}${pokemonCountText} View all Pokémon that can learn ${moveData.name || moveName} in Pokémon Polished Crystal.`;
    const url = `https://www.polisheddex.app/moves/${nameParam}`;

    // Build move stats text
    const moveStats = moveData.updated || moveData.faithful;
    const statsText = moveStats
      ? ` Type: ${moveStats.type}, Power: ${moveStats.power || 'N/A'}, Accuracy: ${moveStats.accuracy || 'N/A'}, PP: ${moveStats.pp || 'N/A'}.`
      : '';

    const socialDescription = `${moveData.description || 'Move details'}.${statsText}${pokemonCountText}`;

    return {
      title,
      description,
      keywords: [
        'pokemon polished crystal',
        moveData.name?.toLowerCase() || moveName.toLowerCase(),
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
            alt: `${moveData.name || moveName} - PolishedDex`,
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
  } catch (error) {
    console.error('Error generating metadata for move:', error);
    return {
      title: 'Move | PolishedDex',
      description: 'Move details and Pokémon that can learn it in Pokémon Polished Crystal.',
    };
  }
}

// Export viewport separately as required by Next.js 15+
export const viewport = 'width=device-width, initial-scale=1';
