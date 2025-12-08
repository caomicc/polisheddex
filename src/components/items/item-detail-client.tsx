'use client';

import { ComprehensiveItemsData } from '@/types/new';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { getUsageDescription } from '@/utils/itemEffectProcessor';
import { ItemInfoTable } from './item-info-table';
import { ItemLocationsTable } from './item-locations-table';
import { DetailCard } from '@/components/ui/detail-card';
import { MapPin } from 'lucide-react';

interface MoveInfo {
  name: string;
  type: string;
  category: string;
  power: number;
  accuracy: number | string;
  pp: number;
}

interface ItemDetailClientProps {
  item: ComprehensiveItemsData;
  polishedMoveData?: MoveInfo | null;
  faithfulMoveData?: MoveInfo | null;
  locationNameMap?: Record<string, string>;
}

export default function ItemDetailClient({
  item,
  polishedMoveData,
  faithfulMoveData,
  locationNameMap,
}: ItemDetailClientProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();
  const version = showFaithful ? 'faithful' : 'polished';
  const versionData = item.versions[version];
  const usageDesc = getUsageDescription(versionData);
  const moveData = showFaithful ? faithfulMoveData : polishedMoveData;

  const isTmHm =
    versionData.attributes?.category === 'tm' || versionData.attributes?.category === 'hm';

  return (
    <div className="space-y-6">
      <ItemInfoTable
        name={versionData.name}
        description={versionData.description}
        category={versionData.attributes?.category}
        price={versionData.attributes?.price}
        usage={usageDesc}
        moveName={isTmHm ? versionData.attributes?.moveName : undefined}
        moveData={moveData}
      />

      {/* Locations Section */}
      {versionData.locations && versionData.locations.length > 0 && (
        <DetailCard icon={MapPin} title={`Locations (${versionData.locations.length})`}>
          <ItemLocationsTable locations={versionData.locations} locationNameMap={locationNameMap} />
        </DetailCard>
      )}
    </div>
  );
}
