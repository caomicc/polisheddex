'use client';
import React, { JSX } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '../ui/card';
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
import GroupedTrainerCard from '../trainer/grouped-trainer-card';
import { groupRematchTrainers } from '@/utils/trainerGrouping';
import TableWrapper from '../ui/table-wrapper';
import { BentoGrid, BentoGridItem, BentoGridNoLink } from '../ui/bento-box';
import {
  ArrowRight,
  DoorOpen,
  MoveDown,
  MoveDownLeft,
  MoveDownRight,
  MoveLeft,
  MoveRight,
  MoveUp,
  MoveUpLeft,
  MoveUpRight,
} from 'lucide-react';
import { formatPokemonUrlWithForm } from '@/utils/pokemonFormUtils';

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
      <div className="relative z-10 space-y-4 py-4">
        {/* About tab - Location details */}
        {comprehensiveInfo &&
        comprehensiveInfo.connections &&
        comprehensiveInfo.connections.length > 0 ? (
          <>
            {comprehensiveInfo.connections.map((connection: LocationConnection, index: number) => {
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
                <Link
                  key={index}
                  href={connection.targetLocation}
                  className="flex items-center gap-2 label-text"
                >
                  <span
                    className="h-4 w-4 flex items-center justify-center text-sm"
                    aria-hidden="true"
                    title={connection.direction}
                  >
                    {arrow}
                  </span>
                  <span>{capitalizeFirst(connection.targetLocationDisplay)}:</span>
                  <span>
                    {' '}
                    {connection.direction === 'warp'
                      ? 'Warp Location'
                      : `To the ${capitalizeFirst(connection.direction)}`}
                  </span>
                </Link>
              );
            })}
          </>
        ) : (
          <></>
        )}
      </div>
      <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full space-y-4">
        {comprehensiveInfo?.trainers && (
          <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-1">
            {groupRematchTrainers(comprehensiveInfo.trainers)?.map((groupedTrainer, index) => (
              <BentoGridNoLink key={index}>
                <GroupedTrainerCard groupedTrainer={groupedTrainer} />
              </BentoGridNoLink>
            ))}
          </BentoGrid>
        )}

        {Object.keys(groupedPokemonData).length > 0 ? (
          <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-1">
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
          </BentoGrid>
        ) : (
          <></>
        )}
        {comprehensiveInfo?.trades && (
          <TableWrapper className="pt-4 pb-6">
            <Card>
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
                            href={formatPokemonUrlWithForm(trade.wantsPokemon, 'plain')}
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {trade.wantsPokemon}
                          </Link>
                        </div>
                        <div className="text-2xl">↔</div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">You get</div>
                          <Link
                            href={formatPokemonUrlWithForm(trade.givesPokemon, 'plain')}
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
          </TableWrapper>
        )}
        {console.log('comprehensiveInfo?.events', comprehensiveInfo?.events)}
        {comprehensiveInfo?.events &&
          comprehensiveInfo.events.some(
            (event: { type: string }) => event.type === 'phone_call',
          ) && (
            <TableWrapper className="pt-4 pb-6">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-neutral-600 dark:text-neutral-200">
                Phone Call Rewards
              </h3>
              <div className="space-y-4">
                {comprehensiveInfo.events
                  .filter((event: { type: string }) => event.type === 'phone_call')
                  .map(
                    (event: { npc: string; reward: string; conditions: string }, index: number) => {
                      const isTM = isTMItem(event.reward);
                      console.log('event.reward', event.reward, isTM);
                      const moveName = isTM ? getTMMoveFromItemName(event.reward) : null;
                      const linkHref =
                        isTM && moveName
                          ? `/moves/${getMoveUrlFromName(moveName)}`
                          : `/items/${getItemIdFromDisplayName(event.reward)}`;

                      const spriteUrl = isTM
                        ? `/sprites/items/tm_hm.png`
                        : `/sprites/items/${getItemSpriteName(event.reward)}.png`;

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Image
                              src={spriteUrl}
                              alt={event.reward}
                              width={24}
                              height={24}
                              className="rounded-sm dark:bg-white"
                            />
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-500 flex gap-1">
                                Trainer
                                <span className="font-bold text-gray-700 dark:text-green-400">
                                  {event.npc}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="size-4" />
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-500 flex gap-1">
                                Gives
                                <a
                                  href={linkHref}
                                  className="font-bold text-gray-700 dark:text-green-400"
                                >
                                  {event.reward}
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md italic">
                            {event.conditions}
                          </div>
                        </div>
                      );
                    },
                  )}
              </div>
            </TableWrapper>
          )}
        {(() => {
          const hasTrainers = !!(
            comprehensiveInfo?.trainers && comprehensiveInfo.trainers.length > 0
          );
          const hasPokemon = Object.keys(groupedPokemonData || {}).length > 0;
          const hasTrades = !!(comprehensiveInfo?.trades && comprehensiveInfo.trades.length > 0);
          const hasPhoneCalls = !!(
            comprehensiveInfo?.events &&
            comprehensiveInfo.events.some((e: { type: string }) => e.type === 'phone_call')
          );

          if (!hasTrainers && !hasPokemon && !hasTrades && !hasPhoneCalls) {
            return (
              <BentoGridNoLink>
                <div className="text-gray-400 text-sm my-6 text-center">
                  There doesn&apos;t seem to be any relevant information available...
                </div>
              </BentoGridNoLink>
            );
          }
          return null;
        })()}
      </div>

      {comprehensiveInfo?.items && (
        <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full space-y-4">
          <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-4">
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
                <BentoGridItem
                  key={index}
                  href={linkHref}
                  icon={
                    <Image
                      src={spriteUrl}
                      alt={item.name}
                      width={24}
                      height={24}
                      className="rounded-sm"
                    />
                  }
                  title={item.name}
                  description={
                    item.type === 'hiddenItem'
                      ? 'Hidden Item'
                      : item.type === 'tmHm'
                        ? `TM/HM - Links to ${moveName || 'move'} page`
                        : item.type === 'berry'
                          ? 'Grows on Berry Tree'
                          : 'Visible Item'
                  }
                ></BentoGridItem>
              );
            })}
          </BentoGrid>
        </div>
      )}
    </>
  );
}
