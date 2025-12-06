'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
// import ItemLocationDataTable from './item-location-data-table';
import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
import { processItemEffect, getUsageDescription } from '@/utils/itemEffectProcessor';
import { ComprehensiveItemsData } from '@/types/new';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import ItemLocationDataTable from './item-location-data-table';
import { ItemSprite } from './item-sprite';

interface ItemDetailClientProps {
  item: ComprehensiveItemsData;
}

export default function ItemDetailClient({ item }: ItemDetailClientProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();
  const version = showFaithful ? 'faithful' : 'polished';
  const effect = processItemEffect(item.versions[version]);
  const usageDesc = getUsageDescription(item.versions[version]);
  return (
    <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
      {/* <RegularItemDetails item={item.versions[version]} /> */}
      <div className="">
        {/* Primary Effect Display */}
        <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-3 mb-4">
          <BentoGridNoLink className="col-span-1">
            <div>
              <ItemSprite
                itemName={item.versions[version].name}
                category={item.versions[version].attributes?.category}
                size={24}
              />
              <div className="mt-2 flex items-center gap-2 mb-2">
                <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200">
                  {item.versions[version].name}
                </div>
                <Badge className="text-xs">{effect.category}</Badge>
              </div>
              <div className="font-sans text-sm font-normal text-neutral-600 dark:text-neutral-300">
                {item.versions[version].description}
              </div>
            </div>
          </BentoGridNoLink>

          <BentoGridNoLink>
            <div>
              <ItemSprite itemName="Coin Case" size={24} />
              <div className="mb-2 mt-2 font-sans font-bold text-neutral-600 dark:text-neutral-200">
                Price
              </div>
              <div className="font-sans text-sm font-bold text-green-600 dark:text-green-300">
                ₽{item.versions[version].attributes?.price?.toLocaleString() ?? 'N/A'}
              </div>
            </div>
          </BentoGridNoLink>

          <BentoGridNoLink>
            <div>
              <ItemSprite itemName="Itemfinder" size={24} />
              <div className="mt-2 mb-2 font-sans font-bold text-neutral-600 dark:text-neutral-200">
                How to Use
              </div>
              <div className="font-sans text-sm font-normal text-neutral-600 dark:text-neutral-300">
                {usageDesc}
              </div>
            </div>
          </BentoGridNoLink>
        </BentoGrid>
      </div>
      {item.versions[version].locations?.length && (
        <ItemLocationDataTable locations={item.versions[version].locations} />
      )}
    </div>
  );
}
