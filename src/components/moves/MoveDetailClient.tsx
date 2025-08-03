'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonWithMove } from '@/utils/loaders/move-data-loader';
import PokemonWithMoveDataTable from './PokemonWithMoveDataTable';

interface MoveDetailClientProps {
  moveData: {
    name?: string;
    description?: string;
    faithful?: {
      type?: string;
      category?: string;
      power?: number;
      accuracy?: number;
      pp?: number;
    };
    updated?: {
      type?: string;
      category?: string;
      power?: number;
      accuracy?: number;
      pp?: number;
    };
    tm?: {
      number?: string;
      location?: {
        area?: string;
        details?: string;
      };
    };
  };
  pokemonWithMove: PokemonWithMove[];
  moveName: string;
}

export default function MoveDetailClient({
  moveData,
  pokemonWithMove,
  moveName,
}: MoveDetailClientProps) {
  const [learnMethodFilter, setLearnMethodFilter] = useState<string>('all');
  const { showFaithful } = useFaithfulPreference();

  // Get move stats based on faithful preference
  const moveStats = (showFaithful ? moveData.faithful : moveData.updated) ?? moveData.updated;
  const hasValidStats = moveStats && moveStats.type !== 'None' && (moveStats.power ?? 0) > 0;

  // Get TM/HM info
  const tmInfo = moveData.tm;

  return (
    <div className="space-y-6 p-4">
      {/* Move Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {moveName}
            {hasValidStats && (
              <Badge variant="secondary" className={`bg-${moveStats.type?.toLowerCase()}`}>
                {moveStats.type}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{moveData.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <p className="text-sm">{moveStats?.category || 'Unknown'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Power</Label>
              <p className="text-sm">{moveStats?.power || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Accuracy</Label>
              <p className="text-sm">{moveStats?.accuracy || 'N/A'}%</p>
            </div>
            <div>
              <Label className="text-sm font-medium">PP</Label>
              <p className="text-sm">{moveStats?.pp || 'N/A'}</p>
            </div>
          </div>

          {tmInfo && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">TM/HM Location</Label>
              <p className="text-sm">
                {tmInfo.number} - {tmInfo.location?.area || 'Unknown location'}
                {tmInfo.location?.details && (
                  <span className="text-muted-foreground"> ({tmInfo.location.details})</span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pokemon List Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Pokémon that can learn {moveName}</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PokemonWithMoveDataTable
            pokemonWithMove={pokemonWithMove}
            learnMethodFilter={learnMethodFilter}
            onLearnMethodFilterChange={setLearnMethodFilter}
            showFaithful={showFaithful}
          />
        </CardContent>
      </Card>
    </div>
  );
}
