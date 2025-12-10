'use client';

import Link from 'next/link';
import { DetailCard } from '@/components/ui/detail-card';
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
import { ExternalLink, Gift, Sparkles, Navigation } from 'lucide-react';
import { StaticPokemon } from '@/types/new';

interface HowToObtainCardProps {
  staticPokemon: StaticPokemon[];
  className?: string;
}

/**
 * Displays prerequisite information (item, event, or caught requirement)
 */
function PrerequisiteDisplay({ prerequisite }: { prerequisite: StaticPokemon['prerequisite'] }) {
  if (!prerequisite) return <span className="text-neutral-500">—</span>;

  const typeLabels = {
    item: 'Requires',
    event: 'After',
    caught: 'Catch',
  };

  return (
    <span className="text-xs text-neutral-400">
      {typeLabels[prerequisite.type]}: {prerequisite.displayName}
    </span>
  );
}

export function HowToObtainCard({ staticPokemon, className }: HowToObtainCardProps) {
  if (!staticPokemon || staticPokemon.length === 0) {
    return null;
  }

  // Sort by type (gift first, then static, then roaming) then by level
  const sortedPokemon = [...staticPokemon].sort((a, b) => {
    const typeOrder = { gift: 0, static: 1, roaming: 2 };
    const typeCompare = typeOrder[a.type] - typeOrder[b.type];
    if (typeCompare !== 0) return typeCompare;
    return a.level - b.level;
  });

  return (
    <DetailCard icon={Gift} title="How to Obtain" className={className}>
      <TableWrapper>
        <Table className="w-full min-w-[500px]">
          <TableHeader>
            <TableRow>
              <TableHead className="table-header-label">Location</TableHead>
              <TableHead className="table-header-label w-[80px]">Level</TableHead>
              <TableHead className="table-header-label">Type</TableHead>
              <TableHead className="table-header-label">Form</TableHead>
              <TableHead className="table-header-label">Held Item</TableHead>
              <TableHead className="table-header-label">Prerequisite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPokemon.map((pokemon) => (
              <TableRow key={pokemon.id}>
                <TableCell>
                  {pokemon.type === 'roaming' ? (
                    <span className="text-neutral-300">{pokemon.locationDisplay}</span>
                  ) : (
                    <Link
                      href={`/locations/${pokemon.location}`}
                      className="table-link"
                    >
                      {pokemon.locationDisplay}
                      <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </Link>
                  )}
                </TableCell>
                <TableCell className="table-cell-text">Lv. {pokemon.level}</TableCell>
                <TableCell>
                  <Badge variant={pokemon.type}>
                    {pokemon.type}
                  </Badge>
                </TableCell>
                <TableCell className="table-cell-text">
                  {pokemon.form ? (
                    <span className="text-neutral-300 capitalize">
                      {pokemon.form.replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </TableCell>
                <TableCell className="table-cell-text">
                  {pokemon.heldItemDisplay ? (
                    <span className="text-neutral-300">{pokemon.heldItemDisplay}</span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <PrerequisiteDisplay prerequisite={pokemon.prerequisite} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </DetailCard>
  );
}
