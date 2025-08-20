import { GymLeader, LocationTrainer, Move, PokemonType } from '@/types/types';
import Image from 'next/image';
import pokemonBaseData from '@/output/pokemon_base_data.json';
import pokemonMoveDescriptions from '@/output/manifests/moves.json';
import { Badge } from '../ui/badge';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';
import Link from 'next/link';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { PokemonSprite } from '../pokemon/pokemon-sprite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { TrainerSprite } from './trainer-sprite';
import { GroupedTrainer } from '@/utils/trainerGrouping';
import { BentoGrid, BentoGridNoLink } from '../ui/bento-box';
import { formatPokemonUrlWithForm } from '@/utils/pokemonFormUtils';

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
    <div className="">
      <BentoGrid className="max-w-4xl mx-auto md:auto-rows-auto md:grid-cols-3">
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
            <BentoGridNoLink key={idx} className="bg-neutral-50 dark:bg-white/10">
              {/* <Card className="bg-white dark:bg-black/5 border border-border p-0 shadow-none">
                <CardContent className="p-4 flex flex-col gap-2"> */}
              <div className="flex items-center gap-3">
                <Link
                  href={formatPokemonUrlWithForm(
                    poke.species,
                    poke.form ? poke.form.toLowerCase().replace(/ form/g, '') : 'plain',
                  )}
                >
                  <PokemonSprite
                    pokemonName={poke.species.toLowerCase().replace(/-/g, '_')}
                    form={poke.form?.toLowerCase().replace(/ form/g, '')}
                    alt={poke.species}
                    hoverAnimate={true}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <h3>
                    <Link
                      href={formatPokemonUrlWithForm(
                        poke.species,
                        poke.form ? poke.form.toLowerCase().replace(/ form/g, '') : 'plain',
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

                  const moveData = moveKey ? pokemonMoveDescriptions[moveKey] : undefined;
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
              {/* </CardContent>
              </Card> */}
            </BentoGridNoLink>
          );
        })}
      </BentoGrid>
    </div>
  );
}

