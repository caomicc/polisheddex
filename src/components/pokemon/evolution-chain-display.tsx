'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface EvolutionChainDisplayProps {
  chain: EvolutionChain | null;
  currentPokemon: string;
  currentForm?: string;
}

/**
 * Format an evolution method for display
 */
function formatEvolutionMethod(method: { action: string; parameter?: string | number }): string {
  const { action, parameter } = method;

  switch (action) {
    case 'level':
      return `Lv. ${parameter}`;
    case 'item':
      return formatItemName(String(parameter));
    case 'trade':
      if (parameter) {
        return `Trade w/ ${formatItemName(String(parameter))}`;
      }
      return 'Trade';
    case 'happiness':
      if (parameter === 'day' || parameter === 'mornday') return '❤️ Day';
      if (parameter === 'night' || parameter === 'evenite') return '❤️ Night';
      return '❤️';
    case 'stat':
      return 'Special Stats';
    case 'move':
      return `Knows ${formatItemName(String(parameter))}`;
    case 'location':
      return formatItemName(String(parameter));
    case 'held_item':
      if (parameter === 'day') return 'Hold Item (Day)';
      if (parameter === 'night') return 'Hold Item (Night)';
      return `Hold ${formatItemName(String(parameter))}`;
    default:
      if (parameter) {
        return `${formatItemName(action)}`;
      }
      return formatItemName(action);
  }
}

