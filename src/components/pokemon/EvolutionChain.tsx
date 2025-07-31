import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';

interface EvolutionMethod {
  method: string;
  parameter: string | number | null;
  target: string;
  form?: string;
}

interface EvolutionData {
  methods: EvolutionMethod[];
  chain: string[];
  chainWithMethods: Record<string, EvolutionMethod[]>;
}

interface Props {
  evolutionData: EvolutionData;
  spritesByGen?: Record<string, string>;
  className?: string;
}

export function EvolutionChain({ evolutionData, spritesByGen, className }: Props) {
  const { chain, chainWithMethods } = evolutionData;

  const formatMethod = (method: string) => method.replace('EVOLVE_', '').toLowerCase();

  const processEvolutionData = () => {
    const chainWithForms = [...chain];
    const evolutionPaths: Array<{
      source: string;
      target: string;
      targetForm?: string;
      method: string;
      parameter: string | number | null;
      sourceForm?: string;
    }> = [];

    const addedFormVariants = new Set<string>();

    Object.entries(chainWithMethods).forEach(([sourcePokemon, methods]) => {
      if (!Array.isArray(methods) || methods.length === 0 || methods.every((m) => !m)) return;

      const formRegex = /^(.+?)(?: \((.+)\)|-(.+)-form)$/i;
      const matches = sourcePokemon.match(formRegex);
      let sourceIsForm = false;
      let sourceBaseName = sourcePokemon;
      let sourceFormName = undefined;

      if (matches) {
        sourceIsForm = true;
        sourceBaseName = matches[1];
        sourceFormName = matches[2] || matches[3];
      }

      methods.forEach((method) => {
        if (!method) return;

        evolutionPaths.push({
          source: sourceIsForm ? sourceBaseName : sourcePokemon,
          sourceForm: sourceFormName,
          target: method.target.toLowerCase(),
          targetForm: method.form,
          method: formatMethod(method.method),
          parameter: method.parameter,
        });
      });
    });

    const pokemonWithForms: Record<string, Array<string>> = {};

    evolutionPaths.forEach((path) => {
      if (path.targetForm) {
        if (!pokemonWithForms[path.target]) pokemonWithForms[path.target] = [];
        if (!pokemonWithForms[path.target].includes(path.targetForm)) {
          pokemonWithForms[path.target].push(path.targetForm);
        }
      }
    });

    const enhancedChain: string[] = [];

    for (let i = 0; i < chainWithForms.length; i++) {
      const pokemon = chainWithForms[i];
      const normalized = pokemon.toLowerCase();
      enhancedChain.push(pokemon);

      if (pokemonWithForms[normalized]) {
        pokemonWithForms[normalized].forEach((form) => {
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

  console.log('Evolution Chain Data:', {
    chainWithForms,
    evolutionPaths,
  });

  const getEvolutionInfo = (fromPokemon: string, toPokemon: string) => {
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

    const isToFormVariant = toPokemon.includes('(') && toPokemon.includes(')');
    let baseToPokemon = toPokemon;
    let toFormName = '';

    if (isToFormVariant) {
      const matches = toPokemon.match(/^(.+) \((.+)\)$/);
      if (matches) {
        baseToPokemon = matches[1];
        toFormName = matches[2];
      }
    }

    const path = evolutionPaths.find((p) => {
      const sourceMatches =
        p.source.toLowerCase() === baseFromPokemon.toLowerCase() &&
        (!isFromFormVariant || p.sourceForm === fromFormName);

      const targetMatches =
        p.target.toLowerCase() === baseToPokemon.toLowerCase() &&
        (!isToFormVariant || p.targetForm === toFormName);

      return sourceMatches && targetMatches;
    });

    if (!path) return null;

    return {
      methodName: path.method,
      parameter: path.parameter,
      form: path.targetForm,
    };
  };

  const getSpriteUrl = (name: string) => {
    if (name.includes('(') && name.includes(')')) {
      const matches = name.match(/^(.+) \((.+)\)$/);
      if (matches) {
        const baseName = matches[1];
        const formName = matches[2].replace(/ form$/i, '').toLowerCase();
        if (spritesByGen?.[name]) return spritesByGen[name];
        if (formName === 'plain') {
          return `/sprites/pokemon/${baseName.toLowerCase().replace(/-/g, '_')}/normal_front.png`;
        }
        return `/sprites/pokemon/${baseName.toLowerCase().replace(/-/g, '_')}_${formName}/normal_front.png`;
      }
    }

    const normalized = name.includes('-') ? name.replace(/-/g, '_') : name;
    return (
      spritesByGen?.[name] ||
      `/sprites/pokemon/${normalized.toLowerCase().replace(/-/g, '_')}/normal_front.png`
    );
  };

  return (
    <div className={cn('flex flex-col gap-4 items-center', className)}>
      <div className="flex flex-col items-center justify-center gap-2">
        {evolutionPaths.map((path, index) => {
          const sourceName = path.sourceForm ? `${path.source} (${path.sourceForm})` : path.source;
          const targetName = path.targetForm ? `${path.target} (${path.targetForm})` : path.target;

          return (
            <div
              className="flex flex-row items-center justify-center"
              key={`${sourceName}-${targetName}-${index}`}
            >
              <Link
                href={`/pokemon/${sourceName.includes('(') ? sourceName.split(' (')[0] : sourceName}${
                  path.sourceForm && path.sourceForm.toLowerCase() !== 'plain form'
                    ? `?form=${encodeURIComponent(path.sourceForm.replace(/ form$/i, '').toLowerCase())}`
                    : ''
                }`}
                className={`dark:bg-white p-2 w-12 md:w-20 rounded-xl text-center shadow-sm`}
              >
                {/* This is for debugging purposes, you can remove it */}
                <img
                  className="mx-auto relative"
                  src={getSpriteUrl(sourceName)}
                  alt={`Sprite of Pokémon ${sourceName}`}
                />
                <span className="text-xs font-bold text-muted-foreground capitalize leading-none dark:text-black">
                  {sourceName}
                </span>
              </Link>
              {(() => {
                const evolutionInfo = getEvolutionInfo(sourceName, targetName);
                if (!evolutionInfo) {
                  return (
                    <span>
                      {sourceName} → {targetName} ({path.method})
                    </span>
                  );
                }

                return (
                  <div className="flex flex-col items-center mx-2 min-w-[80px]">
                    <span className="text-lg">→</span>
                    <div className="text-xs text-gray-600 text-center">
                      {evolutionInfo.methodName === 'item' && (
                        <div className="flex flex-col items-center gap-1">
                          <p>Item:</p>
                          {(() => {
                            const itemName = String(evolutionInfo.parameter);
                            const itemId = getItemIdFromDisplayName(itemName);

                            const itemImage = (
                              <Image
                                src={`/sprites/items/${itemName.toLowerCase()}.png`}
                                alt={`Item: ${itemName}`}
                                width={16}
                                height={16}
                              />
                            );

                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {itemId ? (
                                    <Link
                                      href={`/items/${itemId}`}
                                      className="hover:scale-110 transition-transform duration-200"
                                    >
                                      {itemImage}
                                    </Link>
                                  ) : (
                                    <div>{itemImage}</div>
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {itemId ? (
                                    <span>
                                      {itemName}{' '}
                                      <span className="text-xs opacity-75">(click to view)</span>
                                    </span>
                                  ) : (
                                    itemName
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                        </div>
                      )}
                      {evolutionInfo.methodName === 'happiness' && (
                        <div>
                          <p>Happiness:</p>
                          {evolutionInfo.parameter === 'TR_MORNDAY' && <span>(Morning/Day)</span>}
                          {evolutionInfo.parameter === 'TR_EVENITE' && <span>(Evening/Night)</span>}
                          {evolutionInfo.parameter === 'TR_ANYTIME' && <span>Anytime</span>}
                        </div>
                      )}
                      {evolutionInfo.methodName === 'stat' && (
                        <div>
                          Stat:
                          {evolutionInfo.parameter === 'ATK_GT_DEF' && (
                            <span> Attack &gt; Defense</span>
                          )}
                          {evolutionInfo.parameter === 'ATK_LT_DEF' && (
                            <span> Attack &lt; Defense</span>
                          )}
                          {evolutionInfo.parameter === 'ATK_EQ_DEF' && (
                            <span> Attack = Defense</span>
                          )}
                        </div>
                      )}
                      {typeof evolutionInfo.parameter !== 'number' &&
                        evolutionInfo.parameter &&
                        !['item', 'happiness', 'stat'].includes(evolutionInfo.methodName) && (
                          <div>{String(evolutionInfo.parameter)}</div>
                        )}
                      {typeof evolutionInfo.parameter === 'number' && (
                        <div>level {evolutionInfo.parameter}</div>
                      )}
                    </div>
                  </div>
                );
              })()}
              <Link
                href={`/pokemon/${targetName.includes('(') ? targetName.split(' (')[0] : targetName}${
                  path.targetForm && path.targetForm.toLowerCase() !== 'plain form'
                    ? `?form=${encodeURIComponent(path.targetForm.replace(/ form$/i, '').toLowerCase())}`
                    : ''
                }`}
                className="dark:bg-white p-2 w-12 md:w-20 rounded-xl text-center"
              >
                {/* This is for debugging purposes, you can remove it */}
                <img
                  className="mx-auto relative"
                  src={getSpriteUrl(targetName)}
                  alt={`Sprite of Pokémon ${targetName}`}
                />
                <span className="text-xs font-bold text-muted-foreground capitalize leading-none dark:text-black">
                  {targetName}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
