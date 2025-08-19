'use client';
import React, { JSX } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CardContent, CardHeader } from '../ui/card';
import Link from 'next/link';
import { LocationConnection, LocationItem, NPCTrade, PokemonEncounter } from '@/types/types';
import { GroupedPokemon } from '@/types/locationTypes';
import {
  getItemIdFromDisplayName,
  isTMItem,
  getTMMoveFromItemName,
  getMoveUrlFromName,
  getItemSpriteName,
} from '@/utils/itemUtils';
import { PokemonDataTable } from '../pokemon/pokemon-data-table';
import { pokemonColumns } from '../pokemon/pokemon-columns';
import TrainerCard from '../trainer/trainer-card';
import GroupedTrainerCard from '../trainer/grouped-trainer-card';
import { groupRematchTrainers } from '@/utils/trainerGrouping';
import TableWrapper from '../ui/table-wrapper';
import { createPokemonUrl } from '@/utils/pokemonLinkHelper';
import { BentoGrid, BentoGridItem, BentoGridNoLink } from '../ui/bento-box';
import {
  DoorOpen,
  ExternalLink,
  MoveDown,
  MoveDownLeft,
  MoveDownRight,
  MoveLeft,
  MoveRight,
  MoveUp,
  MoveUpLeft,
  MoveUpRight,
} from 'lucide-react';

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
      <div className="relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
        {(comprehensiveInfo?.trainers || comprehensiveInfo?.gymLeader) && (
          <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-1">
            {comprehensiveInfo?.trainers &&
              groupRematchTrainers(comprehensiveInfo.trainers)?.map((groupedTrainer, index) => (
                <BentoGridNoLink key={index}>
                  <GroupedTrainerCard groupedTrainer={groupedTrainer} />
                </BentoGridNoLink>
              ))}
            {/* Conditional rendering for location type */}
            {comprehensiveInfo?.gymLeader && (
              <div className="gym-details">
                <h2 className="text-lg font-semibold mb-4">Gym Details</h2>
                {comprehensiveInfo.gymLeader && (
                  <TrainerCard trainer={comprehensiveInfo.gymLeader} isGymLeader />
                )}
              </div>
            )}
          </BentoGrid>
        )}

        <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-1">
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
            <BentoGridNoLink>
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
            </BentoGridNoLink>
          ) : (
            <></>
          )}

          {comprehensiveInfo?.items && (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="label-text w-[60px]"></TableHead>
                    <TableHead className="label-text">Item</TableHead>
                    <TableHead className="label-text">Type</TableHead>
                    {/* <TableHead className="label-text">Description</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprehensiveInfo?.items?.map((item: LocationItem, index: number) => {
                    // Check if this is a TM/HM item
                    const isItemTM = isTMItem(item.name, item.type);
                    const moveName = isItemTM ? getTMMoveFromItemName(item.name) : null;
                    const linkHref =
                      isItemTM && moveName
                        ? `/moves/${getMoveUrlFromName(moveName)}`
                        : `/items/${getItemIdFromDisplayName(item.name)}`;

                    const spriteUrl = isItemTM
                      ? `/sprites/items/tm_hm.png`
                      : `/sprites/items/${getItemSpriteName(item.name)}.png`;

                    return (
                      <TableRow key={index}>
                        <TableCell className="w-[60px]">
                          <div className="">
                            <Link href={linkHref}>
                              <Image
                                src={spriteUrl}
                                alt={item.name}
                                width={24}
                                height={24}
                                className="rounded-sm"
                              />
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 min-w-0">
                            <Link
                              href={linkHref}
                              className="hover:text-blue-600 hover:underline truncate flex items-center gap-1"
                            >
                              {item.name}
                              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {item.type === 'hiddenItem'
                            ? 'Hidden Item'
                            : item.type === 'tmHm'
                              ? `TM/HM - Links to ${moveName || 'move'} page`
                              : 'Found in this location'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400"></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrapper>
          )}

          {/* {comprehensiveInfo?.events && (
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
        )} */}

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
        </BentoGrid>
      </div>
      <div className="relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
        <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-3">
          {/* About tab - Location details */}
          {comprehensiveInfo &&
          comprehensiveInfo.connections &&
          comprehensiveInfo.connections.length > 0 ? (
            <>
              {comprehensiveInfo.connections.map(
                (connection: LocationConnection, index: number) => {
                  const arrowMap: Record<string, JSX.Element> = {
                    north: <MoveUp />,
                    south: <MoveDown />,
                    east: <MoveRight />,
                    west: <MoveLeft />,
                    northeast: <MoveUpRight />,
                    northwest: <MoveUpLeft />,
                    southeast: <MoveDownRight />,
                    southwest: <MoveDownLeft />,
                  };

                  const arrow = arrowMap[connection.direction ?? ''] ?? <DoorOpen />;

                  const capitalizeFirst = (s?: string) =>
                    s && typeof s === 'string' && s.length > 0
                      ? s.charAt(0).toUpperCase() + s.slice(1)
                      : (s ?? '');

                  return (
                    <BentoGridItem
                      key={index}
                      title={capitalizeFirst(connection.targetLocationDisplay)}
                      description={
                        connection.direction === 'warp'
                          ? 'Warp Location'
                          : `To the ${capitalizeFirst(connection.direction)}`
                      }
                      icon={
                        <span
                          className="h-4 w-4 flex items-center justify-center text-sm"
                          aria-hidden="true"
                          title={connection.direction}
                        >
                          {arrow}
                        </span>
                      }
                    />
                  );
                },
              )}
            </>
          ) : (
            <></>
          )}
        </BentoGrid>
      </div>
    </>
  );
}
