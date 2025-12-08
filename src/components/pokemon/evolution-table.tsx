'use client';

import Link from 'next/link';
import { PokemonSprite } from './pokemon-sprite';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface EvolutionChainMember {
  name: string;
  formName: string;
}

interface EvolutionChainStep {
  from: EvolutionChainMember;
  to: EvolutionChainMember;
  method: {
    action: string;
    parameter?: string | number;
  };
}

type EvolutionChain = EvolutionChainStep[][];

interface EvolutionTableProps {
  chain: EvolutionChain | null;
  currentPokemon: string;
  currentForm?: string;
}

interface EvolutionRow {
  fromName: string | null;
  pokemon: EvolutionChainMember;
  acquireMethod: string;
  isBase: boolean;
}

/**
 * Format an evolution method for display
 */
function formatAcquireMethod(
  method: { action: string; parameter?: string | number },
  fromName: string
): string {
  const { action, parameter } = method;
  const formattedFrom = formatPokemonName(fromName);

  switch (action) {
    case 'level':
      return `Level up ${formattedFrom} to Lv. ${parameter}`;
    case 'item':
      return `Use ${formatItemName(String(parameter))} on ${formattedFrom}`;
    case 'trade':
      if (parameter) {
        return `Trade ${formattedFrom} holding ${formatItemName(String(parameter))}`;
      }
      return `Trade ${formattedFrom}`;
    case 'happiness':
      if (parameter === 'day' || parameter === 'mornday') {
        return `Level up ${formattedFrom} with high friendship during day`;
      }
      if (parameter === 'night' || parameter === 'evenite') {
        return `Level up ${formattedFrom} with high friendship at night`;
      }
      return `Level up ${formattedFrom} with high friendship`;
    case 'stat':
      return `Level up ${formattedFrom} with special stats condition`;
    case 'move':
      return `Level up ${formattedFrom} knowing ${formatItemName(String(parameter))}`;
    case 'location':
      return `Level up ${formattedFrom} at ${formatItemName(String(parameter))}`;
    case 'held_item':
      if (parameter === 'day') return `Level up ${formattedFrom} holding item (Day)`;
      if (parameter === 'night') return `Level up ${formattedFrom} holding item (Night)`;
      return `Level up ${formattedFrom} holding ${formatItemName(String(parameter))}`;
    default:
      if (parameter) {
        return `${formatItemName(action)} (${parameter})`;
      }
      return formatItemName(action);
  }
}

function formatItemName(item: string): string {
  return item
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/stone$/i, ' Stone')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function formatPokemonName(name: string): string {
  return name
    .split(/[\s-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Filter the chain to only include paths relevant to the selected form
 */
function filterChainByForm(chain: EvolutionChain, selectedForm: string): EvolutionChain {
  // Filter paths to only include those that have the selected form
  // A path is relevant if any step involves the selected form
  return chain.filter((path) => {
    return path.some(
      (step) => step.from.formName === selectedForm || step.to.formName === selectedForm
    );
  });
}

/**
 * Build a flat list of evolution rows from the chain data
 */
function buildEvolutionRows(chain: EvolutionChain, selectedForm: string): EvolutionRow[] {
  // Filter chain to only include paths relevant to the selected form
  const filteredChain = filterChainByForm(chain, selectedForm);
  
  // If no paths match the selected form, fall back to plain form
  const chainToUse = filteredChain.length > 0 ? filteredChain : filterChainByForm(chain, 'plain');
  
  const rows: EvolutionRow[] = [];
  const seenPokemon = new Set<string>();
  const basePokemon = new Set<string>();
  const evolvedPokemon = new Set<string>();

  // First pass: identify all base and evolved pokemon
  for (const path of chainToUse) {
    for (const step of path) {
      const fromKey = `${step.from.name}|${step.from.formName}`;
      const toKey = `${step.to.name}|${step.to.formName}`;
      basePokemon.add(fromKey);
      evolvedPokemon.add(toKey);
    }
  }

  // Find the true base pokemon (those that don't evolve from anything in the chain)
  const trueBase = new Set<string>();
  for (const key of basePokemon) {
    if (!evolvedPokemon.has(key)) {
      trueBase.add(key);
    }
  }

  // Add base pokemon first
  for (const key of trueBase) {
    const [name, formName] = key.split('|');
    if (!seenPokemon.has(key)) {
      rows.push({
        fromName: null,
        pokemon: { name, formName },
        acquireMethod: 'Base form',
        isBase: true,
      });
      seenPokemon.add(key);
    }
  }

  // Add all evolutions
  for (const path of chainToUse) {
    for (const step of path) {
      const toKey = `${step.to.name}|${step.to.formName}`;
      if (!seenPokemon.has(toKey)) {
        rows.push({
          fromName: step.from.name,
          pokemon: step.to,
          acquireMethod: formatAcquireMethod(step.method, step.from.name),
          isBase: false,
        });
        seenPokemon.add(toKey);
      }
    }
  }

  return rows;
}

export function EvolutionTable({ chain, currentPokemon, currentForm = 'plain' }: EvolutionTableProps) {
  if (!chain || chain.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        This Pokémon does not evolve.
      </p>
    );
  }

  const rows = buildEvolutionRows(chain, currentForm);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        This Pokémon does not evolve.
      </p>
    );
  }

  return (
  <div className="w-full mx-auto md:mx-0 relative z-10 rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
    <Table className="w-full text-sm table-auto">
      <TableHeader>
        <TableRow>
          <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 w-[100px] align-top">
            Pokemon
          </TableHead>

          <TableCell  className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 ">
            Acquire At
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {rows.map((row, index) => {
          const pokemonKey = `${row.pokemon.name}|${row.pokemon.formName}`;
          const isCurrentPokemon =
            row.pokemon.name.toLowerCase() === currentPokemon.toLowerCase() &&
            (row.pokemon.formName === currentForm || row.pokemon.formName === 'plain');

          return (
            <TableRow
              key={pokemonKey + index}
              className={isCurrentPokemon ? 'bg-primary/10' : ''}
            >
              {row.isBase ? (
                <TableCell
                  className="px-4 py-2 text-neutral-700 dark:text-neutral-200 min-w-[200px]">
                  <Link
                    href={`/pokemon/${row.pokemon.name}`}
                    className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <PokemonSprite
                      pokemonName={row.pokemon.name}
                      form={row.pokemon.formName}
                      size='sm'
                    />
                    <span className="capitalize">{formatPokemonName(row.pokemon.name)}</span>
                  </Link>
                </TableCell>
              ) : (
                <>
                  <TableCell
                  className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                    <Link
                      href={`/pokemon/${row.pokemon.name}`}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <PokemonSprite
                        pokemonName={row.pokemon.name}
                        form={row.pokemon.formName}
                        size='sm'
                      />
                      <span className="capitalize">{formatPokemonName(row.pokemon.name)}</span>
                    </Link>
                  </TableCell>
                </>
              )}
              <TableCell className="px-4 py-2 text-neutral-600 dark:text-neutral-400 text-xs">
                {row.acquireMethod}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </div>
  );
}
