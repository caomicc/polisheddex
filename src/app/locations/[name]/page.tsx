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
import { LocationData } from '@/types/new';
import { loadJsonFile } from '@/utils/fileLoader';

// Load location data from the new system
async function loadLocationData(locationId: string): Promise<LocationData | null> {
  try {
    const locationData = await loadJsonFile<LocationData>(`new/locations/${locationId}.json`);
    return locationData;
  } catch (error) {
    console.error(`Error loading location data for ${locationId}:`, error);
    return null;
  }
}

// Generate static params for all locations
export async function generateStaticParams() {
  try {
    const locationManifest = await loadJsonFile<Array<{ id: string; name: string }>>(
      'new/locations_manifest.json',
    );

    if (!locationManifest || !Array.isArray(locationManifest)) {
      console.error('Invalid locations manifest');
      return [];
    }

    return locationManifest.map((location) => ({
      name: location.id,
    }));
  } catch (error) {
    console.error('Error generating static params for locations:', error);
    return [];
  }
}
// Disable ISR - use static generation only
export const dynamicParams = false;

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const locationId = decodeURIComponent(name);

  // Load location data from the new system
  const locationData = await loadLocationData(locationId);

  if (!locationData) {
    return notFound();
  }

  const displayName =
    locationData.name ||
    locationId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading...</div>}>
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
                <BreadcrumbPage className="">{displayName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="max-w-xl md:max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Basic Location Info */}
          <div className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Location Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locationData.region && (
                <div>
                  <span className="font-medium">Region:</span> {locationData.region}
                </div>
              )}
              {locationData.type && (
                <div>
                  <span className="font-medium">Type:</span> {locationData.type.join(', ')}
                </div>
              )}
              {locationData.connectionCount && (
                <div>
                  <span className="font-medium">Connections:</span> {locationData.connectionCount}
                </div>
              )}
              {locationData.order && (
                <div>
                  <span className="font-medium">Order:</span> {locationData.order}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          {locationData.items && locationData.items.length > 0 && (
            <div className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Items Found Here</h2>
              <div className="grid grid-cols-1 gap-3">
                {locationData.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-700"
                  >
                    <div>
                      <span className="font-medium capitalize">
                        {item.name.replace(/([a-z])([A-Z])/g, '$1 $2')}
                      </span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        ({item.type})
                      </span>
                    </div>
                    {item.coordinates && (
                      <span className="text-xs text-gray-500">
                        ({item.coordinates.x}, {item.coordinates.y})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {locationData.events && locationData.events.length > 0 && (
            <div className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Events</h2>
              <div className="grid grid-cols-1 gap-3">
                {locationData.events.map((event, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <div className="font-medium capitalize">
                      {event.name.replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {event.description} ({event.type})
                    </div>
                    {event.item && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Item: {event.item}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trainers */}
          {locationData.trainers && locationData.trainers.length > 0 && (
            <div className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Trainers</h2>
              <div className="grid grid-cols-1 gap-3">
                {locationData.trainers.map((trainer, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <div className="font-medium">{trainer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Data (for debugging) */}
          <details className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
            <summary className="cursor-pointer font-semibold">View Raw Data</summary>
            <pre className="mt-4 text-xs overflow-auto bg-gray-100 p-4 rounded dark:bg-gray-900">
              {JSON.stringify(locationData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </Suspense>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const locationId = decodeURIComponent(name);

  // Load location data from the new system
  const locationData = await loadLocationData(locationId);

  // Create display name and description
  const displayName =
    locationData?.name ||
    locationId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) ||
    'Unknown Location';

  // Count items and events
  const itemCount = locationData?.items?.length || 0;
  const eventCount = locationData?.events?.length || 0;
  const trainerCount = locationData?.trainers?.length || 0;

  const itemText = itemCount > 0 ? ` Features ${itemCount} items` : '';
  const eventText = eventCount > 0 ? ` and ${eventCount} events` : '';
  const trainerText = trainerCount > 0 ? ` with ${trainerCount} trainers` : '';

  // Get region info if available
  const regionInfo = locationData?.region ? ` in ${locationData.region}` : '';

  const title = `${displayName} | PolishedDex Locations`;
  const description = `Explore ${displayName}${regionInfo} in Pokémon Polished Crystal.${itemText}${eventText}${trainerText}. Complete location guide with detailed information.`;
  const url = `https://www.polisheddex.app/locations/${name}`;

  // Create rich social description
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
          alt: `${displayName} - PolishedDex Location Guide`,
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
