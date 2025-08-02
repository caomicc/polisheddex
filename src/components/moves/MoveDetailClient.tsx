'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonWithMove } from '@/utils/loaders/move-data-loader';
import PokemonCard from '@/components/pokemon/PokemonCard';
import Link from 'next/link';
import { normalizePokemonUrlKey } from '@/utils/pokemonUrlNormalizer';

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

export default function MoveDetailClient({ moveData, pokemonWithMove, moveName }: MoveDetailClientProps) {
  const [learnMethodFilter, setLearnMethodFilter] = useState<string>('all');
  const { showFaithful } = useFaithfulPreference();

  // Filter Pokemon based on faithful preference and learn method
  const filteredPokemonWithMove = useMemo(() => {
    return pokemonWithMove.filter((item) => {
      // Filter by faithful preference
      const faithfulMatch = showFaithful ? item.faithful : item.updated;
      if (!faithfulMatch) return false;

      // Filter by learn method
      if (learnMethodFilter !== 'all' && item.learnMethod !== learnMethodFilter) {
        return false;
      }

      return true;
    });
  }, [pokemonWithMove, showFaithful, learnMethodFilter]);

  // Get move stats based on faithful preference
  const moveStats = showFaithful ? moveData.faithful : moveData.updated;
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
          
          {hasValidStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <p className="text-sm">{moveStats.category || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Power</Label>
                <p className="text-sm">{moveStats.power || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Accuracy</Label>
                <p className="text-sm">{moveStats.accuracy || 'N/A'}%</p>
              </div>
              <div>
                <Label className="text-sm font-medium">PP</Label>
                <p className="text-sm">{moveStats.pp || 'N/A'}</p>
              </div>
            </div>
          )}

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
            Pokémon that can learn {moveName} ({filteredPokemonWithMove.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex justify-end">
            <div className="min-w-[180px]">
              <Label htmlFor="method-filter">Learn Method</Label>
              <Select value={learnMethodFilter} onValueChange={setLearnMethodFilter}>
                <SelectTrigger className="bg-white" id="method-filter">
                  {learnMethodFilter === 'all' ? 'All Methods' : 
                   learnMethodFilter.charAt(0).toUpperCase() + learnMethodFilter.slice(1)}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="level">Level Up</SelectItem>
                  <SelectItem value="tm">TM/HM</SelectItem>
                  <SelectItem value="egg">Egg Move</SelectItem>
                  <SelectItem value="tutor">Move Tutor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pokemon Grid */}
          {filteredPokemonWithMove.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No Pokémon found matching your criteria.
            </p>
          ) : (
            <ul className="grid gap-4 md:gap-8 grid-cols-2 md:grid-cols-3">
              {filteredPokemonWithMove.map((item) => {
                const { pokemon, learnMethod, level } = item;
                
                const normalizedName = pokemon.normalizedUrl || normalizePokemonUrlKey(pokemon.name).toLowerCase();
                const pokemonUrl = pokemon.formName
                  ? `/pokemon/${normalizedName}?form=${encodeURIComponent(pokemon.formName)}`
                  : `/pokemon/${normalizedName}`;

                return (
                  <li key={`${pokemon.name}-${learnMethod}-${level}`}>
                    <Link href={pokemonUrl}>
                      <div className="relative">
                        <PokemonCard
                          pokemon={pokemon}
                          sortType="alphabetical"
                          showUpdatedTypes={!showFaithful}
                        />
                        {/* Learn Method Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs",
                              learnMethod === 'level' && "bg-blue-100 text-blue-800",
                              learnMethod === 'tm' && "bg-purple-100 text-purple-800",
                              learnMethod === 'egg' && "bg-green-100 text-green-800",
                              learnMethod === 'tutor' && "bg-orange-100 text-orange-800"
                            )}
                          >
                            {learnMethod === 'level' && level 
                              ? `Lv.${level}`
                              : learnMethod?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}