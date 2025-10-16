import path from 'path';
import { Suspense } from 'react';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import PokemonFormWrapper from '@/components/pokemon/pokemon-form-wrapper';
import PokemonNavigation from '@/components/pokemon/pokemon-navigation';
import PokemonKeyboardNavigation from '@/components/pokemon/pokemon-keyboard-navigation';
import { getPokemonNavigation } from '@/utils/pokemonNavigation';
import { loadJsonData } from '@/utils/fileLoader';
import { loadBasePokemonData, loadEnrichedPokemonData } from '@/utils/loaders/pokemon-data-loader';
import { Button } from '@/components/ui/button';
import { reduce } from '@/lib/extract-utils';

export default async function PokemonDetail({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const pokemonName = decodeURIComponent(nameParam);

  // Load Pokemon data with resolved abilities using the new optimized loader
  const pokemonData = await loadEnrichedPokemonData(pokemonName);

  if (!pokemonData) return notFound();

  // Load the new dex order for navigation
  const navigation = getPokemonNavigation(pokemonName);

  return (
    <>
      <div className="max-w-xl md:max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 sr-only">{pokemonName}</h1>
        <PokemonKeyboardNavigation navigation={navigation} />
        <PokemonFormWrapper pokemonData={pokemonData} />
        {/* Only render navigation if we have valid navigation data */}
        {navigation.current.index !== -1 ? (
          <PokemonNavigation navigation={navigation} />
        ) : (
          <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <Button asChild variant="ghost" size="sm">
                <Link href="/pokemon" className="flex items-center gap-1">
                  <span className="text-xs">Back to List</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Generate static params for all Pokemon - only lowercase normalized names
export async function generateStaticParams() {
  const baseDataFile = path.join(process.cwd(), 'new/pokemon_manifest.json');
  const data = await loadJsonData<Record<string, unknown>>(baseDataFile);

  if (!data) return [];

  // Only generate lowercase normalized URLs to prevent uppercase static generation
  return Object.keys(data).map((pokemonKey) => ({
    name: pokemonKey,
  }));
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const nameParam = (await params).name;
  const standardKey = reduce(nameParam);

  // Use the optimized loader for metadata as well
  const pokemonData = await loadBasePokemonData(standardKey);

  if (!pokemonData) {
    return {
      title: 'Pokémon Not Found',
      description: 'The requested Pokémon could not be found.',
    };
  }

  // Get types for better description
  const types = pokemonData.versions['polished'].types || [];
  const typeText = Array.isArray(types) ? types.join('/') : types || 'Unknown';

  // Get dex numbers
  const nationalDex = pokemonData.dexNo;
  const dexInfo = nationalDex ? `#${nationalDex}` : '';

  // Build description
  const pokemonDisplayName = (pokemonData.name || 'Unknown Pokemon').replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  );
  const baseDescription = `${pokemonDisplayName} ${dexInfo} - ${typeText} type Pokémon`;
  // const locationCount = pokemonData.locations?.length || 0;
  // const locationText = locationCount > 0 ? ` Found in ${locationCount} locations.` : '';

  const title = `${pokemonDisplayName} ${dexInfo} | PolishedDex`;
  const description = `${baseDescription} in Pokémon Polished Crystal. View stats, moves, evolution, and more.`;
  const url = `https://www.polisheddex.app/pokemon/${nameParam}`;

  const socialDescription = `${baseDescription}`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      pokemonDisplayName.toLowerCase(),
      'pokedex',
      'pokemon stats',
      'pokemon moves',
      'pokemon evolution',
      typeText.toLowerCase(),
      'polisheddex',
    ],

    // Open Graph metadata
    openGraph: {
      title,
      description: socialDescription,
      url,
      siteName: 'PolishedDex',
      type: 'website',

      locale: 'en_US',
    },

    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title,
      description: socialDescription,
      // images: [pokemonData.frontSpriteUrl || '/og-image.png'],
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
