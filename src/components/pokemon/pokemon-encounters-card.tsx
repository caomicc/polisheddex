'use client';

import Link from 'next/link';
import { DetailCard } from '@/components/ui/detail-card';
import { Badge } from '@/components/ui/badge';
import { BadgeLevelLegend } from '@/components/ui/badge-level-legend';
import { BadgeLevelIndicator } from '@/components/ui/badge-level-indicator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TableWrapper from '@/components/ui/table-wrapper';
import { ExternalLink, MapPin } from 'lucide-react';
import { extractBadgeOffsets } from '@/data/badge-levels';

interface PokemonLocationEncounter {
  locationId: string;
  locationName: string;
  region: string;
  method: string;
  version: string;
  levelRange: string;
  rate: number;
  formName?: string;
}

interface ConsolidatedLocation {
  locationId: string;
  locationName: string;
  region: string;
  method: string;
  version: string;
  levels: number[];
  badgeLevels: string[];
  hasVariableLevel: boolean;
  totalRate: number;
  levelRange: string;
  isBadgeLevel: boolean;
}

interface PokemonEncountersCardProps {
  encounters: PokemonLocationEncounter[];
  selectedForm?: string;
  className?: string;
}

function consolidateLocations(
  encounters: PokemonLocationEncounter[],
  selectedForm?: string
): ConsolidatedLocation[] {
  // Filter for the current form
  const filteredEncounters = encounters.filter(
    (loc) => !loc.formName || loc.formName === 'plain' || loc.formName === selectedForm
  );

  // Group by location + method + time
  const grouped = filteredEncounters.reduce(
    (acc, loc) => {
      const key = `${loc.locationId}|${loc.method}|${loc.version}`;
      if (!acc[key]) {
        acc[key] = {
          locationId: loc.locationId,
          locationName: loc.locationName,
          region: loc.region,
          method: loc.method,
          version: loc.version,
          levels: [],
          badgeLevels: [],
          hasVariableLevel: false,
          totalRate: 0,
        };
      }

      // Parse level - check for badge-relative levels
      if (loc.levelRange.toLowerCase().includes('badge')) {
        if (!acc[key].badgeLevels.includes(loc.levelRange)) {
          acc[key].badgeLevels.push(loc.levelRange);
        }
      } else {
        const level = parseInt(loc.levelRange, 10);
        if (isNaN(level) || level < 0) {
          acc[key].hasVariableLevel = true;
        } else if (!acc[key].levels.includes(level)) {
          acc[key].levels.push(level);
        }
      }

      acc[key].totalRate += loc.rate;
      return acc;
    },
    {} as Record<
      string,
      Omit<ConsolidatedLocation, 'levelRange' | 'isBadgeLevel'>
    >
  );

  // Convert to array and format level ranges
  const consolidated = Object.values(grouped).map((loc) => {
    let levelRange: string;
    let isBadgeLevel = false;

    if (loc.badgeLevels.length > 0) {
      isBadgeLevel = true;
      const offsets = extractBadgeOffsets(loc.badgeLevels);
      if (offsets.length === 1) {
        levelRange = `Badge ${offsets[0] >= 0 ? '+' : ''}${offsets[0]}`;
      } else if (offsets.length > 1) {
        const minOffset = Math.min(...offsets);
        const maxOffset = Math.max(...offsets);
        levelRange = `Badge ${minOffset >= 0 ? '+' : ''}${minOffset} to ${maxOffset >= 0 ? '+' : ''}${maxOffset}`;
      } else {
        levelRange = 'Badge';
      }
    } else if (loc.hasVariableLevel || loc.levels.length === 0) {
      levelRange = 'Varies';
    } else {
      loc.levels.sort((a, b) => a - b);
      const minLevel = loc.levels[0];
      const maxLevel = loc.levels[loc.levels.length - 1];
      levelRange = minLevel === maxLevel ? `${minLevel}` : `${minLevel}-${maxLevel}`;
    }

    return {
      ...loc,
      levelRange,
      isBadgeLevel,
    };
  });

  // Sort by location name, then method, then time
  consolidated.sort((a, b) => {
    if (a.locationName !== b.locationName) return a.locationName.localeCompare(b.locationName);
    if (a.method !== b.method) return a.method.localeCompare(b.method);
    const timeOrder = { morning: 0, day: 1, night: 2 };
    return (
      (timeOrder[a.version as keyof typeof timeOrder] ?? 3) -
      (timeOrder[b.version as keyof typeof timeOrder] ?? 3)
    );
  });

  return consolidated;
}

export function PokemonEncountersCard({
  encounters,
  selectedForm,
  className,
}: PokemonEncountersCardProps) {
  const consolidatedLocations = consolidateLocations(encounters, selectedForm);

  if (consolidatedLocations.length === 0) {
    return null;
  }

  // Extract badge offsets for the legend
  const badgeLevelRanges = consolidatedLocations
    .filter((loc) => loc.isBadgeLevel)
    .map((loc) => loc.levelRange);
  const badgeOffsets = extractBadgeOffsets(badgeLevelRanges);
  const hasBadgeLevels = badgeOffsets.length > 0;

  return (
    <DetailCard
      icon={MapPin}
      title={`Wild Encounters (${consolidatedLocations.length})`}
      className={className}
    >
      {hasBadgeLevels && <BadgeLevelLegend offsets={badgeOffsets} />}
      <TableWrapper>
        <Table className="w-full min-w-[500px]">
          <TableHeader>
            <TableRow>
              <TableHead className="table-header-label">Location</TableHead>
              <TableHead className="table-header-label">Time</TableHead>
              <TableHead className="table-header-label">Method</TableHead>
              <TableHead className="table-header-label">Level</TableHead>
              <TableHead className="table-header-label">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consolidatedLocations.map((loc, idx) => (
              <TableRow key={`${loc.locationId}-${loc.method}-${loc.version}-${idx}`}>
                <TableCell>
                  <Link
                    href={`/locations/${loc.locationId}`}
                    className="table-link capitalize"
                  >
                    {loc.locationName}
                    <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={loc.version} className="text-xs">
                    {loc.version}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs uppercase">
                    {loc.method.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="table-cell-text">
                  {loc.isBadgeLevel ? (
                    <BadgeLevelIndicator levelRange={loc.levelRange} />
                  ) : loc.levelRange === 'Varies' ? (
                    'Varies'
                  ) : (
                    `Lv. ${loc.levelRange}`
                  )}
                </TableCell>
                <TableCell className="table-cell-text">{loc.totalRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </DetailCard>
  );
}
