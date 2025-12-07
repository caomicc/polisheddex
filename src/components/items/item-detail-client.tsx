'use client';

import { ComprehensiveItemsData } from '@/types/new';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { getUsageDescription } from '@/utils/itemEffectProcessor';
import { ItemHeader } from './item-header';
import { ItemDescription } from './item-description';
import { ItemEffectCard } from './item-effect-card';
import { ItemLocationsCard } from './item-locations-card';
import { ItemUsageCard } from './item-usage-card';

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
}

export default function ItemDetailClient({
  item,
  polishedMoveData,
  faithfulMoveData,
}: ItemDetailClientProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();
  const version = showFaithful ? 'faithful' : 'polished';
  const versionData = item.versions[version];
  const usageDesc = getUsageDescription(versionData);
  const moveData = showFaithful ? faithfulMoveData : polishedMoveData;

  const isTmHm =
    versionData.attributes?.category === 'tm' || versionData.attributes?.category === 'hm';

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 md:p-6 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
      {/* Header Section */}
      <ItemHeader
        name={versionData.name}
        category={versionData.attributes?.category}
        price={versionData.attributes?.price}
        className="mb-6"
      />

      {/* Description */}
      <ItemDescription description={versionData.description} className="mb-4" />

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* TM/HM Move Info */}
        {isTmHm && versionData.attributes?.moveName && (
          <ItemEffectCard
            category={versionData.attributes?.category}
            moveName={versionData.attributes?.moveName}
            moveData={moveData}
            className="md:col-span-1"
          />
        )}

        {/* Usage Info */}
        <ItemUsageCard usage={usageDesc} className={isTmHm ? 'md:col-span-1' : 'md:col-span-2'} />
      </div>

      {/* Locations */}
      {versionData.locations && versionData.locations.length > 0 && (
        <ItemLocationsCard locations={versionData.locations} />
      )}
    </div>
  );
}
