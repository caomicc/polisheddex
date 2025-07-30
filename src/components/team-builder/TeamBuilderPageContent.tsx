'use client';

import { useState, useEffect } from 'react';
import { TeamBuilderClient } from './TeamBuilderClient';
import { DetailedStats } from '@/types/types';

export function TeamBuilderPageContent() {
  const [pokemonData, setPokemonData] = useState<Record<string, DetailedStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simple client-side fetch, no need for complex loader
        const response = await fetch('/output/pokemon_base_data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPokemonData(data);
      } catch (err) {
        console.error('Failed to load Pokemon data:', err);
        setError('Failed to load Pokemon data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-xl md:max-w-4xl mx-auto md:p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading Pokemon data...</div>
        </div>
      </div>
    );
  }

  if (error || !pokemonData) {
    return (
      <div className="max-w-xl md:max-w-4xl mx-auto md:p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-red-600">{error || 'Failed to load Pokemon data'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto md:p-4">
      <TeamBuilderClient pokemonData={pokemonData} />
    </div>
  );
}
