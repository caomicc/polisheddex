// import { GroupedTrainer, GymLeader, LocationTrainer, Move, PokemonType } from '@/types/types';
// import Image from 'next/image';
// import pokemonBaseData from '@/output/pokemon_base_data.json';
// import pokemonMoveDescriptions from '@/output/manifests/moves.json';
import { Badge } from '../ui/badge';
// import { getItemIdFromDisplayName } from '@/utils/itemUtils';
// import Link from 'next/link';
// import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
// import { PokemonSprite } from '../pokemon/pokemon-sprite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
// import { TrainerSprite } from './trainer-sprite';
// import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
// import { formatPokemonUrlWithForm } from '@/utils/pokemonFormUtils';

// // Utility functions to reduce redundancy
// const normalizeForm = (form?: string): string => {
//   return form ? form.toLowerCase().replace(/ form/g, '') : 'plain';
// };

// const normalizePokemonName = (species: string): string => {
//   return species.toLowerCase().replace(/-/g, '_');
// };

// const normalizeItemName = (item: string): string => {
//   return item
//     .toLowerCase()
//     .replace(/_/g, ' ')
//     .replace(/\b\w/g, (c) => c.toUpperCase());
// };

// const GYM_LEADER_CLASSES = [
//   'FALKNER',
//   'BUGSY',
//   'WHITNEY',
//   'MORTY',
//   'CHUCK',
//   'JASMINE',
//   'PRYCE',
//   'CLAIR',
//   'BROCK',
//   'MISTY',
//   'LT_SURGE',
//   'ERIKA',
//   'JANINE',
//   'SABRINA',
//   'BLAINE',
//   'BLUE',
// ];

// const STARTER_LINES = {
//   grass: ['chikorita', 'bayleef', 'meganium'],
//   fire: ['cyndaquil', 'quilava', 'typhlosion'],
//   water: ['totodile', 'croconaw', 'feraligatr'],
// };

// const detectStarterType = (
//   pokemon: LocationTrainer['pokemon'],
// ): 'grass' | 'fire' | 'water' | null => {
//   if (!pokemon) return null;

//   for (const [type, pokemonNames] of Object.entries(STARTER_LINES)) {
//     const hasStarter = pokemon.some((p) =>
//       pokemonNames.some((name) => p.species.toLowerCase().includes(name)),
//     );
//     if (hasStarter) return type as 'grass' | 'fire' | 'water';
//   }
//   return null;
// };

// const getPlayerStarterFromOpponent = (
//   opponentStarter: 'grass' | 'fire' | 'water',
//   isRival: boolean,
// ): string => {
//   const starterMap = {
//     weak: { grass: 'Cyndaquil', fire: 'Totodile', water: 'Chikorita' },
//     strong: { grass: 'Totodile', fire: 'Chikorita', water: 'Cyndaquil' },
//   };

//   const behavior = isRival ? 'strong' : 'weak';
//   return starterMap[behavior][opponentStarter];
// };

// const normalizeTrainerClass = (trainerClass?: string): string => {
//   if (!trainerClass) return '';

//   const classMap: Record<string, string> = {
//     lyra2: '',
//     rival2: '',
//     lyra1: '',
//     rival1: '',
//     rival0: '',
//     prof_elm: 'Professor',
//     prof_oak: 'Professor',
//     cooltrainerm: 'Cool Trainer',
//     cooltrainerf: 'Cool Trainer',
//     swimmerm: 'Swimmer',
//     swimmerf: 'Swimmer',
//     veteranm: 'Veteran',
//     veteranf: 'Veteran',
//     psychict: 'Psychic',
//     psychic_t: 'Psychic',
//     teacherm: 'Teacher',
//     teacherf: 'Teacher',
//     sightseerm: 'Sightseer',
//     sightseerf: 'Sightseer',
//     pokefanf: 'PokeFan',
//     pokefanm: 'PokeFan',
//     officerm: 'Officer',
//     officerf: 'Officer',
//     guitaristm: 'Guitarist',
//     guitaristf: 'Guitarist',
//     gruntm: 'Grunt',
//     gruntf: 'Grunt',
//     blackbelt_t: 'Blackbelt',
//   };

//   const lowerClass = trainerClass.toLowerCase();
//   return classMap[lowerClass] || trainerClass.replace(/_/g, ' ').toLowerCase();
// };

