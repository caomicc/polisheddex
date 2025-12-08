'use client';

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import TableWrapper from '@/components/ui/table-wrapper';
import { MapPin, ShoppingCart, Gift, Search, Coins, Trophy, ExternalLink } from 'lucide-react';

interface LocationEntry {
  area: string;
  method: string;
  name?: string;
  parentId?: string;
}

interface ItemLocationsTableProps {
  locations: LocationEntry[];
  locationNameMap?: Record<string, string>;
}

function getMethodIcon(method?: string) {
  if (!method) return <MapPin className="h-4 w-4" />;

  const methodLower = method.toLowerCase();
  if (methodLower.includes('buy') || methodLower.includes('shop') || methodLower.includes('mart')) {
    return <ShoppingCart className="h-4 w-4" />;
  }
  if (methodLower.includes('gift') || methodLower.includes('given') || methodLower.includes('npc')) {
    return <Gift className="h-4 w-4" />;
  }
  if (methodLower.includes('hidden') || methodLower.includes('find') || methodLower.includes('pickup')) {
    return <Search className="h-4 w-4" />;
  }
  if (methodLower.includes('prize') || methodLower.includes('coin') || methodLower.includes('casino')) {
    return <Coins className="h-4 w-4" />;
  }
  if (methodLower.includes('gym') || methodLower.includes('badge') || methodLower.includes('reward')) {
    return <Trophy className="h-4 w-4" />;
  }
  return <MapPin className="h-4 w-4" />;
}

function getMethodVariant(method?: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!method) return 'secondary';

  const methodLower = method.toLowerCase();
  if (methodLower.includes('buy') || methodLower.includes('shop') || methodLower.includes('mart')) {
    return 'default';
  }
  return 'secondary';
}

function getMethodColor(method?: string): string {
  if (!method) return 'text-neutral-400';

  const methodLower = method.toLowerCase();
  if (methodLower.includes('buy') || methodLower.includes('shop') || methodLower.includes('mart')) {
    return 'text-green-500';
  }
  if (methodLower.includes('gift') || methodLower.includes('given') || methodLower.includes('npc')) {
    return 'text-pink-500';
  }
  if (methodLower.includes('hidden') || methodLower.includes('find') || methodLower.includes('pickup')) {
    return 'text-yellow-500';
  }
  if (methodLower.includes('prize') || methodLower.includes('coin') || methodLower.includes('casino')) {
    return 'text-purple-500';
  }
  if (methodLower.includes('gym') || methodLower.includes('badge') || methodLower.includes('reward')) {
    return 'text-orange-500';
  }
  return 'text-blue-500';
}

export function ItemLocationsTable({ locations, locationNameMap }: ItemLocationsTableProps) {
  if (!locations || locations.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-4">
        No location data available for this item.
      </p>
    );
  }

  return (
    <TableWrapper>
      <Table className="data-table">
        <TableHeader>
          <TableRow>
            <TableHead className="table-header-label w-[200px]">Location</TableHead>
            <TableHead className="table-header-label">Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((loc, idx) => {
            const locationSlug = loc.parentId || loc.area.toLowerCase().replace(/\s+/g, '_');
            const displayName = locationNameMap?.[locationSlug] || loc.area;
            return (
              <TableRow key={`${loc.area}-${loc.method}-${idx}`}>
                <TableCell>
                  <Link
                    href={`/locations/${locationSlug}`}
                    className="table-link"
                  >
                    {displayName}
                    <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={cn('flex-shrink-0', getMethodColor(loc.method))}>
                      {getMethodIcon(loc.method)}
                    </span>
                    <Badge variant={getMethodVariant(loc.method)} className="text-xs">
                      {loc.method || 'Found'}
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}
