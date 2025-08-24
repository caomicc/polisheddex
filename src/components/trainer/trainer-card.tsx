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
import { formatPokemonUrlWithForm } from '@/utils/pokemonFormUtils';

interface TrainerCardProps {
  trainer: GymLeader | LocationTrainer;
  isGymLeader?: boolean;
}

export default function TrainerCard({ trainer, isGymLeader }: TrainerCardProps) {
  let displayTrainerClass = trainer.trainerClass;
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
      displayTrainerClass = trainer.trainerClass.replace(/_/g, ' ').toLowerCase();
      break;
  }

  let displayTrainerName = trainer.name;

  if (displayTrainerName === '<RIVAL>' || displayTrainerName === 'boy') {
    displayTrainerName = 'Rival';
  }

  let trainerSpritePath = trainer.trainerClass.toLowerCase().replace(/_/g, '_');
  console.log('trainerSpritePath', trainerSpritePath);
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

  const { showFaithful } = useFaithfulPreference();

  return (
    <div className="">
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1" className="p-0">
          <AccordionTrigger className="p-0  items-center">
            <div className="relative flex flex-row items-center gap-4">
              {/* not a pokemon sprite but w/e */}
              <TrainerSprite
                trainerName={
                  ['rival0', 'rival1', 'lyra0', 'lyra1'].includes(
                    trainer.trainerClass.toLowerCase().replace(/-/g, '_'),
                  )
                    ? trainer.trainerClass
                        .toLowerCase()
                        .replace(/-/g, '_')
                        .replace(/(\d)$/, (match) => `${parseInt(match) + 1}`)
                    : trainer.trainerClass.toLowerCase().replace(/-/g, '_')
                }
                src={`/sprites/trainers/${
                  ['rival0', 'rival1', 'lyra0', 'lyra1'].includes(trainerSpritePath)
                    ? trainerSpritePath.replace(/(\d)$/, (match) => `${parseInt(match) + 1}`)
                    : trainerSpritePath
                }/static.png`}
                alt={trainer.name}
              />
              <div>
                <h3 className="text-left">
                  {isGymLeader ? (
                    displayTrainerName
                  ) : (
                    <span className="capitalize">
                      {displayTrainerClass} {displayTrainerName}
                    </span>
                  )}
                </h3>
                {isGymLeader && <p>Badge: {(trainer as GymLeader).badge}</p>}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            {trainer.pokemon && trainer.pokemon.length > 0 && (
              <div className="flex-grow min-w-0 w-full pt-6">
                <span className="sr-only">Pokemon:</span>
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

                    console.log(`Pokemon data for ${poke.species}:`, pokemonData);

                    // const moves = showFaithful
                    //   ? pokemonData?.moves?.faithful || []
                    //   : pokemonData?.moves?.updated || [];

                    console.log(
                      `Rendering Pokémon: ${poke.species} with types: ${types.join(', ')}`,
                      pokemonData,
                    );

                    return (
                      <Card
                        key={idx}
                        className="bg-white dark:bg-black/5 border border-border p-0 shadow-none"
                      >
                        <CardContent className="p-4 flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <Link
                              className="relative"
                              href={formatPokemonUrlWithForm(
                                poke.species,
                                poke.form ? poke.form.toLowerCase().replace(/ form/g, '') : 'plain',
                              )}
                            >
                              <PokemonSprite
                                hoverAnimate={true}
                                pokemonName={poke.species.toLowerCase().replace(/-/g, '_')}
                                src={`/sprites/pokemon/${poke.species.toLowerCase().replace(/-/g, '_')}${poke.form ? `_${poke.form?.toLowerCase().replace(/ form/g, '')}` : ''}/normal_front.png`}
                                alt={poke.species}
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <h3>
                                <Link
                                  href={formatPokemonUrlWithForm(
                                    poke.species,
                                    poke.form
                                      ? poke.form.toLowerCase().replace(/ form/g, '')
                                      : 'plain',
                                  )}
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
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
