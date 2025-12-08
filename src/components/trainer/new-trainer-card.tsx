'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TrainerSprite } from './trainer-sprite';
import { PokemonSprite } from '@/components/pokemon/pokemon-sprite';
import { ComprehensiveTrainerData } from '@/types/new';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { formatMoveName } from '@/utils/stringUtils';

interface NewTrainerCardProps {
  trainer: ComprehensiveTrainerData;
  /** Which team/battle to show (matchCount). Defaults to showing first battle */
  showTeam?: number;
  /** Whether to show all teams in an accordion */
  showAllTeams?: boolean;
  /** If this is a gym leader or elite four member */
  isGymLeader?: boolean;
}

// Format trainer class for display
function formatTrainerClass(trainerClass: string): string {
  if (!trainerClass) return '';

  const classMap: Record<string, string> = {
    'youngster': 'Youngster',
    'lass': 'Lass',
    'bug_catcher': 'Bug Catcher',
    'bugcatcher': 'Bug Catcher',
    'cooltrainerm': 'Cool Trainer',
    'cooltrainerf': 'Cool Trainer',
    'cooltrainer_m': 'Cool Trainer',
    'cooltrainer_f': 'Cool Trainer',
    'ace_trainer_m': 'Ace Trainer',
    'ace_trainer_f': 'Ace Trainer',
    'swimmerm': 'Swimmer',
    'swimmerf': 'Swimmer',
    'pokefanm': 'Pokéfan',
    'pokefanf': 'Pokéfan',
    'gruntm': 'Grunt',
    'gruntf': 'Grunt',
  };

  const lowerClass = trainerClass.toLowerCase();
  if (classMap[lowerClass]) return classMap[lowerClass];

  // Default formatting: replace underscores, capitalize words
  return trainerClass
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Get trainer sprite path from class
function getTrainerSpritePath(trainerClass: string): string {
  const classLower = trainerClass.toLowerCase().replace(/-/g, '_');

  const spriteMap: Record<string, string> = {
    'cooltrainerm': 'cooltrainer_m',
    'cooltrainerf': 'cooltrainer_f',
    'prof_elm': 'elm',
    'prof_oak': 'oak',
    'rival0': 'rival1',
  };

  return spriteMap[classLower] || classLower;
}

// Get level range display for a team
function getLevelRangeDisplay(pokemon: ComprehensiveTrainerData['versions'][string]['teams'][0]['pokemon']): string {
  // Check if any Pokemon has badge-dependent levels
  const hasBadgeLevels = pokemon.some(p => p.levelDisplay);

  if (hasBadgeLevels) {
    // For badge-dependent teams, show "Badge Dependent"
    return 'Badge Dependent';
  }

  // For static levels, show the range
  const levels = pokemon.map(p => p.level).filter(l => l > 0);
  if (levels.length === 0) return 'Variable';

  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);

  return minLevel === maxLevel ? `Lv. ${minLevel}` : `Lv. ${minLevel}-${maxLevel}`;
}

