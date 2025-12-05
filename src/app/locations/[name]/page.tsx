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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LocationData,
  getAllLocations,
  getLocationData,
} from '@/utils/location-data-server';
import { PokemonSprite } from '@/components/pokemon/pokemon-sprite';
import Image from 'next/image';
import { getItemSpriteName } from '@/utils/spriteUtils';

// Load location data from the new system using proper data loaders
async function loadLocationData(locationId: string): Promise<LocationData | null> {
  try {
    const locationData = await getLocationData(locationId);
    return locationData;
  } catch (error) {
    console.error(`Error loading location data for ${locationId}:`, error);
    return null;
  }
}

// Generate static params for all locations
export async function generateStaticParams() {
  try {
    const locationsData = await getAllLocations();

    return locationsData.map((location) => ({
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

          {/* Pokemon Encounters */}
          {locationData.encounters && locationData.encounters.length > 0 && (
            <div className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Wild Pokémon</h2>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="morning">Morning</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="night">Night</TabsTrigger>
                </TabsList>

                {['all', 'morning', 'day', 'night'].map((timeOfDay) => {
                  // Filter and consolidate encounters
                  const filteredEncounters =
                    timeOfDay === 'all'
                      ? locationData.encounters!
                      : locationData.encounters!.filter((e) => e.version === timeOfDay);

                  // Group by Pokemon + method, consolidate levels and rates
                  const groupedEncounters = filteredEncounters.reduce(
                    (acc, enc) => {
                      const key = `${enc.pokemon}-${enc.method}-${enc.formName || 'plain'}`;
                      if (!acc[key]) {
                        acc[key] = {
                          pokemon: enc.pokemon,
                          method: enc.method,
                          formName: enc.formName || 'plain',
                          levels: [],
                          totalRate: 0,
                          times: new Set<string>(),
                        };
                      }
                      const level = parseInt(enc.levelRange, 10);
                      if (!isNaN(level) && !acc[key].levels.includes(level)) {
                        acc[key].levels.push(level);
                      }
                      acc[key].totalRate += enc.rate;
                      acc[key].times.add(enc.version);
                      return acc;
                    },
                    {} as Record<
                      string,
                      {
                        pokemon: string;
                        method: string;
                        formName: string;
                        levels: number[];
                        totalRate: number;
                        times: Set<string>;
                      }
                    >,
                  );

                  const consolidatedEncounters = Object.values(groupedEncounters)
                    .map((enc) => {
                      enc.levels.sort((a, b) => a - b);
                      const levelRange =
                        enc.levels.length === 0
                          ? 'Varies'
                          : enc.levels.length === 1
                            ? `${enc.levels[0]}`
                            : `${enc.levels[0]}-${enc.levels[enc.levels.length - 1]}`;
                      return { ...enc, levelRange };
                    })
                    .sort((a, b) => b.totalRate - a.totalRate);

                  return (
                    <TabsContent key={timeOfDay} value={timeOfDay}>
                      {consolidatedEncounters.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60px]"></TableHead>
                              <TableHead>Pokémon</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead>Rate</TableHead>
                              {timeOfDay === 'all' && <TableHead>Time</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {consolidatedEncounters.map((enc, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <PokemonSprite
                                    pokemonName={enc.pokemon}
                                    form={enc.formName}
                                    className="w-10 h-10 shadow-none"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`/pokemon/${enc.pokemon}${enc.formName !== 'plain' ? `?form=${enc.formName}` : ''}`}
                                    className="font-medium capitalize hover:text-blue-600 dark:hover:text-blue-400"
                                  >
                                    {enc.pokemon.replace(/-/g, ' ')}
                                    {enc.formName !== 'plain' && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({enc.formName})
                                      </span>
                                    )}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="capitalize">
                                    {enc.method.replace(/_/g, ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell>Lv. {enc.levelRange}</TableCell>
                                <TableCell>{enc.totalRate}%</TableCell>
                                {timeOfDay === 'all' && (
                                  <TableCell className="capitalize">
                                    {Array.from(enc.times).join(', ')}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          No Pokémon encounters during this time
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          )}

          {/* Items */}
          {locationData.items && locationData.items.length > 0 && (
            <div className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Items Found Here</h2>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="hidden">Hidden</TabsTrigger>
                  <TabsTrigger value="gift">Gift</TabsTrigger>
                  <TabsTrigger value="berry">Berry</TabsTrigger>
                  <TabsTrigger value="tm">TM/HM</TabsTrigger>
                </TabsList>

                {['all', 'hidden', 'gift', 'berry', 'tm'].map((itemType) => {
                  const filteredItems =
                    itemType === 'all'
                      ? locationData.items!
                      : itemType === 'hidden'
                        ? locationData.items!.filter((item) => item.type === 'item' || item.type === 'hiddenItem')
                        : itemType === 'tm'
                          ? locationData.items!.filter((item) => item.type === 'tm' || item.type === 'hm')
                          : locationData.items!.filter((item) => item.type === itemType);

                  // Helper to format the type for display
                  const formatItemType = (type: string) => {
                    if (type === 'item' || type === 'hiddenItem') return 'Hidden';
                    if (type === 'tm') return 'TM';
                    if (type === 'hm') return 'HM';
                    return type.charAt(0).toUpperCase() + type.slice(1);
                  };

                  return (
                    <TabsContent key={itemType} value={itemType}>
                      {filteredItems.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60px]"></TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Location</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((item, idx) => {
                              // Format item name for display
                              const displayName = item.name
                                .replace(/([a-z])([A-Z])/g, '$1 $2')
                                .replace(/_/g, ' ');

                              // Get the sprite name
                              const spriteName = getItemSpriteName(displayName);

                              return (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Image
                                      src={`/sprites/items/${spriteName}.png`}
                                      width={24}
                                      height={24}
                                      alt={displayName}
                                      className="w-6 h-6"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Link
                                      href={`/items/${item.name.toLowerCase()}`}
                                      className="font-medium capitalize hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                      {displayName}
                                    </Link>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                      {formatItemType(item.type)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {item.coordinates ? (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({item.coordinates.x}, {item.coordinates.y})
                                      </span>
                                    ) : (
                                      <span className="text-sm text-gray-400 dark:text-gray-500">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          No {itemType === 'hidden' ? 'hidden items' : itemType === 'all' ? 'items' : itemType === 'tm' ? 'TM/HM items' : `${itemType} items`} found at this location
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
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
