import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { LocationData, LocationAreaData, GroupedLocation } from '@/types/types';
// import LocationCard from '@/components/pokemon/LocationCard';
import LocationSearch from '@/components/pokemon/LocationSearch';
import { normalizeLocationKey } from '@/utils/locationUtils';
import {
  groupLocationsHierarchically,
  filterLocationsWithData,
  flattenGroupedLocations,
} from '@/utils/locationGrouping';
import { Hero } from '@/components/ui/Hero';

// Interface for items data
interface ItemData {
  id: string;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
  locations: Array<{
    area: string;
    details: string;
  }>;
}

// Function to load items data
async function loadItemsData(): Promise<Record<string, ItemData>> {
  try {
    const itemsFile = path.join(process.cwd(), 'output/items_data.json');
    const data = await fs.promises.readFile(itemsFile, 'utf8');
    const parsed = JSON.parse(data) as Record<string, ItemData>;
    console.log('Items data loaded successfully, keys:', Object.keys(parsed).length);
    return parsed;
  } catch (error) {
    console.error('Error loading items data:', error);
    return {};
  }
}

// Function to load Pokemon encounter data by area
async function loadPokemonLocationData(): Promise<Record<string, LocationAreaData>> {
  try {
    const locationsFile = path.join(process.cwd(), 'output/locations_by_area.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    return JSON.parse(data) as Record<string, LocationAreaData>;
  } catch (error) {
    console.error('Error loading Pokemon location data:', error);
    return {};
  }
}

// Function to load comprehensive location data and group hierarchically
async function loadGroupedLocationData(): Promise<Record<string, GroupedLocation>> {
  try {
    const locationsFile = path.join(process.cwd(), 'output/all_locations.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    const allLocationData = JSON.parse(data) as Record<string, LocationData>;

    // Group locations hierarchically
    const groupedLocations = groupLocationsHierarchically(allLocationData);

    // Filter to only show locations with meaningful data
    const locationsWithData = filterLocationsWithData(groupedLocations);

    return locationsWithData;
  } catch (error) {
    console.error('Error loading and grouping location data:', error);
    return {};
  }
}

// Enhanced location type with additional data
export interface EnhancedLocation {
  area: string; // Key used for internal processing
  urlName: string; // Name used for URLs (matches Pokemon location data keys)
  displayName: string;
  types: string[];
  pokemonCount: number;
  hasHiddenGrottoes: boolean;
  hasTrainers: boolean; // Whether location has any trainers
  trainerCount: number; // Number of trainers in location
  items?: Array<{ type: 'item' | 'hiddenItem' | 'tmHm'; name: string; details?: string }>; // Items available at this location
  region?: 'johto' | 'kanto' | 'orange';
  flyable?: boolean;
  connections?: Array<{
    direction: string;
    targetLocation: string;
    targetLocationDisplay: string;
    offset: number;
  }>;
  coordinates?: { x: number; y: number };
}

// Type for Pokemon methods in location data
interface PokemonWithMethods {
  methods?: Record<string, unknown>;
}

/**
 * Create a more intelligent location matching system for items
 * Maps item location names to normalized location keys
 */
function createLocationMappingForItems(locations: EnhancedLocation[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  locations.forEach((location) => {
    const normalized = normalizeLocationKey(location.area);
    const displayName = location.displayName.toLowerCase();

    // Direct mapping
    mapping[normalizeLocationKey(location.displayName)] = normalized;

    // Handle common variations
    // Poké Mart -> Mart
    if (displayName.includes('mart') && !displayName.includes('dept')) {
      const baseName = displayName.replace(' mart', '');
      // Map from "City/Town Poké Mart" format to just "Mart" format
      mapping[normalizeLocationKey(baseName + ' City Poké Mart')] = normalized;
      mapping[normalizeLocationKey(baseName + ' Town Poké Mart')] = normalized;
      mapping[normalizeLocationKey(baseName + ' Poké Mart')] = normalized;
    }

    // Department Store variations
    if (displayName.includes('dept') || displayName.includes('department')) {
      const baseName = displayName.replace(/\s*(dept|department).*$/i, '');
      mapping[normalizeLocationKey(baseName + ' Dept. Store 2F')] = normalized;
      mapping[normalizeLocationKey(baseName + ' Department Store 2F')] = normalized;
      mapping[normalizeLocationKey(baseName + ' Dept Store 2F')] = normalized;
    }

    // Game Corner variations
    if (displayName.includes('game corner')) {
      const baseName = displayName.replace(' game corner', '');
      mapping[normalizeLocationKey(baseName + ' Game Corner')] = normalized;
    }

    // Handle special locations
    if (displayName.includes('radio tower')) {
      mapping[normalizeLocationKey('Radio Tower')] = normalized;
      mapping[normalizeLocationKey("Radio Tower Buena's Password Club")] = normalized;
    }
  });

  return mapping;
}
/**
 * Determines location types based on the location name.
 * Uses a simple heuristic mapping for biome/environment.
 * @param locationName - The name of the location
 * @returns Array of type strings
 */
function getLocationTypes(locationName: string): string[] {
  if (locationName.includes('Forest') || locationName.includes('Woods')) {
    return ['Grass'];
  } else if (locationName.includes('Cave') || locationName.includes('Mountain')) {
    return ['Rock'];
  } else if (
    locationName.includes('Lake') ||
    locationName.includes('Sea') ||
    locationName.includes('Ocean')
  ) {
    return ['Water'];
  } else if (locationName.includes('Tower') || locationName.includes('Ruins')) {
    return ['Ghost'];
  } else if (locationName.includes('Power Plant')) {
    return ['Electric'];
  } else if (locationName.includes('Desert') || locationName.includes('Sand')) {
    return ['Ground'];
  } else if (locationName.includes('Volcano') || locationName.includes('Lava')) {
    return ['Fire'];
  } else if (locationName.includes('Route')) {
    return ['Grass'];
  } else if (locationName.includes('City') || locationName.includes('Town')) {
    return ['Normal'];
  }
  return ['Normal'];
}

export default async function LocationsPage() {
  const pokemonLocationData = await loadPokemonLocationData();
  const groupedLocations = await loadGroupedLocationData(); // Get hierarchically grouped locations
  const itemsData = await loadItemsData(); // Load items data

  // Flatten grouped locations for item mapping and search functionality
  const flattenedLocations = flattenGroupedLocations(groupedLocations);
  const allLocations = Object.values(flattenedLocations);

  // Create a more comprehensive location mapping for items
  const itemLocationMapping: Record<string, string> = {};

  // First, create the basic mapping using the function
  const basicMapping = createLocationMappingForItems(
    allLocations.map((loc) => ({
      area: loc.name,
      urlName: loc.name,
      displayName: loc.displayName,
      types: getLocationTypes(loc.displayName),
      pokemonCount: 0,
      hasHiddenGrottoes: false,
      hasTrainers: false,
      trainerCount: 0,
      region: loc.region,
      flyable: loc.flyable,
      connections: loc.connections,
      coordinates: loc.x >= 0 && loc.y >= 0 ? { x: loc.x, y: loc.y } : undefined,
    })),
  );
  Object.assign(itemLocationMapping, basicMapping);

  // Add some manual mappings for common patterns we know about
  allLocations.forEach((location) => {
    const normalized = normalizeLocationKey(location.name);
    const displayName = location.displayName.toLowerCase();

    // Additional manual mappings for department stores
    if (displayName.includes('goldenrod') && displayName.includes('dept')) {
      itemLocationMapping[normalizeLocationKey('Goldenrod Dept. Store 2F')] = normalized;
      itemLocationMapping[normalizeLocationKey('Goldenrod Department Store 2F')] = normalized;
    }
    if (displayName.includes('celadon') && displayName.includes('dept')) {
      itemLocationMapping[normalizeLocationKey('Celadon Dept. Store 2F')] = normalized;
      itemLocationMapping[normalizeLocationKey('Celadon Department Store 2F')] = normalized;
    }

    // Radio Tower special mappings
    if (displayName.includes('radio tower')) {
      itemLocationMapping[normalizeLocationKey("Radio Tower Buena's Password Club")] = normalized;
    }
  });

  // Create a map of items by location (normalized location names as keys)
  const itemsByLocation: Record<
    string,
    Array<{ type: 'item' | 'hiddenItem' | 'tmHm'; name: string; details?: string }>
  > = {};

  // Check if itemsData exists and is an object before processing
  if (itemsData && typeof itemsData === 'object') {
    Object.values(itemsData).forEach((item) => {
      if (item && item.locations && Array.isArray(item.locations)) {
        item.locations.forEach((location) => {
          if (location && location.area && location.details) {
            // Skip non-location items like "Pickup"
            if (location.area.toLowerCase() === 'pickup') {
              return;
            }

            // Try multiple approaches to find the right location
            let normalizedLocationKey = normalizeLocationKey(location.area);

            // First, check if we have a direct mapping
            if (itemLocationMapping[normalizedLocationKey]) {
              normalizedLocationKey = itemLocationMapping[normalizedLocationKey];
            } else {
              // Try some common patterns
              const areaLower = location.area.toLowerCase();

              // Look for partial matches in comprehensive locations
              const partialMatch = allLocations.find((loc) => {
                const displayLower = loc.displayName.toLowerCase();
                // Check if the area name contains the location name or vice versa
                return (
                  displayLower.includes(areaLower.split(' ')[0]) ||
                  areaLower.includes(displayLower.split(' ')[0])
                );
              });

              if (partialMatch) {
                normalizedLocationKey = normalizeLocationKey(partialMatch.name);
              }
            }

            if (!itemsByLocation[normalizedLocationKey]) {
              itemsByLocation[normalizedLocationKey] = [];
            }
            // Determine the item type based on the details or item name
            let itemType: 'item' | 'hiddenItem' | 'tmHm' = 'item';
            if (location.details && location.details.toLowerCase().includes('hidden')) {
              itemType = 'hiddenItem';
            } else if (item.name && (item.name.startsWith('TM') || item.name.startsWith('HM'))) {
              itemType = 'tmHm';
            }

            itemsByLocation[normalizedLocationKey].push({
              type: itemType,
              name: item.name,
              details: location.details,
            });
          }
        });
      }
    });
  } // Create a normalized Pokemon location map for efficient lookups
  const normalizedPokemonData: Record<string, { originalKey: string; data: LocationAreaData }> = {};
  Object.keys(pokemonLocationData).forEach((originalKey) => {
    const normalizedKey = normalizeLocationKey(originalKey);
    normalizedPokemonData[normalizedKey] = {
      originalKey,
      data: pokemonLocationData[originalKey],
    };
  });

  // Convert grouped locations to EnhancedLocation format for the search component
  // We'll show parent locations with aggregated data from their children
  const enhancedLocations: EnhancedLocation[] = Object.entries(groupedLocations).map(
    ([locationKey, groupedLocation]) => {
      // Aggregate data from parent and all children
      const allSubLocations = [groupedLocation, ...(groupedLocation.children || [])];

      // Find matching Pokemon data for parent and children
      let totalPokemonCount = 0;
      let hasHiddenGrottoes = false;
      let totalTrainerCount = 0;
      let hasTrainers = false;
      const combinedItems: Array<{
        type: 'item' | 'hiddenItem' | 'tmHm';
        name: string;
        details?: string;
      }> = [];

      allSubLocations.forEach((subLocation) => {
        const normalizedKey = normalizeLocationKey(subLocation.name);

        // Add Pokemon data if available
        if (normalizedPokemonData[normalizedKey]) {
          const pokemonData = normalizedPokemonData[normalizedKey].data;
          totalPokemonCount += Object.keys(pokemonData.pokemon).length;

          if (
            Object.values(pokemonData.pokemon).some(
              (pokemon: PokemonWithMethods) =>
                pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
            )
          ) {
            hasHiddenGrottoes = true;
          }
        }

        // Add trainer data
        if (subLocation.trainers && subLocation.trainers.length > 0) {
          hasTrainers = true;
          totalTrainerCount += subLocation.trainers.length;
        }

        // Add items from comprehensive location data
        if (subLocation.items) {
          subLocation.items.forEach((item) => {
            combinedItems.push({
              type: (item.type as 'item' | 'hiddenItem' | 'tmHm') || 'item',
              name: item.name,
              details: item.coordinates
                ? `Found at coordinates (${item.coordinates.x}, ${item.coordinates.y})`
                : undefined,
            });
          });
        }

        // Add items from items_data.json
        const itemsFromItemsData = itemsByLocation[normalizedKey] || [];
        combinedItems.push(...itemsFromItemsData);
      });

      return {
        area: locationKey,
        urlName: locationKey,
        displayName: groupedLocation.displayName,
        types: getLocationTypes(groupedLocation.displayName),
        pokemonCount: totalPokemonCount,
        hasHiddenGrottoes,
        hasTrainers,
        trainerCount: totalTrainerCount,
        items: combinedItems,
        region: groupedLocation.region,
        flyable: groupedLocation.flyable,
        connections: groupedLocation.connections,
        coordinates:
          groupedLocation.x >= 0 && groupedLocation.y >= 0
            ? { x: groupedLocation.x, y: groupedLocation.y }
            : undefined,
      };
    },
  );

  // Note: We're not including Pokemon-only locations since we're focusing on parent locations
  // The parent location grouping should capture most meaningful locations with data

  const processedLocations = enhancedLocations;

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
