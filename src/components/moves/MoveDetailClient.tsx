'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonWithMove } from '@/utils/loaders/move-data-loader';
import PokemonWithMoveDataTable from './PokemonWithMoveDataTable';
import { Hero } from '../ui/Hero';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import Link from 'next/link';
import { Badge } from '../ui/badge';

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

  // Get TM/HM info
  const tmInfo = moveData.tm;

  return (
    <>
      <Hero
        headline={moveData.name || moveName}
        description={moveData.description || 'Move details and Pokemon that can learn it'}
        types={
          <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
            <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
              {showFaithful ? (
                <Badge>
                  {String(moveData.faithful?.type || moveData.updated?.type || 'Unknown Type')}
                </Badge>
              ) : (
                <Badge>{String(moveData.updated?.type || 'Unknown Type')}</Badge>
              )}
            </div>
          </div>
        }
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/moves" className="hover:underline">
                    Moves
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="">{moveData.name || moveName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="space-y-6">
        {/* Move Information Card */}
        <Card>
          <CardContent className="">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-md font-black">Category</Label>
                <p className="text-sm">{moveStats?.category || 'Unknown'}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-md font-black">Power</Label>
                <p className="text-sm">{moveStats?.power || 'N/A'}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-md font-black">Accuracy</Label>
                <p className="text-sm">{moveStats?.accuracy || 'N/A'}%</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-md font-black">PP</Label>
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
    </>
  );
}
