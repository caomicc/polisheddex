'use client';

import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { MoveData } from '@/types/new';
import { MoveInfoTable } from './move-info-table';
import { MoveTmLocationCard } from './move-tm-location-card';
import { MoveLearnersCard } from './move-learners-card';

interface MoveDetailClientProps {
  moveData: MoveData;
  tmLocationExists?: boolean;
}

export default function MoveDetailClient({ moveData, tmLocationExists = true }: MoveDetailClientProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();

  const version = showFaithful ? 'faithful' : 'polished';
  const versionData = moveData.versions[version];

  return (
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
  );
}
