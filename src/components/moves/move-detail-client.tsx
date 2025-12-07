'use client';

import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { MoveData } from '@/types/new';
import { MoveStatsCard } from './move-stats-card';
import { MoveTmLocationCard } from './move-tm-location-card';
import { MoveLearnersCard } from './move-learners-card';

interface MoveDetailClientProps {
  moveData: MoveData;
}

export default function MoveDetailClient({ moveData }: MoveDetailClientProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();

  const version = showFaithful ? 'faithful' : 'polished';
  const versionData = moveData.versions[version];

  return (
    <div className="space-y-4">
      {/* Move Stats Card */}
      <MoveStatsCard
        power={versionData?.power}
        accuracy={versionData?.accuracy}
        pp={versionData?.pp}
        category={versionData?.category}
      />

      {/* TM/HM Location Card */}
      <MoveTmLocationCard
        tmNumber={moveData.tm?.number}
        location={moveData.tm?.location}
      />

      {/* Pokemon Learners Card */}
      <MoveLearnersCard learners={versionData?.learners || []} />
    </div>
  );
}