interface TeamDisplayProps {
  team: ComprehensiveTrainerData['versions'][string]['teams'][0];
  matchLabel?: string;
}
function TeamDisplay({ team, matchLabel }: TeamDisplayProps) {
  function getItemIdFromDisplayName(item: string): string {
    // Convert display name to item ID (e.g., "Ultra Ball" -> "ultraball")
    return item.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  return (
    <div className="space-y-3">
      {matchLabel && (
        <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">{matchLabel}</h4>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {team.pokemon.map((poke, idx) => (
          <div
            key={idx}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2"
          >
            <div className="flex items-start gap-3">
              <Link href={`/pokemon/${poke.pokemonName}${poke.formName && poke.formName !== 'plain' ? `?form=${poke.formName}` : ''}`}>
                <PokemonSprite
                  pokemonName={poke.pokemonName}
                  form={poke.formName || 'plain'}
                  hoverAnimate
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/pokemon/${poke.pokemonName}${poke.formName && poke.formName !== 'plain' ? `?form=${poke.formName}` : ''}`}
                  className="font-medium capitalize hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {/* {poke.pokemonName.replace(/_/g, ' ')}
                  {poke.formName && poke.formName !== 'plain' && (
                    <span className="text-xs text-gray-500 ml-1">({poke.formName})</span>
                  )} */}
                  {poke.pokemonName}{' '}
                  {poke.gender?.toLowerCase() === 'female' && (
                    <Image
                      src={`/icons/venus-solid.svg`}
                      alt="Female"
                      width={10}
                      height={10}
                      className="inline-block translate-y-[-1px] mr-2"
                    />
                  )}
                  {poke.gender?.toLowerCase() === 'male' && (
                    <Image
                      src={`/icons/mars-solid.svg`}
                      alt="Male"
                      width={10}
                      height={10}
                      className="inline-block translate-y-[-1px] mr-2"
                    />
                  )}
                </Link>

                {(poke.level || poke.levelDisplay) && (
                  <p className="text-xs">
                    {poke.levelDisplay ? poke.levelDisplay : `Lv. ${poke.level}`}
                  </p>
                )}
                {poke.item && (
                  <p className="text-xs">
                    Held item:{' '}
                    <a
                      href={`/items/${getItemIdFromDisplayName(poke.item)}`}
                      className="text-indigo-700 dark:text-indigo-300 hover:underline font-bold"
                    >
                      {poke.item
                        .toLowerCase()
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </a>
                  </p>
                )}
                {poke.nature && (
                  <span className="text-xs">Nature: {poke.nature}</span>
                )}

              </div>
            </div>

            {/* Moves */}
            {poke.moves && poke.moves.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {poke.moves.map((move, i) => {
                  const moveType = (move.type || 'normal') as BadgeVariant;

                  return (
                    <Link
                      key={i}
                      href={`/moves/${move.id}`}
                      className="text-xs font-bold capitalize text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-black/50 transition-colors"
                      title={formatMoveName(move.id)}
                    >
                      <span className="capitalize truncate w-full text-center">{formatMoveName(move.id)}</span>
                      <Badge
                        variant={moveType}
                        className="px-1 py-0 text-[9px]"
                      >
                        {moveType}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NewTrainerCard({
  trainer,
  showTeam = 1,
  showAllTeams = false,
  isGymLeader = false
}: NewTrainerCardProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();
  const version = showFaithful ? 'faithful' : 'polished';

  const versionData = trainer.versions[version] || trainer.versions.polished || trainer.versions.faithful;

  if (!versionData || !versionData.teams || versionData.teams.length === 0) {
    return null;
  }

  const displayClass = formatTrainerClass(trainer.class);
  const displayName = trainer.name === '<RIVAL>' || trainer.name === 'boy' ? 'Rival' : trainer.name;
  const spritePath = getTrainerSpritePath(trainer.class);

  // Find the requested team or default to first
  const selectedTeam = versionData.teams.find(t => t.matchCount === showTeam) || versionData.teams[0];
  const hasMultipleTeams = versionData.teams.length > 1;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <Accordion type="single" collapsible defaultValue={showAllTeams ? 'trainer' : undefined}>
        <AccordionItem value="trainer" className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-center gap-3">
              <TrainerSprite
                trainerName={spritePath}
                className="w-12 h-12 shadow-none"
                alt={displayName}
              />
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  {displayClass && displayClass.toLowerCase() !== displayName.toLowerCase() ? (
                    <span className="capitalize">{displayClass} {displayName}</span>
                  ) : (
                    <span className="capitalize">{displayName}</span>
                  )}
                  {isGymLeader && (
                    <Badge variant="default" className="text-xs">Gym Leader</Badge>
                  )}
                  {hasMultipleTeams && (
                    <Badge variant="secondary" className="text-xs">
                      {versionData.teams.length} battles
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedTeam.pokemon.length} Pokémon • {getLevelRangeDisplay(selectedTeam.pokemon)}
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {showAllTeams && hasMultipleTeams ? (
              <div className="space-y-6">
                {versionData.teams.map((team, idx) => (
                  <TeamDisplay
                    key={idx}
                    team={team}
                    matchLabel={`Battle ${team.matchCount}`}
                  />
                ))}
              </div>
            ) : (
              <TeamDisplay team={selectedTeam} />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
