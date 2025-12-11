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
import { PokemonSprite } from '@/components/pokemon/pokemon-sprite';
import { Footprints, ExternalLink } from 'lucide-react';
import { extractBadgeOffsets } from '@/data/badge-levels';

interface LocationEncounter {
  pokemon: string;
  method: string;
  version: string;
  levelRange: string;
  rate: number;
  formName?: string;
}

interface ConsolidatedEncounter {
  pokemon: string;
  method: string;
  formName: string;
  levels: number[];
  totalRate: number;
  times: Set<string>;
  levelRange: string;
}

interface LocationEncountersCardProps {
  encounters: LocationEncounter[];
  className?: string;
}

function consolidateEncounters(encounters: LocationEncounter[]): ConsolidatedEncounter[] {
  const grouped = encounters.reduce(
    (acc, enc) => {
      const key = `${enc.pokemon}-${enc.method}-${enc.formName || 'plain'}`;
      if (!acc[key]) {
        acc[key] = {
          pokemon: enc.pokemon,
          method: enc.method,
          formName: enc.formName || 'plain',
          levels: [],
          totalRate: 0,
          times: new Set<string>(),
          isBadgeLevel: enc.levelRange.startsWith('Badge '),
        };
      }
      // Parse level - handle both normal "12" and badge-relative "Badge +2" formats
      const levelStr = enc.levelRange.replace('Badge ', '');
      const level = parseInt(levelStr, 10);
      if (!isNaN(level) && !acc[key].levels.includes(level)) {
        acc[key].levels.push(level);
      }
      acc[key].totalRate += enc.rate;
      acc[key].times.add(enc.version);
      return acc;
    },
    {} as Record<string, Omit<ConsolidatedEncounter, 'levelRange'> & { isBadgeLevel: boolean }>
  );

  return Object.values(grouped)
    .map((enc) => {
      enc.levels.sort((a, b) => a - b);
      let levelRange: string;
      if (enc.levels.length === 0) {
        levelRange = 'Varies';
      } else if (enc.isBadgeLevel) {
        // Format badge-relative levels: "Badge +1" or "Badge -2 to +3"
        const formatBadgeLevel = (lvl: number): string =>
          lvl >= 0 ? `+${lvl}` : `${lvl}`;
        levelRange =
          enc.levels.length === 1
            ? `Badge ${formatBadgeLevel(enc.levels[0])}`
            : `Badge ${formatBadgeLevel(enc.levels[0])} to ${formatBadgeLevel(enc.levels[enc.levels.length - 1])}`;
      } else {
        levelRange =
          enc.levels.length === 1
            ? `${enc.levels[0]}`
            : `${enc.levels[0]}-${enc.levels[enc.levels.length - 1]}`;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isBadgeLevel, ...rest } = enc;
      return { ...rest, levelRange };
    })
    .sort((a, b) => b.totalRate - a.totalRate);
}

function EncounterTable({
  encounters,
  showTimeColumn,
}: {
  encounters: ConsolidatedEncounter[];
  showTimeColumn: boolean;
}) {
  return (
    <TableWrapper>
      <Table className="w-full min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]"></TableHead>
            <TableHead className="table-header-label">Pokémon</TableHead>
            {showTimeColumn && <TableHead className="table-header-label">Time</TableHead>}
            <TableHead className="table-header-label">Method</TableHead>
            <TableHead className="table-header-label w-[80px]">Level</TableHead>
            <TableHead className="table-header-label w-[60px]">Rate</TableHead>
          </TableRow>
        </TableHeader>
      <TableBody>
        {encounters.map((enc, idx) => (
          <TableRow key={idx}>
            <TableCell className="w-[60px]">
              <PokemonSprite
                pokemonName={enc.pokemon}
                form={enc.formName}
                size="sm"
                className="shadow-none"
              />
            </TableCell>
            <TableCell>
              <Link
                href={`/pokemon/${enc.pokemon}${enc.formName !== 'plain' ? `?form=${enc.formName}` : ''}`}
                className="table-link capitalize"
              >
                {enc.pokemon.replace(/-/g, ' ')}
                {enc.formName !== 'plain' && (
                  <span className="text-xs text-neutral-500 ml-1">({enc.formName})</span>
                )}
                <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
              </Link>
            </TableCell>
            {showTimeColumn && (
                <TableCell className="space-x-1">
                  {Array.from(enc.times).length === 3 ? (
                    <Badge variant="all">all</Badge>
                  ) : (
                    Array.from(enc.times).map((time) => (
                      <Badge key={time} variant={time}>
                        {time}
                      </Badge>
                    ))
                  )}
                </TableCell>
            )}
            <TableCell>
              <Badge variant="secondary" className="uppercase">
                {enc.method.replace(/_/g, ' ')}
              </Badge>
            </TableCell>
            <TableCell className="table-cell-text">
              {enc.levelRange.startsWith('Badge') ? (
                <BadgeLevelIndicator levelRange={enc.levelRange} />
              ) : (
                `Lv. ${enc.levelRange}`
              )}
            </TableCell>
            <TableCell className="table-cell-text">{enc.totalRate}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TableWrapper>
  );
}

export function LocationEncountersCard({ encounters, className }: LocationEncountersCardProps) {
  if (!encounters || encounters.length === 0) {
    return null;
  }

  const consolidated = consolidateEncounters(encounters);

  // Extract badge offsets from all badge-relative encounters
  const badgeLevelRanges = consolidated
    .map((enc) => enc.levelRange)
    .filter((range) => range.startsWith('Badge '));
  const badgeOffsets = extractBadgeOffsets(badgeLevelRanges);
  const hasBadgeLevels = badgeOffsets.length > 0;

  return (
    <DetailCard icon={Footprints} title="Wild Pokémon" className={className}>
      {hasBadgeLevels && <BadgeLevelLegend offsets={badgeOffsets} />}
      <EncounterTable encounters={consolidated} showTimeColumn={true} />
    </DetailCard>
  );
}
