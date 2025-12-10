'use client';

import { PokemonSprite } from './pokemon-sprite';
import { Badge } from '../ui/badge';
import { EvolutionChainStep } from '@/utils/evolution-data-server';
import Link from 'next/link';
import { PokemonType as TypeChartType, getTypeEffectiveness } from '@/data/typeChart';
import { formatMoveName } from '@/utils/stringUtils';

// Enriched ability structure from pokemon-data-loader
interface EnrichedAbility {
  id: string;
  name: string;
  description?: string;
}

// Held item structure from extraction (enriched with name)
interface HeldItem {
  id: string;
  name?: string;
  rarity: 'common' | 'rare' | 'always';
}

interface PokemonInfoTableProps {
  name: string;
  dexNo: number;
  types: string[];
  abilities: EnrichedAbility[];
  selectedForm: string;
  evolutionChain: EvolutionChainStep[][] | null;
  eggGroups?: string[];
  heldItems?: HeldItem[];
  growthRate?: string;
  genderRatio?: string;
  hatchRate?: string;
  catchRate?: number;
  baseExp?: number;
  availableForms?: string[];
}

// Format evolution method into readable text
function formatEvolutionMethod(step: EvolutionChainStep): string {
  const { action, parameter } = step.method;
  const fromName = step.from.name.charAt(0).toUpperCase() + step.from.name.slice(1);

  switch (action) {
    case 'level':
      return `Evolves from ${fromName} at Lv. ${parameter}`;
    case 'item':
      return `Evolves from ${fromName} using ${formatItemName(parameter as string)}`;
    case 'trade':
      if (parameter) {
        return `Evolves from ${fromName} when traded holding ${formatItemName(parameter as string)}`;
      }
      return `Evolves from ${fromName} when traded`;
    case 'friendship':
      return `Evolves from ${fromName} with high friendship`;
    case 'friendshipDay':
      return `Evolves from ${fromName} with high friendship (Day)`;
    case 'friendshipNight':
      return `Evolves from ${fromName} with high friendship (Night)`;
    case 'levelDay':
      return `Evolves from ${fromName} at Lv. ${parameter} (Day)`;
    case 'levelNight':
      return `Evolves from ${fromName} at Lv. ${parameter} (Night)`;
    case 'levelMale':
      return `Evolves from ${fromName} at Lv. ${parameter} (Male)`;
    case 'levelFemale':
      return `Evolves from ${fromName} at Lv. ${parameter} (Female)`;
    case 'levelMove':
      return `Evolves from ${fromName} when leveled up knowing ${formatMoveName(parameter as string)}`;
    case 'levelLocation':
      return `Evolves from ${fromName} when leveled up at ${parameter}`;
    case 'levelHoldItem':
      return `Evolves from ${fromName} when leveled up holding ${formatItemName(parameter as string)}`;
    default:
      if (parameter) {
        return `Evolves from ${fromName} (${action}: ${parameter})`;
      }
      return `Evolves from ${fromName}`;
  }
}

