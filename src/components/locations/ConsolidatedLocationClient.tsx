'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaNavigation } from './AreaNavigation';
import LocationContent from './LocationContent';
import EliteFourSection from './EliteFourSection';
import { useLocationUrlState } from '@/utils/locationUrlState';
import { isConsolidatedLocation, getLocationArea } from '@/utils/locationConsolidatorClient';
import type { LocationData, LocationArea } from '@/types/types';
import type { GroupedPokemon } from '@/types/locationTypes';

interface ConsolidatedLocationClientProps {
  locationData: LocationData;
  groupedPokemonData: GroupedPokemon;
  locationKey: string;
}

export default function ConsolidatedLocationClient({
  locationData,
  groupedPokemonData,
  locationKey
}: ConsolidatedLocationClientProps) {
  const searchParams = useSearchParams();
  const { navigateToArea } = useLocationUrlState();
  const currentAreaId = searchParams.get('area') || undefined;

  const isConsolidated = isConsolidatedLocation(locationData);
  const currentArea = currentAreaId ? getLocationArea(locationData, currentAreaId) : null;
  
  // Determine what data to show based on current area
  const getAreaData = () => {
    if (!currentAreaId || currentAreaId === 'main') {
      // Main area - show base location data
      return {
        trainers: locationData.trainers || [],
        items: locationData.items || [],
        connections: locationData.connections || [],
        tmhms: locationData.tmhms || [],
        events: locationData.events || [],
        npcTrades: locationData.npcTrades || []
      };
    } else if (currentArea) {
      // Specific area - show area data
      return {
        trainers: currentArea.trainers || [],
        items: currentArea.items || [],
        connections: currentArea.connections || [],
        tmhms: currentArea.tmhms || [],
        events: currentArea.events || [],
        npcTrades: currentArea.npcTrades || []
      };
    }
    return null;
  };

  const areaData = getAreaData();
  
  // Filter Pokemon data for current area if needed
  const getAreaPokemonData = (): GroupedPokemon => {
    if (!isConsolidated || !currentAreaId || currentAreaId === 'main') {
      return groupedPokemonData;
    }

    // Filter Pokemon data to show only encounters for the current area
    const filteredData: GroupedPokemon = {};
    
    Object.entries(groupedPokemonData).forEach(([method, timeData]) => {
      Object.entries(timeData).forEach(([time, encounterData]) => {
        const areaEncounters = encounterData.pokemon.filter(pokemon => {
          // Check if Pokemon has location data and if it matches current area
          const pokemonLocation = 'location' in pokemon ? pokemon.location : undefined;
          const matchesArea = currentArea && pokemonLocation === currentArea.displayName;
          return matchesArea;
        });

        if (areaEncounters.length > 0) {
          if (!filteredData[method]) {
            filteredData[method] = {};
          }
          if (!filteredData[method][time]) {
            filteredData[method][time] = { pokemon: [] };
          }
          filteredData[method][time].pokemon.push(...areaEncounters);
        }
      });
    });

    return filteredData;
  };

  const displayPokemonData = getAreaPokemonData();

  return (
    <div className="space-y-6">
      {/* Location Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Location Information</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {locationData.region}
              </Badge>
              {locationData.flyable && (
                <Badge variant="secondary">Flyable</Badge>
              )}
              {isConsolidated && (
                <Badge variant="outline">
                  {locationData.areas?.length || 0} Areas
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {locationData.id >= 0 && (
              <div>
                <div className="font-medium text-muted-foreground mb-1">ID</div>
                <div>{locationData.id}</div>
              </div>
            )}
            
            {locationData.trainerCount !== undefined && locationData.trainerCount > 0 && (
              <div>
                <div className="font-medium text-muted-foreground mb-1">Trainers</div>
                <div>{locationData.trainerCount}</div>
              </div>
            )}
            
            {locationData.consolidatedFrom && (
              <div className="col-span-2">
                <div className="font-medium text-muted-foreground mb-1">Consolidated From</div>
                <div className="text-xs">
                  {locationData.consolidatedFrom.length} locations
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Area Navigation */}
      {isConsolidated && locationData.areas && (
        <AreaNavigation
          areas={locationData.areas}
          currentAreaId={currentAreaId}
          onAreaChange={navigateToArea}
          locationName={locationData.name}
        />
      )}

      {/* Elite Four Section (for Indigo Plateau) */}
      {locationData.eliteFour && locationData.eliteFour.length > 0 && (
        <EliteFourSection 
          eliteFour={locationData.eliteFour}
          showInMain={!currentAreaId || currentAreaId === 'main'}
        />
      )}

      {/* Main Content */}
      {areaData && (
        <LocationContent
          areaData={areaData}
          pokemonData={displayPokemonData}
          areaName={currentArea?.displayName || locationData.displayName}
          showAreaContext={isConsolidated && !!currentAreaId && currentAreaId !== 'main'}
        />
      )}
      
      {/* No data message for empty areas */}
      {!areaData && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No data available for this area.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}