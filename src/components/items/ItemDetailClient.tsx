'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { isRegularItem, isTMHMItem, type ItemData, type TMHMData } from '@/types/types';
import Link from 'next/link';
import { normalizeLocationKey } from '@/utils/locationUtils';
import ItemLocationDataTable from './ItemLocationDataTable';

interface ItemDetailClientProps {
  item: ItemData | TMHMData;
  itemName: string;
}

export default function ItemDetailClient({ item, itemName }: ItemDetailClientProps) {
  return (
    <div className="space-y-6">
      {/* Item Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {item.name}
            <Badge variant="secondary" className="text-xs">
              {isRegularItem(item) ? item.attributes?.category || 'Item' : 'TM/HM'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{item.description}</p>
          
          {isRegularItem(item) ? (
            <RegularItemDetails item={item} />
          ) : isTMHMItem(item) ? (
            <TMHMItemDetails item={item} />
          ) : null}
        </CardContent>
      </Card>

      {/* Locations Card */}
      {isRegularItem(item) && item.locations && item.locations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Locations ({item.locations.length})</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemLocationDataTable locations={item.locations} />
          </CardContent>
        </Card>
      ) : isTMHMItem(item) && item.location ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Location</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemLocationDataTable locations={[item.location]} />
          </CardContent>
        </Card>
      ) : null}
    </div>
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

