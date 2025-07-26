import { GymLeader } from '@/types/types';
import Image from 'next/image';

interface GymLeaderCardProps {
  gymLeader: GymLeader;
}

export default function GymLeaderCard({ gymLeader }: GymLeaderCardProps) {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex flex-col items-start gap-4">
        {/* Trainer Icon with better styling */}
        <div className="flex flex-row items-center gap-4 w-full">
          <div className="w-16 h-16 relative">
            <Image
              src={`/sprites/trainers/${gymLeader.trainerClass.toLowerCase()}.png`}
              alt={gymLeader.name}
              fill
            />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {gymLeader.name}
            </h3>
            <p>Badge: {gymLeader.badge}</p>
          </div>
        </div>
        <div className="flex-grow min-w-0 w-full">
          {/* Enhanced Trainer Header */}
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center gap-2 w-full">
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border w-full">
                <span className="sr-only">Pokemon:</span>
                {gymLeader?.pokemon && (
                  <div className="flex flex-col md:flex-row md:justify-between gap-1">
                    {gymLeader.pokemon.map((poke, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col text-slate-600 dark:text-slate-300 text-xs border-b last:border-b-0 border-slate-200 dark:border-slate-700 py-1 relative"
                      >
                        <Image
                          src={`/sprites/pokemon/${poke.species.toLowerCase()}/front_cropped.png`}
                          alt={poke.species}
                          width={32}
                          height={32}
                          className="inline-block mr-2"
                        />
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