// const normalizeTrainerSpritePath = (trainerClass: string): string => {
//   const spriteMap: Record<string, string> = {
//     cooltrainerm: 'cooltrainer_m',
//     cooltrainerf: 'cooltrainer_f',
//     prof_elm: 'elm',
//     rival0: 'rival1',
//   };

//   const lowerClass = trainerClass.toLowerCase().replace(/_/g, '_');
//   return spriteMap[lowerClass] || lowerClass;
// };

// interface GroupedTrainerCardProps {
//   groupedTrainer: GroupedTrainer;
//   isGymLeader?: boolean;
// }

function TrainerTeamDisplay({ trainer }: { trainer: any }) {
  // const { showFaithful } = useFaithfulPreference();

  if (!trainer.pokemon || trainer.pokemon.length === 0) {
    return null;
  }

  return (
    <div className="">
      {/* <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-3">
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

          // const normalizedForm = normalizeForm(poke.form);

          // const pokemonNameForUrl = normalizePokemonName(poke.species);

          const normalizedForm = poke.form
            ? poke.form.toLowerCase().replace(/ form/g, '').replace(/_/g, '')
            : 'plain';
          const pokemonNameForUrl = poke.species.toLowerCase().replace(/-/g, '_');

          return (
            <BentoGridNoLink key={idx} className="bg-neutral-50 dark:bg-white/10">
              <div className="flex items-center gap-3">
                <Link href={formatPokemonUrlWithForm(poke.species, normalizedForm)}>
                  <PokemonSprite
                    pokemonName={pokemonNameForUrl}
                    form={normalizedForm}
                    alt={poke.species}
                    hoverAnimate={true}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <h3>
                    <Link href={formatPokemonUrlWithForm(poke.species, normalizedForm)}>
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
                        {poke.item}
                      </a>
                    </p>
                  )}
                  {poke.nature && <span className="text-xs">Nature: {poke.nature}</span>}
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
                            variant={type.toLowerCase()}
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

                  const moveData = moveKey ? pokemonMoveDescriptions[moveKey] : undefined;
                  const moveType = showFaithful
                    ? moveData && moveData?.faithful?.type
                      ? moveData?.faithful?.type
                      : moveData?.updated?.type || 'Unknown'
                    : moveData?.updated?.type
                      ? moveData?.updated?.type
                      : moveData?.faithful?.type || 'Unknown';

                  return (
                    <li key={move + i}>
                      <Link
                        href={`/moves?search=${move.toLowerCase().replace(/\s+/g, '+')}`}
                        className="text-xs font-bold capitalize text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-black/50 transition-colors"
                        key={move + i}
                      >
                        {move}
                        <Badge
                          variant={moveType?.toLowerCase()}
                          className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                        >
                          {moveType}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </BentoGridNoLink>
          );
        })}
      </BentoGrid> */}
    </div>
  );
}

