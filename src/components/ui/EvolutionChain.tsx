import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { EvolutionChainProps, EvolutionMethod } from '@/types/types';
import { Card } from './card';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

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

  // Process evolution data to include forms
  const processEvolutionData = () => {
    if (!chainWithMethods) return { chainWithForms: chain, evolutionPaths: [] };

    // Start with the base chain
    const chainWithForms = [...chain];
    const evolutionPaths: Array<{
      source: string;
      target: string;
      targetForm?: string;
      method: string;
      parameter: string | number | null;
      sourceForm?: string; // Added to track if this is coming from a specific form
    }> = [];

    // Keep track of form variants we've already added
    const addedFormVariants = new Set<string>();

    // First pass: collect all evolution paths
    Object.entries(chainWithMethods).forEach(([sourcePokemon, methods]) => {
      // Check if sourcePokemon is a form variant
      const sourceIsForm = sourcePokemon.includes('(') && sourcePokemon.includes(')');
      let sourceBaseName = sourcePokemon;
      let sourceFormName = undefined;

      if (sourceIsForm) {
        const matches = sourcePokemon.match(/^(.+) \((.+)\)$/);
        if (matches) {
          sourceBaseName = matches[1];
          sourceFormName = matches[2];
        }
      }

      // For each evolution method
      methods.forEach((method) => {
        const target = method.target;

        // Add path information for every evolution method
        evolutionPaths.push({
          source: sourceIsForm ? sourceBaseName : sourcePokemon,
          sourceForm: sourceFormName,
          target,
          targetForm: method.form,
          method: formatMethod(method.method),
          parameter: method.parameter,
        });
      });
    });

    // Second pass: Build enhanced chain with form variants
    // Start by identifying which Pokemon have form variants
    const pokemonWithForms: Record<string, Array<string>> = {};

    evolutionPaths.forEach((path) => {
      if (path.targetForm) {
        if (!pokemonWithForms[path.target]) {
          pokemonWithForms[path.target] = [];
        }
        if (!pokemonWithForms[path.target].includes(path.targetForm)) {
          pokemonWithForms[path.target].push(path.targetForm);
        }
      }
    });

    // Build the enhanced chain
    const enhancedChain: string[] = [];

    // Process each Pokemon in the original chain
    for (let i = 0; i < chainWithForms.length; i++) {
      const pokemon = chainWithForms[i];
      enhancedChain.push(pokemon); // Add the base Pokemon

      // If this Pokemon has forms, add them right after the base form
      if (pokemonWithForms[pokemon]) {
        pokemonWithForms[pokemon].forEach((form) => {
          // Skip "Plain Form" as it's redundant with the base form
          if (form === 'Plain Form') return;

          const formVariant = `${pokemon} (${form})`;
          if (!addedFormVariants.has(formVariant)) {
            enhancedChain.push(formVariant);
            addedFormVariants.add(formVariant);
          }
        });
      }
    }

    return { chainWithForms: enhancedChain, evolutionPaths };
  };

  const { chainWithForms, evolutionPaths } = processEvolutionData();

  // Function to get the evolution method between two Pokémon
  const getEvolutionInfo = (fromPokemon: string, toPokemon: string) => {
    // Check if fromPokemon is a form variant
    const isFromFormVariant = fromPokemon.includes('(') && fromPokemon.includes(')');
    let baseFromPokemon = fromPokemon;
    let fromFormName = '';

    if (isFromFormVariant) {
      const matches = fromPokemon.match(/^(.+) \((.+)\)$/);
      if (matches) {
        baseFromPokemon = matches[1];
        fromFormName = matches[2];
      }
    }

    // Check if toPokemon is a form variant (contains parentheses)
    const isToFormVariant = toPokemon.includes('(') && toPokemon.includes(')');
    let baseToPokemon = toPokemon;
    let toFormName = '';

    if (isToFormVariant) {
      // Extract base name and form
      const matches = toPokemon.match(/^(.+) \((.+)\)$/);
      if (matches) {
        baseToPokemon = matches[1];
        toFormName = matches[2];
      }
    }

    // Special case for form-to-form evolution
    if (baseFromPokemon === baseToPokemon && isFromFormVariant && isToFormVariant) {
      // This is a form variant evolution, like "Raichu (Plain Form)" to "Raichu (Alolan Form)"
      // Look for the original evolution method from the base form
      for (const path of evolutionPaths) {
        if (path.target === baseToPokemon && path.targetForm === toFormName) {
          return {
            methodName: path.method,
            parameter: path.parameter,
            form: path.targetForm,
          };
        }
      }
    }

    // Find matching path - check both normal and with sourceForm
    const path = evolutionPaths.find((p: any) => {
      // Direct match from source to target
      if (p.source === baseFromPokemon && p.target.toLowerCase() === baseToPokemon.toLowerCase()) {
        // If the target is a form variant, match the specific form
        if (isToFormVariant) {
          return p.targetForm === toFormName;
        }
        // If the source is a form variant, we need to match the sourceForm
        else if (isFromFormVariant) {
          return p.sourceForm === fromFormName;
        }
        // Regular match without forms
        else {
          return !p.targetForm || p.targetForm === 'Plain Form';
        }
      }
      return false;
    });

    if (!path) {
      // If no direct match, try to find any path to this Pokémon
      const fallbackPath = evolutionPaths.find((p: any) => {
        if (p.target.toLowerCase() === baseToPokemon.toLowerCase()) {
          // If the target is a form variant, match the specific form
          if (isToFormVariant) {
            return p.targetForm === toFormName;
          } else {
            return !p.targetForm || p.targetForm === 'Plain Form';
          }
        }
        return false;
      });

      return fallbackPath
        ? {
            methodName: fallbackPath.method,
            parameter: fallbackPath.parameter,
            form: fallbackPath.targetForm,
          }
        : null;
    }

    return {
      methodName: path.method,
      parameter: path.parameter,
      form: path.targetForm,
    };
  };

  // Function to get sprite URL for a Pokémon (handling form variants)
  const getSpriteUrl = (name: string) => {
    // Check if name includes form information
    if (name.includes('(') && name.includes(')')) {
      const matches = name.match(/^(.+) \((.+)\)$/);
      if (matches) {
        console.log(`Processing form variant: ${name}`);
        const baseName = matches[1];
        const formName = matches[2].replace(/ form$/i, '').toLowerCase();

        // Try to get sprite from spritesByGen first
        if (spritesByGen && spritesByGen[name]) return spritesByGen[name];

        console.log(`baseName.toLowerCase()`, baseName.toLowerCase());

        // Otherwise construct path with form
        return `/sprites/pokemon/${baseName.toLowerCase()}_${formName}/front_cropped.png`;
      }
    }

    // Regular Pokémon
    return (
      (spritesByGen && spritesByGen[name]) ||
      `/sprites/pokemon/${name.toLowerCase()}/front_cropped.png`
    );
  };

  return (
    <div className={cn('flex flex-wrap gap-4 items-center', className)}>
      {chainWithForms.map((name, i) => (
        <React.Fragment key={name}>
          <Link href={`/pokemon/${name.includes('(') ? name.split(' (')[0] : name}`}>
            <Card className="flex flex-col items-center min-w-[150px]">
              <Image
                src={getSpriteUrl(name)}
                alt={`Sprite of Pokémon ${name}`}
                width={64}
                height={64}
                className="w-16 h-16"
              />

              {name.replace(/ Form\)$/, ')')}
            </Card>
          </Link>

          {i < chainWithForms.length - 1 && (
            <>
              <div className="flex flex-col items-center mx-1">
                <span className="text-lg mx-2">→</span>
                {chainWithForms[i + 1] && (
                  <div className="text-xs text-gray-600">
                    {(() => {
                      const evolutionInfo = getEvolutionInfo(name, chainWithForms[i + 1]);
                      if (!evolutionInfo) return null;

                      return (
                        <div className="text-center min-w-[50px]">
                          {/* <div>{evolutionInfo.methodName}</div> */}
                          {evolutionInfo.methodName === 'item' && (
                            <div className="flex flex-col items-center gap-1">
                              <p>Item:</p>
                              {/* Use Tooltip for item display */}
                              <Tooltip>
                                <TooltipTrigger>
                                  <Image
                                    src={`/sprites/items/${String(
                                      evolutionInfo.parameter,
                                    ).toLowerCase()}.png`}
                                    alt={`Item: ${evolutionInfo.parameter}`}
                                    width={16}
                                    height={16}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>{String(evolutionInfo.parameter)}</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                          {typeof evolutionInfo.parameter !== 'number' &&
                            evolutionInfo.parameter &&
                            evolutionInfo.methodName !== 'item' && (
                              <div>{String(evolutionInfo.parameter)}</div>
                            )}
                          {typeof evolutionInfo.parameter === 'number' && (
                            <div>level {evolutionInfo.parameter}</div>
                          )}
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
