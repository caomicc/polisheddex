import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Hero } from '@/components/ui/Hero';
import {
  LocationData,
  getAllLocations,
  getLocationData,
} from '@/utils/location-data-server';
import { getTrainersData } from '@/utils/loaders/trainer-data-loader';
import { getStaticPokemonForLocation } from '@/utils/loaders/static-pokemon-loader';
import { LocationDetailClient } from '@/components/locations/location-detail-client';
import { PokemonGridSkeleton } from '@/components/pokemon/pokemon-card-skeleton';

async function loadLocationData(locationId: string): Promise<LocationData | null> {
  try {
    return await getLocationData(locationId);
  } catch (error) {
    console.error(`Error loading location data for ${locationId}:`, error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const locationsData = await getAllLocations();
    return locationsData.map((location) => ({ name: location.id }));
  } catch (error) {
    console.error('Error generating static params for locations:', error);
    return [];
  }
}

export const dynamicParams = false;

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const locationId = decodeURIComponent(name);

  const locationData = await loadLocationData(locationId);

  if (!locationData) {
    return notFound();
  }

  const trainersData =
    locationData.trainers && locationData.trainers.length > 0
      ? await getTrainersData(locationData.trainers)
      : [];

  const staticPokemon = await getStaticPokemonForLocation(locationId);

  const displayName =
    locationData.name ||
    locationId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <>
      <Hero
        headline={displayName}
        description={locationData.region ? `Located in ${locationData.region}` : ''}
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
                <BreadcrumbLink asChild>
                  <Link href="/locations" className="hover:underline">
                    Locations
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{displayName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="max-w-xl md:max-w-4xl mx-auto">
        <Suspense fallback={<PokemonGridSkeleton count={4} />}>
          <LocationDetailClient location={locationData} trainers={trainersData} staticPokemon={staticPokemon} />
        </Suspense>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const locationId = decodeURIComponent(name);

  const locationData = await loadLocationData(locationId);

  const displayName =
    locationData?.name ||
    locationId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) ||
    'Unknown Location';

  const itemCount = locationData?.items?.length || 0;
  const eventCount = locationData?.events?.length || 0;
  const trainerCount = locationData?.trainers?.length || 0;

  const itemText = itemCount > 0 ? ` Features ${itemCount} items` : '';
  const eventText = eventCount > 0 ? ` and ${eventCount} events` : '';
  const trainerText = trainerCount > 0 ? ` with ${trainerCount} trainers` : '';

  const regionInfo = locationData?.region ? ` in ${locationData.region}` : '';

  const title = `${displayName} | PolishedDex Locations`;
  const description = `Explore ${displayName}${regionInfo} in Pokémon Polished Crystal.${itemText}${eventText}${trainerText}. Complete location guide with detailed information.`;
  const url = `https://www.polisheddex.app/locations/${name}`;

  const locationTypeText = locationData?.type ? ` (${locationData.type.join(', ')})` : '';
  const socialDescription = `${displayName}${locationTypeText}${regionInfo} - Complete location guide for Pokémon Polished Crystal`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'locations',
      displayName.toLowerCase(),
      'location guide',
      'polisheddex',
      ...(locationData?.region ? [locationData.region.toLowerCase()] : []),
      ...(locationData?.type ? locationData.type.map((t) => t.toLowerCase()) : []),
    ],
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
          alt: `${displayName} - PolishedDex Location Guide`,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: socialDescription,
      images: ['/og-image.png'],
      creator: '@polisheddex',
      site: '@polisheddex',
    },
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
    alternates: {
      canonical: url,
    },
  };
}
