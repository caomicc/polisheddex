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
  const allLocationKeys = new Set([
    ...Object.keys(pokemonLocations),
    ...Object.keys(allLocations)
  ]);

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

  // Check comprehensive location data (by key)
  const comprehensiveInfo = allLocationData[locationName];

  // Try to find matching Pokemon data using normalized keys and variations
  let pokemonInfo = null;

  // Create all possible variations of the location name for matching
  const locationVariations = new Set([
    locationName, // Original URL param: "burned_tower_1f"
    // From comprehensive info if available
    ...(comprehensiveInfo ? [
      comprehensiveInfo.displayName, // "Burned Tower 1F"
      normalizeLocationKey(comprehensiveInfo.displayName), // "burned_tower_1f"
    ] : []),
    // Normalized variations
    normalizeLocationKey(locationName), // "burned_tower_1f"
    // Space variations
    locationName.replace(/_/g, ' '), // "burned tower 1f"
    locationName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '), // "Burned Tower 1f"
    // Title case variations
    locationName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '), // "Burned Tower 1f"
  ]);

  // Try each variation to find Pokemon data
  for (const nameVariation of locationVariations) {
    if (pokemonLocationData[nameVariation]) {
      pokemonInfo = pokemonLocationData[nameVariation];
      break;
    }
  }

  // If neither exists, return 404
  if (!pokemonInfo && !comprehensiveInfo) {
    return notFound();
  }

  // Determine display name - prefer comprehensive info, fallback to processed location name
  const displayName = comprehensiveInfo?.displayName ||
    locationName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

  // Process Pokémon encounters by method and time for locations with Pokemon data
  const groupedByMethodAndTime: GroupedPokemon = {};

  Object.entries((pokemonInfo?.pokemon ?? {})).forEach(([pokemonName, pokemonData]) => {
    Object.entries(pokemonData.methods).forEach(([method, methodData]) => {
      if (!groupedByMethodAndTime[method]) {
        groupedByMethodAndTime[method] = {};
      }

      Object.entries(methodData.times).forEach(([time, encounters]) => {
        if (!groupedByMethodAndTime[method][time]) {
          groupedByMethodAndTime[method][time] = { pokemon: [] };
        }

        encounters.forEach((encounter: EncounterDetail) => {
          const pokemonEntry: {
            name: string;
            level: string;
            chance: number;
            rareItem?: string;
          } = {
            name: pokemonName,
            level: encounter.level,
            chance: encounter.chance,
          };

          // Add rareItem if it exists
          if ('rareItem' in encounter && typeof encounter.rareItem === 'string') {
            pokemonEntry.rareItem = encounter.rareItem;
          }

          groupedByMethodAndTime[method][time].pokemon.push(pokemonEntry);
        });
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
    <div className="max-w-xl md:max-w-4xl mx-auto p-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="hover:underline dark:text-blue-200 text-blue-700">
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/locations" className="hover:underline dark:text-blue-200 text-blue-700">
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

      <h1 className="text-3xl font-bold mb-6">{displayName}</h1>
      
      <LocationClient 
        comprehensiveInfo={comprehensiveInfo}
        groupedPokemonData={groupedByMethodAndTime}
      />
    </div>
  );
}
