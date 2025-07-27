import { GymLeader, LocationTrainer, PokemonType } from '@/types/types';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import pokemonBaseData from '@/output/pokemon_base_data.json';
import pokemonMoveDescriptions from '@/output/pokemon_move_descriptions.json';
import { Badge } from '../ui/badge';
import { getItemIdFromDisplayName } from '@/utils/itemUtils';

interface TrainerCardProps {
  trainer: GymLeader | LocationTrainer;
  isGymLeader?: boolean;
}

export default function TrainerCard({ trainer, isGymLeader }: TrainerCardProps) {
  const trainerSpritePath = trainer.trainerClass.toLowerCase().replace(/_/g, '_');

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex flex-col items-start gap-4">
        <div className="flex flex-row items-center gap-4 w-full">
          <div className="w-16 h-16 relative">
            <Image src={`/sprites/trainers/${trainerSpritePath}.png`} alt={trainer.name} fill />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {isGymLeader ? (
                trainer.name
              ) : (
                <span className="capitalize">
                  {trainer.trainerClass.replace(/_/g, ' ').toLowerCase()} {trainer.name}
                </span>
              )}
            </h3>
            {isGymLeader && <p>Badge: {(trainer as GymLeader).badge}</p>}
          </div>
        </div>
        {trainer.pokemon && trainer.pokemon.length > 0 && (
          <div className="flex-grow min-w-0 w-full">
            <span className="sr-only">Pokemon:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {trainer.pokemon.map((poke, idx) => {
                const pokemonData = pokemonBaseData[poke.species.toLowerCase()];
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

                console.log(
                  `Rendering Pokémon: ${poke.species} with types: ${types.join(', ')}`,
                  pokemonData,
                );

                return (
                  <Card key={idx} className="bg-white border-2 border-gray-200 p-0 shadow-none">
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Image
                          src={`/sprites/pokemon/${poke.species.toLowerCase()}/front_cropped.png`}
                          alt={poke.species}
                          width={48}
                          height={48}
                          className="inline-block mr-2"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="capitalize">
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
                          <label className="leading-none text-xs w-[50px]">Faithful:</label>
                          <div
                            className="flex flex-wrap gap-2 items-center justify-center"
                            aria-label="Pokemon Types"
                            role="group"
                          >
                            {types ? (
                              Array.isArray(types) ? (
                                types.map((type: string) => (
                                  <Badge
                                    key={type}
                                    variant={type.toLowerCase() as PokemonType['name']}
                                    className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                                  >
                                    {type}
                                  </Badge>
                                ))
                              ) : (
                                <Badge
                                  key={types}
                                  variant={types as PokemonType['name']}
                                  className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                                >
                                  {types}
                                </Badge>
                              )
                            ) : (
                              <Badge
                                variant="secondary"
                                className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                              >
                                Unknown
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className={'text-center'}>
                          <label className="leading-none text-xs w-[50px]">Polished:</label>
                          <div
                            className="flex flex-wrap gap-2 items-center justify-center"
                            aria-label="Pokemon Types"
                            role="group"
                          >
                            {updatedTypes ? (
                              Array.isArray(updatedTypes) ? (
                                updatedTypes.map((type: string) => (
                                  <Badge
                                    key={type}
                                    className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                                    variant={type.toLowerCase() as PokemonType['name']}
                                  >
                                    {type}
                                  </Badge>
                                ))
                              ) : (
                                <Badge
                                  key={updatedTypes}
                                  className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                                  variant={updatedTypes as PokemonType['name']}
                                >
                                  {updatedTypes}
                                </Badge>
                              )
                            ) : (
                              <></>
                            )}
                          </div>
                        </div>
                      </div>
                      <ul className="grid grid-cols-2 gap-2">
                        {poke.moves?.map((move, i) => {
                          type MoveDescriptions = typeof pokemonMoveDescriptions;
                          type MoveKey = keyof MoveDescriptions;
                          const moveKey = Object.keys(pokemonMoveDescriptions).find(
                            (k) => k.toLowerCase() === move.toLowerCase(),
                          ) as MoveKey | undefined;
                          const moveData = moveKey ? pokemonMoveDescriptions[moveKey] : undefined;
                          const moveType = moveData?.type || 'Unknown';
                          return (
                            <li
                              key={move + i}
                              className="text-xs font-bold capitalize text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2 p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              {move}
                              <Badge
                                variant={moveType.toLowerCase() as PokemonType['name']}
                                className="px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px]"
                              >
                                {moveType}
                              </Badge>
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
      </div>
    </div>
  );
}
