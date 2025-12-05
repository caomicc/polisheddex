'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge, BadgeVariant } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TrainerSprite } from './trainer-sprite';
import { PokemonSprite } from '@/components/pokemon/pokemon-sprite';
import { ComprehensiveTrainerData } from '@/types/new';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';

// Type for move data from manifest
interface MoveInfo {
  name: string;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  category: string;
}

interface MovesManifestItem {
  id: string;
  versions: {
    faithful: MoveInfo;
    polished: MoveInfo;
  };
}

// Cache for moves data
let movesCache: Record<string, MovesManifestItem> | null = null;

// Hook to load moves data
function useMovesData() {
  const [moves, setMoves] = useState<Record<string, MovesManifestItem>>(movesCache || {});
  const [isLoading, setIsLoading] = useState(!movesCache);

  useEffect(() => {
    if (movesCache) {
      setMoves(movesCache);
      setIsLoading(false);
      return;
    }

    fetch('/new/moves_manifest.json')
      .then(res => res.json())
      .then((data: MovesManifestItem[]) => {
        const movesMap: Record<string, MovesManifestItem> = {};
        data.forEach(move => {
          movesMap[move.id] = move;
        });
        movesCache = movesMap;
        setMoves(movesMap);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading moves:', err);
        setIsLoading(false);
      });
  }, []);

  return { moves, isLoading };
}

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

// Format move name for display
function formatMoveName(move: string): string {
  return move
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Format item name for display
function formatItemName(item: string): string {
  return item
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

interface TeamDisplayProps {
  team: ComprehensiveTrainerData['versions'][string]['teams'][0];
  matchLabel?: string;
  movesData: Record<string, MovesManifestItem>;
  version: 'faithful' | 'polished';
}

function TeamDisplay({ team, matchLabel, movesData, version }: TeamDisplayProps) {
  function getItemIdFromDisplayName(item: string) {
    throw new Error('Function not implemented.');
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

                {poke.level && <p className="text-xs">Lv. {poke.level}</p>}
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
                  const moveData = movesData[move.toLowerCase()];
                  const moveType = (moveData?.versions[version]?.type || 'normal') as BadgeVariant;

                  return (
                    <Link
                      key={i}
                      href={`/moves/${move.toLowerCase()}`}
                      className="text-xs font-bold capitalize text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-black/50 transition-colors"
                      title={formatMoveName(move)}
                    >
                      <span className="capitalize truncate w-full text-center">{formatMoveName(move)}</span>
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

            {/* Additional info */}
            {/* <div className="mt-2 flex flex-wrap gap-1">
              {poke.ability && (
                <Badge variant="outline" className="text-[10px]">
                  {poke.ability}
                </Badge>
              )}
              {poke.nature && (
                <Badge variant="outline" className="text-[10px]">
                  {poke.nature}
                </Badge>
              )}
            </div> */}
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
  const { moves: movesData } = useMovesData();
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
                  {selectedTeam.pokemon.length} Pokémon • Lv. {Math.min(...selectedTeam.pokemon.map(p => p.level))}-{Math.max(...selectedTeam.pokemon.map(p => p.level))}
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
                    movesData={movesData}
                    version={version}
                  />
                ))}
              </div>
            ) : (
              <TeamDisplay team={selectedTeam} movesData={movesData} version={version} />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
