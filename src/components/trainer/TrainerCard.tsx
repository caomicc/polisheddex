import Link from 'next/link';
import { LocationTrainer } from '@/types/types';
import Image from 'next/image';

interface TrainerCardProps {
  trainer: LocationTrainer;
}

export default function TrainerCard({ trainer }: TrainerCardProps) {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Trainer Icon with better styling */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 relative">
            <Image
              src={`/sprites/trainers/${trainer.trainerClass.toLowerCase()}.png`}
              alt={trainer.name}
              fill
            />
          </div>
        </div>

        <div className="flex-grow min-w-0">
          {/* Enhanced Trainer Header */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {trainer.trainerClass} {trainer.name}
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border">
                <span className="sr-only">Position:</span>
                <span aria-hidden="true">📍</span>
                {trainer.possibleCoordinates && trainer.possibleCoordinates.length > 1 ? (
                  <span
                    title={`Can be encountered at ${trainer.possibleCoordinates.length} different locations`}
                  >
                    Multiple locations ({trainer.possibleCoordinates.length})
                  </span>
                ) : (
                  <>
                    ({trainer.coordinates.x}, {trainer.coordinates.y})
                  </>
                )}
              </div>
              {trainer.rematchable && (
                <div className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md border border-green-200 dark:border-green-800">
                  <span aria-hidden="true">🔄</span> Rematchable
                </div>
              )}
            </div>
          </div>

          {/* Additional trainer info */}
          {(trainer.baseReward ||
            trainer.items ||
            (trainer.possibleCoordinates && trainer.possibleCoordinates.length > 1)) && (
            <div className="space-y-2 mb-3 text-sm">
              <div className="flex flex-wrap gap-3">
                {trainer.baseReward && (
                  <div className="text-yellow-600 dark:text-yellow-400 font-medium">
                    <span aria-hidden="true">💰</span> ${trainer.baseReward} reward
                  </div>
                )}
                {trainer.items && trainer.items.length > 0 && (
                  <div className="text-purple-600 dark:text-purple-400 font-medium">
                    <span aria-hidden="true">🎁</span> Items: {trainer.items.join(', ')}
                  </div>
                )}
              </div>

              {/* Show all possible coordinates if there are multiple */}
              {trainer.possibleCoordinates && trainer.possibleCoordinates.length > 1 && (
                <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded border">
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Possible encounter locations:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {trainer.possibleCoordinates.map((coord, index) => (
                      <span
                        key={index}
                        className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded"
                      >
                        ({coord.x}, {coord.y})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pokemon Party */}
          {trainer.pokemon && trainer.pokemon.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span aria-hidden="true">🎪</span>
                Pokémon Team ({trainer.pokemon.length})
              </h4>
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {trainer.pokemon.map((pokemon, pokemonIndex) => (
                  <article
                    key={pokemonIndex}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                  >
                    <header className="flex items-center justify-between mb-2">
                      <Link
                        href={`/pokemon/${pokemon.species}`}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline capitalize truncate flex-grow mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-700 rounded"
                        title={`View ${pokemon.species.replace(/_/g, ' ')} details`}
                      >
                        {pokemon.nickname || pokemon.species.replace(/_/g, ' ')}
                      </Link>
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {pokemon.shiny && (
                          <span
                            className="text-yellow-500"
                            title="Shiny Pokémon"
                            aria-label="Shiny"
                          >
                            ✨
                          </span>
                        )}
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded">
                          Lv. {pokemon.level}
                        </span>
                      </div>
                    </header>

                    {/* Pokemon details in a more organized layout */}
                    <div className="space-y-1.5 text-xs">
                      {pokemon.nickname && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 dark:text-slate-400">Species:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {pokemon.species.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {pokemon.gender && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 dark:text-slate-400">Gender:</span>
                            <span
                              className={`font-medium ${pokemon.gender === 'male' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'}`}
                            >
                              {pokemon.gender === 'male' ? '♂' : '♀'}
                            </span>
                          </div>
                        )}

                        {pokemon.nature && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 dark:text-slate-400">Nature:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {pokemon.nature}
                            </span>
                          </div>
                        )}
                      </div>

                      {pokemon.ability && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 dark:text-slate-400">Ability:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {pokemon.ability}
                          </span>
                        </div>
                      )}

                      {pokemon.item && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 dark:text-slate-400">Held Item:</span>
                          <span className="font-medium text-purple-600 dark:text-purple-400">
                            {pokemon.item}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Moves with better layout */}
                    {pokemon.moves && pokemon.moves.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Moves:
                        </div>
                        <div
                          className="flex flex-wrap gap-1"
                          role="list"
                          aria-label="Pokémon moves"
                        >
                          {pokemon.moves.map((move, moveIndex) => (
                            <span
                              key={moveIndex}
                              role="listitem"
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200 rounded-md font-medium border border-blue-200 dark:border-blue-700"
                              title={`Move ${moveIndex + 1}: ${move.replace(/_/g, ' ')}`}
                            >
                              {move.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Show if no party data available */}
          {(!trainer.pokemon || trainer.pokemon.length === 0) && (
            <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-sm text-slate-500 dark:text-slate-400 italic text-center">
                <span aria-hidden="true">⚠️</span> Pokémon team data not available
              </div>
            </div>
          )}

          {/* Battle dialogue if available */}
          {(trainer.seenText || trainer.beatenText || trainer.afterText) && (
            <details className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
              <summary className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 rounded">
                Battle Dialogue
              </summary>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mt-2">
                {trainer.seenText && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Before battle:
                    </span>{' '}
                    &ldquo;{trainer.seenText}&rdquo;
                  </div>
                )}
                {trainer.beatenText && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      After defeat:
                    </span>{' '}
                    &ldquo;{trainer.beatenText}&rdquo;
                  </div>
                )}
                {trainer.afterText && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Later encounters:
                    </span>{' '}
                    &ldquo;{trainer.afterText}&rdquo;
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
