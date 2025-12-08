'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface BaseStats {
  hp?: number;
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
}

interface StatsRadarChartProps {
  stats: BaseStats;
}

const chartConfig = {
  stat: {
    label: 'Stat',
    color: 'var(--color-pokemon-primary, hsl(var(--primary)))',
  },
} satisfies ChartConfig;

// Stat labels and their keys
const STAT_CONFIG = [
  { key: 'hp', label: 'HP', fullLabel: 'HP' },
  { key: 'attack', label: 'Atk', fullLabel: 'Attack' },
  { key: 'defense', label: 'Def', fullLabel: 'Defense' },
  { key: 'speed', label: 'Spd', fullLabel: 'Speed' },
  { key: 'specialDefense', label: 'SpD', fullLabel: 'Sp. Def' },
  { key: 'specialAttack', label: 'SpA', fullLabel: 'Sp. Atk' },
] as const;

export function StatsRadarChart({ stats }: StatsRadarChartProps) {
  // Transform stats into chart data
  const chartData = STAT_CONFIG.map(({ key, label, fullLabel }) => ({
    stat: label,
    fullLabel,
    value: stats[key as keyof BaseStats] ?? 0,
  }));

  // Calculate total and find top stat
  const total = Object.values(stats).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  const topStat = chartData.reduce((max, curr) => (curr.value > max.value ? curr : max), chartData[0]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-100 overflow-hidden shadow-md dark:border-neutral-800 dark:bg-neutral-900 p-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Radar Chart */}
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px] w-full md:w-1/2">
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.payload.fullLabel}:</span>
                      <span className="font-bold">{value}</span>
                    </div>
                  )}
                />
              }
            />
            <PolarGrid
              className="fill-neutral-200/50 stroke-neutral-300 dark:fill-neutral-800/50 dark:stroke-neutral-700"
              gridType="polygon"
            />
            <PolarRadiusAxis
              domain={[0, 255]}
              tick={false}
              axisLine={false}
            />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-neutral-600 dark:text-neutral-400"
            />
            <Radar
              dataKey="value"
              fill="var(--color-stat)"
              fillOpacity={0.5}
              stroke="var(--color-stat)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>

        {/* Stats Summary */}
        <div className="flex flex-col gap-3 w-full md:w-1/2">
          {/* Stat List */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {chartData.map(({ stat, fullLabel, value }) => (
              <div
                key={stat}
                className={`flex justify-between px-3 py-1.5 rounded-md ${
                  value === topStat.value
                    ? 'bg-pokemon-primary/20 dark:bg-pokemon-primary/30 font-semibold'
                    : 'bg-neutral-200/50 dark:bg-neutral-800/50'
                }`}
              >
                <span className="text-neutral-600 dark:text-neutral-400">{fullLabel}</span>
                <span className={value === topStat.value ? 'text-pokemon-primary' : ''}>{value}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between px-3 py-2 rounded-md bg-neutral-300/50 dark:bg-neutral-700/50 font-semibold">
            <span>Total</span>
            <span>{total}</span>
          </div>

          {/* Top Stat Highlight */}
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-pokemon-primary">{topStat.fullLabel}</span> is the highest stat
          </div>
        </div>
      </div>
    </div>
  );
}
