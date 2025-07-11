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

// Define interfaces for location data structure
interface EncounterDetail {
  level: string;
  chance: number;
  rareItem?: string;
}

interface TimeEncounters {
  [time: string]: EncounterDetail[];
}

interface MethodData {
  times: TimeEncounters;
}

interface PokemonMethods {
  methods: {
    [method: string]: MethodData;
  };
}

interface LocationData {
  pokemon: {
    [pokemonName: string]: PokemonMethods;
  };
}

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

export default async function LocationsPage() {
  const locationData = await loadLocationData();
  const locationNames = Object.keys(locationData).sort();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbLink asChild>
            <Link href="/" className="hover:underline text-blue-700">
              Home
            </Link>
          </BreadcrumbLink>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Locations</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-6">Game Locations</h1>

      {/* Hidden Grotto Locations */}
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
                <Link
                  key={locationName + '-grotto'}
                  href={`/locations/${encodeURIComponent(locationName)}`}
                  className="block p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold">{locationName}</h3>
                  <p className="text-gray-600 mt-1">
                    {pokemonCount} {pokemonCount === 1 ? 'Pokémon' : 'Pokémon'} in hidden grottoes
                  </p>
                </Link>
              );
            })}
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">All Locations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationNames.map((locationName) => {
          // Count total Pokémon in this location
          const pokemonCount = Object.keys(locationData[locationName].pokemon).length;

          // Check if this location has hidden grottoes
          const hasHiddenGrottoes = Object.values(locationData[locationName].pokemon).some(
            (pokemon: PokemonMethods) =>
              pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
          );

          return (
            <Link
              key={locationName}
              href={`/locations/${encodeURIComponent(locationName)}`}
              className="block p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <h2 className="text-xl font-semibold">{locationName}</h2>
              <p className="text-gray-600 mt-1">
                {pokemonCount} {pokemonCount === 1 ? 'Pokémon' : 'Pokémon'} available
                {hasHiddenGrottoes && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Hidden Grotto
                  </span>
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
