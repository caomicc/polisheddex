'use client';

import React from 'react';

export interface StatData {
  hp: number;
  attack: number;
  defense: number;
  spatk: number;
  spdef: number;
  speed: number;
}

// Nature multipliers
export type NatureModifiers = {
  attack: number;
  defense: number;
  spatk: number;
  spdef: number;
  speed: number;
};

const neutralNature: NatureModifiers = {
  attack: 1,
  defense: 1,
  spatk: 1,
  spdef: 1,
  speed: 1,
};

const MAX_IV = 31;
const MAX_EV = 252;
const MAX_TOTAL_EV = 510;

export const calculateActualStats = (
  base: StatData,
  ivs: StatData,
  evs: StatData,
  level: number,
  nature: NatureModifiers = neutralNature,
): StatData => {
  const calc = (
    stat: keyof StatData,
    baseVal: number,
    iv: number,
    ev: number,
    modifier: number = 1,
  ) => {
    if (stat === 'hp') {
      return Math.floor(((2 * baseVal + iv + Math.floor(ev / 4)) * level) / 100 + level + 10);
    } else {
      return Math.floor(
        Math.floor(((2 * baseVal + iv + Math.floor(ev / 4)) * level) / 100 + 5) * modifier,
      );
    }
  };

  return {
    hp: calc('hp', base.hp, ivs.hp, evs.hp),
    attack: calc('attack', base.attack, ivs.attack, evs.attack, nature.attack),
    defense: calc('defense', base.defense, ivs.defense, evs.defense, nature.defense),
    spatk: calc('spatk', base.spatk, ivs.spatk, evs.spatk, nature.spatk),
    spdef: calc('spdef', base.spdef, ivs.spdef, evs.spdef, nature.spdef),
    speed: calc('speed', base.speed, ivs.speed, evs.speed, nature.speed),
  };
};

export const estimateIV = (
  stat: keyof StatData,
  observed: number,
  base: number,
  ev: number,
  level: number,
  natureModifier: number = 1,
): number[] => {
  const possibleIVs: number[] = [];

  for (let iv = 0; iv <= MAX_IV; iv++) {
    let calc: number;
    if (stat === 'hp') {
      calc = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + level + 10);
    } else {
      calc = Math.floor(
        Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + 5) * natureModifier,
      );
    }
    if (calc === observed) {
      possibleIVs.push(iv);
    }
  }

  return possibleIVs;
};

export const validateEVs = (evs: StatData): boolean => {
  const total = evs.hp + evs.attack + evs.defense + evs.spatk + evs.spdef + evs.speed;
  if (total > MAX_TOTAL_EV) return false;
  return Object.values(evs).every((ev) => ev >= 0 && ev <= MAX_EV);
};

export const validateIVs = (ivs: StatData): boolean => {
  return Object.values(ivs).every((iv) => iv >= 0 && iv <= MAX_IV);
};

export const validateLevel = (level: number): boolean => {
  return level >= 1 && level <= 100;
};

// ----------------- StatHexagon UI -----------------

export interface StatHexagonProps {
  baseStats?: StatData;
  ivs?: StatData;
  evs?: StatData;
  level?: number;
  nature?: NatureModifiers;
  maxValue?: number;
  showLabels?: boolean;
  size?: number;
  className?: string;
  title?: string;
  showLayers?: {
    base?: boolean;
    ivs?: boolean;
    evs?: boolean;
    total?: boolean;
  };
}

export const STAT_POSITIONS = {
  hp: { angle: 0, label: 'HP' },
  attack: { angle: 60, label: 'Attack' },
  defense: { angle: 120, label: 'Defense' },
  speed: { angle: 180, label: 'Speed' },
  spdef: { angle: 240, label: 'Sp. Def' },
  spatk: { angle: 300, label: 'Sp. Atk' },
} as const;

const DEFAULT_STATS: StatData = { hp: 0, attack: 0, defense: 0, spatk: 0, spdef: 0, speed: 0 };

