'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { isRegularItem, isTMHMItem, type ItemData, type TMHMData } from '@/types/types';
import ItemLocationDataTable from './item-location-data-table';
import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
import { processItemEffect, getUsageDescription } from '@/utils/itemEffectProcessor';
import { getItemSpriteName } from '@/utils/itemUtils';

interface ItemDetailClientProps {
  item: ItemData | TMHMData;
  itemName: string;
}

export default function ItemDetailClient({ item }: ItemDetailClientProps) {
  return (
    <div className="max-w-xl md:max-w-4xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
      {/* Item Information Card */}
      {isRegularItem(item) && <RegularItemDetails item={item} />}

      {((isRegularItem(item) && item.locations?.length) || (isTMHMItem(item) && item.location)) && (
        <ItemLocationDataTable locations={isRegularItem(item) ? item.locations : [item.location]} />
      )}
    </div>
  );
}

// Component for regular item details
function RegularItemDetails({ item }: { item: ItemData }) {
  const effect = processItemEffect(
    item.name,
    item.attributes?.effect,
    item.attributes?.parameter,
    item.attributes?.category,
    item.description,
    item.attributes.isKeyItem,
  );

  const usageDesc = getUsageDescription(
    item.attributes?.useOutsideBattle,
    item.attributes?.useInBattle,
    item.attributes?.category,
    item.attributes?.isKeyItem,
  );

  return (
    <div className="">
      {/* Primary Effect Display */}
      <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-3 mb-4">
        <BentoGridNoLink className="col-span-1">
          <div>
            <Image
              src={`/sprites/items/${getItemSpriteName(item.name)}.png`}
              width={24}
              height={24}
              alt={item.name}
              className="rounded-sm"
            />
            <div className="mt-2 flex items-center gap-2 mb-2">
              <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200">
                {effect.name}
              </div>
              <Badge
                variant={(() => {
                  switch (effect.category) {
                    case 'healing':
                    case 'Medicine':
                    case 'status':
                      return 'medicine';
                    case 'Item':
                    case 'stat':
                    case 'held':
                    case 'battle':
                      return 'item';
                    case 'Berry':
                      return 'berry';
                    case 'Poké Ball':
                      return 'pokeball';
                    case 'Key Item':
                      return 'keyitem';
                    default:
                      return 'default';
                  }
                })()}
                className="text-xs"
              >
                {effect.category}
              </Badge>
            </div>
            <div className="font-sans text-sm font-normal text-neutral-600 dark:text-neutral-300">
              {effect.description}
            </div>
          </div>
        </BentoGridNoLink>

        <BentoGridNoLink>
          <div>
            <Image
              src={`/sprites/items/coin_case.png`}
              width={24}
              height={24}
              alt={item.name}
              className="rounded-sm"
            />
            <div className="mb-2 mt-2 font-sans font-bold text-neutral-600 dark:text-neutral-200">
              Price
            </div>
            <div className="font-sans text-sm font-bold text-green-600 dark:text-green-300">
              ₽{item.attributes.price.toLocaleString()}
            </div>
          </div>
        </BentoGridNoLink>

        <BentoGridNoLink>
          <div>
            <Image
              src={`/sprites/items/itemfinder.png`}
              width={24}
              height={24}
              alt={item.name}
              className="rounded-sm"
            />
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
  );
}
