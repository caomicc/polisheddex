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
import PokemonSearch from '@/components/pokemon/pokemon-search';
import { Hero } from '@/components/ui/Hero';
import { loadPokemonBaseDataFromManifest } from '@/utils/loaders/pokemon-data-loader';
export default async function PokemonList({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  // Load Pokemon data from manifest system
  const pokemonData = await loadPokemonBaseDataFromManifest();
  const { sort = 'johtodex' } = (await searchParams) ?? {};

  console.log('Pokemon data loaded:', Object.keys(pokemonData).length, 'entries');
  console.log(JSON.stringify(pokemonData, null, 2));

  // Determine sort type from query param
  const sortType =
    sort === 'nationaldex' ? 'nationaldex' : sort === 'johtodex' ? 'johtodex' : 'alphabetical';

  // Prepare an array of Pokémon with their names and dex numbers
  const pokemonList: BaseData[] = Object.values(pokemonData) as BaseData[];

  // Sort based on selected sort type
  const sortedPokemon = [...pokemonList].sort((a, b) => {
    if (sortType === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (sortType === 'nationaldex') {
      return (a.nationalDex ?? 0) - (b.nationalDex ?? 0) || a.name.localeCompare(b.name);
    }
    if (sortType === 'johtodex') {
      return (a.johtoDex ?? 999) - (b.johtoDex ?? 999) || a.name.localeCompare(b.name);
    }
    return 0;
  });

  console.log(
    `Sorted Pokémon by ${sortType}:`,
    sortedPokemon.map((p) => `${p.name} (${p.johtoDex ?? 'N/A'})`).join(', '),
  );

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
        <PokemonSearch pokemon={sortedPokemon} sortType={sortType} />
      </div>
    </>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort = 'johtodex' } = (await searchParams) ?? {};

  const sortType =
    sort === 'nationaldex' ? 'National Dex' : sort === 'johtodex' ? 'Johto Dex' : 'Alphabetical';

  const title = `Pokédex - ${sortType} Order | PolishedDex`;
  const description = `Browse all Pokémon available in Pokémon Polished Crystal, sorted by ${sortType} order. View detailed stats, types, evolutions, moves, and locations.`;
  const url = `https://polisheddex.com/pokemon${sort !== 'johtodex' ? `?sort=${sort}` : ''}`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'pokedex',
      'pokemon list',
      'pokemon database',
      'polisheddex',
      sortType.toLowerCase(),
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
          alt: `Pokédex - ${sortType} Order - PolishedDex`,
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
