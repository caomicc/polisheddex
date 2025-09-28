// 'use client';

// import React, { useState, useEffect } from 'react';
// import { StatData, calculateActualStats, type NatureModifiers } from './stat-hexagon';
// import { getPokemonStatsData, type PokemonStatsData } from '@/lib/pokemon-stats';
// import { Nature, NATURE_DATA, type IVs, type EVs } from '../pokemon-slot';
// import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
// import { Progress } from '../ui/progress';

// interface StatsDisplayProps {
//   pokemonName?: string;
//   ivs?: IVs;
//   evs?: EVs;
//   level?: number;
//   nature?: Nature;
// }

// const defaultStats: StatData = {
//   hp: 0,
//   attack: 0,
//   defense: 0,
//   spatk: 0,
//   spdef: 0,
//   speed: 0,
// };

// // Convert IVs/EVs to StatData format (they should already match, but this ensures compatibility)
// function convertToStatData(stats?: IVs | EVs): StatData {
//   if (!stats) return defaultStats;
//   return {
//     hp: stats.hp || 0,
//     attack: stats.attack || 0,
//     defense: stats.defense || 0,
//     spatk: stats.spatk || 0,
//     spdef: stats.spdef || 0,
//     speed: stats.speed || 0,
//   };
// }

// // Convert Nature to NatureModifiers
// function getNatureModifiers(nature?: Nature): NatureModifiers {
//   if (!nature) {
//     return { attack: 1, defense: 1, spatk: 1, spdef: 1, speed: 1 };
//   }

//   const natureData = NATURE_DATA[nature];
//   const modifiers: NatureModifiers = { attack: 1, defense: 1, spatk: 1, spdef: 1, speed: 1 };

//   if (natureData.increased) {
//     modifiers[natureData.increased] = 1.1;
//   }
//   if (natureData.decreased) {
//     modifiers[natureData.decreased] = 0.9;
//   }

//   return modifiers;
// }

export default function StatsDisplay(
  {
    // pokemonName,
    // ivs,
    // evs,
    // level = 50,
    // nature,
  },
) {
  // const [pokemonStats, setPokemonStats] = useState<PokemonStatsData | null>(null);
  // const [loading, setLoading] = useState(false);
  // const { showFaithful } = useFaithfulPreference();

  // useEffect(() => {
  //   if (!pokemonName) {
  //     setPokemonStats(null);
  //     return;
  //   }

  //   setLoading(true);
  //   getPokemonStatsData(pokemonName)
  //     .then(setPokemonStats)
  //     .catch(console.error)
  //     .finally(() => setLoading(false));
  // }, [pokemonName]);

  // if (!pokemonName) {
  //   return null;
  // }

  // if (loading) {
  //   return (
  //     <div className="mt-2 p-2 bg-muted/50 rounded-lg">
  //       <div className="text-xs text-muted-foreground">Loading stats...</div>
  //     </div>
  //   );
  // }

  // if (!pokemonStats) {
  //   return (
  //     <div className="mt-2 p-2 bg-muted/50 rounded-lg">
  //       <div className="text-xs text-muted-foreground">Could not load stats</div>
  //     </div>
  //   );
  // }

  // // Choose base stats based on faithful preference
  // const baseStats =
  //   showFaithful && pokemonStats.faithfulBaseStats
  //     ? pokemonStats.faithfulBaseStats
  //     : pokemonStats.polishedBaseStats || pokemonStats.baseStats;

  // const natureModifiers = getNatureModifiers(nature);

  // const calculatedStats = calculateActualStats(
  //   baseStats,
  //   convertToStatData(ivs),
  //   convertToStatData(evs),
  //   level,
  //   natureModifiers,
  // );

  // return (
  //   <div className="mt-2 p-2 bg-muted/50 rounded-lg">
  //     <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm relative">
  //       <div>
  //         <div className="flex justify-between">
  //           <span className="label-text">HP:</span>
  //           <span className="font-mono font-medium">{calculatedStats.hp}</span>
  //         </div>
  //         <Progress value={calculatedStats.hp / 5} max={500} />
  //       </div>
  //       <div>
  //         <div className="flex justify-between">
  //           <span className="label-text">Att:</span>
  //           <span className="font-mono font-medium">{calculatedStats.attack}</span>
  //         </div>
  //         <Progress value={calculatedStats.attack / 5} max={500} />
  //       </div>
  //       <div>
  //         <div className="flex justify-between">
  //           <span className="label-text">Def:</span>
  //           <span className="font-mono font-medium">{calculatedStats.defense}</span>
  //         </div>
  //         <Progress value={calculatedStats.defense / 5} max={500} />
  //       </div>
  //       <div>
  //         <div className="flex justify-between">
  //           <span className="label-text">SpA:</span>
  //           <span className="font-mono font-medium">{calculatedStats.spatk}</span>
  //         </div>
  //         <Progress value={calculatedStats.spatk / 5} max={500} />
  //       </div>
  //       <div>
  //         <div className="flex justify-between">
  //           <span className="label-text">SpD:</span>
  //           <span className="font-mono font-medium">{calculatedStats.spdef}</span>
  //         </div>
  //         <Progress value={calculatedStats.spdef / 5} max={500} />
  //       </div>

  //       <div>
  //         <div className="flex justify-between">
  //           <span className="label-text">Spe:</span>
  //           <span className="font-mono font-medium">{calculatedStats.speed}</span>
  //         </div>
  //         <Progress value={calculatedStats.speed / 5} max={500} />
  //       </div>
  //     </div>
  //   </div>
  // );
  return null;
}
