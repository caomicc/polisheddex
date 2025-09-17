'use client';

import React, { useState } from 'react';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
import { PokemonWithMove } from '@/utils/loaders/move-data-loader';
import PokemonWithMoveDataTable from './pokemon-with-move-data-table';
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
import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
import { BicepsFlexed, Crosshair, FolderOpen, HandFist } from 'lucide-react';

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
                <Badge variant={moveData.faithful?.type?.toLowerCase()}>
                  {String(moveData.faithful?.type || moveData.updated?.type || 'Unknown Type')}
                </Badge>
              ) : (
                <Badge variant={moveData.updated?.type?.toLowerCase()}>
                  {String(moveData.updated?.type || 'Unknown Type')}
                </Badge>
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
      <div className="space-y-6 max-w-4xl mx-auto  mb-10">
        {/* Move Information Card */}
        <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
          <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-4">
            <BentoGridNoLink>
              <div>
                <FolderOpen className="size-4" />
                <p className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
                  Category
                </p>
                <p className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
                  {moveStats?.category || 'Unknown'}
                </p>
              </div>
            </BentoGridNoLink>
            <BentoGridNoLink>
              <div>
                <HandFist className="size-4" />
                <p className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
                  Power
                </p>
                <p className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
                  {moveStats?.power || 'N/A'}
                </p>
              </div>
            </BentoGridNoLink>
            <BentoGridNoLink>
              <div>
                <Crosshair className="size-4" />
                <p className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
                  Accuracy
                </p>
                <p className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
                  {moveStats?.accuracy || 'N/A'}%
                </p>
              </div>
            </BentoGridNoLink>
            <BentoGridNoLink>
              <div>
                <BicepsFlexed className="size-4" />
                <p className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
                  PP
                </p>
                <p className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
                  {moveStats?.pp || 'N/A'}
                </p>
              </div>
            </BentoGridNoLink>

            {tmInfo && (
              <BentoGridNoLink className="md:col-span-4">
                <div>
                  <Crosshair className="size-4" />
                  <p className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
                    TM/HM Location
                  </p>
                  <p className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
                    {tmInfo.number} - {tmInfo.location?.area || 'Unknown location'}
                    {tmInfo.location?.details && (
                      <span className="text-muted-foreground"> ({tmInfo.location.details})</span>
                    )}
                  </p>
                </div>{' '}
              </BentoGridNoLink>
            )}
          </BentoGrid>
        </div>

        <PokemonWithMoveDataTable
          pokemonWithMove={pokemonWithMove}
          learnMethodFilter={learnMethodFilter}
          onLearnMethodFilterChange={setLearnMethodFilter}
          showFaithful={showFaithful}
        />
      </div>
    </>
  );
}