export default function StatHexagon({
  baseStats = DEFAULT_STATS,
  ivs = DEFAULT_STATS,
  evs = DEFAULT_STATS,
  level = 50,
  nature = neutralNature,
  maxValue = 400,
  showLabels = true,
  size = 200,
  className = '',
  title,
  showLayers = { base: true, ivs: true, evs: true, total: true },
}: StatHexagonProps) {
  const center = size / 2;
  const radius = size / 2 - 40;
  const innerRadius = radius * 0.1;

  // NEW: Use improved formula with validation + passed nature
  const actualStats = calculateActualStats(baseStats, ivs, evs, level, nature);

  // Convert angle to radians and get x,y coordinates
  const getCoordinates = (angle: number, distance: number) => {
    const radians = (angle - 90) * (Math.PI / 180); // -90 to start from top
    return {
      x: center + distance * Math.cos(radians),
      y: center + distance * Math.sin(radians),
    };
  };

  // Create hexagon background grid lines
  const createGridLines = () => {
    const lines: React.ReactElement[] = [];
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

    gridLevels.forEach((level, index) => {
      const points = Object.values(STAT_POSITIONS)
        .map(({ angle }) => {
          const coords = getCoordinates(angle, radius * level);
          return `${coords.x},${coords.y}`;
        })
        .join(' ');

      lines.push(
        <polygon
          key={`grid-${index}`}
          points={points}
          fill="none"
          stroke="oklch(86.9% 0.022 252.894)"
          strokeWidth="1"
          opacity={0.3}
        />,
      );
    });

    return lines;
  };

  // Create stat data polygon with value points
  const createStatPolygonWithValues = (
    statData: StatData,
    color: string,
    opacity: number = 0.3,
    strokeWidth: number = 2,
    id?: string,
    showValues: boolean = false,
    valueSize: number = 6,
    layerName?: string,
    displayValues?: StatData, // Optional separate values for display (used for IV scaling)
  ) => {
    const points = Object.entries(STAT_POSITIONS)
      .map(([statKey, { angle }]) => {
        const statValue = statData[statKey as keyof StatData];
        const normalizedValue = Math.min(statValue / maxValue, 1);
        const distance = statValue === 0 ? 0 : innerRadius + (radius - innerRadius) * normalizedValue;
        const coords = getCoordinates(angle, distance);
        return `${coords.x},${coords.y}`;
      })
      .join(' ');

    const elements = [];

    // Add the polygon
    elements.push(
      <polygon
        key={`polygon-${id}`}
        points={points}
        fill={color}
        fillOpacity={opacity}
        stroke={color}
        strokeWidth={strokeWidth}
      />,
    );

    // Add value points if requested
    if (showValues) {
      Object.entries(STAT_POSITIONS).forEach(([statKey, { angle }]) => {
        const statValue = statData[statKey as keyof StatData];
        const displayValue = displayValues ? displayValues[statKey as keyof StatData] : statValue;
        if (statValue === 0) return; // Don't show points for zero values

        const normalizedValue = Math.min(statValue / maxValue, 1);
        const distance = statValue === 0 ? 0 : innerRadius + (radius - innerRadius) * normalizedValue;
        const coords = getCoordinates(angle, Math.max(distance, statValue === 0 ? 0 : innerRadius + 10));

        elements.push(
          <g key={`value-${id}-${statKey}`} className="group">
            {/* Invisible hover area */}
            <circle
              cx={coords.x}
              cy={coords.y}
              r="12"
              fill="transparent"
              className="cursor-pointer"
            />

            {/* Visible value circle */}
            <circle
              cx={coords.x}
              cy={coords.y}
              r={valueSize}
              fillOpacity={opacity}
              fill={color}
              stroke={color}
              strokeWidth="1"
              className="transition-all duration-200 group-hover:opacity-80"
            />

            {/* Value text */}
            <text
              x={coords.x}
              y={coords.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-bold fill-foreground pointer-events-none"
              // style={{ fontSize: `${Math.max(8, valueSize)}px` }}
            >
              {displayValue}
            </text>

            {/* Tooltip */}
            <g className="z-100 relative opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {/* Tooltip background */}
              <rect
                x={coords.x - 40}
                y={angle > 90 && angle < 270 ? coords.y + 15 : coords.y - 35}
                width="80"
                height="20"
                rx="4"
                fill="rgb(31, 41, 55)"
                stroke="rgb(75, 85, 99)"
                strokeWidth="1"
                filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
              />

              {/* Tooltip text */}
              <text
                x={coords.x}
                y={angle > 90 && angle < 270 ? coords.y + 28 : coords.y - 22}
                textAnchor="middle"
                className="text-xs fill-white font-medium"
              >
                {layerName}: {displayValue}
              </text>
            </g>
          </g>,
        );
      });
    }

    return elements;
  };

  // Create axis lines from center to each stat position
  const createAxisLines = () => {
    return Object.values(STAT_POSITIONS).map(({ angle }, index) => {
      const outerCoords = getCoordinates(angle, radius);
      return (
        <line
          key={`axis-${index}`}
          x1={center}
          y1={center}
          x2={outerCoords.x}
          y2={outerCoords.y}
          stroke="oklch(86.9% 0.022 252.894)"
          strokeWidth="1"
          opacity={0.5}
        />
      );
    });
  };

  // Create just the stat labels
  const createStatLabels = () => {
    if (!showLabels) return [];

    return Object.entries(STAT_POSITIONS).map(([statKey, { angle, label }]) => {
      const labelDistance = radius + 30;
      const labelCoords = getCoordinates(angle, labelDistance);

      return (
        <text
          key={`label-${statKey}`}
          x={labelCoords.x}
          y={labelCoords.y}
          textAnchor="middle"
          className="label-text relative z-10 fill-neutral-700 dark:fill-neutral-300"
        >
          {label}
        </text>
      );
    });
  };

  const layers = [];

  // IV layer (light blue) - scale IVs to maxValue for visual positioning
  if (showLayers.ivs) {
    // Scale IV values (0-31) to the same visual scale as other stats (relative to maxValue)
    const scaledIVs: StatData = {
      hp: ivs.hp * 10, // Scale HP IVs to half maxValue for better visibility
      attack: ivs.attack * 10,
      defense: ivs.defense * 10,
      spatk: ivs.spatk * 10,
      spdef: ivs.spdef * 10,
      speed: ivs.speed * 10,
    };

    layers.push(
      ...createStatPolygonWithValues(
        scaledIVs,
        'oklch(71.8% 0.202 349.761)',
        0.2,
        1,
        'ivs',
        true,
        8,
        'IV',
        ivs, // Pass original IV values for display
      ),
    );
  }

  // Total stats layer (main blue)
  if (showLayers.total) {
    layers.push(
      ...createStatPolygonWithValues(
        actualStats,
        'oklch(67.3% 0.182 276.935)',
        0.2,
        1,
        'total',
        true,
        8,
        'Total',
      ),
    );
  }

  // Base stats layer (light gray)
  if (showLayers.base) {
    layers.push(
      ...createStatPolygonWithValues(
        baseStats,
        'rgb(156, 163, 175)',
        0.2,
        1,
        'base',
        true,
        8,
        'Base',
      ),
    );
  }

  // EV layer (yellow/orange) - show EV contribution values (EV/4)
  if (showLayers.evs) {
    const evContribution: StatData = {
      hp: Math.floor(evs.hp / 1),
      attack: Math.floor(evs.attack / 1),
      defense: Math.floor(evs.defense / 1),
      spatk: Math.floor(evs.spatk / 1),
      spdef: Math.floor(evs.spdef / 1),
      speed: Math.floor(evs.speed / 1),
    };
    layers.push(
      ...createStatPolygonWithValues(
        evContribution,
        'oklch(70.2% 0.183 293.541)',
        0.2,
        1,
        'evs',
        true,
        8,
        'EV',
      ),
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      )}
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="overflow-visible drop-shadow-sm"
          style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))' }}
        >
          {/* Background grid */}
          {createGridLines()}

          {/* Axis lines */}
          {createAxisLines()}

          {/* Stat polygons (layered) */}
          {layers}

          {/* Center point */}
          <circle
            cx={center}
            cy={center}
            r="3"
            fill="rgb(107, 114, 128)"
            stroke="white"
            strokeWidth="1"
          />

          {/* Stat labels */}
          {createStatLabels()}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md border border-border">
        {showLayers.base && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-400 rounded-sm shadow-sm"></div>
            <span className="text-gray-600 dark:text-gray-300">Base</span>
          </div>
        )}
        {showLayers.ivs && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-pink-400 rounded-sm shadow-sm"></div>
            <span className="text-gray-600 dark:text-gray-300">IVs</span>
          </div>
        )}
        {showLayers.evs && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-violet-400 rounded-sm shadow-sm"></div>
            <span className="text-gray-600 dark:text-gray-300">EVs</span>
          </div>
        )}
        {showLayers.total && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-indigo-500 rounded-sm shadow-sm"></div>
            <span className="text-gray-600 dark:text-gray-300">Total</span>
          </div>
        )}
      </div>
    </div>
  );
}
