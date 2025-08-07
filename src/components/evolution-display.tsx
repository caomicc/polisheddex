'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EvolutionMethod {
  method: string;
  parameter: string | number;
  target: string;
  form?: string;
}

interface EvolutionData {
  methods: EvolutionMethod[];
  chain: string[];
  chainWithMethods: Record<string, EvolutionMethod[]>;
  faithfulMethods?: EvolutionMethod[];
  faithfulChainWithMethods?: Record<string, EvolutionMethod[]>;
  updatedMethods?: EvolutionMethod[];
  updatedChainWithMethods?: Record<string, EvolutionMethod[]>;
}

interface EvolutionDisplayProps {
  evolution: EvolutionData;
  currentPokemon: string;
  className?: string;
}

export function EvolutionDisplay({ evolution, currentPokemon, className }: EvolutionDisplayProps) {
  const [selectedVersion, setSelectedVersion] = useState<'default' | 'faithful' | 'updated'>(
    'default',
  );

  // Determine which data to use based on selected version
  const getEvolutionData = () => {
    switch (selectedVersion) {
      case 'faithful':
        return {
          chain: evolution.chain,
          chainWithMethods: evolution.faithfulChainWithMethods || evolution.chainWithMethods,
        };
      case 'updated':
        return {
          chain: evolution.chain,
          chainWithMethods: evolution.updatedChainWithMethods || evolution.chainWithMethods,
        };
      default:
        return {
          chain: evolution.chain,
          chainWithMethods: evolution.chainWithMethods,
        };
    }
  };

  const { chain, chainWithMethods } = getEvolutionData();

  // Check if there are version differences
  const hasVersionDifferences =
    evolution.faithfulChainWithMethods || evolution.updatedChainWithMethods;

  const formatMethod = (method: EvolutionMethod) => {
    switch (method.method) {
      case 'EVOLVE_LEVEL':
        return `Level ${method.parameter}`;
      case 'EVOLVE_ITEM':
        return `Use ${method.parameter}`;
      case 'EVOLVE_LOCATION':
        return `At ${method.parameter}`;
      case 'EVOLVE_HAPPINESS':
        return `High Happiness`;
      case 'EVOLVE_TRADE':
        return `Trade`;
      default:
        return `${method.method} ${method.parameter}`;
    }
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Evolution</h3>

        {hasVersionDifferences && (
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setSelectedVersion('default')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                selectedVersion === 'default'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Default
            </button>
            {evolution.faithfulChainWithMethods && (
              <button
                onClick={() => setSelectedVersion('faithful')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  selectedVersion === 'faithful'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Faithful
              </button>
            )}
            {evolution.updatedChainWithMethods && (
              <button
                onClick={() => setSelectedVersion('updated')}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  selectedVersion === 'updated'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Updated
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {chain.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            {chain.map((pokemon, index) => (
              <div key={pokemon} className="flex items-center gap-2">
                <div
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium',
                    pokemon.toLowerCase() === currentPokemon.toLowerCase()
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-card-foreground border-border',
                  )}
                >
                  {pokemon}
                </div>

                {index < chain.length - 1 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xs text-muted-foreground">
                      {chainWithMethods[pokemon]?.map((method, methodIndex) => (
                        <div key={methodIndex} className="text-center">
                          {formatMethod(method)}
                        </div>
                      ))}
                    </div>
                    <div className="text-muted-foreground">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">This Pokémon does not evolve.</div>
        )}

        {/* Show evolution methods for current pokemon */}
        {chainWithMethods[currentPokemon]?.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Evolution Methods:</h4>
            <div className="space-y-1">
              {chainWithMethods[currentPokemon].map((method, index) => (
                <div key={index} className="text-sm">
                  Evolves into <span className="font-medium">{method.target}</span> →{' '}
                  {formatMethod(method)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
