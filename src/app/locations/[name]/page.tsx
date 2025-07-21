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
import { getItemIdFromDisplayName } from '@/utils/itemUtils';
import { LocationConnection, NPCTrade, LocationEvent } from '@/types/types';

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

  // Try to find matching Pokemon data by testing different name variations
  let pokemonInfo = null;
  if (comprehensiveInfo) {
    // If we have comprehensive info, try multiple name variations for Pokemon lookup
    const possibleNames = [
      comprehensiveInfo.displayName, // "Beautiful Beach"
      locationName, // "beautiful_beach"
      locationName.replace(/_/g, ' '), // "beautiful beach"
      locationName.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '), // "Beautiful Beach"
    ];

    for (const name of possibleNames) {
      if (pokemonLocationData[name]) {
        pokemonInfo = pokemonLocationData[name];
        break;
      }
    }
  } else {
    // If no comprehensive info, check Pokemon data directly with name variations
    const possibleNames = [
      locationName, // exact match
      locationName.replace(/_/g, ' '), // "beautiful beach"
      locationName.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '), // "Beautiful Beach"
    ];

    for (const name of possibleNames) {
      if (pokemonLocationData[name]) {
        pokemonInfo = pokemonLocationData[name];
        break;
      }
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

  // If no Pokemon data, show location info without Pokemon table
  if (!pokemonInfo) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbLink asChild>
              <Link href="/" className="hover:underline dark:text-blue-200 text-blue-700">
                Home
              </Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbLink asChild>
              <Link href="/locations" className="hover:underline dark:text-blue-200 text-blue-700">
                Locations
              </Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-bold mb-6">{displayName}</h1>

        {comprehensiveInfo && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Location Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {comprehensiveInfo.region && (
                <div>
                  <div className="font-medium text-slate-600 dark:text-slate-300">Region</div>
                  <div className="capitalize">{comprehensiveInfo.region}</div>
                </div>
              )}
              {comprehensiveInfo.flyable !== undefined && (
                <div>
                  <div className="font-medium text-slate-600 dark:text-slate-300">Flyable</div>
                  <div>{comprehensiveInfo.flyable ? 'Yes' : 'No'}</div>
                </div>
              )}
              {comprehensiveInfo.x >= 0 && comprehensiveInfo.y >= 0 && (
                <div>
                  <div className="font-medium text-slate-600 dark:text-slate-300">Coordinates</div>
                  <div>{comprehensiveInfo.x}, {comprehensiveInfo.y}</div>
                </div>
              )}
              {comprehensiveInfo.connections && comprehensiveInfo.connections.length > 0 && (
                <div>
                  <div className="font-medium text-slate-600 dark:text-slate-300">Connections</div>
                  <div>{comprehensiveInfo.connections.length}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation connections */}
        {comprehensiveInfo && comprehensiveInfo.connections && comprehensiveInfo.connections.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">Connected Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {comprehensiveInfo.connections.map((connection: LocationConnection, index: number) => (
                <Link
                  key={index}
                  href={`/locations/${encodeURIComponent(connection.targetLocation)}`}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 hover:shadow-md"
                  aria-label={`Navigate ${connection.direction} to ${connection.targetLocationDisplay}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    {connection.direction === 'north' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↑</span>}
                    {connection.direction === 'south' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↓</span>}
                    {connection.direction === 'east' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">→</span>}
                    {connection.direction === 'west' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">←</span>}
                    {connection.direction === 'northeast' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↗</span>}
                    {connection.direction === 'northwest' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↖</span>}
                    {connection.direction === 'southeast' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↘</span>}
                    {connection.direction === 'southwest' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↙</span>}
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">
                      To {connection.direction}
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                      {connection.targetLocationDisplay}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-slate-400 dark:text-slate-500">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* NPC Trades */}
        {comprehensiveInfo && comprehensiveInfo.npcTrades && comprehensiveInfo.npcTrades.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
            <h2 className="text-lg font-semibold mb-3 text-green-800 dark:text-green-200">NPC Trades Available</h2>
            <div className="space-y-3">
              {comprehensiveInfo.npcTrades.map((trade: NPCTrade, index: number) => (
                <div key={index} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{trade.traderName}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-slate-600 dark:text-slate-300">Wants</div>
                      <Link
                        href={`/pokemon/${trade.wantsPokemon}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline capitalize"
                      >
                        {trade.wantsPokemon}
                      </Link>
                      {trade.wantsForm && (
                        <span className="text-slate-500 text-xs ml-1">({trade.wantsForm})</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-600 dark:text-slate-300">Offers</div>
                      <Link
                        href={`/pokemon/${trade.givesPokemon}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline capitalize"
                      >
                        {trade.givesPokemon}
                      </Link>
                      {trade.givesForm && (
                        <span className="text-slate-500 text-xs ml-1">({trade.givesForm})</span>
                      )}
                      {trade.givesGender && (
                        <span className="text-slate-500 text-xs ml-1">(♂/♀)</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-600 dark:text-slate-300">Nickname</div>
                      <div className="text-slate-700 dark:text-slate-300">{trade.nickname}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Events */}
        {comprehensiveInfo && comprehensiveInfo.events && comprehensiveInfo.events.length > 0 && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
            <h2 className="text-lg font-semibold mb-3 text-purple-800 dark:text-purple-200">Special Events</h2>
            <div className="space-y-2">
              {comprehensiveInfo.events.map((event: LocationEvent, index: number) => (
                <div key={index} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                      {event.type === 'rival_battle' && <span className="text-xs">⚔️</span>}
                      {event.type === 'trainer_battle' && <span className="text-xs">🥊</span>}
                      {event.type === 'special' && <span className="text-xs">✨</span>}
                      {event.type === 'item' && <span className="text-xs">📦</span>}
                      {event.type === 'coordinate_trigger' && <span className="text-xs">📍</span>}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{event.description}</div>
                      {event.details && (
                        <div className="text-sm text-slate-600 dark:text-slate-300">{event.details}</div>
                      )}
                      {event.coordinates && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Position: ({event.coordinates.x}, {event.coordinates.y})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
          <p className="text-slate-600 dark:text-slate-300">No Pokémon encounter data available for this location.</p>
        </div>
      </div>
    );
  }

  // Process Pokémon encounters by method and time for locations with Pokemon data
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

  Object.entries(pokemonInfo.pokemon).forEach(([pokemonName, pokemonData]) => {
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

      {/* Optional location details from comprehensive data */}
      {comprehensiveInfo && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Location Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {comprehensiveInfo.region && (
              <div>
                <div className="font-medium text-slate-600 dark:text-slate-300">Region</div>
                <div className="capitalize">{comprehensiveInfo.region}</div>
              </div>
            )}
            {comprehensiveInfo.flyable !== undefined && (
              <div>
                <div className="font-medium text-slate-600 dark:text-slate-300">Flyable</div>
                <div>{comprehensiveInfo.flyable ? 'Yes' : 'No'}</div>
              </div>
            )}
            {comprehensiveInfo.x >= 0 && comprehensiveInfo.y >= 0 && (
              <div>
                <div className="font-medium text-slate-600 dark:text-slate-300">Coordinates</div>
                <div>{comprehensiveInfo.x}, {comprehensiveInfo.y}</div>
              </div>
            )}
            {comprehensiveInfo.connections && comprehensiveInfo.connections.length > 0 && (
              <div>
                <div className="font-medium text-slate-600 dark:text-slate-300">Connections</div>
                <div>{comprehensiveInfo.connections.length}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation connections */}
      {comprehensiveInfo && comprehensiveInfo.connections && comprehensiveInfo.connections.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">Connected Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {comprehensiveInfo.connections.map((connection: LocationConnection, index: number) => (
              <Link
                key={index}
                href={`/locations/${encodeURIComponent(connection.targetLocation)}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 hover:shadow-md"
                aria-label={`Navigate ${connection.direction} to ${connection.targetLocationDisplay}`}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  {connection.direction === 'north' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↑</span>}
                  {connection.direction === 'south' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↓</span>}
                  {connection.direction === 'east' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">→</span>}
                  {connection.direction === 'west' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">←</span>}
                  {connection.direction === 'northeast' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↗</span>}
                  {connection.direction === 'northwest' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↖</span>}
                  {connection.direction === 'southeast' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↘</span>}
                  {connection.direction === 'southwest' && <span className="text-sm font-bold text-blue-700 dark:text-blue-300">↙</span>}
                </div>
                <div className="flex-grow">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">
                    To {connection.direction}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    {connection.targetLocationDisplay}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-slate-400 dark:text-slate-500">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* NPC Trades */}
      {comprehensiveInfo && comprehensiveInfo.npcTrades && comprehensiveInfo.npcTrades.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
          <h2 className="text-lg font-semibold mb-3 text-green-800 dark:text-green-200">NPC Trades Available</h2>
          <div className="space-y-3">
            {comprehensiveInfo.npcTrades.map((trade: NPCTrade, index: number) => (
              <div key={index} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">{trade.traderName}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-slate-600 dark:text-slate-300">Wants</div>
                    <Link
                      href={`/pokemon/${trade.wantsPokemon}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline capitalize"
                    >
                      {trade.wantsPokemon}
                    </Link>
                    {trade.wantsForm && (
                      <span className="text-slate-500 text-xs ml-1">({trade.wantsForm})</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-600 dark:text-slate-300">Offers</div>
                    <Link
                      href={`/pokemon/${trade.givesPokemon}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline capitalize"
                    >
                      {trade.givesPokemon}
                    </Link>
                    {trade.givesForm && (
                      <span className="text-slate-500 text-xs ml-1">({trade.givesForm})</span>
                    )}
                    {trade.givesGender && (
                      <span className="text-slate-500 text-xs ml-1">(♂/♀)</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-600 dark:text-slate-300">Nickname</div>
                    <div className="text-slate-700 dark:text-slate-300">{trade.nickname}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Events */}
      {comprehensiveInfo && comprehensiveInfo.events && comprehensiveInfo.events.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
          <h2 className="text-lg font-semibold mb-3 text-purple-800 dark:text-purple-200">Special Events</h2>
          <div className="space-y-2">
            {comprehensiveInfo.events.map((event: LocationEvent, index: number) => (
              <div key={index} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                    {event.type === 'rival_battle' && <span className="text-xs">⚔️</span>}
                    {event.type === 'trainer_battle' && <span className="text-xs">🥊</span>}
                    {event.type === 'special' && <span className="text-xs">✨</span>}
                    {event.type === 'item' && <span className="text-xs">📦</span>}
                    {event.type === 'coordinate_trigger' && <span className="text-xs">📍</span>}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{event.description}</div>
                    {event.details && (
                      <div className="text-sm text-slate-600 dark:text-slate-300">{event.details}</div>
                    )}
                    {event.coordinates && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Position: ({event.coordinates.x}, {event.coordinates.y})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedByMethodAndTime).map(([method, timeData]) => (
          <Card key={method}>
            <CardHeader>
              <h3 className="text-lg font-semibold">{formatMethod(method)}</h3>
            </CardHeader>
            <CardContent>
              {Object.entries(timeData).map(([time, data]) => (
                <div key={time} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <TimeIcon time={time} />
                    <h4 className="text-md font-medium">{formatTime(time)}</h4>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pokémon</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Chance</TableHead>
                        <TableHead>Rare Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.pokemon.map((pokemon, index) => (
                        <TableRow key={`${pokemon.name}-${index}`}>
                          <TableCell>
                            <Link
                              href={`/pokemon/${pokemon.name}`}
                              className="hover:underline text-blue-600 dark:text-blue-400"
                            >
                              {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                            </Link>
                          </TableCell>
                          <TableCell>{pokemon.level}</TableCell>
                          <TableCell>{pokemon.chance}%</TableCell>
                          <TableCell>
                            {pokemon.rareItem ? (
                              <Link
                                href={`/items/${getItemIdFromDisplayName(pokemon.rareItem)}`}
                                className="hover:underline text-purple-600 dark:text-purple-400"
                              >
                                {pokemon.rareItem}
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
