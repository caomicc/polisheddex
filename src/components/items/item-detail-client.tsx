'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { isRegularItem, isTMHMItem, type ItemData, type TMHMData } from '@/types/types';
import ItemLocationDataTable from './item-location-data-table';

interface ItemDetailClientProps {
  item: ItemData | TMHMData;
  itemName: string;
}

export default function ItemDetailClient({ item }: ItemDetailClientProps) {
  return (
    <>
      {/* Item Information Card */}
      <Card className="mb-6">
        <CardContent className="space-y-4">
          {isRegularItem(item) && <RegularItemDetails item={item} />}
          {isTMHMItem(item) && <TMHMItemDetails item={item} />}
        </CardContent>
      </Card>

      {((isRegularItem(item) && item.locations?.length) || (isTMHMItem(item) && item.location)) && (
        <ItemLocationDataTable locations={isRegularItem(item) ? item.locations : [item.location]} />
      )}
    </>
  );
}

// Component for regular item details
function RegularItemDetails({ item }: { item: ItemData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Label className="text-sm font-medium">Effect</Label>
        <p className="text-sm">{item.attributes?.effect || 'None'}</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Parameter</Label>
        <p className="text-sm">{item.attributes?.parameter || 0}</p>
      </div>

      {item.attributes?.price !== undefined && (
        <div>
          <Label className="text-sm font-medium">Price</Label>
          <p className="text-sm font-mono text-green-600 dark:text-green-400">
            ₽{item.attributes.price.toLocaleString()}
          </p>
        </div>
      )}

      <div>
        <Label className="text-sm font-medium">Usage</Label>
        <div className="space-y-1">
          {item.attributes?.useOutsideBattle && (
            <p className="text-xs text-muted-foreground">
              Outside: {item.attributes.useOutsideBattle}
            </p>
          )}
          {item.attributes?.useInBattle && (
            <p className="text-xs text-muted-foreground">
              In Battle: {item.attributes.useInBattle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Component for TM/HM item details
function TMHMItemDetails({ item }: { item: TMHMData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Label className="text-sm font-medium">Move</Label>
        <p className="text-sm font-semibold">{item.moveName}</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Type</Label>
        <p className="text-sm font-semibold">{item.type}</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Category</Label>
        <p className="text-sm">{item.category}</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Power</Label>
        <p className="text-sm">{item.power}</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Accuracy</Label>
        <p className="text-sm">{item.accuracy}%</p>
      </div>

      <div>
        <Label className="text-sm font-medium">PP</Label>
        <p className="text-sm">{item.pp}</p>
      </div>
    </div>
  );
}
