'use client';

import React from 'react';
import { TableCell, TableRow } from '../ui/table';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AbilityData } from '@/types/new';

interface AbilityRowProps {
  ability: AbilityData;
  version: string;
}

export function AbilityRow({ ability, version }: AbilityRowProps) {
  const displayName =
    ability.name || ability.id.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const description = ability.versions[version]?.description || 'No description available';

  // Desktop: standard two-column table row
  const desktopRow = (
    <TableRow key={`desktop-${ability.id}`} className="hidden md:table-row">
      <TableCell className="p-2 w-[200px]">
        <Link href={`/abilities/${encodeURIComponent(ability.id)}`} className="table-link">
          {displayName}
          <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
        </Link>
      </TableCell>
      <TableCell className="p-2 table-cell-text">
        <span className="line-clamp-2">{description}</span>
      </TableCell>
    </TableRow>
  );

  // Mobile: stacked card-style layout within table row
  const mobileRow = (
    <TableRow key={`mobile-${ability.id}`} className="md:hidden">
      <TableCell colSpan={2} className="p-3">
        <div className="flex flex-col gap-1">
          <Link
            href={`/abilities/${encodeURIComponent(ability.id)}`}
            className="table-link text-sm font-semibold"
          >
            {displayName}
            <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </Link>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {description}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {desktopRow}
      {mobileRow}
    </>
  );
}
