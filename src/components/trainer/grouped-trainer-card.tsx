import { GymLeader, LocationTrainer, Move, PokemonType } from '@/types/types';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import pokemonBaseData from '@/output/pokemon_base_data.json';
import pokemonMoveDescriptions from '@/output/manifests/moves.json';
import { Badge } from '../ui/badge';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';
import Link from 'next/link';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonSprite } from '../pokemon/pokemon-sprite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { TrainerSprite } from './trainer-sprite';
import { createPokemonUrl } from '@/utils/pokemonLinkHelper';
import { GroupedTrainer } from '@/utils/trainerGrouping';

interface GroupedTrainerCardProps {
  groupedTrainer: GroupedTrainer;
  isGymLeader?: boolean;
}

function TrainerTeamDisplay({ trainer }: { trainer: LocationTrainer | GymLeader }) {
  const { showFaithful } = useFaithfulPreference();
  
  if (!trainer.pokemon || trainer.pokemon.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
      {trainer.pokemon.map((poke, idx) => {
        type PokemonBaseDataKey = keyof typeof pokemonBaseData;
        const speciesKey = poke.species.toLowerCase() as PokemonBaseDataKey;
        const pokemonData = pokemonBaseData[speciesKey];
        const types: string[] = Array.isArray(pokemonData?.types)
          ? pokemonData.types
          : typeof pokemonData?.types === 'string'
            ? [pokemonData.types]
            : [];

        const updatedTypes: string[] = Array.isArray(pokemonData?.updatedTypes)
          ? pokemonData.updatedTypes
          : typeof pokemonData?.updatedTypes === 'string'
            ? [pokemonData.updatedTypes]
            : [];

        return (
          <Card
            key={idx}
            className="bg-white dark:bg-black/5 border border-border p-0 shadow-none"
          >
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Link
                  href={`${createPokemonUrl(poke.species)}${poke.form ? `?form=${poke.form?.toLowerCase().replace(/ form/g, '')}` : ''}`}
                >
                  <PokemonSprite
                    pokemonName={poke.species.toLowerCase().replace(/-/g, '_')}
                    src={`/sprites/pokemon/${poke.species.toLowerCase().replace(/-/g, '_')}${poke.form ? `_${poke.form?.toLowerCase().replace(/ form/g, '')}` : ''}/normal_front.png`}
                    alt={poke.species}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <h3>
                    <Link
                      href={`${createPokemonUrl(poke.species)}${poke.form ? `?form=${poke.form?.toLowerCase().replace(/ form/g, '')}` : ''}`}
                    >
                      {poke.species}{' '}
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
                  </h3>
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

              <div className="flex flex-row flex-wrap justify-center items-center mb-2 gap-2 md:gap-4">
                <div className={'text-center'}>
                  <div
                    className="flex flex-wrap gap-2 items-center justify-center"
                    aria-label="Pokemon Types"
                    role="group"
                  >
                    {(showFaithful ? types : updatedTypes) &&
                      (Array.isArray(showFaithful ? types : updatedTypes) ? (
                        (showFaithful ? types : updatedTypes).map((type: string) => (
                          <Badge
                            key={type}
                            variant={type.toLowerCase() as PokemonType['name']}
                            className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                          >
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <></>
                      ))}
                  </div>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {poke.moves?.map((move, i) => {
                  type MoveDescriptions = typeof pokemonMoveDescriptions;
                  type MoveKey = keyof MoveDescriptions;
                  const moveKey = Object.keys(pokemonMoveDescriptions).find(
                    (k) => k.toLowerCase() === move.toLowerCase().replace(/\s+/g, '-'),
                  ) as MoveKey | undefined;

                  const moveData = moveKey
                    ? pokemonMoveDescriptions[moveKey]
                    : undefined;
                  const moveType = showFaithful
                    ? moveData && (moveData as Move['info'])?.faithful?.type
                      ? (moveData as Move['info'])?.faithful?.type
                      : (moveData as Move['info'])?.updated?.type || 'Unknown'
                    : (moveData as Move['info'])?.updated?.type
                      ? (moveData as Move['info'])?.updated?.type
                      : (moveData as Move['info'])?.faithful?.type || 'Unknown';

                  return (
                    <li key={move + i}>
                      <Link
                        href={`/moves?search=${move.toLowerCase().replace(/\s+/g, '+')}`}
                        className="text-xs font-bold capitalize text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-black/50 transition-colors"
                        key={move + i}
                      >
                        {move}
                        <Badge
                          variant={moveType?.toLowerCase() as PokemonType['name']}
                          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                        >
                          {moveType}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function GroupedTrainerCard({ groupedTrainer, isGymLeader }: GroupedTrainerCardProps) {
  const { baseTrainer, rematches, isGrouped } = groupedTrainer;
  
  let displayTrainerClass = baseTrainer.trainerClass;
  switch (displayTrainerClass?.toLowerCase()) {
    case 'lyra2':
    case 'rival2':
    case 'lyra1':
    case 'rival1':
    case 'rival0':
      displayTrainerClass = '';
      break;
    case 'prof_elm':
    case 'prof_oak':
      displayTrainerClass = 'Professor';
      break;
    case undefined:
    case null:
      displayTrainerClass = '';
      break;
    default:
      displayTrainerClass = baseTrainer.trainerClass.replace(/_/g, ' ').toLowerCase();
      break;
  }

  let displayTrainerName = baseTrainer.name;

  if (displayTrainerName === '<RIVAL>' || displayTrainerName === 'boy') {
    displayTrainerName = 'Rival';
  }

  let trainerSpritePath = baseTrainer.trainerClass.toLowerCase().replace(/_/g, '_');
  switch (trainerSpritePath.toLowerCase()) {
    case 'cooltrainerm':
      trainerSpritePath = 'cooltrainer_m';
      break;
    case 'cooltrainerf':
      trainerSpritePath = 'cooltrainer_f';
      break;
    case 'prof_elm':
      trainerSpritePath = 'elm';
      break;
    case 'rival0':
      trainerSpritePath = 'rival1';
      break;
  }

  return (
    <div className="p-4 bg-white dark:bg-white/5 rounded-md md:rounded-2xl border border-border shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="trainer-details">
          <AccordionTrigger className="p-0 items-center">
            <div className="relative flex flex-row items-center gap-4">
              <TrainerSprite
                trainerName={
                  ['rival0', 'rival1', 'lyra0', 'lyra1'].includes(
                    baseTrainer.trainerClass.toLowerCase().replace(/-/g, '_'),
                  )
                    ? baseTrainer.trainerClass
                        .toLowerCase()
                        .replace(/-/g, '_')
                        .replace(/(\d)$/, (match) => `${parseInt(match) + 1}`)
                    : baseTrainer.trainerClass.toLowerCase().replace(/-/g, '_')
                }
                src={`/sprites/trainers/${
                  ['rival0', 'rival1', 'lyra0', 'lyra1'].includes(trainerSpritePath)
                    ? trainerSpritePath.replace(/(\d)$/, (match) => `${parseInt(match) + 1}`)
                    : trainerSpritePath
                }/static.png`}
                alt={baseTrainer.name}
              />
              <div className="text-left">
                <h3>
                  {isGymLeader ? (
                    displayTrainerName
                  ) : (
                    <span className="capitalize">
                      {displayTrainerClass} {displayTrainerName}
                    </span>
                  )}
                  {isGrouped && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {rematches.length + 1} battles
                    </Badge>
                  )}
                </h3>
                {isGymLeader && 'badge' in baseTrainer && <p>Badge: {String((baseTrainer as any).badge)}</p>}
                {isGrouped && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Can be rematched for stronger teams
                  </p>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-6">
            {!isGrouped ? (
              // Single trainer - show team normally
              <div className="flex-grow min-w-0 w-full">
                <span className="sr-only">Pokemon:</span>
                <TrainerTeamDisplay trainer={baseTrainer} />
              </div>
            ) : (
              // Grouped trainer - show initial battle and rematches
              <div className="space-y-6">
                {/* Initial Battle */}
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Initial Battle</h4>
                  <TrainerTeamDisplay trainer={baseTrainer} />
                </div>

                {/* Rematches */}
                {rematches.map((rematchTrainer, index) => (
                  <div key={rematchTrainer.id}>
                    <h4 className="font-semibold mb-3 text-lg">
                      Rematch {index + 1}
                    </h4>
                    <TrainerTeamDisplay trainer={rematchTrainer} />
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}