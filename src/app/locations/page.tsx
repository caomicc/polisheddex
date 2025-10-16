import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import LocationSearch from '@/components/locations/location-search';
import { Hero } from '@/components/ui/Hero';
import { getAllLocations } from '@/utils/location-data-server';

export default async function LocationsPage() {
  // Load locations using the new manifest system
  const locationsData = await getAllLocations();

  // Data is already an array from manifest
  const processedLocations = locationsData;

  return (
    <>
      <Hero
        headline={'Locations'}
        description={'Explore the diverse locations in Pokémon Polished Crystal'}
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
                <BreadcrumbPage className="">Locations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
        <LocationSearch locations={processedLocations} />
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
