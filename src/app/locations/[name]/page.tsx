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
import LocationClient from '@/components/pokemon/LocationClient';
import { normalizeLocationKey } from '@/utils/locationUtils';
import { GroupedPokemon, EncounterDetail } from '@/types/locationTypes';
import { Hero } from '@/components/ui/Hero';
import { groupLocationsHierarchically } from '@/utils/locationGrouping';
import {
  loadMergedPokemonLocationData,
  loadAllLocationData,
} from '@/utils/loaders/location-data-loader';

// Generate static params for all locations (including those without Pokemon)
export async function generateStaticParams() {
  try {
    const [pokemonLocations, allLocationData] = await Promise.all([
      loadMergedPokemonLocationData(),
      loadAllLocationData(),
    ]);

    const locationNames = new Set<string>();

    Object.keys(pokemonLocations).forEach((location) => {
      locationNames.add(normalizeLocationKey(location.toLowerCase()));
    });

    Object.keys(allLocationData).forEach((location) => {
      locationNames.add(normalizeLocationKey(location.toLowerCase()));
    });

    return Array.from(locationNames).map((name) => ({
      name,
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
  const locationName = decodeURIComponent(name);

  const [pokemonLocationData, allLocationData] = await Promise.all([
    loadMergedPokemonLocationData(),
    loadAllLocationData(),
  ]);

  const groupedLocations = groupLocationsHierarchically(allLocationData);

  const comprehensiveInfo = allLocationData[locationName];

  let pokemonInfo = null;
  const aggregatedPokemonData: Record<
    string,
    { methods: Record<string, { times: Record<string, EncounterDetail[]> }> }
  > = {};

  const parentLocation = groupedLocations[locationName];
  if (parentLocation && parentLocation.children && parentLocation.children.length > 0) {
    const allSubLocations = [parentLocation, ...parentLocation.children];

    allSubLocations.forEach((subLocation) => {
      const subLocationKey = subLocation.name;

      const subLocationVariations = new Set([
        subLocationKey,
        normalizeLocationKey(subLocation.displayName),
        subLocation.displayName,
        subLocationKey.replace(/_/g, ' '),
        subLocationKey
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      ]);

      for (const nameVariation of subLocationVariations) {
        if (pokemonLocationData[nameVariation]) {
          const subPokemonData = pokemonLocationData[nameVariation];

          Object.entries(subPokemonData.pokemon || {}).forEach(([pokemonName, pokemonData]) => {
            if (!aggregatedPokemonData[pokemonName]) {
              aggregatedPokemonData[pokemonName] = { methods: {} };
            }

            Object.entries(pokemonData.methods || {}).forEach(([method, methodData]) => {
              if (!aggregatedPokemonData[pokemonName].methods[method]) {
                aggregatedPokemonData[pokemonName].methods[method] = { times: {} };
              }

              const typedMethodData = methodData as { times: Record<string, EncounterDetail[]> };

              Object.entries(typedMethodData.times || {}).forEach(([time, encounters]) => {
                if (!aggregatedPokemonData[pokemonName].methods[method].times[time]) {
                  aggregatedPokemonData[pokemonName].methods[method].times[time] = [];
                }

                const encountersWithLocation = encounters.map((encounter) => ({
                  ...encounter,
                  location: subLocation.displayName,
                  locationKey: subLocationKey,
                }));

                aggregatedPokemonData[pokemonName].methods[method].times[time].push(
                  ...encountersWithLocation,
                );
              });
            });
          });
          break;
        }
      }
    });

    if (Object.keys(aggregatedPokemonData).length > 0) {
      pokemonInfo = { pokemon: aggregatedPokemonData };
    }
  } else {
    const locationVariations = new Set([
      locationName,
      ...(comprehensiveInfo
        ? [comprehensiveInfo.displayName, normalizeLocationKey(comprehensiveInfo.displayName)]
        : []),
      normalizeLocationKey(locationName),
      locationName.replace(/_/g, ' '),
      locationName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      locationName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' '),
    ]);

    for (const nameVariation of locationVariations) {
      if (pokemonLocationData[nameVariation]) {
        pokemonInfo = pokemonLocationData[nameVariation];
        break;
      }
    }
  }

  if (!pokemonInfo && !comprehensiveInfo) {
    return notFound();
  }

  const displayName =
    comprehensiveInfo?.displayName ||
    locationName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const groupedByMethodAndTime: GroupedPokemon = {};

  Object.entries(pokemonInfo?.pokemon ?? {}).forEach(([pokemonName, pokemonData]) => {
    Object.entries(pokemonData.methods).forEach(([method, methodData]) => {
      if (!groupedByMethodAndTime[method]) {
        groupedByMethodAndTime[method] = {};
      }

      Object.entries(methodData.times).forEach(([time, encounters]) => {
        if (!groupedByMethodAndTime[method][time]) {
          groupedByMethodAndTime[method][time] = { pokemon: [] };
        }

        encounters.forEach(
          (encounter: EncounterDetail & { location?: string; locationKey?: string }) => {
            const pokemonEntry: {
              name: string;
              level: string;
              chance: number;
              rareItem?: string;
              form?: string;
              location?: string;
            } = {
              name: pokemonName,
              level: encounter.level,
              chance: encounter.chance,
              form: '',
            };

            if ('rareItem' in encounter && typeof encounter.rareItem === 'string') {
              pokemonEntry.rareItem = encounter.rareItem;
            }

            if ('formName' in encounter && typeof encounter.formName === 'string') {
              pokemonEntry.form = encounter.formName;
            }

            if ('location' in encounter && typeof encounter.location === 'string') {
              pokemonEntry.location = encounter.location;
            }

            groupedByMethodAndTime[method][time].pokemon.push(pokemonEntry);
          },
        );
      });
    });
  });

  Object.values(groupedByMethodAndTime).forEach((methodData) => {
    Object.values(methodData).forEach((timeData) => {
      timeData.pokemon.sort((a, b) => b.chance - a.chance);
    });
  });

  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading...</div>}>
      <div className="max-w-xl md:max-w-4xl mx-auto">
        <div className="space-y-6">
          <Hero
            headline={displayName}
            description=""
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
          <LocationClient
            comprehensiveInfo={comprehensiveInfo}
            groupedPokemonData={groupedByMethodAndTime}
          />
        </div>
      </div>
    </Suspense>
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const locationName = decodeURIComponent(name);

  const [allLocationData, pokemonLocationData] = await Promise.all([
    loadAllLocationData(),
    loadMergedPokemonLocationData(),
  ]);

  // Get comprehensive location info
  const comprehensiveInfo = allLocationData[locationName];
  const pokemonInfo = pokemonLocationData[locationName];

  // Create display name and description
  const displayName =
    comprehensiveInfo?.displayName ||
    locationName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) ||
    'Unknown Location';

  // Count unique Pokemon encounters
  const pokemonCount = pokemonInfo ? Object.keys(pokemonInfo.pokemon || {}).length : 0;
  const pokemonText =
    pokemonCount > 0 ? ` Features ${pokemonCount} different Pokémon encounters.` : '';

  // Get region info if available
  const regionInfo = comprehensiveInfo?.region ? ` in ${comprehensiveInfo.region}` : '';

  const title = `${displayName} | PolishedDex Locations`;
  const description = `Explore ${displayName}${regionInfo} in Pokémon Polished Crystal.${pokemonText} Find wild Pokémon, items, trainers, and detailed location information.`;
  const url = `https://www.polisheddex.app/locations/${name}`;

  // Create rich social description
  const locationTypeText = comprehensiveInfo?.type ? ` (${comprehensiveInfo.type})` : '';
  const socialDescription = `${displayName}${locationTypeText}${regionInfo} - ${pokemonText || 'Location in Pokémon Polished Crystal'}`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'locations',
      displayName.toLowerCase(),
      'pokemon encounters',
      'wild pokemon',
      'polisheddex',
      'location guide',
      ...(comprehensiveInfo?.region ? [comprehensiveInfo.region.toLowerCase()] : []),
      ...(comprehensiveInfo?.type ? [comprehensiveInfo.type.toLowerCase()] : []),
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
