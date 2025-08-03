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
import ConsolidatedLocationClient from '@/components/locations/ConsolidatedLocationClient';
import { 
  normalizeLocationKey, 
  getConsolidatedLocationKey, 
  getLocationRedirect 
} from '@/utils/locationUtils';
import { generateLocationBreadcrumbs } from '@/utils/locationUrlState';
import { GroupedPokemon, EncounterDetail } from '@/types/locationTypes';
import { groupLocationsHierarchically } from '@/utils/locationGrouping';
import {
  loadMergedPokemonLocationData,
  loadAllLocationData,
} from '@/utils/loaders/location-data-loader';
import { redirect } from 'next/navigation';
import React from 'react';

// Generate static params for consolidated locations only
export async function generateStaticParams() {
  try {
    const allLocationData = await loadAllLocationData();
    
    // Get all consolidated location keys
    const locationNames = new Set<string>();
    
    Object.keys(allLocationData).forEach((location) => {
      const consolidatedKey = getConsolidatedLocationKey(location);
      locationNames.add(normalizeLocationKey(consolidatedKey.toLowerCase()));
    });

    return Array.from(locationNames).map((name) => ({
      name,
    }));
  } catch (error) {
    console.error('Error generating static params for consolidated locations:', error);
    return [];
  }
}

export const dynamicParams = false;

export default async function ConsolidatedLocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ area?: string }>;
}) {
  const { name } = await params;
  const { area } = await searchParams;
  const locationName = decodeURIComponent(name);

  // Check if this is an old URL that needs redirection
  const redirectUrl = getLocationRedirect(locationName);
  if (redirectUrl) {
    redirect(redirectUrl);
  }

  // Get the consolidated location key
  const consolidatedKey = getConsolidatedLocationKey(locationName);

  const [pokemonLocationData, allLocationData] = await Promise.all([
    loadMergedPokemonLocationData(),
    loadAllLocationData(),
  ]);

  // Get the consolidated location data
  const locationData = allLocationData[consolidatedKey];
  
  if (!locationData) {
    return notFound();
  }

  // Aggregate Pokemon data from all related locations
  const aggregatedPokemonData: Record<
    string,
    { methods: Record<string, { times: Record<string, EncounterDetail[]> }> }
  > = {};

  // Get all locations that should be included in this consolidated view
  const locationsToInclude = [
    consolidatedKey,
    ...(locationData.consolidatedFrom || [])
  ];

  // Process Pokemon data for all included locations
  for (const locationKey of locationsToInclude) {
    const locationVariations = new Set([
      locationKey,
      normalizeLocationKey(locationKey),
      locationKey.replace(/_/g, ' '),
      locationKey
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    ]);

    for (const nameVariation of locationVariations) {
      if (pokemonLocationData[nameVariation]) {
        const pokemonData = pokemonLocationData[nameVariation];

        Object.entries(pokemonData.pokemon || {}).forEach(([pokemonName, pokemonData]) => {
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

              // Add location context for area-specific encounters
              const encountersWithLocation = encounters.map((encounter) => {
                // Determine which area this encounter belongs to
                let locationLabel = locationData.displayName;
                
                if (locationData.areas) {
                  const area = locationData.areas.find(a => 
                    locationKey.includes(a.id) || locationKey.endsWith(`_${a.id}`)
                  );
                  if (area) {
                    locationLabel = area.displayName;
                  }
                }

                return {
                  ...encounter,
                  location: locationLabel,
                  locationKey: locationKey,
                };
              });

              aggregatedPokemonData[pokemonName].methods[method].times[time].push(
                ...encountersWithLocation,
              );
            });
          });
        });
        break;
      }
    }
  }

  // Transform to GroupedPokemon format
  const groupedByMethodAndTime: GroupedPokemon = {};

  Object.entries(aggregatedPokemonData).forEach(([pokemonName, pokemonData]) => {
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

  // Sort Pokemon encounters by chance
  Object.values(groupedByMethodAndTime).forEach((methodData) => {
    Object.values(methodData).forEach((timeData) => {
      timeData.pokemon.sort((a, b) => b.chance - a.chance);
    });
  });

  // Generate breadcrumbs with area support
  const currentArea = area && locationData.areas?.find(a => a.id === area);
  const breadcrumbs = generateLocationBreadcrumbs(
    locationData.name,
    locationData.displayName,
    area,
    currentArea?.displayName
  );

  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading...</div>}>
      <div className="max-w-xl md:max-w-4xl mx-auto">
        <div className="space-y-6">
          <Hero
            headline={currentArea?.displayName || locationData.displayName}
            description={
              currentArea ? 
                `${currentArea.displayName} in ${locationData.displayName}` :
                `Explore ${locationData.displayName} in Pokémon Polished Crystal`
            }
            breadcrumbs={
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.href}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href} className="hover:underline hover:text-slate-200">
                              {crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            }
          />
          
          <ConsolidatedLocationClient
            locationData={locationData}
            groupedPokemonData={groupedByMethodAndTime}
            locationKey={locationData.name}
          />
        </div>
      </div>
    </Suspense>
  );
}

// Generate metadata for consolidated locations
export async function generateMetadata({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ name: string }>;
  searchParams: Promise<{ area?: string }>;
}) {
  const { name } = await params;
  const { area } = await searchParams;
  const locationName = decodeURIComponent(name);
  const consolidatedKey = getConsolidatedLocationKey(locationName);

  const [allLocationData, pokemonLocationData] = await Promise.all([
    loadAllLocationData(),
    loadMergedPokemonLocationData(),
  ]);

  const locationData = allLocationData[consolidatedKey];
  if (!locationData) {
    return {
      title: 'Location Not Found | PolishedDex',
      description: 'The requested location could not be found.',
    };
  }

  const currentArea = area && locationData.areas?.find(a => a.id === area);
  const displayName = currentArea?.displayName || locationData.displayName;
  const isAreaView = !!currentArea;

  // Count Pokemon encounters
  const pokemonCount = Object.keys(pokemonLocationData[consolidatedKey]?.pokemon || {}).length;
  const pokemonText = pokemonCount > 0 ? ` Features ${pokemonCount} different Pokémon encounters.` : '';

  // Area context
  const areaContext = isAreaView ? 
    ` - ${currentArea.displayName} area` : 
    (locationData.areas?.length ? ` with ${locationData.areas.length} explorable areas` : '');

  const title = `${displayName} | PolishedDex Locations`;
  const description = `Explore ${displayName} in ${locationData.region}${areaContext}.${pokemonText} Find wild Pokémon, items, trainers, and detailed location information.`;
  const url = `https://www.polisheddex.app/locations/${name}${area ? `?area=${area}` : ''}`;

  return {
    title,
    description,
    keywords: [
      'pokemon polished crystal',
      'locations',
      displayName.toLowerCase(),
      'pokemon encounters',
      'consolidated locations',
      locationData.region.toLowerCase(),
      ...(currentArea ? [currentArea.displayName.toLowerCase()] : []),
    ],

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
          alt: `${displayName} - PolishedDex Location Guide`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },

    alternates: {
      canonical: url,
    },
  };
}