'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { isRegularItem, isTMHMItem, type ItemData, type TMHMData } from '@/types/types';
import ItemLocationDataTable from './item-location-data-table';
import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
import { processItemEffect, getUsageDescription, isHeldItem } from '@/utils/itemEffectProcessor';

interface ItemDetailClientProps {
  item: ItemData | TMHMData;
  itemName: string;
}

export default function ItemDetailClient({ item }: ItemDetailClientProps) {
  return (
    <div className="relative z-10 mt-4 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
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
  );

  const usageDesc = getUsageDescription(
    item.attributes?.useOutsideBattle,
    item.attributes?.useInBattle,
    item.attributes?.category,
  );

  const isHeld = isHeldItem(item.attributes?.effect, item.attributes?.category);

  return (
    <div className="">
      {/* Primary Effect Display */}
      <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-3 mb-4">
        <BentoGridNoLink className="col-span-1">
          <div className="transition duration-200 group-hover/bento:translate-x-2">
            <Image
              src={`/sprites/items/${item.name
                .replace(/^Max\s+/i, '') // Remove "Max " at the start, case-insensitive
                .replace(/é/i, 'e')
                .toLowerCase()
                .replace(/ /g, '_')}.png`}
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
                variant={
                  effect.category === 'healing'
                    ? 'medicine'
                    : effect.category === 'status'
                      ? 'medicine'
                      : effect.category === 'stat'
                        ? 'item'
                        : effect.category === 'battle'
                          ? 'item'
                          : effect.category === 'held'
                            ? 'berry'
                            : 'default'
                }
                className="text-xs"
              >
                {effect.category}
              </Badge>
              {isHeld && (
                <Badge variant="secondary" className="text-xs">
                  Held Item
                </Badge>
              )}
            </div>
            <div className="font-sans text-sm font-normal text-neutral-600 dark:text-neutral-300">
              {effect.description}
            </div>
          </div>
        </BentoGridNoLink>

        <BentoGridNoLink>
          <div className="transition duration-200 group-hover/bento:translate-x-2">
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
            <div className="font-sans text-xs font-normal text-neutral-600 dark:text-neutral-300">
              ₽{item.attributes.price.toLocaleString()}
            </div>
          </div>
        </BentoGridNoLink>

        <BentoGridNoLink>
          <div className="transition duration-200 group-hover/bento:translate-x-2">
            <Image
              src={`/sprites/items/${item.name
                .replace(/^Max\s+/i, '') // Remove "Max " at the start, case-insensitive
                .replace(/é/i, 'e')
                .toLowerCase()
                .replace(/ /g, '_')}.png`}
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
            {/* {(item.attributes?.useOutsideBattle || item.attributes?.useInBattle) && (
              <div className="mt-3 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                {item.attributes.useOutsideBattle &&
                  item.attributes.useOutsideBattle !== 'Cannot use' && (
                    <div>Outside battle: {item.attributes.useOutsideBattle}</div>
                  )}
                {item.attributes.useInBattle && item.attributes.useInBattle !== 'Cannot use' && (
                  <div>In battle: {item.attributes.useInBattle}</div>
                )}
              </div>
            )} */}
          </div>
        </BentoGridNoLink>
      </BentoGrid>
    </div>
  );
}
