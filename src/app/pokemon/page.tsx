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
import PokemonSearch from '@/components/pokemon/PokemonSearch';
import { Hero } from '@/components/ui/Hero';
import { loadPokemonBaseData } from '@/utils/loaders/pokemon-base-data-loader';

export default async function PokemonList() {
  // Load Pokemon data using optimized loader
  const pokemonData = await loadPokemonBaseData();

  // Convert to array for the search component
  const allPokemon: BaseData[] = Object.values(pokemonData);

  return (
    <>
      <Hero
        headline="Pokédex"
        description="Browse all Pokémon available in Pokémon Polished Crystal"
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
                <BreadcrumbPage className="">Pokemon</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-xl md:max-w-4xl mx-auto md:px-4">
        <PokemonSearch pokemon={allPokemon} sortType="johtodex" />
      </div>
    </>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata() {
  const title = 'Pokédex | PolishedDex';
  const description = 'Browse all Pokémon available in Pokémon Polished Crystal. View detailed stats, types, evolutions, moves, and locations.';
  const url = 'https://www.polisheddx.app/pokemon';

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'pokédex',
      'pokemon list',
      'pokemon database',
      'polisheddx',
      'pokemon stats',
      'pokemon types',
      'pokemon evolutions',
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
          alt: 'Pokédex - PolishedDex',
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