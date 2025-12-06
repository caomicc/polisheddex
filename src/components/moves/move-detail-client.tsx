'use client';

import React, { useState } from 'react';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
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
import { BicepsFlexed, Crosshair, FolderOpen, HandFist, MapPin } from 'lucide-react';
import { MoveData } from '@/types/new';

export default function MoveDetailClient({ moveData }: { moveData: MoveData }) {
  const [learnMethodFilter, setLearnMethodFilter] = useState<string>('all');
  const { showFaithful } = useFaithfulPreferenceSafe();

  const version = showFaithful ? 'faithful' : 'polished';

  return (
    <>
      <Hero
        headline={moveData.versions[version]?.name}
        description={
          moveData.versions[version]?.description || 'Move details and Pokemon that can learn it'
        }
        types={
          <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
            <div className="flex flex-wrap gap-2" aria-label="Pokemon Types" role="group">
              <Badge variant={moveData.versions[version]?.type?.toLowerCase() as any}>
                {String(moveData.versions[version]?.type || 'Unknown Type')}
              </Badge>
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
                <BreadcrumbPage className="">{moveData.versions[version]?.name}</BreadcrumbPage>
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
                  {moveData.versions[version]?.category || 'Unknown'}
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
                  {moveData.versions[version]?.power || 'N/A'}
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
                  {moveData.versions[version]?.accuracy || 'N/A'}%
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
                  {moveData.versions[version]?.pp || 'N/A'}
                </p>
              </div>
            </BentoGridNoLink>

            {moveData.tm && (
              <BentoGridNoLink className="md:col-span-4">
                <div>
                  <MapPin className="size-4" />
                  <p className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200 capitalize">
                    {moveData.tm.number.toUpperCase()} Location
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {moveData.tm.location ? (
                      <Link
                        href={`/locations/${encodeURIComponent(moveData.tm.location.toLowerCase().replace(/\s+/g, '_'))}`}
                        className="inline-flex items-center gap-1 text-xs font-normal text-neutral-600 dark:text-neutral-300 hover:text-primary transition-colors"
                      >
                          {moveData.tm.location.replace(/_/g, ' ')}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unknown location</span>
                    )}
                  </div>
                </div>
              </BentoGridNoLink>
            )}
          </BentoGrid>
        </div>

        <PokemonWithMoveDataTable
          learners={moveData.versions[version]?.learners || []}
          learnMethodFilter={learnMethodFilter}
          onLearnMethodFilterChange={setLearnMethodFilter}
          showFaithful={showFaithful}
        />
      </div>
    </>
  );
}
