'use client';

import Link from 'next/link';
import Image from 'next/image';
import { DetailCard } from '@/components/ui/detail-card';
import { FilterableTabs } from '@/components/ui/filterable-tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TableWrapper from '@/components/ui/table-wrapper';
import { Package, ExternalLink } from 'lucide-react';
import { getItemSpriteName } from '@/utils/spriteUtils';

interface LocationItem {
  name: string;
  type: string;
  tmId?: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

interface LocationItemsCardProps {
  items: LocationItem[];
  className?: string;
}

const ITEM_TABS = [
  { value: 'all', label: 'All' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'gift', label: 'Gift' },
  { value: 'berry', label: 'Berry' },
  { value: 'tm', label: 'TM/HM' },
];

function formatItemType(type: string): string {
  if (type === 'item' || type === 'hiddenItem') return 'Hidden';
  if (type === 'tm') return 'TM';
  if (type === 'hm') return 'HM';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function filterItems(data: LocationItem[], tabValue: string): LocationItem[] {
  if (tabValue === 'all') return data;
  if (tabValue === 'hidden') return data.filter((item) => item.type === 'item' || item.type === 'hiddenItem');
  if (tabValue === 'tm') return data.filter((item) => item.type === 'tm' || item.type === 'hm');
  return data.filter((item) => item.type === tabValue);
}

function ItemsTable({ items }: { items: LocationItem[] }) {
  return (
    <TableWrapper>
      <Table className="data-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]"></TableHead>
            <TableHead className="table-header-label">Item</TableHead>
            <TableHead className="table-header-label">Type</TableHead>
            <TableHead className="table-header-label">Location</TableHead>
          </TableRow>
        </TableHeader>
      <TableBody>
        {items.map((item, idx) => {
          const displayName = item.name
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ');

          const isTmHm = item.type === 'tm' || item.type === 'hm';
          const spriteName = isTmHm ? 'tm_hm' : getItemSpriteName(displayName);
          const itemLinkId = isTmHm
            ? item.tmId || item.name.toLowerCase()
            : item.name.toLowerCase();

          return (
            <TableRow key={idx}>
              <TableCell>
                <Image
                  src={`/sprites/items/${spriteName}.png`}
                  width={24}
                  height={24}
                  alt={displayName}
                  className="w-6 h-6"
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/items/${itemLinkId}`}
                  className="table-link capitalize"
                >
                  {isTmHm ? `${itemLinkId.toUpperCase()} (${displayName})` : displayName}
                  <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {formatItemType(item.type)}
                </Badge>
              </TableCell>
              <TableCell>
                {item.coordinates ? (
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    ({item.coordinates.x}, {item.coordinates.y})
                  </span>
                ) : (
                  <span className="text-sm text-neutral-400 dark:text-neutral-500">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </TableWrapper>
  );
}

export function LocationItemsCard({ items, className }: LocationItemsCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <DetailCard icon={Package} title="Items Found Here" className={className}>
      <FilterableTabs
        tabs={ITEM_TABS}
        defaultValue="all"
        data={items}
        filterFn={filterItems}
        emptyMessage="No items of this type found"
        renderContent={(filtered) => <ItemsTable items={filtered} />}
      />
    </DetailCard>
  );
}
