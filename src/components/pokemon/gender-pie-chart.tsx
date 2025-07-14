'use client';

import { Pie, PieChart } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  male: {
    label: 'Male',
    color: '#3b82f6', // blue-500
  },
  female: {
    label: 'Female',
    color: '#f472b6', // pink-400
  },
} satisfies ChartConfig;

interface GenderPieChartProps {
  male: number;
  female: number;
  genderless?: number;
}

export function GenderPieChart({ male, female, genderless }: GenderPieChartProps) {
  const data = [
    {
      label: 'Male',
      value: male,
      fill: '#3b82f6', // blue-500
    },
    {
      label: 'Female',
      value: female,
      fill: '#f472b6', // pink-400
    },
    {
      label: 'Genderless',
      value: genderless,
      fill: '#9ca3af', // gray-400
    },
  ];

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={6} />
      </PieChart>
    </ChartContainer>
  );
}
