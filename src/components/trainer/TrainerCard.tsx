import { GymLeader, LocationTrainer, PokemonType } from '@/types/types';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import pokemonBaseData from '@/output/pokemon_base_data.json';
import { Badge } from '../ui/badge';

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
                  <Card key={idx} className="bg-white border-2 border-gray-200 p-0">
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
                          <h3 className="capitalize">{poke.species}</h3>
                          {poke.level && <p>Lv. {poke.level}</p>}
                          {poke.gender && <p className="capitalize">{poke.gender}</p>}
                        </div>
                      </div>
                      {/* {types.length > 0 && (
                        <div className="flex gap-2">
                          {types.map((type: string, i: number) => (
                            <Badge key={i} variant={type.toLowerCase() as PokemonType['name']}>
                              {type}
                            </Badge>
                          ))}
                        </div>
                      )} */}

                      <div className="flex flex-row flex-wrap md:flex-col items-start gap-2">
                        <div className={''}>
                          <label className="leading-none text-xs w-[50px]">Faithful:</label>
                          <div
                            className="flex flex-wrap gap-2"
                            aria-label="Pokemon Types"
                            role="group"
                          >
                            {types ? (
                              Array.isArray(types) ? (
                                types.map((type: string) => (
                                  <Badge
                                    key={type}
                                    variant={type.toLowerCase() as PokemonType['name']}
                                  >
                                    {type}
                                  </Badge>
                                ))
                              ) : (
                                <Badge key={types} variant={types as PokemonType['name']}>
                                  {types}
                                </Badge>
                              )
                            ) : (
                              <Badge variant="secondary">Unknown</Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="leading-none text-xs w-[50px]">Polished:</label>
                          <div
                            className="flex flex-wrap gap-2"
                            aria-label="Pokemon Types"
                            role="group"
                          >
                            {updatedTypes ? (
                              Array.isArray(updatedTypes) ? (
                                updatedTypes.map((type: string) => (
                                  <Badge
                                    key={type}
                                    variant={type.toLowerCase() as PokemonType['name']}
                                  >
                                    {type}
                                  </Badge>
                                ))
                              ) : (
                                <Badge
                                  key={updatedTypes}
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

                      {poke.item && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Held item:{' '}
                          <a
                            href={`/items/${poke.item.toLowerCase().replace(/_/g, '').replace(/\s+/g, '-')}`}
                            className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            {poke.item}
                          </a>
                        </p>
                      )}
                      {poke.nature && (
                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {poke.nature} Nature
                        </span>
                      )}
                      <ul>
                        {poke.moves?.map((move, i) => (
                          <li
                            key={move + i}
                            className="text-sm capitalize text-gray-700 dark:text-gray-300"
                          >
                            {move}
                          </li>
                        ))}
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
