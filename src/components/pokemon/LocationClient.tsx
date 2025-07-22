'use client';
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader } from '../ui/card';
import Link from 'next/link';
import { LocationConnection, LocationEvent, LocationItem, LocationTrainer, NPCTrade } from '@/types/types';
import { GroupedPokemon } from '@/types/locationTypes';
import { formatMethod, formatTime } from '@/utils/locationUtils';
import TrainerCard from '../trainer/TrainerCard';
import TimeIcon from './TimeIcon';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';

export default function LocationClient({
  comprehensiveInfo,
  groupedPokemonData
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comprehensiveInfo?: any;
  groupedPokemonData: GroupedPokemon;
}) {
  // Determine the initial tab based on available data
  const getInitialTab = () => {
    if (Object.keys(groupedPokemonData).length > 0) return 'pokemon';
    if (comprehensiveInfo?.items && comprehensiveInfo.items.length > 0) return 'items';
    if (comprehensiveInfo?.trainers && comprehensiveInfo.trainers.length > 0) return 'trainers';
    if (comprehensiveInfo?.events && comprehensiveInfo.events.length > 0) return 'events';
    if (comprehensiveInfo?.trades && comprehensiveInfo.trades.length > 0) return 'trades';
    return 'about';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Load saved tab from localStorage on component mount
  useEffect(() => {
    const savedTab = localStorage.getItem('locationActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('locationActiveTab', value);
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full">
          {Object.keys(groupedPokemonData).length > 0 && (
            <TabsTrigger value="pokemon">Pokemon</TabsTrigger>
          )}
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
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        {/* Pokemon encounters tab */}
        {Object.keys(groupedPokemonData).length > 0 && (
          <TabsContent value="pokemon" className="text-center md:text-left py-6 w-full spacing-y-6 gap-6 flex flex-col">
            <div className="space-y-6">
              {Object.entries(groupedPokemonData).map(([method, timeData]) => (
                <Card key={method} className="w-full">
                  <CardHeader className="pb-3">
                    <h3 className="text-lg font-semibold">{formatMethod(method)}</h3>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {Object.entries(timeData).map(([time, data]) => (
                      <div key={time} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <TimeIcon time={time} />
                          <span className="font-medium text-sm">{formatTime(time)}</span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-left">Pokémon</TableHead>
                              <TableHead className="text-center">Level</TableHead>
                              <TableHead className="text-center">Chance</TableHead>
                              <TableHead className="text-center">Rare Item</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.pokemon.map((pokemon, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Link
                                    href={`/pokemon/${encodeURIComponent(pokemon.name.toLowerCase())}`}
                                    className="hover:underline text-blue-600 dark:text-blue-400 capitalize font-medium"
                                  >
                                    {pokemon.name.replace(/_/g, ' ')}
                                  </Link>
                                </TableCell>
                                <TableCell className="text-center">{pokemon.level}</TableCell>
                                <TableCell className="text-center">{pokemon.chance}%</TableCell>
                                <TableCell className="text-center">
                                  {pokemon.rareItem ? (
                                    <Link
                                      href={`/items/${getItemIdFromDisplayName(pokemon.rareItem)}`}
                                      className="hover:underline text-green-600 dark:text-green-400"
                                    >
                                      {pokemon.rareItem}
                                    </Link>
                                  ) : (
                                    '—'
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
          </TabsContent>
        )}

        {/* Items tab */}
        {comprehensiveInfo?.items && comprehensiveInfo.items.length > 0 && (
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
                          {item.type === 'hiddenItem' ? 'Hidden Item' : item.type === 'tmHm' ? 'TM/HM' : 'Found in this location'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Trainers tab */}
        {comprehensiveInfo?.trainers && comprehensiveInfo.trainers.length > 0 && (
          <TabsContent value="trainers" className="py-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Trainers</h3>
              <div className="grid gap-6">
                {comprehensiveInfo.trainers.map((trainer: LocationTrainer, index: number) => (
                  <TrainerCard key={index} trainer={trainer} />
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Events tab */}
        {comprehensiveInfo?.events && comprehensiveInfo.events.length > 0 && (
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
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
        )}

        {/* Trades tab */}
        {comprehensiveInfo?.trades && comprehensiveInfo.trades.length > 0 && (
          <TabsContent value="trades" className="py-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">NPC Trades</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comprehensiveInfo.trades.map((trade: NPCTrade, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
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
          </TabsContent>
        )}

        {/* About tab - Location details */}
        <TabsContent value="about" className="py-6">
          {/* Location details from comprehensive data */}
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
        </TabsContent>
      </Tabs>
    </>
  );
}