export default function GroupedTrainerCard({
  groupedTrainer,
  isGymLeader,
}: GroupedTrainerCardProps) {
  const { baseTrainer, rematches, isGrouped, groupType } = groupedTrainer;

  // Define gym leader classes to check against
  const gymLeaderClasses = [
    'FALKNER',
    'BUGSY',
    'WHITNEY',
    'MORTY',
    'CHUCK',
    'JASMINE',
    'PRYCE',
    'CLAIR',
    'BROCK',
    'MISTY',
    'LT_SURGE',
    'ERIKA',
    'JANINE',
    'SABRINA',
    'BLAINE',
    'BLUE',
  ];

  // Check if this trainer is a gym leader based on their class
  const isActualGymLeader =
    isGymLeader || gymLeaderClasses.includes(baseTrainer.trainerClass?.toUpperCase());

  console.log('GroupedTrainerCard', groupedTrainer, isGymLeader);

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
    case 'cooltrainerm':
    case 'cooltrainerf':
      displayTrainerClass = 'Cool Trainer';
      break;
    case 'swimmerm':
    case 'swimmerf':
      displayTrainerClass = 'Swimmer';
      break;
    case 'veteranm':
    case 'veteranf':
      displayTrainerClass = 'Veteran';
      break;
    case 'psychict':
      displayTrainerClass = 'Psychic';
      break;
    case 'teacherm':
    case 'teacherf':
      displayTrainerClass = 'Teacher';
      break;
    case 'sightseerm':
    case 'sightseerf':
      displayTrainerClass = 'Sightseer';
      break;
    case 'pokefanf':
    case 'pokefanm':
      displayTrainerClass = 'PokeFan';
      break;
    case 'officerm':
    case 'officerf':
      displayTrainerClass = 'Officer';
      break;
    case 'guitarist_m':
    case 'guitaristf':
      displayTrainerClass = 'Guitarist';
      break;
    case 'gruntm':
    case 'gruntf':
      displayTrainerClass = 'Grunt';
      break;
    case 'blackbelt_t':
      displayTrainerClass = 'Blackbelt';
      break;
    case 'psychic_t':
      displayTrainerClass = 'Psychic';
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

  console.log('trainerSpritePath after', trainerSpritePath);

  return (
    <div className="">
      <Accordion type="single" collapsible>
        <AccordionItem value="trainer-details">
          <AccordionTrigger className="p-0 items-center">
            <div className="relative flex flex-row items-center gap-4">
              <TrainerSprite
                className="shadow-none"
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
                alt={baseTrainer.name}
              />
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
                    {groupType === 'starter_variation' ? (() => {
                      // Determine player's starter based on base trainer's starter
                      const hasChikorita = baseTrainer.pokemon?.some(p => 
                        p.species.toLowerCase().includes('chikorita') || 
                        p.species.toLowerCase().includes('bayleef') || 
                        p.species.toLowerCase().includes('meganium')
                      );
                      
                      const hasCyndaquil = baseTrainer.pokemon?.some(p => 
                        p.species.toLowerCase().includes('cyndaquil') || 
                        p.species.toLowerCase().includes('quilava') || 
                        p.species.toLowerCase().includes('typhlosion')
                      );
                      
                      const hasTotodile = baseTrainer.pokemon?.some(p => 
                        p.species.toLowerCase().includes('totodile') || 
                        p.species.toLowerCase().includes('croconaw') || 
                        p.species.toLowerCase().includes('feraligatr')
                      );

                      if (hasChikorita) {
                        return 'Team 1 (if you choose Cyndaquil)';
                      } else if (hasTotodile) {
                        return 'Team 1 (if you choose Chikorita)';
                      } else if (hasCyndaquil) {
                        return 'Team 1 (if you choose Totodile)';
                      } else {
                        return 'Team 1';
                      }
                    })() : 'Initial Battle'}
                  </h4>
                  <TrainerTeamDisplay trainer={baseTrainer} />
                </div>

                {/* Additional Teams/Rematches */}
                {rematches.map((rematchTrainer, index) => {
                  // For starter variations, determine which starter the player chose based on opponent's team
                  let starterContext = '';
                  if (groupType === 'starter_variation') {
                    // Look at the opponent's starter to determine which starter the player chose
                    const hasChikorita = rematchTrainer.pokemon?.some(p => 
                      p.species.toLowerCase().includes('chikorita') || 
                      p.species.toLowerCase().includes('bayleef') || 
                      p.species.toLowerCase().includes('meganium')
                    );
                    
                    const hasCyndaquil = rematchTrainer.pokemon?.some(p => 
                      p.species.toLowerCase().includes('cyndaquil') || 
                      p.species.toLowerCase().includes('quilava') || 
                      p.species.toLowerCase().includes('typhlosion')
                    );
                    
                    const hasTotodile = rematchTrainer.pokemon?.some(p => 
                      p.species.toLowerCase().includes('totodile') || 
                      p.species.toLowerCase().includes('croconaw') || 
                      p.species.toLowerCase().includes('feraligatr')
                    );

                    if (hasChikorita) {
                      // Opponent has Chikorita, so player chose Cyndaquil (Fire beats Grass)
                      starterContext = 'if you choose Cyndaquil';
                    } else if (hasTotodile) {
                      // Opponent has Totodile, so player chose Chikorita (Grass gets neutral vs Water)
                      starterContext = 'if you choose Chikorita';
                    } else if (hasCyndaquil) {
                      // Opponent has Cyndaquil, so player chose Totodile (Water beats Fire)
                      starterContext = 'if you choose Totodile';
                    } else {
                      // Fallback to index-based assignment
                      const starters = ['Cyndaquil', 'Chikorita'];
                      starterContext = `if you choose ${starters[index] || 'Cyndaquil'}`;
                    }
                  }

                  return (
                    <div key={rematchTrainer.id}>
                      <h4 className="font-semibold mb-3 text-lg">
                        {groupType === 'starter_variation'
                          ? `Team ${index + 2} (${starterContext})`
                          : `Rematch ${index + 1}`}
                      </h4>
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
