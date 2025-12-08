'use client';

import { PokemonSprite } from './pokemon-sprite';
import { Badge } from '../ui/badge';
import { EvolutionChainStep } from '@/utils/evolution-data-server';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { PokemonType as TypeChartType, getTypeEffectiveness } from '@/data/typeChart';

// Enriched ability structure from pokemon-data-loader
interface EnrichedAbility {
  id: string;
  name: string;
  description?: string;
}

interface PokemonInfoTableProps {
  name: string;
  dexNo: number;
  types: string[];
  abilities: EnrichedAbility[];
  selectedForm: string;
  evolutionChain: EvolutionChainStep[][] | null;
  eggGroups?: string[];
  wildHeldItems?: string[];
  growthRate?: string;
  hasGender?: boolean;
  availableForms?: string[];
}

// Format evolution method into readable text
function formatEvolutionMethod(step: EvolutionChainStep): string {
  const { action, parameter } = step.method;

  switch (action) {
    case 'level':
      return `Evolves from ${step.from.name} at Lv. ${parameter}`;
    case 'item':
      return `Evolves from ${step.from.name} using ${formatItemName(parameter as string)}`;
    case 'trade':
      if (parameter) {
        return `Evolves from ${step.from.name} when traded holding ${formatItemName(parameter as string)}`;
      }
      return `Evolves from ${step.from.name} when traded`;
    case 'friendship':
      return `Evolves from ${step.from.name} with high friendship`;
    case 'friendshipDay':
      return `Evolves from ${step.from.name} with high friendship (Day)`;
    case 'friendshipNight':
      return `Evolves from ${step.from.name} with high friendship (Night)`;
    case 'levelDay':
      return `Evolves from ${step.from.name} at Lv. ${parameter} (Day)`;
    case 'levelNight':
      return `Evolves from ${step.from.name} at Lv. ${parameter} (Night)`;
    case 'levelMale':
      return `Evolves from ${step.from.name} at Lv. ${parameter} (Male)`;
    case 'levelFemale':
      return `Evolves from ${step.from.name} at Lv. ${parameter} (Female)`;
    case 'levelMove':
      return `Evolves from ${step.from.name} when leveled up knowing ${formatMoveName(parameter as string)}`;
    case 'levelLocation':
      return `Evolves from ${step.from.name} when leveled up at ${parameter}`;
    case 'levelHoldItem':
      return `Evolves from ${step.from.name} when leveled up holding ${formatItemName(parameter as string)}`;
    default:
      if (parameter) {
        return `Evolves from ${step.from.name} (${action}: ${parameter})`;
      }
      return `Evolves from ${step.from.name}`;
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

function formatMoveName(move: string): string {
  return move
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

export function PokemonInfoTable({
  name,
  dexNo,
  types,
  abilities,
  selectedForm,
  evolutionChain,
  eggGroups = [],
  wildHeldItems = [],
  growthRate,
  hasGender,
  availableForms = [],
}: PokemonInfoTableProps) {
  const obtainMethod = getObtainMethod(name, selectedForm, evolutionChain);

  // Calculate type effectiveness
  const effectiveness = getDefensiveEffectiveness(types);
  const weaknesses = ALL_TYPES.filter((type) => effectiveness[type] > 1);
  const resistances = ALL_TYPES.filter((type) => effectiveness[type] < 1 && effectiveness[type] > 0);
  const immunities = ALL_TYPES.filter((type) => effectiveness[type] === 0);

  return (
    <div className="w-full mx-auto md:mx-0 relative z-10 rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <Table className="w-full text-sm table-auto">
        <TableHeader>

          <TableRow>
            <TableCell className="text-center p-4 bg-neutral-50 dark:bg-neutral-900 w-full"
              colSpan={3}
            >
              {/* Sprite Grid: Normal, Shiny, Animated Normal, Animated Shiny */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md mx-auto">
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
                {/* Animated Normal */}
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
                {/* Animated Shiny */}
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
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {/* Type */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 w-[100px] align-top">
              Type
            </TableHead>
            <TableCell className="px-4 py-2">
              <div className="flex gap-1 flex-wrap">
                {types.map((type) => (
                  <Badge key={type} variant={type.toLowerCase() as any}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>


          {/* National Dex */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Dex
            </TableHead>
            <TableCell  className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              #{dexNo.toString().padStart(3, '0')}
            </TableCell>
          </TableRow>

          {/* Location / How to Obtain */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Location
            </TableHead>
            <TableCell className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {obtainMethod}
            </TableCell>
          </TableRow>

          {/* Abilities */}
          {abilities.length > 0 && (
            <>
              {abilities.map((ability, index) => {
                const abilityName = ability.name || ability.id || '';
                const abilityId = ability.id || ability.name || '';
                const abilityDescription = ability.description || '';
                const abilityType = index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Hidden';

                return (
                  <TableRow key={abilityId || index}>
                    {index === 0 && (
                      <TableHead
                        rowSpan={abilities.length}
                        className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top"
                      >
                        Abilities
                      </TableHead>
                    )}
                    <TableCell className="px-4 py-2 font-medium text-neutral-700 dark:text-neutral-200 min-w-[120px] max-w-[200px]">
                      <Link
                        href={`/abilities/${abilityId}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 capitalize"
                      >
                        {abilityName.replace(/([a-z])([A-Z])/g, '$1 $2')}
                      </Link>
                      {abilities.length > 1 && (
                        <span className="text-xs text-neutral-500 ml-1">({abilityType})</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-neutral-600 dark:text-neutral-400 text-xs">
                      {abilityDescription}
                    </TableCell>
                  </TableRow>
                );
              })}
            </>
          )}

          {/* Growth Rate */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Growth Rate
            </TableHead>
            <TableCell colSpan={2} className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {growthRate ? formatGrowthRate(growthRate) : 'Unknown'}
            </TableCell>
          </TableRow>

          {/* Gender */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Gender
            </TableHead>
            <TableCell colSpan={2} className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {hasGender !== undefined ? (hasGender ? 'Male / Female' : 'Genderless') : 'Unknown'}
            </TableCell>
          </TableRow>

          {/* Egg Groups */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Egg Groups
            </TableHead>
            <TableCell colSpan={2} className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {eggGroups.length > 0 ? eggGroups.join(', ') : 'Unknown'}
            </TableCell>
          </TableRow>

          {/* Wild Held Items */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Wild Held Items
            </TableHead>
            <TableCell colSpan={2} className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
              {wildHeldItems.length > 0 ? wildHeldItems.join(', ') : 'None'}
            </TableCell>
          </TableRow>

          {/* Weaknesses */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Weak To
            </TableHead>
            <TableCell colSpan={2} className="px-4 py-2">
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
            </TableCell>
          </TableRow>

          {/* Resistances */}
          <TableRow>
            <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
              Resists
            </TableHead>
            <TableCell colSpan={2} className="px-4 py-2">
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
            </TableCell>
          </TableRow>

          {/* Immunities */}
          {immunities.length > 0 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Immune To
              </TableHead>
              <TableCell colSpan={2} className="px-4 py-2">
                <div className="flex gap-1 flex-wrap">
                  {immunities.map((type) => (
                    <Badge key={type} variant={type.toLowerCase() as any} className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          )}


          {/* Available Forms */}
          {availableForms.length > 1 && (
            <TableRow>
              <TableHead className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-300 align-top">
                Forms
              </TableHead>
              <TableCell colSpan={2} className="px-4 py-2 text-neutral-700 dark:text-neutral-200">
                {availableForms.map(formatFormName).join(', ')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
