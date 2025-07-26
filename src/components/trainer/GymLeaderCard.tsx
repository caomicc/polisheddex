import { GymLeader } from '@/types/types';

interface GymLeaderCardProps {
  gymLeader: GymLeader;
}

export default function GymLeaderCard({ gymLeader }: GymLeaderCardProps) {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Trainer Icon with better styling */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800 dark:to-red-900 rounded-full flex items-center justify-center border-2 border-red-200 dark:border-red-700">
            <span className="text-lg" aria-hidden="true">
              👤
            </span>
          </div>
        </div>

        <div className="flex-grow min-w-0">
          {/* Enhanced Trainer Header */}
          <div className="flex flex-col gap-2 mb-3">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {gymLeader.name}
            </h3>
            <p>Badge: {gymLeader.badge}</p>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border">
                <span className="sr-only">Pokemon:</span>
                {gymLeader?.pokemon && (
                  <div className="flex flex-col gap-1">
                    {gymLeader.pokemon.map((poke, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col text-slate-600 dark:text-slate-300 text-xs border-b last:border-b-0 border-slate-200 dark:border-slate-700 py-1"
                      >
                        <span className="font-semibold capitalize">{poke.species}</span>
                        <span>
                          <span className="mr-2">Lv.{poke.level}</span>
                          <span className="capitalize">{poke.gender}</span>
                        </span>
                        <span>
                          Moves:{' '}
                          {poke?.moves?.map((move, i) => (
                            <span key={move}>
                              {move}
                              {poke?.moves && i < poke.moves.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
