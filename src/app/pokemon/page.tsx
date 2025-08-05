import Link from 'next/link';
import { BaseData } from '@/types/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Hero } from '@/components/ui/Hero';
import { loadPokemonBaseDataFromManifest } from '@/utils/loaders/pokemon-data-loader';
import { Suspense } from 'react';
import PokemonListDisplay from '@/components/pokemon/pokemon-list-display';

export default async function PokemonTableList() {
  // Load Pokemon data from manifest system
  const pokemonData = await loadPokemonBaseDataFromManifest();

  // Prepare an array of Pokémon with their names and dex numbers
  const pokemonList: BaseData[] = Object.values(pokemonData) as BaseData[];

  return (
    <>
      <Hero
        headline={'Pokédex Table'}
        description={'Browse all Pokémon in a searchable, sortable table format'}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Pokemon</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="max-w-xl md:max-w-4xl mx-auto ">
        <Suspense fallback={<div className="flex justify-center py-8">Loading Pokemon...</div>}>
          <PokemonListDisplay pokemonList={pokemonList} />
        </Suspense>
      </div>
    </>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata() {
  const title = 'Pokédex Table | PolishedDex';
  const description =
    'Browse all Pokémon available in Pokémon Polished Crystal in a searchable, sortable table format. Filter by type, generation, and more.';
  const url = 'https://polisheddex.com/pokemon/table';

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'pokedex table',
      'pokemon list',
      'pokemon database',
      'polisheddex',
      'pokemon table',
      'pokemon stats',
      'pokemon types',
      'searchable pokemon',
    ],

    // Open Graph metadata for Facebook, Discord, etc.
    openGraph: {
      title,
      description,
      url,
      siteName: 'PolishedDex',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Pokédex Table - PolishedDex',
        },
      ],
      locale: 'en_US',
    },

    // Twitter Card metadata
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
