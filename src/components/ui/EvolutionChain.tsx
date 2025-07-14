import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { EvolutionChainProps, EvolutionMethod } from '@/types/types';
import { Card } from './card';

export function EvolutionChain({
  chain,
  chainWithMethods,
  spritesByGen,
  className,
}: EvolutionChainProps) {
  // Function to format evolution method
  const formatMethod = (method: string) => {
    return method.replace('EVOLVE_', '').toLowerCase();
  };

  // Function to get the evolution method between two Pokémon
  const getEvolutionInfo = (fromPokemon: string, toPokemon: string) => {
    if (!chainWithMethods || !chainWithMethods[fromPokemon]) return null;

    // Find the method that evolves fromPokemon to toPokemon
    const method = chainWithMethods[fromPokemon].find(
      (m) => m.target.toLowerCase() === toPokemon.toLowerCase(),
    );

    if (!method) return null;

    return {
      methodName: formatMethod(method.method),
      parameter: method.parameter,
      form: method.form,
    };
  };

  return (
    <div className={cn('flex flex-wrap gap-2 items-center', className)}>
      {chain.map((name, i) => (
        <React.Fragment key={name}>
          <Link
            href={`/pokemon/${name}`}
            className="hover:underline text-blue-700 text-sm font-mono"
          >
            <Card className="flex flex-col items-center min-w-[150px]">
              <Image
                src={
                  spritesByGen?.[name] || `/sprites/pokemon/${name.toLowerCase()}/front_cropped.png`
                }
                alt={`Sprite of Pokémon ${name}`}
                width={64}
                height={64}
                className="w-16 h-16"
              />

              {name}
            </Card>
          </Link>

          {i < chain.length - 1 && (
            <>
              <div className="flex flex-col items-center mx-1">
                <span className="text-lg mx-2">→</span>
                {chainWithMethods && chain[i + 1] && (
                  <div className="text-xs text-gray-600">
                    {(() => {
                      const evolutionInfo = getEvolutionInfo(name, chain[i + 1]);
                      if (!evolutionInfo) return null;

                      return (
                        <div className="text-center min-w-[50px]">
                          <div>{evolutionInfo.methodName}</div>
                          {typeof evolutionInfo.parameter === 'number' ? (
                            <div>level {evolutionInfo.parameter}</div>
                          ) : (
                            evolutionInfo.parameter && <div>{String(evolutionInfo.parameter)}</div>
                          )}
                          {evolutionInfo.form && <div>({evolutionInfo.form})</div>}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
