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
import { PokemonSprite } from '@/components/pokemon/pokemon-sprite';
import { Sparkles, ExternalLink, Gift, Navigation } from 'lucide-react';
import { StaticPokemon } from '@/types/new';

interface SpecialEncountersCardProps {
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

export function SpecialEncountersCard({ staticPokemon, className }: SpecialEncountersCardProps) {
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
    <DetailCard icon={Sparkles} title="Special Encounters" className={className}>
      <TableWrapper>
        <Table className="w-full min-w-[500px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead className="table-header-label">Pokémon</TableHead>
              <TableHead className="table-header-label w-[80px]">Level</TableHead>
              <TableHead className="table-header-label">Type</TableHead>
              <TableHead className="table-header-label">Held Item</TableHead>
              <TableHead className="table-header-label">Prerequisite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPokemon.map((pokemon) => (
              <TableRow key={pokemon.id}>
                <TableCell className="w-[60px]">
                  <PokemonSprite
                    pokemonName={pokemon.species}
                    form={pokemon.form || 'plain'}
                    size="sm"
                    className="shadow-none"
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/pokemon/${pokemon.species}${pokemon.form ? `?form=${pokemon.form}` : ''}`}
                    className="table-link capitalize"
                  >
                    {pokemon.speciesDisplay}
                    {pokemon.form && (
                      <span className="text-xs text-neutral-500 ml-1">
                        ({pokemon.form.replace(/([a-z])([A-Z])/g, '$1 $2')})
                      </span>
                    )}
                    <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  </Link>
                </TableCell>
                <TableCell className="table-cell-text">Lv. {pokemon.level}</TableCell>
                <TableCell>
                  <Badge variant={pokemon.type}>
                    {pokemon.type}
                  </Badge>
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
