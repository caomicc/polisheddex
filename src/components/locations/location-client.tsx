'use client';
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CardContent, CardHeader } from '../ui/card';
import Link from 'next/link';
import {
  LocationConnection,
  LocationEvent,
  LocationItem,
  NPCTrade,
  PokemonEncounter,
} from '@/types/types';
import { GroupedPokemon } from '@/types/locationTypes';
import { getItemIdFromDisplayName, isTMItem, getTMMoveFromItemName, getMoveUrlFromName } from '@/utils/itemUtils';
import { PokemonDataTable } from '../pokemon/pokemon-data-table';
import { pokemonColumns } from '../pokemon/pokemon-columns';
import TrainerCard from '../trainer/trainer-card';
import GroupedTrainerCard from '../trainer/grouped-trainer-card';
import { groupRematchTrainers } from '@/utils/trainerGrouping';
import { Badge } from '../ui/badge';
import TableWrapper from '../ui/table-wrapper';
import { createPokemonUrl } from '@/utils/pokemonLinkHelper';

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

  return (
    <>
      {/* Conditional rendering for location type */}
      {comprehensiveInfo?.gymLeader && (
        <div className="gym-details">
          <h2 className="text-lg font-semibold mb-4">Gym Details</h2>
          {comprehensiveInfo.gymLeader && (
            <TrainerCard trainer={comprehensiveInfo.gymLeader} isGymLeader />
          )}
        </div>
      )}

      {comprehensiveInfo?.trainers && comprehensiveInfo?.trainers.length > 0 && (
        <div className="trainers-list flex flex-col gap-4 mt-6">
          <h3>Trainers:</h3>
          {groupRematchTrainers(comprehensiveInfo.trainers).map((groupedTrainer, index) => (
            <GroupedTrainerCard key={index} groupedTrainer={groupedTrainer} />
          ))}
        </div>
      )}

      {comprehensiveInfo?.type === 'route' && (
        <div className="route-details">
          <h2 className="text-lg font-semibold">Route Details</h2>
          {groupedPokemonData && (
            <div className="pokemon-encounters">
              <h3>Pokemon Encounters:</h3>
              {Object.entries(groupPokemonByArea(groupedPokemonData)).map(
                ([areaName, methodData]) => (
                  <div key={areaName} className="area-group">
                    <h4>{areaName}</h4>
                    {Object.entries(methodData).map(([method, timeData]) => (
                      <div key={method} className="method-group">
                        <h5>Method: {method}</h5>
                        {Object.entries(timeData).map(([time, encounters]) => (
                          <div key={time} className="time-group">
                            <h6>Time: {time}</h6>
                            <ul>
                              {encounters.map((encounter, index) => (
                                <li key={index}>
                                  {encounter.name} (Level: {encounter.level})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          )}
          {comprehensiveInfo.items && comprehensiveInfo.items.length > 0 && (
            <div className="items-list">
              <h3>Items:</h3>
              <ul>
                {comprehensiveInfo.items.map((item: LocationItem, index: number) => (
                  <li key={index}>{item.name}</li>
                ))}
              </ul>
            </div>
          )}
          {comprehensiveInfo.connections && comprehensiveInfo.connections.length > 0 && (
            <div className="connections-list">
              <h3>Connections:</h3>
              <ul>
                {comprehensiveInfo.connections.map(
                  (connection: LocationConnection, index: number) => (
                    <li key={index}>{connection.targetLocationDisplay}</li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {Object.keys(groupedPokemonData).length > 0 ? (
        <div className="space-y-6">
          <h3 className="pt-4">Pokémon:</h3>
          {(() => {
            const areaGroups = groupPokemonByArea(groupedPokemonData);
            return Object.entries(areaGroups).map(([areaName, methodData]) => (
              <React.Fragment key={areaName}>
                {/* <CardHeader className="sr-only"> */}
                {/* <h3>{areaName}</h3> */}
                {/* </CardHeader> */}
                {/* <CardContent className="p-0"> */}
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
                {/* </CardContent> */}
              </React.Fragment>
            ));
          })()}
        </div>
      ) : (
        <></>
      )}

      {comprehensiveInfo?.items && (
        <>
          <h3 className="pt-4">Items Found Here</h3>

          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="label-text">Item</TableHead>
                  <TableHead className="label-text">Type</TableHead>
                  <TableHead className="label-text">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comprehensiveInfo?.items?.map((item: LocationItem, index: number) => {
                  // Check if this is a TM/HM item
                  const isItemTM = isTMItem(item.name, item.type);
                  const moveName = isItemTM ? getTMMoveFromItemName(item.name) : null;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Link
                          href={
                            isItemTM && moveName
                              ? `/moves/${getMoveUrlFromName(moveName)}`
                              : `/items/${getItemIdFromDisplayName(item.name)}`
                          }
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
                            ? `TM/HM - Links to ${moveName || 'move'} page`
                            : 'Found in this location'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
        </>
      )}

      {comprehensiveInfo?.events && (
        <TableWrapper className="pt-4 pb-6">
          <CardHeader>
            <h3>Special Events</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comprehensiveInfo.events?.map((event: LocationEvent, index: number) => (
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
        </TableWrapper>
      )}

      {comprehensiveInfo?.trades && (
        <TableWrapper className="pt-4 pb-6">
          <CardHeader>
            <h3>NPC Trades</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comprehensiveInfo?.trades?.map((trade: NPCTrade, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">You give</div>
                      <Link
                        href={createPokemonUrl(trade.wantsPokemon)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {trade.wantsPokemon}
                      </Link>
                    </div>
                    <div className="text-2xl">↔</div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">You get</div>
                      <Link
                        href={createPokemonUrl(trade.givesPokemon)}
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
        </TableWrapper>
      )}

      {/* About tab - Location details */}
      {comprehensiveInfo &&
      comprehensiveInfo.connections &&
      comprehensiveInfo.connections.length > 0 ? (
        <TableWrapper className="pt-4 pb-6">
          <CardHeader>
            <h3>Connections</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {comprehensiveInfo.connections.map(
                (connection: LocationConnection, index: number) => (
                  <Link
                    key={index}
                    href={`/locations/${encodeURIComponent(connection.targetLocation)}`}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-white/10 rounded-lg hover:bg-white/5 dark:hover:bg-white/5 transition ease border border-border shadow-sm hover:shadow-md"
                    aria-label={`Navigate ${connection.direction} to ${connection.targetLocationDisplay}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                      {connection.direction === 'north' && (
                        <span className="text-sm font-bold">↑</span>
                      )}
                      {connection.direction === 'south' && (
                        <span className="text-sm font-bold">↓</span>
                      )}
                      {connection.direction === 'east' && (
                        <span className="text-sm font-bold">→</span>
                      )}
                      {connection.direction === 'west' && (
                        <span className="text-sm font-bold">←</span>
                      )}
                      {connection.direction === 'northeast' && (
                        <span className="text-sm font-bold ">↗</span>
                      )}
                      {connection.direction === 'northwest' && (
                        <span className="text-sm font-bold">↖</span>
                      )}
                      {connection.direction === 'southeast' && (
                        <span className="text-sm font-bold">↘</span>
                      )}
                      {connection.direction === 'southwest' && (
                        <span className="text-sm font-bold ">↙</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <Badge variant="secondary">{connection.direction}</Badge>
                      <div className="">{connection.targetLocationDisplay}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-slate-400 dark:text-slate-500">→</span>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </CardContent>
        </TableWrapper>
      ) : (
        <></>
      )}
    </>
  );
}
