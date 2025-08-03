'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TrainerCard from '@/components/trainer/TrainerCard';
import { PokemonDataTable } from '@/components/pokemon/pokemon-data-table';
import { pokemonColumns } from '@/components/pokemon/pokemon-columns';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';
import { formatMethod, formatTime } from '@/utils/locationUtils';
import type { 
  LocationTrainer, 
  LocationItem, 
  LocationConnection,
  TMHMReference,
  LocationEvent,
  NPCTrade 
} from '@/types/types';
import type { GroupedPokemon, PokemonEncounter } from '@/types/locationTypes';

interface AreaData {
  trainers: LocationTrainer[];
  items: LocationItem[];
  connections: LocationConnection[];
  tmhms: TMHMReference[];
  events: LocationEvent[];
  npcTrades: NPCTrade[];
}

interface LocationContentProps {
  areaData: AreaData;
  pokemonData: GroupedPokemon;
  areaName: string;
  showAreaContext?: boolean;
}

export default function LocationContent({
  areaData,
  pokemonData,
  areaName,
  showAreaContext = false
}: LocationContentProps) {
  
  // Transform Pokemon data for table display
  const transformPokemonData = (): PokemonEncounter[] => {
    const encounters: PokemonEncounter[] = [];
    
    Object.entries(pokemonData).forEach(([method, timeData]) => {
      Object.entries(timeData).forEach(([time, encounterData]) => {
        encounterData.pokemon.forEach(pokemon => {
          encounters.push({
            name: pokemon.name,
            level: pokemon.level,
            chance: pokemon.chance,
            method: method as PokemonEncounter['method'],
            time: time as PokemonEncounter['time'],
            rareItem: pokemon.rareItem,
            form: pokemon.form,
            location: showAreaContext ? areaName : undefined
          });
        });
      });
    });

    return encounters.sort((a, b) => b.chance - a.chance);
  };

  const pokemonEncounters = transformPokemonData();
  const hasContent = pokemonEncounters.length > 0 || 
                    areaData.trainers.length > 0 || 
                    areaData.items.length > 0 ||
                    areaData.connections.length > 0;

  if (!hasContent) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No encounters or notable features in this area.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pokemon Encounters */}
      {pokemonEncounters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wild Pokémon Encounters</CardTitle>
          </CardHeader>
          <CardContent>
            <PokemonDataTable 
              columns={pokemonColumns} 
              data={pokemonEncounters}
              showLocationColumn={showAreaContext}
            />
          </CardContent>
        </Card>
      )}

      {/* Grouped Pokemon Display (Alternative layout) */}
      {Object.keys(pokemonData).length > 0 && (
        <div className="space-y-4">
          {Object.entries(pokemonData).map(([method, timeData]) => (
            <Card key={method}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {formatMethod(method)}
                  <Badge variant="outline" className="text-xs">
                    {Object.values(timeData).reduce((total, data) => total + data.pokemon.length, 0)} encounters
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(timeData).map(([time, encounters]) => (
                    <div key={time}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {formatTime(time)}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {encounters.pokemon.map((pokemon, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <Link 
                              href={`/pokemon/${pokemon.name.toLowerCase().replace(/\s+/g, '-')}`}
                              className="font-medium hover:underline"
                            >
                              {pokemon.name}
                            </Link>
                            <div className="text-sm text-muted-foreground">
                              {pokemon.chance}% • Lv.{pokemon.level}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trainers */}
      {areaData.trainers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {areaData.trainers.map((trainer, index) => (
                <TrainerCard key={`${trainer.id}-${index}`} trainer={trainer} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      {areaData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areaData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Link
                        href={`/items/${getItemIdFromDisplayName(item.name)}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.type.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.coordinates ? `(${item.coordinates.x}, ${item.coordinates.y})` : 'Various'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TM/HMs */}
      {areaData.tmhms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>TMs & HMs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {areaData.tmhms.map((tmhm, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <div className="font-medium">{tmhm.tmNumber}</div>
                    <div className="text-sm text-muted-foreground">{tmhm.moveName}</div>
                  </div>
                  <Badge variant="secondary">{tmhm.location}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections */}
      {areaData.connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {areaData.connections.map((connection, index) => (
                <Link
                  key={index}
                  href={`/locations/${connection.targetLocation}`}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors"
                >
                  <div>
                    <div className="font-medium">{connection.targetLocationDisplay}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {connection.direction}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {connection.offset !== 0 && `${connection.offset > 0 ? '+' : ''}${connection.offset}`}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events */}
      {areaData.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {areaData.events.map((event, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-md">
                  <div className="font-medium">{event.type}</div>
                  {event.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* NPC Trades */}
      {areaData.npcTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>NPC Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {areaData.npcTrades.map((trade, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        Trade {trade.requestedPokemon} → {trade.offeredPokemon}
                      </div>
                      {trade.nickname && (
                        <div className="text-sm text-muted-foreground">
                          Nickname: {trade.nickname}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary">NPC Trade</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}