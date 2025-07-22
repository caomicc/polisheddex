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
import TrainerCard from '@/components/trainer/TrainerCard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import TimeIcon from '@/components/pokemon/TimeIcon';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';
import { LocationConnection, NPCTrade, LocationEvent, LocationItem, LocationTrainer, TrainerPokemon } from '@/types/types';
import { Key } from 'react';

function normalizeLocationKey(input: string): string {
  return input
    // Convert CamelCase/PascalCase to snake_case first
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    // Handle "Tower1 F" and "tower1_f" patterns specifically
    .replace(/(\w)1[\s_]+f/i, '$1_1f')
    // Handle "Tower1" pattern at end (e.g., "Burned Tower1" -> "burned_tower_1")
    .replace(/(\w)1$/i, '$1_1')
    // Handle route numbers specifically: "route6" -> "route_6"
    .replace(/^route(\d+)(_|$)/g, 'route_$1$2')
    // Handle various floor patterns - normalize all to standard format
    // Handle B1F variations (with or without spaces, with or without F)
    .replace(/\s*b\s*1\s*f?\s*$/i, '_b1f')
    .replace(/\s*b\s*2\s*f?\s*$/i, '_b2f')
    .replace(/\s*b\s*3\s*f?\s*$/i, '_b3f')
    .replace(/\s*b\s*4\s*f?\s*$/i, '_b4f')
    .replace(/\s*b\s*5\s*f?\s*$/i, '_b5f')
    // Handle regular floor patterns (with or without spaces, with or without F)
    .replace(/\s*1\s*f?\s*$/i, '_1f')
    .replace(/\s*2\s*f?\s*$/i, '_2f')
    .replace(/\s*3\s*f?\s*$/i, '_3f')
    .replace(/\s*4\s*f?\s*$/i, '_4f')
    .replace(/\s*5\s*f?\s*$/i, '_5f')
    .replace(/\s*6\s*f?\s*$/i, '_6f')
    .replace(/\s*7\s*f?\s*$/i, '_7f')
    .replace(/\s*8\s*f?\s*$/i, '_8f')
    .replace(/\s*9\s*f?\s*$/i, '_9f')
    .replace(/\s*10\s*f?\s*$/i, '_10f')
    // Convert spaces, hyphens, and other separators to underscores
    .replace(/[\s\-\.]+/g, '_')
    // Clean up multiple underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');
}

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

        {/* Gym Leader */}
        {comprehensiveInfo && comprehensiveInfo.gymLeader && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
            <h2 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">🏆</span>
              Gym Leader
            </h2>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl" aria-hidden="true">👑</span>
                </div>
                <div className="flex-grow">
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {comprehensiveInfo.gymLeader.name}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-slate-600 dark:text-slate-300">Speciality</div>
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {comprehensiveInfo.gymLeader.speciality} Type
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-600 dark:text-slate-300">Badge</div>
                      <div className="text-slate-700 dark:text-slate-300 capitalize">
                        {comprehensiveInfo.gymLeader.badge.toLowerCase().replace('badge', ' Badge')}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-600 dark:text-slate-300">Region</div>
                      <div className="text-slate-700 dark:text-slate-300 capitalize">
                        {comprehensiveInfo.gymLeader.region}
                      </div>
                    </div>
                  </div>
                  {comprehensiveInfo.gymLeader.coordinates && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Position: ({comprehensiveInfo.gymLeader.coordinates.x}, {comprehensiveInfo.gymLeader.coordinates.y})
                    </div>
                  )}
                  {comprehensiveInfo.gymLeader.pokemon && comprehensiveInfo.gymLeader.pokemon.length > 0 && (
                    <div className="mt-4">
                      <div className="font-medium text-slate-600 dark:text-slate-300 mb-2">Pokémon Team</div>
                      <div className="space-y-2">
                        {comprehensiveInfo.gymLeader.pokemon.map((pokemon: TrainerPokemon, index: number) => (
                          <div key={index} className="p-2 bg-slate-50 dark:bg-slate-700 rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                                {pokemon?.species.replace(/_/g, ' ')}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-300">
                                Level {pokemon?.level}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {pokemon.item && (
                                <div>
                                  <span className="font-medium text-slate-600 dark:text-slate-300">Item:</span>{' '}
                                  <span className="capitalize">{pokemon.item.replace(/_/g, ' ')}</span>
                                </div>
                              )}
                              {pokemon.gender && (
                                <div>
                                  <span className="font-medium text-slate-600 dark:text-slate-300">Gender:</span>{' '}
                                  <span className="capitalize">{pokemon.gender}</span>
                                </div>
                              )}
                            </div>
                            {pokemon.moves && pokemon.moves.length > 0 && (
                              <div className="mt-2">
                                <div className="font-medium text-slate-600 dark:text-slate-300 text-xs mb-1">Moves:</div>
                                <div className="flex flex-wrap gap-1">
                                  {pokemon.moves.map((move: string, moveIndex: Key | null | undefined) => (
                                    <span
                                      key={moveIndex}
                                      className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded capitalize"
                                    >
                                      {move.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                      {/* {event.type === 'item' && <span className="text-xs">📦</span>} */}
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

        {/* Items */}
        {comprehensiveInfo && comprehensiveInfo.items && comprehensiveInfo.items.length > 0 && (
          <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
            <h2 className="text-lg font-semibold mb-3 text-indigo-800 dark:text-indigo-200">Items</h2>
            <div className="space-y-2">
              {comprehensiveInfo.items.map((item: LocationItem, index: number) => (
                <div key={`item-${index}`} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      item.type === 'item' ? 'bg-orange-100 dark:bg-orange-800' :
                      item.type === 'hiddenItem' ? 'bg-amber-100 dark:bg-amber-800' :
                      'bg-purple-100 dark:bg-purple-800'
                    }`}>
                      <span className="text-xs">
                        {item.type === 'item' ? '📦' :
                         item.type === 'hiddenItem' ? '🕵️' :
                         '🔧'}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className={`text-sm font-medium ${
                        item.type === 'item' ? 'text-orange-600 dark:text-orange-400' :
                        item.type === 'hiddenItem' ? 'text-amber-600 dark:text-amber-400' :
                        'text-purple-600 dark:text-purple-400'
                      }`}>
                        {item.type === 'item' ? 'Visible Item' :
                         item.type === 'hiddenItem' ? 'Hidden Item' :
                         'TM/HM'}
                      </div>
                      {item.coordinates && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Position: ({item.coordinates.x}, {item.coordinates.y})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LocationTrainer */}
        {comprehensiveInfo && comprehensiveInfo.trainers && comprehensiveInfo.trainers.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">Trainers</h2>
            <div className="space-y-2">
              {comprehensiveInfo.trainers.map((trainer: LocationTrainer) => (
                <div key={trainer.name} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                      <span className="text-xs">👤</span>
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{trainer.name}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Trainer</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Position: ({trainer.coordinates.x}, {trainer.coordinates.y})
                      </div>
                      {trainer.trainerClass && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Class: {trainer.trainerClass}
                        </div>
                      )}
                      {trainer.pokemon && trainer.pokemon.length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium text-slate-600 dark:text-slate-300">Pokémon</div>
                          <ul className="list-disc list-inside space-y-1">
                            {trainer.pokemon.map((pokemon, index) => (
                              <li key={index} className="text-sm text-slate-700 dark:text-slate-300">
                                {pokemon.species} (Level {pokemon.level})
                              </li>
                            ))}
                          </ul>
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

      {/* Gym Leader */}
      {comprehensiveInfo && comprehensiveInfo.gymLeader && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
          <h2 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🏆</span>
            Gym Leader
          </h2>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                <span className="text-2xl" aria-hidden="true">👑</span>
              </div>
              <div className="flex-grow">
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {comprehensiveInfo.gymLeader.name}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-slate-600 dark:text-slate-300">Speciality</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {comprehensiveInfo.gymLeader.speciality} Type
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-600 dark:text-slate-300">Badge</div>
                    <div className="text-slate-700 dark:text-slate-300 capitalize">
                      {comprehensiveInfo.gymLeader.badge.toLowerCase().replace('badge', ' Badge')}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-600 dark:text-slate-300">Region</div>
                    <div className="text-slate-700 dark:text-slate-300 capitalize">
                      {comprehensiveInfo.gymLeader.region}
                    </div>
                  </div>
                </div>
                {comprehensiveInfo.gymLeader.coordinates && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Position: ({comprehensiveInfo.gymLeader.coordinates.x}, {comprehensiveInfo.gymLeader.coordinates.y})
                  </div>
                )}
              </div>
            </div>
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
                    {/* {event.type === 'item' && <span className="text-xs">📦</span>} */}
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

      {console.log('Grouped Pokémon by method and time:', groupedByMethodAndTime)}
      {console.log('Comprehensive Info:', comprehensiveInfo)}

      {/* Trainers */}
      {comprehensiveInfo && comprehensiveInfo.trainers && comprehensiveInfo.trainers.length > 0 && (
        <section className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
          <h2 className="text-lg font-semibold mb-3 text-red-800 dark:text-red-200 flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">⚔️</span>
            Trainers ({comprehensiveInfo.trainers.length})
          </h2>
          <div className="space-y-4">
            {comprehensiveInfo.trainers.map((trainer: LocationTrainer, index: number) => (
              <TrainerCard key={`trainer-${index}-${trainer.name}`} trainer={trainer} />
            ))}
          </div>
        </section>
      )}

       {/* Gym Leaders */}
      {comprehensiveInfo && comprehensiveInfo.gymLeader && (
        <section className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
          <h2 className="text-lg font-semibold mb-3 text-red-800 dark:text-red-200 flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">⚔️</span>
            Gym Leaders ({comprehensiveInfo.gymLeader.length})
          </h2>
          <div className="space-y-4">
            {comprehensiveInfo.gymLeader.map((leader: LocationTrainer) => (
              <TrainerCard key={`gym-leader-${leader.name}`} trainer={leader} />
            ))}
          </div>
        </section>
      )}

      {comprehensiveInfo && comprehensiveInfo.items && comprehensiveInfo.items.length > 0 && (
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
          <h2 className="text-lg font-semibold mb-3 text-indigo-800 dark:text-indigo-200">Items</h2>
          <div className="space-y-2">
            {comprehensiveInfo.items.map((item: LocationItem, index: number) => (
              <div key={`item-${index}`} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    item.type === 'item' ? 'bg-orange-100 dark:bg-orange-800' :
                    item.type === 'hiddenItem' ? 'bg-amber-100 dark:bg-amber-800' :
                    'bg-purple-100 dark:bg-purple-800'
                  }`}>
                    <span className="text-xs">
                      {item.type === 'item' ? '📦' :
                       item.type === 'hiddenItem' ? '🕵️' :
                       '🔧'}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                    <div className={`text-sm font-medium ${
                      item.type === 'item' ? 'text-orange-600 dark:text-orange-400' :
                      item.type === 'hiddenItem' ? 'text-amber-600 dark:text-amber-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`}>
                      {item.type === 'item' ? 'Visible Item' :
                       item.type === 'hiddenItem' ? 'Hidden Item' :
                       'TM/HM'}
                    </div>
                    {item.coordinates && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Position: ({item.coordinates.x}, {item.coordinates.y})
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
