'use client';

import { useState } from 'react';
import { DetailedStats } from '@/types/types';
import { TeamSlot } from './TeamSlot';
import { TeamAnalysis } from './TeamAnalysis';
import { PokemonSearchModal } from './PokemonSearchModal';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { useTeamSearchParams } from '@/hooks/use-team-search-params';

interface TeamBuilderClientProps {
  pokemonData: Record<string, DetailedStats>;
}

export function TeamBuilderClient({ pokemonData }: TeamBuilderClientProps) {
  const { showFaithful } = useFaithfulPreference();
  const { team, setPokemonInSlot, removePokemonFromSlot } = useTeamSearchParams(
    pokemonData,
    showFaithful,
  );
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    setSelectedSlot(index);
  };

  const handlePokemonSelect = (name: string, data: DetailedStats, formName?: string) => {
    if (selectedSlot !== null) {
      setPokemonInSlot(selectedSlot, name, data, formName);
      setSelectedSlot(null);
    }
  };

  const handleRemovePokemon = (index: number) => {
    removePokemonFromSlot(index);
  };

  const closeModal = () => {
    setSelectedSlot(null);
  };

  return (
    <div className="space-y-6">
      {/* Team Slots */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold mb-4">Your Team</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {team.map((pokemon, index) => (
            <TeamSlot
              key={index}
              pokemon={pokemon}
              slotNumber={index + 1}
              onSlotClick={() => handleSlotClick(index)}
              onRemove={() => handleRemovePokemon(index)}
            />
          ))}
        </div>
      </div>

      {/* Team Analysis */}
      <TeamAnalysis team={team} />

      {/* Pokemon Selection Modal */}
      {selectedSlot !== null && (
        <PokemonSearchModal
          pokemonData={pokemonData}
          onSelect={handlePokemonSelect}
          onClose={closeModal}
          currentTeam={team}
          showFaithful={showFaithful}
        />
      )}
    </div>
  );
}