export default function GroupedTrainerCard({
  groupedTrainer,
  isGymLeader,
}: {
  groupedTrainer: any;
  isGymLeader: boolean;
}) {
  const { baseTrainer, rematches, isGrouped, groupType } = groupedTrainer;

  const GYM_LEADER_CLASSES = ['GYM_LEADER', 'ELITE_FOUR', 'CHAMPION'];
  // Check if this trainer is a gym leader based on their class
  const isActualGymLeader =
    isGymLeader || GYM_LEADER_CLASSES.includes(baseTrainer.trainerClass?.toUpperCase());

  console.log('GroupedTrainerCard', groupedTrainer, isGymLeader);

  // const displayTrainerClass = normalizeTrainerClass(baseTrainer.trainerClass);
  const displayTrainerClass = baseTrainer.trainerClass
    ? baseTrainer.trainerClass.replace(/_/g, ' ').toLowerCase()
    : '';
  let displayTrainerName = baseTrainer.name;

  if (displayTrainerName === '<RIVAL>' || displayTrainerName === 'boy') {
    displayTrainerName = 'Rival';
  }

  // const trainerSpritePath = normalizeTrainerSpritePath(
  //   ['rival0', 'rival1', 'lyra0', 'lyra1'].includes(
  //     baseTrainer.trainerClass.toLowerCase().replace(/-/g, '_'),
  //   )
  //     ? baseTrainer.trainerClass
  //         .toLowerCase()
  //         .replace(/-/g, '_')
  //         .replace(/(\d)$/, (match) => `${parseInt(match) + 1}`)
  //     : baseTrainer.trainerClass.toLowerCase().replace(/-/g, '_'),
  // );

  // console.log('trainerSpritePath after', trainerSpritePath);

  return (
    <div className="">
      <Accordion type="single" collapsible>
        <AccordionItem value="trainer-details">
          <AccordionTrigger className="p-0 items-center">
            <div className="relative flex flex-row items-center gap-4">
              {/* <TrainerSprite
                className="shadow-none"
                trainerName={trainerSpritePath}
                alt={baseTrainer.name}
              /> */}
              <div className="text-left">
                <h3>
                  {isActualGymLeader ? (
                    <span className="flex items-center gap-2">
                      {displayTrainerName}
                      <Badge variant="nite" className="text-xs">
                        Gym Leader
                      </Badge>
                    </span>
                  ) : (displayTrainerClass || '').trim().toLowerCase() !==
                      (displayTrainerName || '').trim().toLowerCase() &&
                    (displayTrainerClass || '').trim() ? (
                    <span className="capitalize">
                      {displayTrainerClass} {displayTrainerName}
                    </span>
                  ) : (
                    <span className="capitalize">{displayTrainerName}</span>
                  )}
                  {isGrouped && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {groupType === 'double_battle'
                        ? 'Double battle'
                        : groupType === 'starter_variation'
                          ? `${rematches.length + 1} teams`
                          : `${rematches.length + 1} battles`}
                    </Badge>
                  )}
                </h3>
                {isActualGymLeader && 'badge' in baseTrainer && (
                  <p>Badge: {String(baseTrainer.badge)}</p>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-6 pb-0">
            {!isGrouped ? (
              // Single trainer - show team normally
              <div className="flex-grow min-w-0 w-full">
                <span className="sr-only">Pokemon:</span>
                <TrainerTeamDisplay trainer={baseTrainer} />
              </div>
            ) : (
              // Grouped trainer - show based on group type
              <div className="space-y-6">
                {/* Initial Team/Battle */}
                <div>
                  <h4 className="font-semibold mb-3 text-lg">
                    {groupType === 'starter_variation'
                      ? (() => {
                          // const opponentStarter = detectStarterType(baseTrainer.pokemon);
                          // const trainerClassLower = baseTrainer.trainerClass?.toLowerCase() ?? '';
                          // const trainerNameLower = baseTrainer.name?.toLowerCase() ?? '';
                          // const isRival =
                          //   trainerClassLower.includes('rival') ||
                          //   trainerNameLower.includes('rival');

                          // if (opponentStarter) {
                          //   const playerStarter = getPlayerStarterFromOpponent(
                          //     opponentStarter,
                          //     isRival,
                          //   );
                          //   const who = trainerNameLower.includes('lyra')
                          //     ? 'Lyra'
                          //     : isRival
                          //       ? 'Rival'
                          //       : 'Opponent';
                          //   return `Team 1 (if you choose ${playerStarter}) ${who}`;
                          // }

                          return 'Team 1';
                        })()
                      : 'Initial Battle'}
                  </h4>
                  <TrainerTeamDisplay trainer={baseTrainer} />
                </div>

                {/* Additional Teams/Rematches */}
                {rematches.map((rematchTrainer: any, index: number) => {
                  console.log('rematchTrainer', rematchTrainer, index);
                  // let starterContext = '';
                  // if (groupType === 'starter_variation') {
                  //   const opponentStarter = detectStarterType(rematchTrainer.pokemon);
                  //   const trainerClassLower = baseTrainer.trainerClass?.toLowerCase() ?? '';
                  //   const trainerNameLower = baseTrainer.name?.toLowerCase() ?? '';
                  //   const isRival =
                  //     trainerClassLower.includes('rival') || trainerNameLower.includes('rival');

                  //   if (opponentStarter) {
                  //     const playerStarter = getPlayerStarterFromOpponent(opponentStarter, isRival);
                  //     starterContext = `if you choose ${playerStarter}`;
                  //   } else {
                  //     // Fallback to index-based assignment
                  //     const starters = ['Cyndaquil', 'Chikorita', 'Totodile'];
                  //     starterContext = `if you choose ${starters[index] || 'Cyndaquil'}`;
                  //   }
                  // }

                  return (
                    <div key={rematchTrainer.id}>
                      {/* <h4 className="font-semibold mb-3 text-lg">
                        {groupType === 'starter_variation'
                          ? `Team ${index + 2} (${starterContext})`
                          : `Rematch ${index + 1}`}
                      </h4> */}
                      <TrainerTeamDisplay trainer={rematchTrainer} />
                    </div>
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
