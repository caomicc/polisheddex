'use client';

import Link from 'next/link';
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
import { PokemonSprite } from '@/components/pokemon/pokemon-sprite';
import { cn } from '@/lib/utils';
import { Footprints, ExternalLink } from 'lucide-react';

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

const TIME_TABS = [
  { value: 'all', label: 'All' },
  { value: 'morning', label: 'Morning' },
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
];

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
        };
      }
      const level = parseInt(enc.levelRange, 10);
      if (!isNaN(level) && !acc[key].levels.includes(level)) {
        acc[key].levels.push(level);
      }
      acc[key].totalRate += enc.rate;
      acc[key].times.add(enc.version);
      return acc;
    },
    {} as Record<string, Omit<ConsolidatedEncounter, 'levelRange'>>
  );

  return Object.values(grouped)
    .map((enc) => {
      enc.levels.sort((a, b) => a - b);
      const levelRange =
        enc.levels.length === 0
          ? 'Varies'
          : enc.levels.length === 1
            ? `${enc.levels[0]}`
            : `${enc.levels[0]}-${enc.levels[enc.levels.length - 1]}`;
      return { ...enc, levelRange };
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
            <TableHead className="table-header-label">Method</TableHead>
            <TableHead className="table-header-label w-[80px]">Level</TableHead>
            <TableHead className="table-header-label w-[60px]">Rate</TableHead>
            {showTimeColumn && <TableHead className="table-header-label w-[100px]">Time</TableHead>}
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
            <TableCell>
              <Badge variant="secondary" className="capitalize">
                {enc.method.replace(/_/g, ' ')}
              </Badge>
            </TableCell>
            <TableCell className="table-cell-text">Lv. {enc.levelRange}</TableCell>
            <TableCell className="table-cell-text">{enc.totalRate}%</TableCell>
            {showTimeColumn && (
              <TableCell className="table-cell-text capitalize">{Array.from(enc.times).join(', ')}</TableCell>
            )}
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

  const filterEncounters = (data: LocationEncounter[], tabValue: string): LocationEncounter[] => {
    if (tabValue === 'all') return data;
    return data.filter((e) => e.version === tabValue);
  };

  return (
    <DetailCard icon={Footprints} title="Wild Pokémon" className={className}>
      <FilterableTabs
        tabs={TIME_TABS}
        defaultValue="all"
        data={encounters}
        filterFn={filterEncounters}
        emptyMessage="No Pokémon encounters during this time"
        renderContent={(filtered) => {
          const consolidated = consolidateEncounters(filtered);
          const isAllTab = filtered.length === encounters.length;
          return <EncounterTable encounters={consolidated} showTimeColumn={isAllTab} />;
        }}
      />
    </DetailCard>
  );
}
