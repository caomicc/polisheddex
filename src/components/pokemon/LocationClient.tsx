'use client';
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader } from '../ui/card';
import Link from 'next/link';
import {
  LocationConnection,
  LocationEvent,
  LocationItem,
  LocationTrainer,
  NPCTrade,
  PokemonEncounter,
} from '@/types/types';
import { GroupedPokemon } from '@/types/locationTypes';
import TrainerCard from '../trainer/TrainerCard';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';
import { Badge } from '../ui/badge';
import GymLeaderCard from '../trainer/GymLeaderCard';
import { PokemonDataTable } from './pokemon-data-table';
import { pokemonColumns } from './pokemon-columns';

export default function LocationClient({
  comprehensiveInfo,
  groupedPokemonData,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comprehensiveInfo?: any;
  groupedPokemonData: GroupedPokemon;
}) {
  // Transform grouped pokemon data to group by area/location instead of method
  const groupPokemonByArea = (data: GroupedPokemon) => {
    const areaGroups: Record<string, Record<string, Record<string, PokemonEncounter[]>>> = {};

    Object.entries(data).forEach(([method, timeData]) => {
      Object.entries(timeData).forEach(([time, encounterData]) => {
        encounterData.pokemon.forEach((pokemon) => {
          // Get the area/location name, fallback to "Main Area" if no location specified
          const areaName =
            'location' in pokemon && pokemon.location
              ? String((pokemon as { location?: string }).location)
              : 'Main Area';

          // Initialize nested structure if needed
          if (!areaGroups[areaName]) {
            areaGroups[areaName] = {};
          }
          if (!areaGroups[areaName][method]) {
            areaGroups[areaName][method] = {};
          }
          if (!areaGroups[areaName][method][time]) {
            areaGroups[areaName][method][time] = [];
          }

          // Add the pokemon encounter to the appropriate area/method/time group
          areaGroups[areaName][method][time].push({
            name: pokemon.name,
            level: pokemon.level,
            chance: pokemon.chance,
            rareItem: pokemon.rareItem,
            form: pokemon.form,
            location: areaName !== 'Main Area' ? areaName : undefined,
            method,
            time: time as PokemonEncounter['time'],
          });
        });
      });
    });

    return areaGroups;
  };

  // Determine the initial tab based on available data
  // const getInitialTab = () => {
  //   if (Object.keys(groupedPokemonData).length > 0) return 'pokemon';
  //   if (comprehensiveInfo?.items && comprehensiveInfo.items.length > 0) return 'items';
  //   if (comprehensiveInfo?.trainers && comprehensiveInfo.trainers.length > 0) return 'trainers';
  //   if (comprehensiveInfo?.events && comprehensiveInfo.events.length > 0) return 'events';
  //   if (comprehensiveInfo?.trades && comprehensiveInfo.trades.length > 0) return 'trades';
  //   return 'about';
  // };

  console.log('LocationClient - comprehensiveInfo:', groupedPokemonData);

  // const [activeTab, setActiveTab] = useState(getInitialTab());

  // Load saved tab from localStorage on component mount
  // useEffect(() => {
  //   const savedTab = localStorage.getItem('locationActiveTab');
  //   if (savedTab) {
  //     setActiveTab(savedTab);
  //   }
  // }, []);

  // // Save tab to localStorage when it changes
  // const handleTabChange = (value: string) => {
  //   setActiveTab(value);
  //   localStorage.setItem('locationActiveTab', value);
  // };

  return (
    <>
      {/* Location details from comprehensive data */}
      {comprehensiveInfo && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col gap-2">
              <div className="font-medium text-slate-600 dark:text-slate-300">Region</div>
              <Badge variant={comprehensiveInfo.region}>{comprehensiveInfo.region}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-slate-600 dark:text-slate-300">Flyable?</div>
              <div>{comprehensiveInfo.flyable ? 'Yes' : 'No'}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-slate-600 dark:text-slate-300">Coordinates</div>
              <div>
                {comprehensiveInfo.x}, {comprehensiveInfo.y}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-slate-600 dark:text-slate-300">Connections</div>
              <div>{comprehensiveInfo.connections.length}</div>
            </div>
          </div>
        </div>
      )}

      <Tabs className="w-full" defaultValue={'pokemon'}>
        <TabsList className="w-full">
          <TabsTrigger value="pokemon">Pokemon</TabsTrigger>
          {comprehensiveInfo?.items && comprehensiveInfo.items.length > 0 && (
            <TabsTrigger value="items">Items</TabsTrigger>
          )}
          {comprehensiveInfo?.trainers && comprehensiveInfo.trainers.length > 0 && (
            <TabsTrigger value="trainers">Trainers</TabsTrigger>
          )}
          {comprehensiveInfo?.events && comprehensiveInfo.events.length > 0 && (
            <TabsTrigger value="events">Events</TabsTrigger>
          )}
          {comprehensiveInfo?.trades && comprehensiveInfo.trades.length > 0 && (
            <TabsTrigger value="trades">Trades</TabsTrigger>
          )}
          {comprehensiveInfo?.connections && comprehensiveInfo.connections.length > 0 && (
            <TabsTrigger value="connections">Connections</TabsTrigger>
          )}
        </TabsList>

        {/* Pokemon encounters tab */}
        <TabsContent
          value="pokemon"
          className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col"
        >
          {Object.keys(groupedPokemonData).length > 0 ? (
            <div className="space-y-6">
              {(() => {
                const areaGroups = groupPokemonByArea(groupedPokemonData);
                return Object.entries(areaGroups).map(([areaName, methodData]) => (
                  <Card key={areaName} className="w-full">
                    <CardHeader className="sr-only">
                      <h3 className="text-lg font-semibold">{areaName}</h3>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-6">
                      {(() => {
                        // Flatten all encounters from all methods and times into one array
                        const allEncounters: PokemonEncounter[] = [];
                        Object.values(methodData).forEach((timeData) => {
                          Object.values(timeData).forEach((encounters) => {
                            allEncounters.push(...encounters);
                          });
                        });

                        return (
                          <PokemonDataTable
                            columns={pokemonColumns}
                            data={allEncounters}
                            searchPlaceholder="Filter Pokémon..."
                          />
                        );
                      })()}
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          ) : (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-center">No Pokémon found.</p>
            </>
          )}
        </TabsContent>

        {comprehensiveInfo?.items && comprehensiveInfo.items.length > 0 ? (
          <TabsContent value="items" className="py-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Items Found Here</h3>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comprehensiveInfo.items.map((item: LocationItem, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Link
                            href={`/items/${getItemIdFromDisplayName(item.name)}`}
                            className="hover:underline text-blue-600 dark:text-blue-400 font-medium"
                          >
                            {item.name}
                          </Link>
                        </TableCell>
                        <TableCell className="capitalize">{item.type || 'Item'}</TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {item.type === 'hiddenItem'
                            ? 'Hidden Item'
                            : item.type === 'tmHm'
                              ? 'TM/HM'
                              : 'Found in this location'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ) : (
          <></>
        )}

        {/* Trainers tab */}
        {(comprehensiveInfo?.gymLeader ||
          (comprehensiveInfo?.trainers && comprehensiveInfo.trainers.length > 0)) && (
          <TabsContent value="trainers" className="py-6">
            {comprehensiveInfo?.gymLeader ? (
              <div className="space-y-6 mb-12">
                <h3 className="text-lg font-semibold">Gym Leader:</h3>
                <div className="grid gap-6">
                  <GymLeaderCard gymLeader={comprehensiveInfo.gymLeader} />
                </div>
              </div>
            ) : null}
            {comprehensiveInfo?.trainers && comprehensiveInfo.trainers.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Trainers</h3>
                <div className="grid gap-6">
                  {comprehensiveInfo.trainers.map((trainer: LocationTrainer, index: number) => (
                    <TrainerCard key={index} trainer={trainer} />
                  ))}
                </div>
              </div>
            ) : (
              !comprehensiveInfo?.gymLeader && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <p>No trainers found at this location.</p>
                </div>
              )
            )}
          </TabsContent>
        )}

        {/* Events tab */}
        {comprehensiveInfo?.events && comprehensiveInfo.events.length > 0 ? (
          <TabsContent value="events" className="py-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Special Events</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comprehensiveInfo.events.map((event: LocationEvent, index: number) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                      <h4 className="font-semibold">{event.type}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.description}
                      </p>
                      {event.details && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          Details: {event.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : (
          <></>
        )}

        {/* Trades tab */}
        {comprehensiveInfo?.trades && comprehensiveInfo.trades.length > 0 ? (
          <TabsContent value="trades" className="py-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">NPC Trades</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comprehensiveInfo.trades.map((trade: NPCTrade, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">You give</div>
                          <Link
                            href={`/pokemon/${trade.wantsPokemon.toLowerCase()}`}
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {trade.wantsPokemon}
                          </Link>
                        </div>
                        <div className="text-2xl">↔</div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">You get</div>
                          <Link
                            href={`/pokemon/${trade.givesPokemon.toLowerCase()}`}
                            className="font-semibold text-green-600 dark:text-green-400 hover:underline"
                          >
                            {trade.givesPokemon}
                          </Link>
                        </div>
                      </div>
                      {trade.traderName && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Trader: {trade.traderName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p>No NPC trades available at this location.</p>
            </div>
          </TabsContent>
        ) : (
          <> </>
        )}

        {/* About tab - Location details */}
        {comprehensiveInfo &&
        comprehensiveInfo.connections &&
        comprehensiveInfo.connections.length > 0 ? (
          <TabsContent value="connections" className="py-6">
            {/* Navigation connections */}

            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <h2 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">
                Connected Locations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {comprehensiveInfo.connections.map(
                  (connection: LocationConnection, index: number) => (
                    <Link
                      key={index}
                      href={`/locations/${encodeURIComponent(connection.targetLocation)}`}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 hover:shadow-md"
                      aria-label={`Navigate ${connection.direction} to ${connection.targetLocationDisplay}`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        {connection.direction === 'north' && (
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ↑
                          </span>
                        )}
                        {connection.direction === 'south' && (
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ↓
                          </span>
                        )}
                        {connection.direction === 'east' && (
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            →
                          </span>
                        )}
                        {connection.direction === 'west' && (
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ←
                          </span>
                        )}
                        {connection.direction === 'northeast' && (
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ↗
                          </span>
                        )}
                        {connection.direction === 'northwest' && (
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ↖
                          </span>
                        )}
                        {connection.direction === 'southeast' && (
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ↘
                          </span>
                        )}
                        {connection.direction === 'southwest' && (
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ↙
                          </span>
                        )}
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
                  ),
                )}
              </div>
            </div>
          </TabsContent>
        ) : (
          <></>
        )}
      </Tabs>
    </>
  );
}
