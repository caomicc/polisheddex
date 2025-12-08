import Link from 'next/link';
import { PokemonManifest } from '@/types/new';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import PokemonSearch from '@/components/pokemon/pokemon-search';
import { Hero } from '@/components/ui/Hero';
import { loadPokemonFromNewManifest } from '@/utils/loaders/pokemon-data-loader';

export default async function PokemonList() {
  // Load Pokemon data from manifest system
  const pokemonData = await loadPokemonFromNewManifest();

  // Prepare an array of Pokémon - sorting will be handled client-side
  const pokemonList: PokemonManifest[] = Object.values(pokemonData);

  return (
    <>
      <Hero
        headline={'Pokedex'}
        description={'Browse all Pokémon available in Pokémon Polished Crystal'}
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

      <div className="max-w-xl md:max-w-4xl mx-auto md:p-4">
        <div className="flex justify-end mb-4">
          <Link
            href="/pokemon/table"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View as table →
          </Link>
        </div>
        <PokemonSearch pokemon={pokemonList} />
      </div>
    </>
  );
}

// Generate static metadata for SEO
export function generateMetadata() {
  const title = `Pokédex | PolishedDex`;
  const description = `Browse all Pokémon available in Pokémon Polished Crystal. View detailed stats, types, evolutions, moves, and locations.`;
  const url = `https://polisheddex.com/pokemon`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'pokedex',
      'pokemon list',
      'pokemon database',
      'polisheddex',
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
          alt: `Pokédex - PolishedDex`,
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
