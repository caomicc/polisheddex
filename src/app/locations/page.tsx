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
import { LocationData, PokemonMethods } from '@/types/types';
// import LocationCard from '@/components/pokemon/LocationCard';
import LocationSearch from '@/components/pokemon/LocationSearch';

// Function to load location data
async function loadLocationData(): Promise<Record<string, LocationData>> {
  try {
    const locationsFile = path.join(process.cwd(), 'output/locations_by_area.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    return JSON.parse(data) as Record<string, LocationData>;
  } catch (error) {
    console.error('Error loading location data:', error);
    return {};
  }
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
  } else if (locationName.includes('Lake') || locationName.includes('Sea') || locationName.includes('Ocean')) {
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
  const locationData = await loadLocationData();
  const locationNames = Object.keys(locationData).sort();

  // Process locations to include additional data
  const processedLocations = locationNames.map(locationName => {
    const pokemonCount = Object.keys(locationData[locationName].pokemon).length;

    const hasHiddenGrottoes = Object.values(locationData[locationName].pokemon).some(
      (pokemon: PokemonMethods) =>
        pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
    );

    return {
      area: locationName,
      types: getLocationTypes(locationName),
      pokemonCount,
      hasHiddenGrottoes
    };
  });

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto p-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbLink asChild>
            <Link href="/" className="hover:underline dark:text-blue-200 text-blue-700">
              Home
            </Link>
          </BreadcrumbLink>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Locations</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-6 sr-only">Game Locations</h1>

      <LocationSearch locations={processedLocations} />

      {/* <h1 className="text-3xl font-bold mb-6">Game Locations</h1>

      <h2 className="text-xl font-semibold mb-4">All Locations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationNames.map((locationName) => {
          const pokemonCount = Object.keys(locationData[locationName].pokemon).length;

          const hasHiddenGrottoes = Object.values(locationData[locationName].pokemon).some(
            (pokemon: PokemonMethods) =>
              pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
          );


          return (
            <LocationCard
              key={locationName}
              location={{
                area: locationName,
                types: getLocationTypes(locationName),
                pokemonCount,
                hasHiddenGrottoes
              }}
            />
          );
        })}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Hidden Grotto Locations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationNames
            .filter((locationName) => {
              return Object.values(locationData[locationName].pokemon).some(
                (pokemon: PokemonMethods) =>
                  pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
              );
            })
            .map((locationName) => {
              // Count total Pokémon in hidden grottoes at this location
              const pokemonCount = Object.values(locationData[locationName].pokemon).filter(
                (pokemon: PokemonMethods) =>
                  pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
              ).length;

              return (
                <LocationCard
                  key={locationName + '-grotto'}
                  location={{
                    area: locationName,
                    types: getLocationTypes(locationName),
                    pokemonCount,
                    hasHiddenGrottoes: true
                  }}
                />
              );
            })}
        </div>
      </div> */}
    </div>
  );
}
