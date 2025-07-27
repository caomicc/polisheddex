import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { LocationData } from '@/types/types';
import LocationSearch from '@/components/pokemon/LocationSearch';
import { Hero } from '@/components/ui/Hero';
import { loadEnhancedLocations } from '@/utils/location-data-loader';

export default async function LocationsPage() {
  // Load enhanced locations using the optimized loader
  const processedLocations = await loadEnhancedLocations();

  return (
    <>
      <Hero
        className="text-white"
        headline={'Locations'}
        description={'Explore the diverse locations in Pokémon Polished Crystal'}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline text-white hover:text-slate-200">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Locations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-xl md:max-w-4xl mx-auto px-4">
        {/* Display summary of location data */}
        {/* <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{processedLocations.length}</div>
            <div className="text-slate-600 dark:text-slate-300">Total Locations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{processedLocations.filter(l => l.pokemonCount > 0).length}</div>
            <div className="text-slate-600 dark:text-slate-300">With Pokémon</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{processedLocations.filter(l => l.hasTrainers).length}</div>
            <div className="text-slate-600 dark:text-slate-300">With Trainers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{processedLocations.filter(l => l.items && l.items.length > 0).length}</div>
            <div className="text-slate-600 dark:text-slate-300">With Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{processedLocations.filter(l => l.flyable).length}</div>
            <div className="text-slate-600 dark:text-slate-300">Flyable</div>
          </div>
        </div>
      </div> */}

        <LocationSearch locations={processedLocations as LocationData[]} />
      </div>
    </>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata() {
  const title = 'Locations Guide | PolishedDex';
  const description =
    'Explore all locations in Pokémon Polished Crystal including routes, cities, caves, and special areas. Find Pokémon encounters, items, and trainers for each location.';
  const url = 'https://polisheddex.com/locations';

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'locations',
      'routes',
      'cities',
      'caves',
      'pokemon locations',
      'polisheddex',
      'location guide',
      'pokemon encounters',
      'johto',
      'kanto',
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
          alt: 'Locations Guide - PolishedDex',
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