function formatItemName(item: string): string {
  return item
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatPokemonName(name: string): string {
  return name
    .split(/[\s-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface ChainStage {
  pokemon: EvolutionChainMember;
  evolvesTo: {
    pokemon: EvolutionChainMember;
    methods: { action: string; parameter?: string | number }[];
  }[];
}

/**
 * Build a tree structure from the evolution chain
 * Returns both the map of all stages and the root stages
 */
function buildEvolutionTree(chain: EvolutionChain): {
  allStages: Map<string, ChainStage>;
  rootStages: ChainStage[];
} {
  const stages: Map<string, ChainStage> = new Map();
  const childPokemon = new Set<string>();

  // Process all paths
  for (const path of chain) {
    for (const step of path) {
      const fromKey = `${step.from.name}|${step.from.formName}`;
      const toKey = `${step.to.name}|${step.to.formName}`;

      childPokemon.add(toKey);

      if (!stages.has(fromKey)) {
        stages.set(fromKey, {
          pokemon: step.from,
          evolvesTo: [],
        });
      }

      const stage = stages.get(fromKey)!;

      // Check if this evolution target already exists
      const existingEvolution = stage.evolvesTo.find(
        (e) => e.pokemon.name === step.to.name && e.pokemon.formName === step.to.formName,
      );

      if (existingEvolution) {
        // Add method if not already present
        const methodExists = existingEvolution.methods.some(
          (m) => m.action === step.method.action && m.parameter === step.method.parameter,
        );
        if (!methodExists) {
          existingEvolution.methods.push(step.method);
        }
      } else {
        stage.evolvesTo.push({
          pokemon: step.to,
          methods: [step.method],
        });
      }
    }
  }

  // Find root stages (Pokemon that are not children of any other Pokemon in the chain)
  const rootStages: ChainStage[] = [];
  for (const [key, stage] of stages) {
    if (!childPokemon.has(key)) {
      rootStages.push(stage);
    }
  }

  // If no roots found, just return all stages as roots
  if (rootStages.length === 0) {
    return { allStages: stages, rootStages: Array.from(stages.values()) };
  }

  return { allStages: stages, rootStages };
}

/**
 * Get all Pokemon in a chain including their evolutions recursively
 */
function getAllChainPokemon(chain: EvolutionChain): EvolutionChainMember[] {
  const seen = new Set<string>();
  const result: EvolutionChainMember[] = [];

  for (const path of chain) {
    for (const step of path) {
      const fromKey = `${step.from.name}|${step.from.formName}`;
      const toKey = `${step.to.name}|${step.to.formName}`;

      if (!seen.has(fromKey)) {
        seen.add(fromKey);
        result.push(step.from);
      }
      if (!seen.has(toKey)) {
        seen.add(toKey);
        result.push(step.to);
      }
    }
  }

  return result;
}

interface PokemonCardProps {
  pokemon: EvolutionChainMember;
  isCurrent: boolean;
  methods?: { action: string; parameter?: string | number }[];
  showArrow?: boolean;
}

/**
 * Get the icon sprite URL for a Pokemon
 * Icons are stored as {name}.png or {name}_{form}.png for regional variants
 */
function getIconUrl(pokemonName: string, formName: string): string {
  const baseName = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Map form names to file suffixes
  if (formName && formName !== 'plain') {
    const formSuffix = formName.toLowerCase();
    // Check for regional forms
    if (
      formSuffix.includes('alolan') ||
      formSuffix.includes('galarian') ||
      formSuffix.includes('hisuian') ||
      formSuffix.includes('paldean')
    ) {
      return `/sprites/icons/${baseName}_${formSuffix}.png`;
    }
    // Other forms like armored, bloodmoon, etc.
    return `/sprites/icons/${baseName}_${formSuffix}.png`;
  }

  return `/sprites/icons/${baseName}.png`;
}

function PokemonCard({ pokemon, isCurrent, methods, showArrow }: PokemonCardProps) {
  const pokemonUrl = `/pokemon/${pokemon.name.toLowerCase()}${
    pokemon.formName !== 'plain' ? `?form=${pokemon.formName}` : ''
  }`;

  const iconUrl = getIconUrl(pokemon.name, pokemon.formName);

  return (
    <div className="flex items-center gap-1 shrink-0">
      {showArrow && methods && methods.length > 0 && (
        <div className="flex flex-col items-center gap-0.5 mx-1">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <div className="text-[9px] md:text-[10px] text-muted-foreground text-center max-w-[60px] leading-tight">
            {methods.slice(0, 2).map((m, i) => (
              <div key={i}>{formatEvolutionMethod(m)}</div>
            ))}
            {methods.length > 2 && <div>+{methods.length - 2} more</div>}
          </div>
        </div>
      )}

      <Link
        href={pokemonUrl}
        className={cn(
          'flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all hover:bg-muted/50',
          isCurrent && 'ring-2 ring-primary bg-muted/30',
        )}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 relative flex items-center justify-center">
          <Image
            src={iconUrl}
            alt={pokemon.name}
            width={16}
            height={16}
            className="w-full h-full object-contain pixelated"
            style={{ imageRendering: 'pixelated' }}
            unoptimized
          />
        </div>
        <span
          className={cn(
            'text-[9px] md:text-[10px] font-medium text-center leading-tight max-w-[50px] truncate',
            isCurrent && 'text-primary font-bold',
          )}
        >
          {formatPokemonName(pokemon.name)}
        </span>
        {pokemon.formName !== 'plain' && (
          <span className="text-[7px] md:text-[8px] text-muted-foreground capitalize">
            {pokemon.formName}
          </span>
        )}
      </Link>
    </div>
  );
}

export function EvolutionChainDisplay({
  chain,
  currentPokemon,
  currentForm = 'plain',
}: EvolutionChainDisplayProps) {
  if (!chain || chain.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4 text-sm">
        This Pokémon does not evolve.
      </div>
    );
  }

  const allPokemon = getAllChainPokemon(chain);

  // If only one Pokemon, it doesn't evolve
  if (allPokemon.length <= 1) {
    return (
      <div className="text-center text-muted-foreground py-4 text-sm">
        This Pokémon does not evolve.
      </div>
    );
  }

  const { allStages, rootStages } = buildEvolutionTree(chain);

  // Check if ANY stage in the chain has branching (multiple evolutions)
  const hasBranching = Array.from(allStages.values()).some((stage) => stage.evolvesTo.length > 1);

  // For multi-stage chains with branching at a later stage (like Pichu -> Pikachu -> Raichu/Alolan Raichu)
  // We need a different display approach
  if (hasBranching) {
    // Find the stage that has branching
    const branchingStage = Array.from(allStages.values()).find(
      (stage) => stage.evolvesTo.length > 1,
    );
    const root = rootStages[0];

    if (!root || !branchingStage) {
      return null;
    }

    // Check if root IS the branching stage (simple case like Eevee or Exeggcute)
    const rootKey = `${root.pokemon.name}|${root.pokemon.formName}`;
    const branchKey = `${branchingStage.pokemon.name}|${branchingStage.pokemon.formName}`;
    const rootIsBranching = rootKey === branchKey;

    if (rootIsBranching) {
      // Simple branching: root evolves into multiple forms
      const isCurrent =
        root.pokemon.name.toLowerCase() === currentPokemon.toLowerCase() &&
        (root.pokemon.formName === currentForm || root.pokemon.formName === 'plain');

      return (
        <div className="flex flex-col items-center gap-2 py-2 w-full overflow-hidden">
          <PokemonCard pokemon={root.pokemon} isCurrent={isCurrent} />
          <div className="flex items-center gap-1 text-muted-foreground">
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
          <div className="flex flex-wrap justify-center gap-1 w-full overflow-hidden">
            {root.evolvesTo.map((evo) => {
              const evoCurrent =
                evo.pokemon.name.toLowerCase() === currentPokemon.toLowerCase() &&
                evo.pokemon.formName === currentForm;

              return (
                <div
                  key={`${evo.pokemon.name}-${evo.pokemon.formName}`}
                  className="flex flex-col items-center"
                >
                  <PokemonCard pokemon={evo.pokemon} isCurrent={evoCurrent} />
                  <div className="text-[7px] md:text-[8px] text-muted-foreground text-center max-w-[60px] leading-tight mt-0.5">
                    {evo.methods.slice(0, 1).map((m, i) => (
                      <div key={i}>{formatEvolutionMethod(m)}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Multi-stage branching: root -> middle -> branches (like Pichu -> Pikachu -> Raichu forms)
      // Show: Root -> Middle Stage -> Branches
      const rootCurrent =
        root.pokemon.name.toLowerCase() === currentPokemon.toLowerCase() &&
        (root.pokemon.formName === currentForm || root.pokemon.formName === 'plain');

      const middleCurrent =
        branchingStage.pokemon.name.toLowerCase() === currentPokemon.toLowerCase() &&
        (branchingStage.pokemon.formName === currentForm ||
          branchingStage.pokemon.formName === 'plain');

      // Get the method from root to middle
      const rootToMiddleMethods =
        root.evolvesTo.find(
          (e) =>
            e.pokemon.name === branchingStage.pokemon.name &&
            e.pokemon.formName === branchingStage.pokemon.formName,
        )?.methods || [];

      return (
        <div className="flex flex-col items-center gap-2 py-2 w-full overflow-hidden">
          {/* Root Pokemon */}
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <PokemonCard pokemon={root.pokemon} isCurrent={rootCurrent} />
            <div className="flex flex-col items-center gap-0.5 mx-1">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              {rootToMiddleMethods.length > 0 && (
                <div className="text-[8px] md:text-[9px] text-muted-foreground text-center max-w-[50px] leading-tight">
                  {formatEvolutionMethod(rootToMiddleMethods[0])}
                </div>
              )}
            </div>
            <PokemonCard pokemon={branchingStage.pokemon} isCurrent={middleCurrent} />
          </div>

          {/* Arrow indicating multiple evolutions */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <ChevronRight className="w-3 h-3 rotate-90" />
          </div>

          {/* Evolution targets in a wrapped grid */}
          <div className="flex flex-wrap justify-center gap-1 w-full overflow-hidden">
            {branchingStage.evolvesTo.map((evo) => {
              const evoCurrent =
                evo.pokemon.name.toLowerCase() === currentPokemon.toLowerCase() &&
                evo.pokemon.formName === currentForm;

              return (
                <div
                  key={`${evo.pokemon.name}-${evo.pokemon.formName}`}
                  className="flex flex-col items-center"
                >
                  <PokemonCard pokemon={evo.pokemon} isCurrent={evoCurrent} />
                  <div className="text-[7px] md:text-[8px] text-muted-foreground text-center max-w-[60px] leading-tight mt-0.5">
                    {evo.methods.slice(0, 1).map((m, i) => (
                      <div key={i}>{formatEvolutionMethod(m)}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // Linear display for simple evolution chains (no branching)
  // Build a linear sequence from root to final form(s)
  const linearSequence: {
    pokemon: EvolutionChainMember;
    methods: { action: string; parameter?: string | number }[];
  }[] = [];

  let current = rootStages[0];
  if (current) {
    linearSequence.push({ pokemon: current.pokemon, methods: [] });

    while (current.evolvesTo.length > 0) {
      const next = current.evolvesTo[0];
      linearSequence.push({ pokemon: next.pokemon, methods: next.methods });

      // Find the next stage
      const nextKey = `${next.pokemon.name}|${next.pokemon.formName}`;
      const nextStage = allStages.get(nextKey);

      if (nextStage) {
        current = nextStage;
      } else {
        break;
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 py-2 w-full overflow-hidden">
      {linearSequence.map((item, index) => {
        const isCurrent =
          item.pokemon.name.toLowerCase() === currentPokemon.toLowerCase() &&
          (item.pokemon.formName === currentForm ||
            (currentForm === 'plain' && item.pokemon.formName === 'plain'));

        return (
          <PokemonCard
            key={`${item.pokemon.name}-${item.pokemon.formName}`}
            pokemon={item.pokemon}
            isCurrent={isCurrent}
            methods={item.methods}
            showArrow={index > 0}
          />
        );
      })}
    </div>
  );
}
