import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { LocationData, GroupedPokemon, EncounterDetail } from '@/types/locationTypes';
import { Hero } from '@/components/ui/Hero';
import { groupLocationsHierarchically } from '@/utils/locationGrouping';

// Function to load Pokemon location data
async function loadPokemonLocationData() {
  try {
    const locationsFile = path.join(process.cwd(), 'output/locations_by_area.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    return JSON.parse(data) as Record<string, LocationData>;
  } catch (error) {
    console.error('Error loading Pokemon location data:', error);
    return {};
  }
}

// Function to load comprehensive location data
async function loadAllLocationData() {
  try {
    const locationsFile = path.join(process.cwd(), 'output/all_locations.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading comprehensive location data:', error);
    return {};
  }
}

// This function helps Next.js pre-render pages at build time
export async function generateStaticParams() {
  const pokemonLocations = await loadPokemonLocationData();
  const allLocations = await loadAllLocationData();

  // Get all unique location keys from both datasets
  const allLocationKeys = new Set([...Object.keys(pokemonLocations), ...Object.keys(allLocations)]);

  return Array.from(allLocationKeys).map((name) => ({ name }));
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const locationName = decodeURIComponent(name);

  const pokemonLocationData = await loadPokemonLocationData();
  const allLocationData = await loadAllLocationData();

  // Group locations hierarchically to understand parent-child relationships
  const groupedLocations = groupLocationsHierarchically(allLocationData);

  // Check comprehensive location data (by key)
  const comprehensiveInfo = allLocationData[locationName];

  // Try to find matching Pokemon data using normalized keys and variations
  let pokemonInfo = null;
  const aggregatedPokemonData: Record<
    string,
    { methods: Record<string, { times: Record<string, EncounterDetail[]> }> }
  > = {};

  // First, check if this is a parent location with children
  const parentLocation = groupedLocations[locationName];
  if (parentLocation && parentLocation.children && parentLocation.children.length > 0) {
    // This is a parent location - aggregate data from all children
    const allSubLocations = [parentLocation, ...parentLocation.children];

    allSubLocations.forEach((subLocation) => {
      const subLocationKey = subLocation.name;

      // Create variations for this sub-location
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

      // Try to find Pokemon data for this sub-location
      for (const nameVariation of subLocationVariations) {
        if (pokemonLocationData[nameVariation]) {
          const subPokemonData = pokemonLocationData[nameVariation];

          // Merge Pokemon data with location context
          Object.entries(subPokemonData.pokemon || {}).forEach(([pokemonName, pokemonData]) => {
            if (!aggregatedPokemonData[pokemonName]) {
              aggregatedPokemonData[pokemonName] = { methods: {} };
            }

            // Merge methods - properly type the methodData
            Object.entries(pokemonData.methods || {}).forEach(([method, methodData]) => {
              if (!aggregatedPokemonData[pokemonName].methods[method]) {
                aggregatedPokemonData[pokemonName].methods[method] = { times: {} };
              }

              // Type assertion for methodData to handle the unknown type
              const typedMethodData = methodData as { times: Record<string, EncounterDetail[]> };

              // Merge times with location information
              Object.entries(typedMethodData.times || {}).forEach(([time, encounters]) => {
                if (!aggregatedPokemonData[pokemonName].methods[method].times[time]) {
                  aggregatedPokemonData[pokemonName].methods[method].times[time] = [];
                }

                // Add location information to each encounter
                const encountersWithLocation = encounters.map((encounter) => ({
                  ...encounter,
                  location: subLocation.displayName, // Add the specific sub-location name
                  locationKey: subLocationKey, // Also add the key for reference
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

    // If we found aggregated data, use it
    if (Object.keys(aggregatedPokemonData).length > 0) {
      pokemonInfo = { pokemon: aggregatedPokemonData };
    }
  } else {
    // This is not a parent location or has no children - try direct lookup
    // Create all possible variations of the location name for matching
    const locationVariations = new Set([
      locationName, // Original URL param: "burned_tower_1f"
      // From comprehensive info if available
      ...(comprehensiveInfo
        ? [
            comprehensiveInfo.displayName, // "Burned Tower 1F"
            normalizeLocationKey(comprehensiveInfo.displayName), // "burned_tower_1f"
          ]
        : []),
      // Normalized variations
      normalizeLocationKey(locationName), // "burned_tower_1f"
      // Space variations
      locationName.replace(/_/g, ' '), // "burned tower 1f"
      locationName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '), // "Burned Tower 1f"
      // Title case variations
      locationName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' '), // "Burned Tower 1f"
    ]);

    // Try each variation to find Pokemon data
    for (const nameVariation of locationVariations) {
      if (pokemonLocationData[nameVariation]) {
        pokemonInfo = pokemonLocationData[nameVariation];
        break;
      }
    }
  }

  // If neither exists, return 404
  if (!pokemonInfo && !comprehensiveInfo) {
    return notFound();
  }

  // Determine display name - prefer comprehensive info, fallback to processed location name
  const displayName =
    comprehensiveInfo?.displayName ||
    locationName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  // Process Pokémon encounters by method and time for locations with Pokemon data
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

            // Add rareItem if it exists
            if ('rareItem' in encounter && typeof encounter.rareItem === 'string') {
              pokemonEntry.rareItem = encounter.rareItem;
            }

            // Add form if it exists
            if ('formName' in encounter && typeof encounter.formName === 'string') {
              pokemonEntry.form = encounter.formName;
            }

            // Add location if it exists (for aggregated parent locations)
            if ('location' in encounter && typeof encounter.location === 'string') {
              pokemonEntry.location = encounter.location;
            }

            groupedByMethodAndTime[method][time].pokemon.push(pokemonEntry);
          },
        );
      });
    });
  });

  // Sort Pokémon by encounter rate (highest first)
  Object.values(groupedByMethodAndTime).forEach((methodData) => {
    Object.values(methodData).forEach((timeData) => {
      timeData.pokemon.sort((a, b) => b.chance - a.chance);
    });
  });

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto">
      <div className="space-y-6">
        <Hero
          className="text-white"
          headline={displayName}
          description=""
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
                  <BreadcrumbLink asChild>
                    <Link
                      href="/locations"
                      className="hover:underline text-white hover:text-slate-200"
                    >
                      Locations
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white">{displayName}</BreadcrumbPage>
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
  );
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const locationName = decodeURIComponent(name);

  const allLocationData = await loadAllLocationData();
  const pokemonLocationData = await loadPokemonLocationData();

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
  const url = `https://polisheddex.vercel.app/locations/${name}`;

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
