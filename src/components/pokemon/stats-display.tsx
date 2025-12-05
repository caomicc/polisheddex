'use client';

import React, { useState, useEffect } from 'react';
import { StatData, calculateActualStats, type NatureModifiers } from './stat-hexagon';
import { Nature, NATURE_DATA, type IVs, type EVs } from '../pokemon-slot';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { Progress } from '../ui/progress';

interface StatsDisplayProps {
  pokemonName?: string;
  ivs?: IVs;
  evs?: EVs;
  level?: number;
  nature?: Nature;
}

const defaultStats: StatData = {
  hp: 0,
  attack: 0,
  defense: 0,
  spatk: 0,
  spdef: 0,
  speed: 0,
};

// Convert IVs/EVs to StatData format (they should already match, but this ensures compatibility)
function convertToStatData(stats?: IVs | EVs): StatData {
  if (!stats) return defaultStats;
  return {
    hp: stats.hp || 0,
    attack: stats.attack || 0,
    defense: stats.defense || 0,
    spatk: stats.spatk || 0,
    spdef: stats.spdef || 0,
    speed: stats.speed || 0,
  };
}

// Convert Nature to NatureModifiers
function getNatureModifiers(nature?: Nature): NatureModifiers {
  if (!nature) {
    return { attack: 1, defense: 1, spatk: 1, spdef: 1, speed: 1 };
  }

  const natureData = NATURE_DATA[nature];
  const modifiers: NatureModifiers = { attack: 1, defense: 1, spatk: 1, spdef: 1, speed: 1 };

  if (natureData.increased) {
    modifiers[natureData.increased] = 1.1;
  }
  if (natureData.decreased) {
    modifiers[natureData.decreased] = 0.9;
  }

  return modifiers;
}

// Normalize pokemon name to file path format and extract form
function normalizePokemonId(name: string): { id: string; form: string } {
  // Handle form names like "Slowking (Galarian)" -> id: "slowking", form: "galarian"
  const formMatch = name.match(/\(([^)]+)\)/);
  const form = formMatch ? formMatch[1].toLowerCase().replace(/\s+/g, '') : 'plain';

  // Remove the form indicator to get base name
  const baseName = name.replace(/\s*\(.*?\)/g, '').trim();

  const id = baseName
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return { id, form };
}

export default function StatsDisplay({
  pokemonName,
  ivs,
  evs,
  level = 50,
  nature,
}: StatsDisplayProps) {
  const [baseStats, setBaseStats] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(false);
  const { showFaithful } = useFaithfulPreferenceSafe();

  useEffect(() => {
    if (!pokemonName) {
      setBaseStats(null);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const { id, form } = normalizePokemonId(pokemonName);
        const res = await fetch(`/new/pokemon/${id}.json`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        const version = showFaithful ? 'faithful' : 'polished';
        // Try to get the specific form, fall back to plain if not found
        const formData =
          data.versions?.[version]?.forms?.[form] || data.versions?.[version]?.forms?.plain;
        const rawStats = formData?.baseStats;

        if (rawStats) {
          // Map from JSON format (specialAttack/specialDefense) to StatData format (spatk/spdef)
          setBaseStats({
            hp: rawStats.hp || 0,
            attack: rawStats.attack || 0,
            defense: rawStats.defense || 0,
            spatk: rawStats.specialAttack || 0,
            spdef: rawStats.specialDefense || 0,
            speed: rawStats.speed || 0,
          });
        } else {
          setBaseStats(null);
        }
      } catch (error) {
        console.error('Failed to load stats for', pokemonName, error);
        setBaseStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [pokemonName, showFaithful]);

  if (!pokemonName) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-2 p-2 bg-muted/50 rounded-lg">
        <div className="text-xs text-muted-foreground">Loading stats...</div>
      </div>
    );
  }

  if (!baseStats) {
    return (
      <div className="mt-2 p-2 bg-muted/50 rounded-lg">
        <div className="text-xs text-muted-foreground">Could not load stats</div>
      </div>
    );
  }

  const natureModifiers = getNatureModifiers(nature);

  const calculatedStats = calculateActualStats(
    baseStats,
    convertToStatData(ivs),
    convertToStatData(evs),
    level,
    natureModifiers,
  );

  return (
    <div className="mt-2 p-2 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm relative">
        <div>
          <div className="flex justify-between">
            <span className="label-text">HP:</span>
            <span className="font-mono font-medium">{calculatedStats.hp}</span>
          </div>
          <Progress value={calculatedStats.hp / 5} max={500} />
        </div>
        <div>
          <div className="flex justify-between">
            <span className="label-text">Att:</span>
            <span className="font-mono font-medium">{calculatedStats.attack}</span>
          </div>
          <Progress value={calculatedStats.attack / 5} max={500} />
        </div>
        <div>
          <div className="flex justify-between">
            <span className="label-text">Def:</span>
            <span className="font-mono font-medium">{calculatedStats.defense}</span>
          </div>
          <Progress value={calculatedStats.defense / 5} max={500} />
        </div>
        <div>
          <div className="flex justify-between">
            <span className="label-text">SpA:</span>
            <span className="font-mono font-medium">{calculatedStats.spatk}</span>
          </div>
          <Progress value={calculatedStats.spatk / 5} max={500} />
        </div>
        <div>
          <div className="flex justify-between">
            <span className="label-text">SpD:</span>
            <span className="font-mono font-medium">{calculatedStats.spdef}</span>
          </div>
          <Progress value={calculatedStats.spdef / 5} max={500} />
        </div>
        <div>
          <div className="flex justify-between">
            <span className="label-text">Spe:</span>
            <span className="font-mono font-medium">{calculatedStats.speed}</span>
          </div>
          <Progress value={calculatedStats.speed / 5} max={500} />
        </div>
      </div>
    </div>
  );
}