function formatItemName(item: string): string {
  return item
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get how to obtain this Pokemon
function getObtainMethod(
  pokemonName: string,
  selectedForm: string,
  evolutionChain: EvolutionChainStep[][] | null
): string {
  if (!evolutionChain || evolutionChain.length === 0) {
    return 'Wild encounter or special event';
  }

  // Look through all chains to find how this Pokemon is obtained
  for (const chain of evolutionChain) {
    for (const step of chain) {
      // Check if this Pokemon is the "to" in any evolution step
      if (step.to.name.toLowerCase() === pokemonName.toLowerCase()) {
        // Check if form matches (or both are plain/default)
        const stepForm = step.to.formName || 'plain';
        const targetForm = selectedForm || 'plain';
        if (stepForm === targetForm || stepForm === 'plain' && targetForm === 'plain') {
          return formatEvolutionMethod(step);
        }
      }
    }
  }

  // If not found as an evolution target, it's likely a base Pokemon
  // Check if this Pokemon is at the start of any chain
  for (const chain of evolutionChain) {
    if (chain.length > 0 && chain[0].from.name.toLowerCase() === pokemonName.toLowerCase()) {
      return 'Wild encounter or starter Pokemon';
    }
  }

  return 'Wild encounter or special event';
}

// Format growth rate into readable text
function formatGrowthRate(growthRate: string): string {
  const rateMap: Record<string, string> = {
    growthfast: 'Fast',
    growthmediumfast: 'Medium Fast',
    growthmediumslow: 'Medium Slow',
    growthslow: 'Slow',
    growtherratic: 'Erratic',
    growthfluctuating: 'Fluctuating',
  };
  return rateMap[growthRate.toLowerCase()] || growthRate.replace('growth', '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Format form name into readable text
// All Pokemon types for effectiveness calculation
const ALL_TYPES: TypeChartType[] = [
  'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE', 'FIGHTING', 'POISON',
  'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY',
];

// Calculate defensive effectiveness against all types
function getDefensiveEffectiveness(defTypes: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const attackType of ALL_TYPES) {
    let multiplier = 1;
    for (const defType of defTypes) {
      const effectiveness = getTypeEffectiveness(attackType, defType.toUpperCase() as TypeChartType);
      multiplier *= effectiveness;
    }
    result[attackType] = multiplier;
  }
  return result;
}

function formatFormName(form: string): string {
  if (form === 'plain') return 'Normal';
  return form.charAt(0).toUpperCase() + form.slice(1).replace(/([a-z])([A-Z])/g, '$1 $2');
}

function formatGenderRatio(ratio: string): string {
  if (ratio === 'unknown') return 'Genderless';
  if (ratio === '0') return '100% Male';
  if (ratio === '100') return '100% Female';
  const femalePercent = parseFloat(ratio);
  const malePercent = 100 - femalePercent;
  return `${malePercent}% Male, ${femalePercent}% Female`;
}

function formatHatchRate(rate: string): string {
  const rateMap: Record<string, string> = {
    fastest: 'Fastest (5 cycles)',
    faster: 'Faster (10 cycles)',
    fast: 'Fast (15 cycles)',
    mediumfast: 'Medium Fast (20 cycles)',
    mediumslow: 'Medium Slow (25 cycles)',
    slow: 'Slow (30 cycles)',
    slower: 'Slower (35 cycles)',
    slowest: 'Slowest (40 cycles)',
    unknown: 'Unknown',
  };
  return rateMap[rate.toLowerCase()] || rate;
}

export function PokemonInfoTable({
  name,
  dexNo,
  types,
  abilities,
  selectedForm,
  evolutionChain,
  eggGroups = [],
  heldItems = [],
  growthRate,
  genderRatio,
  hatchRate,
  catchRate,
  baseExp,
  availableForms = [],
}: PokemonInfoTableProps) {
  const obtainMethod = getObtainMethod(name, selectedForm, evolutionChain);

  // Calculate type effectiveness
  const effectiveness = getDefensiveEffectiveness(types);
  const weaknesses = ALL_TYPES.filter((type) => effectiveness[type] > 1);
  const resistances = ALL_TYPES.filter((type) => effectiveness[type] < 1 && effectiveness[type] > 0);
  const immunities = ALL_TYPES.filter((type) => effectiveness[type] === 0);

  return (
    <div className="info-table-wrapper">
      {/* Sprite Header */}
      <div className="text-center p-4 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
        {/* Sprite Grid: Front and Back sprites for Normal and Shiny, static and animated */}
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {/* Front Sprites Row */}
          <div>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-2 block">Front</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Normal Front */}
              <div className="flex flex-col items-center gap-1">
                <PokemonSprite
                  form={selectedForm}
                  pokemonName={name}
                  variant="normal"
                  type="static"
                  className="shadow-none w-16 h-16 md:w-20 md:h-20"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Normal</span>
              </div>
              {/* Shiny Front */}
              <div className="flex flex-col items-center gap-1">
                <PokemonSprite
                  form={selectedForm}
                  pokemonName={name}
                  variant="shiny"
                  type="static"
                  className="shadow-none w-16 h-16 md:w-20 md:h-20"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Shiny</span>
              </div>
              {/* Animated Normal Front */}
              <div className="flex flex-col items-center gap-1">
                <PokemonSprite
                  form={selectedForm}
                  pokemonName={name}
                  variant="normal"
                  type="animated"
                  className="shadow-none w-16 h-16 md:w-20 md:h-20"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Animated</span>
              </div>
              {/* Animated Shiny Front */}
              <div className="flex flex-col items-center gap-1">
                <PokemonSprite
                  form={selectedForm}
                  pokemonName={name}
                  variant="shiny"
                  type="animated"
                  className="shadow-none w-16 h-16 md:w-20 md:h-20"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Shiny Animated</span>
              </div>
            </div>
          </div>

          {/* Back Sprites Row */}
          <div>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-2 block">Back</span>
            <div className="grid grid-cols-2 gap-4 max-w-[200px] mx-auto">
              {/* Normal Back */}
              <div className="flex flex-col items-center gap-1">
                <PokemonSprite
                  form={selectedForm}
                  pokemonName={name}
                  variant="normal"
                  type="static"
                  facing="back"
                  className="shadow-none w-16 h-16 md:w-20 md:h-20"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Normal</span>
              </div>
              {/* Shiny Back */}
              <div className="flex flex-col items-center gap-1">
                <PokemonSprite
                  form={selectedForm}
                  pokemonName={name}
                  variant="shiny"
                  type="static"
                  facing="back"
                  className="shadow-none w-16 h-16 md:w-20 md:h-20"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Shiny</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Rows */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {/* Type */}
        <div className="info-row">
          <div className="info-row-label">Type</div>
          <div className="info-row-value">
            <div className="flex gap-1 flex-wrap">
              {types.map((type) => (
                <Badge key={type} variant={type.toLowerCase() as any}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* National Dex */}
        <div className="info-row">
          <div className="info-row-label">Dex</div>
          <div className="info-row-value">#{dexNo.toString().padStart(3, '0')}</div>
        </div>

        {/* Location / How to Obtain */}
        <div className="info-row">
          <div className="info-row-label">Best obtain method</div>
          <div className="info-row-value">{obtainMethod}</div>
        </div>

        {/* Abilities */}
        {abilities.length > 0 && (
          <div className="info-row">
            <div className="info-row-label">Abilities</div>
            <div className="info-row-value">
              <div className="flex flex-col gap-3">
                {abilities.map((ability, index) => {
                  const abilityName = ability.name || ability.id || '';
                  const abilityId = ability.id || ability.name || '';
                  const abilityDescription = ability.description || '';
                  const abilityType = index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Hidden';

                  return (
                    <div key={index} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/abilities/${abilityId}`}
                          className="table-link capitalize"
                        >
                          {abilityName.replace(/([a-z])([A-Z])/g, '$1 $2')}
                        </Link>
                        {abilities.length > 1 && (
                          <span className="text-xs text-neutral-500">({abilityType})</span>
                        )}
                      </div>
                      {abilityDescription && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {abilityDescription}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Growth Rate */}
        <div className="info-row">
          <div className="info-row-label">Growth Rate</div>
          <div className="info-row-value">{growthRate ? formatGrowthRate(growthRate) : 'Unknown'}</div>
        </div>

        {/* Gender */}
        <div className="info-row">
          <div className="info-row-label">Gender Ratio</div>
          <div className="info-row-value">{genderRatio !== undefined ? formatGenderRatio(genderRatio) : 'Unknown'}</div>
        </div>

        {/* Egg Groups */}
        <div className="info-row">
          <div className="info-row-label">Egg Groups</div>
          <div className="info-row-value capitalize">{eggGroups.length > 0 ? eggGroups.join(', ') : 'Unknown'}</div>
        </div>

        {/* Hatch Rate */}
        <div className="info-row">
          <div className="info-row-label">Hatch Rate</div>
          <div className="info-row-value">{hatchRate ? formatHatchRate(hatchRate) : 'Unknown'}</div>
        </div>

        {/* Catch Rate */}
        <div className="info-row">
          <div className="info-row-label">Catch Rate</div>
          <div className="info-row-value">{catchRate !== undefined ? catchRate : 'Unknown'}</div>
        </div>

        {/* Base Experience */}
        <div className="info-row">
          <div className="info-row-label">Base Exp</div>
          <div className="info-row-value">{baseExp !== undefined ? baseExp : 'Unknown'}</div>
        </div>

        {/* Wild Held Items */}
        <div className="info-row">
          <div className="info-row-label">Wild Held Items</div>
          <div className="info-row-value">
            {heldItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {heldItems.map((item, index) => (
                  <Link
                    key={`${item.id}-${index}`}
                    href={`/items/${item.id}`}
                    className="inline-flex items-center gap-1 table-link"
                  >
                    <span>{item.name || formatItemName(item.id)}</span>
                    <span className="text-xs text-neutral-500">
                      ({item.rarity === 'always' ? '100%' : item.rarity === 'common' ? '25%' : '5%'})
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-neutral-500">None</span>
            )}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="info-row">
          <div className="info-row-label">Weak To</div>
          <div className="info-row-value">
            <div className="flex gap-1 flex-wrap">
              {weaknesses.length === 0 ? (
                <span className="text-neutral-500">None</span>
              ) : (
                weaknesses.map((type) => (
                  <Badge key={type} variant={type.toLowerCase() as any} className="text-xs">
                    {type} ×{effectiveness[type]}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Resistances */}
        <div className="info-row">
          <div className="info-row-label">Resists</div>
          <div className="info-row-value">
            <div className="flex gap-1 flex-wrap">
              {resistances.length === 0 ? (
                <span className="text-neutral-500">None</span>
              ) : (
                resistances.map((type) => (
                  <Badge key={type} variant={type.toLowerCase() as any} className="text-xs">
                    {type} ×{effectiveness[type]}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Immunities */}
        {immunities.length > 0 && (
          <div className="info-row">
            <div className="info-row-label">Immune To</div>
            <div className="info-row-value">
              <div className="flex gap-1 flex-wrap">
                {immunities.map((type) => (
                  <Badge key={type} variant={type.toLowerCase() as any} className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Available Forms */}
        {availableForms.length > 1 && (
          <div className="info-row">
            <div className="info-row-label">Forms</div>
            <div className="info-row-value">{availableForms.map(formatFormName).join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
