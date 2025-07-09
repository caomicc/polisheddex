import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface EncounterDetail {
  level: string;
  chance: number;
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

// Helper function to convert method names to more user-friendly format
function formatMethod(method: string): string {
  if (method === 'grass') return 'Wild Grass';
  if (method === 'water') return 'Surfing';
  if (method === 'hidden_grotto') return 'Hidden Grotto';
  if (method === 'unknown') return 'Special Encounter';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

// Helper function to format time of day
function formatTime(time: string): string {
  if (time === 'morn') return 'Morning';
  if (time === 'day') return 'Day';
  if (time === 'nite') return 'Night';
  if (time === 'eve') return 'Evening';
  if (time === 'any') return 'Any Time';
  // Hidden grotto rarities
  if (time === 'common') return 'Common';
  if (time === 'uncommon') return 'Uncommon';
  if (time === 'rare') return 'Rare';
  return time.charAt(0).toUpperCase() + time.slice(1);
}

// Function to load location data
async function loadLocationData() {
  try {
    const locationsFile = path.join(process.cwd(), 'locations_by_area.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    return JSON.parse(data) as Record<string, LocationData>;
  } catch (error) {
    console.error('Error loading location data:', error);
    return {};
  }
}

// This function helps Next.js pre-render pages at build time
export async function generateStaticParams() {
  const locations = await loadLocationData();
  return Object.keys(locations).map(name => ({ name }));
}

export default async function LocationDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const locationName = decodeURIComponent(name);

  const locationData = await loadLocationData();
  const locationInfo = locationData[locationName];

  if (!locationInfo) return notFound();

  // Process Pokémon encounters by method and time
  type GroupedPokemon = {
    [method: string]: {
      [time: string]: {
        pokemon: {
          name: string;
          level: string;
          chance: number;
          rareItem?: string;
        }[];
      };
    };
  };

  const groupedByMethodAndTime: GroupedPokemon = {};

  Object.entries(locationInfo.pokemon).forEach(([pokemonName, pokemonData]) => {
    Object.entries(pokemonData.methods).forEach(([method, methodData]) => {
      if (!groupedByMethodAndTime[method]) {
        groupedByMethodAndTime[method] = {};
      }

      Object.entries(methodData.times).forEach(([time, encounters]) => {
        if (!groupedByMethodAndTime[method][time]) {
          groupedByMethodAndTime[method][time] = { pokemon: [] };
        }

        encounters.forEach(encounter => {
          const pokemonEntry: {
            name: string;
            level: string;
            chance: number;
            rareItem?: string;
          } = {
            name: pokemonName,
            level: encounter.level,
            chance: encounter.chance
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
  Object.values(groupedByMethodAndTime).forEach(methodData => {
    Object.values(methodData).forEach(timeData => {
      timeData.pokemon.sort((a, b) => b.chance - a.chance);
    });
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      <nav className="mb-4 text-sm">
        <ol className="list-reset flex text-gray-600">
          <li>
            <Link href="/" className="hover:underline text-blue-700">Home</Link>
            <span className="mx-2">/</span>
          </li>
          <li>
            <Link href="/locations" className="hover:underline text-blue-700">Locations</Link>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-900 font-semibold">{locationName}</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold mb-6">{locationName}</h1>

      {Object.entries(groupedByMethodAndTime).map(([method, methodData]) => (
        <div key={method} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            {formatMethod(method)} Encounters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(methodData).map(([time, timeData]) => (
              <div key={time} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold">
                  {formatTime(time)}
                </div>
                <div className="divide-y">
                  {timeData.pokemon.map((pokemon, idx) => (
                    <div key={`${pokemon.name}-${idx}`} className="px-4 py-3 flex justify-between items-center">
                      <Link
                        href={`/pokemon/${pokemon.name}`}
                        className="text-blue-700 hover:underline font-medium"
                      >
                        {pokemon.name}
                      </Link>
                      <div className="flex gap-4">
                        <span className="text-gray-700">Lv. {pokemon.level}</span>
                        <span className="text-gray-500">{pokemon.chance}% chance</span>
                        {pokemon.rareItem && (
                          <span className="text-amber-600 font-medium">Item: {pokemon.rareItem}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
