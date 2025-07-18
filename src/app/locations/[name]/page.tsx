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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import TimeIcon from '@/components/pokemon/TimeIcon';
import { getDisplayLocationName } from '@/components/utils';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';

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
  if (method === 'surf') return 'Surfing';
  if (method === 'fish') return 'Fishing';
  if (method === 'rock_smash') return 'Rock Smash';
  if (method === 'headbutt') return 'Headbutt';
  if (method === 'gift') return 'Gift Pokémon';
  if (method === 'event') return 'Event Pokémon';
  if (method === 'egg') return 'Egg';
  if (method === 'trade') return 'Trade';
  if (method === 'special') return 'Special Encounter';
  if (method === 'roaming') return 'Roaming Pokémon';
  if (method === 'swarm') return 'Swarm Encounter';
  if (method === 'honey_tree') return 'Honey Tree';
  if (method === 'rock') return 'Rock';
  if (method === 'cave') return 'Cave Encounter';
  if (method === 'hidden') return 'Hidden Pokémon';
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
    const locationsFile = path.join(process.cwd(), 'output/locations_by_area.json');
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
  return Object.keys(locations).map((name) => ({ name }));
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const locationName = decodeURIComponent(name);


  const displayName = getDisplayLocationName(locationName);

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

        encounters.forEach((encounter) => {
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

      <h1 className="text-3xl font-bold mb-2">{displayName}</h1>

      <p className="mb-6 text-md text-muted-foreground">
        *Badge Level pertains to the level a user can find in the wild related to current badges
        earned.
      </p>

      {Object.entries(groupedByMethodAndTime).map(([method, methodData]) => (
        <div key={method} className="mb-8">
          {Object.entries(methodData).map(([time, timeData]) => (
            <Card key={time} className="overflow-hidden mb-6">
              <CardHeader className="">
                {time === 'nite' && (
                  <TimeIcon time={time} size={12} className="inline-block *:translate-y-0 *:translate-x-[1px]" />
                )}
                {time !== 'nite' && (
                  <TimeIcon time={time} className="inline-block" />
                )}
                <p className="flex">
                  {formatMethod(method)}: {formatTime(time)}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 px-0 md:px-6">
                {/* <Table defaultValue="level-up" className="w-full"> */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Pokémon</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Chance</TableHead>
                      <TableHead>Rare Item</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeData.pokemon.map((pokemon, idx) => (
                      <TableRow key={`${pokemon.name}-${idx}`}>
                        <TableCell>
                          <Link
                            href={`/pokemon/${pokemon.name}`}
                            className="text-blue-700 hover:underline font-medium capitalize"
                          >
                            {pokemon.name}
                          </Link>
                        </TableCell>
                        <TableCell>Lv. {pokemon.level}</TableCell>
                        <TableCell>{pokemon.chance}%</TableCell>
                        <TableCell>
                          {pokemon.rareItem ? (
                            (() => {
                              const itemId = getItemIdFromDisplayName(pokemon.rareItem);
                              return itemId ? (
                                <Link
                                  href={`/items/${itemId}`}
                                  className="text-amber-600 hover:text-amber-700 hover:underline font-medium transition-colors"
                                >
                                  {pokemon.rareItem}
                                </Link>
                              ) : (
                                <span className="text-amber-600 font-medium">{pokemon.rareItem}</span>
                              );
                            })()
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
