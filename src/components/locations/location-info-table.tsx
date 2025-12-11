'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface ConnectionInfo {
  direction: string;
  to: string;
  toId: string;
}

interface ChildLocation {
  id: string;
  name: string;
}

interface LocationInfoTableProps {
  region?: string;
  types?: string[];
  parent?: string;
  parentId?: string;
  children?: ChildLocation[];
  connections?: ConnectionInfo[];
  encounterCount?: number;
  itemCount?: number;
  eventCount?: number;
  trainerCount?: number;
}

const directionLabels: Record<string, string> = {
  north: '↑ North',
  south: '↓ South',
  east: '→ East',
  west: '← West',
};

export function LocationInfoTable({
  region,
  types,
  parent,
  parentId,
  children,
  connections,
  encounterCount,
  itemCount,
  eventCount,
  trainerCount,
}: LocationInfoTableProps) {
  return (
    <div className="info-table-wrapper">
      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {/* Region */}
        {region && (
          <div className="info-row">
            <div className="info-row-label">Region</div>
            <div className="info-row-value">
              <Badge variant={region.toLowerCase()}>
                {region}
              </Badge>
            </div>
          </div>
        )}

        {/* Location Types */}
        {types && types.length > 0 && (
          <div className="info-row">
            <div className="info-row-label">Type</div>
            <div className="info-row-value capitalize">{types.join(', ')}</div>
          </div>
        )}

        {/* Parent Location */}
        {parent && parentId && (
          <div className="info-row">
            <div className="info-row-label">Part of</div>
            <div className="info-row-value">
              <Link
                href={`/locations/${parentId}`}
                className="table-link"
              >
                {parent}
                <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
              </Link>
            </div>
          </div>
        )}

        {/* Connections */}
        {connections && connections.length > 0 && (
          <div className="info-row">
            <div className="info-row-label">Connections</div>
            <div className="info-row-value">
              <div className="flex flex-col gap-2">
                {connections.map((conn, index) => (
                  <Link
                    key={index}
                    href={`/locations/${conn.toId}`}
                    className="inline-flex items-center gap-2 table-link"
                  >
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 w-16">
                      {directionLabels[conn.direction] || conn.direction}
                    </span>
                    <span className="font-medium">{conn.to}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Child Locations / Buildings */}
        {children && children.length > 0 && (
          <div className="info-row">
            <div className="info-row-label">Contains</div>
            <div className="info-row-value">
              <div className="flex flex-col gap-2">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/locations/${child.id}`}
                    className="table-link"
                  >
                    {child.name}
                    <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wild Pokémon */}
        {encounterCount !== undefined && encounterCount > 0 && (
          <div className="info-row">
            <div className="info-row-label">Wild Pokémon</div>
            <div className="info-row-value">{encounterCount} species</div>
          </div>
        )}

        {/* Items */}
        {itemCount !== undefined && itemCount > 0 && (
          <div className="info-row">
            <div className="info-row-label">Items</div>
            <div className="info-row-value">{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Events */}
        {eventCount !== undefined && eventCount > 0 && (
          <div className="info-row">
            <div className="info-row-label">Events</div>
            <div className="info-row-value">{eventCount} event{eventCount !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Trainers */}
        {trainerCount !== undefined && trainerCount > 0 && (
          <div className="info-row">
            <div className="info-row-label">Trainers</div>
            <div className="info-row-value">{trainerCount} trainer{trainerCount !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>
    </div>
  );
}
