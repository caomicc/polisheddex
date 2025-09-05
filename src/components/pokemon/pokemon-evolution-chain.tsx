import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';
import { PokemonSprite } from './pokemon-sprite';
import { usePokemonType } from '@/contexts/PokemonTypeContext';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { EvolutionMethod, PokemonType } from '@/types/types';
import { formatPokemonUrlWithForm } from '@/utils/pokemonFormUtils';

interface EvolutionData {
  methods: EvolutionMethod[];
  chain: string[];
  chainWithMethods: Record<string, EvolutionMethod[]>;
  faithfulMethods?: EvolutionMethod[];
  updatedMethods?: EvolutionMethod[];
  faithfulChainWithMethods?: Record<string, EvolutionMethod[]>;
  updatedChainWithMethods?: Record<string, EvolutionMethod[]>;
}

interface Props {
  evolutionData: EvolutionData;
  spritesByGen?: Record<string, string>;
  className?: string;
}

export function EvolutionChain({ evolutionData, spritesByGen, className }: Props) {
  const { chain, chainWithMethods, faithfulChainWithMethods, updatedChainWithMethods } =
    evolutionData;
  const { primaryType } = usePokemonType();
  const { showFaithful } = useFaithfulPreference();

  // Determine which evolution data to use based on faithful preference
  const currentChainWithMethods = showFaithful
    ? faithfulChainWithMethods || chainWithMethods
    : updatedChainWithMethods || chainWithMethods;

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

    Object.entries(currentChainWithMethods).forEach(([sourcePokemon, methods]) => {
      if (!Array.isArray(methods) || methods.length === 0 || methods.every((m) => !m)) return;

      console.log('Processing methods for', sourcePokemon, methods);

      // const formRegex = /^(.+?)(?: \((.+)\)|-(.+)-form)$/i;
      // const matches = sourcePokemon.match(formRegex);
      // let sourceIsForm = false;
      // let sourceBaseName = sourcePokemon;
      // let sourceFormName = undefined;

      // if (matches) {
      //   sourceIsForm = true;
      //   sourceBaseName = matches[1];
      //   sourceFormName = matches[2] || matches[3];
      // }

      methods.forEach((method) => {
        if (!method) return;

        evolutionPaths.push({
          source: sourcePokemon,
          sourceForm: method.sourceForm,
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

  const { evolutionPaths } = processEvolutionData();

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
    <div className={cn('flex flex-col gap-4 flex-col-reverse justify-start', className)}>
      {evolutionPaths.map((path, index) => {
        const sourceName = path.sourceForm ? `${path.source} (${path.sourceForm})` : path.source;
        const targetName = path.targetForm ? `${path.target} (${path.targetForm})` : path.target;
        console.log(path);
        return (
          <div
            key={`${sourceName}-${targetName}-${index}`}
            className="grid grid-cols-3 gap-6 items-center"
          >
            <Link
              href={formatPokemonUrlWithForm(
                path.source,
                path.sourceForm ? path.sourceForm.toLowerCase().replace(/ form/g, '') : 'plain',
              )}
              className="table-link flex flex-col"
            >
              <PokemonSprite
                hoverAnimate={true}
                pokemonName={path.source}
                src={getSpriteUrl(path.source)}
                alt={`Sprite of Pokémon ${path.source}`}
                primaryType={primaryType as PokemonType['name']}
                form={path.sourceForm?.toLowerCase()}
                className="shadow-none"
              />
              <span className="mt-2 flex text-xs font-black text-neutral-600 dark:text-neutral-200 capitalize leading-none">
                {sourceName}
              </span>
            </Link>
            {(() => {
              // Use path data directly instead of getEvolutionInfo since we have all the correct data
              return (
                <div className="flex flex-col items-center min-w-[80px]">
                  <span className="text-lg">→</span>
                  <div className="text-xs text-neutral-600 dark:text-neutral-200 text-center">
                    {path.method === 'level' && typeof path.parameter === 'number' && (
                      <div>Level {path.parameter}</div>
                    )}
                    {(path.method === 'item' || path.method === 'trade') && (
                      <div className="flex flex-col items-center gap-1">
                        <p>Item:</p>
                        {(() => {
                          const itemName = String(path.parameter);
                          const itemId = getItemIdFromDisplayName(itemName);

                          const itemImage = (
                            <Image
                              src={`/sprites/items/${itemName.toLowerCase()}.png`}
                              alt={`Item: ${itemName}`}
                              width={16}
                              height={16}
                              className="rounded-xs"
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
                    {path.method === 'location' && (
                      <div>
                        <p>Level up at:</p>
                        <span>
                          {String(path.parameter)
                            .split('_')
                            .map(
                              (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                            )
                            .join(' ')}
                        </span>
                      </div>
                    )}
                    {path.method === 'happiness' && (
                      <div>
                        <p>Happiness:</p>
                        {path.parameter === 'TR_MORNDAY' && <span>(Morning/Day)</span>}
                        {path.parameter === 'TR_EVENITE' && <span>(Evening/Night)</span>}
                        {path.parameter === 'TR_ANYTIME' && <span>Anytime</span>}
                      </div>
                    )}
                    {path.method === 'stat' && (
                      <div>
                        Stat:
                        {path.parameter === 'ATK_GT_DEF' && <span> Attack &gt; Defense</span>}
                        {path.parameter === 'ATK_LT_DEF' && <span> Attack &lt; Defense</span>}
                        {path.parameter === 'ATK_EQ_DEF' && <span> Attack = Defense</span>}
                      </div>
                    )}
                    {!['level', 'item', 'location', 'happiness', 'stat', 'trade'].includes(
                      path.method,
                    ) && (
                      <div>
                        <span className="capitalize">{path.method}</span>:{' '}
                        <span className="capitalize">
                          {String(path.parameter).toLowerCase().replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            <Link
              href={formatPokemonUrlWithForm(
                path.target,
                path.targetForm ? path.targetForm.toLowerCase().replace(/ form/g, '') : 'plain',
              )}
              className="table-link flex flex-col"
            >
              <PokemonSprite
                hoverAnimate={true}
                className="shadow-none"
                pokemonName={path.target}
                src={getSpriteUrl(path.target)}
                alt={`Sprite of Pokémon ${path.target}`}
                primaryType={primaryType as PokemonType['name']}
                form={path.targetForm?.replace(/ form$/i, '').toLowerCase()}
              />
              <span className="mt-2 flex text-xs font-black text-neutral-600 dark:text-neutral-200 capitalize leading-none">
                {targetName}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
