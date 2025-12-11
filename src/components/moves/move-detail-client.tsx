'use client';

import Link from 'next/link';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { MoveData } from '@/types/new';
import { MoveInfoTable } from './move-info-table';
import { MoveTmLocationCard } from './move-tm-location-card';
import { MoveLearnersCard } from './move-learners-card';
import { Hero } from '@/components/ui/Hero';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface MoveDetailClientProps {
  moveData: MoveData;
  tmLocationExists?: boolean;
}

export default function MoveDetailClient({ moveData, tmLocationExists = true }: MoveDetailClientProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();

  const version = showFaithful ? 'faithful' : 'polished';
  const versionData = moveData.versions[version];

  const displayName = versionData?.name || moveData.id;
  const description = versionData?.description || 'Move details and Pokémon that can learn it';
  const moveType = versionData?.type || 'Unknown';

  return (
    <>
      <Hero
        headline={displayName}
        description={description}
        types={
          <div className="flex flex-wrap gap-2" aria-label="Move Type" role="group">
            <Badge variant={moveType.toLowerCase() as any}>
              {moveType}
            </Badge>
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
                <BreadcrumbPage>{displayName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="space-y-4">
        {/* Move Info Table */}
        <MoveInfoTable
          type={versionData?.type}
          category={versionData?.category}
          power={versionData?.power}
          accuracy={versionData?.accuracy}
          pp={versionData?.pp}
          effectChance={versionData?.effectChance}
          description={versionData?.description}
        />

        {/* TM/HM Location Card */}
        <MoveTmLocationCard
          tmNumber={moveData.tm?.number}
          location={moveData.tm?.location}
          locationName={moveData.tm?.locationName}
          locationExists={tmLocationExists}
        />

        {/* Pokemon Learners Card */}
        <MoveLearnersCard learners={versionData?.learners || []} />
      </div>
    </>
  );
}
