'use client';

import { useState } from 'react';
import { DetailedStats } from '@/types/types';
import { TeamSlot } from './TeamSlot';
import { TeamAnalysis } from './TeamAnalysis';
import { PokemonSearchModal } from './PokemonSearchModal';
import { SaveTeamModal } from './SaveTeamModal';
import { LoadTeamModal } from './LoadTeamModal';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { useTeamSearchParams } from '@/hooks/use-team-search-params';
import { Button } from '../ui/button';
import { Save, FolderOpen } from 'lucide-react';

interface TeamBuilderClientProps {
  pokemonData: Record<string, DetailedStats>;
}

export function TeamBuilderClient({ pokemonData }: TeamBuilderClientProps) {
  const { showFaithful } = useFaithfulPreference();
  const { team, setPokemonInSlot, removePokemonFromSlot, setTeamFromUrl } = useTeamSearchParams(
    pokemonData,
    showFaithful,
  );
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

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

  const handleSaveTeam = () => {
    setShowSaveModal(true);
  };

  const handleLoadTeam = (teamUrlParam: string) => {
    setTeamFromUrl(teamUrlParam);
  };

  const handleSaveComplete = () => {
    // Refresh any UI state if needed
  };

  // Check if team has any Pokemon for save button
  const hasAnyPokemon = team.some((pokemon) => pokemon !== null);

  return (
    <div className="space-y-6">
      {/* Team Slots */}
      <div className="">
        <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Your Team</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowLoadModal(true)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Load Team
            </Button>
            <Button
              onClick={handleSaveTeam}
              variant={'default'}
              className="flex items-center gap-2"
              disabled={!hasAnyPokemon}
            >
              <Save className="w-4 h-4" />
              Save Team
            </Button>
          </div>
        </div>
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

      {/* Save Team Modal */}
      <SaveTeamModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        teamPokemon={team.map((pokemon) =>
          pokemon ? { name: pokemon.name, formName: pokemon.formName } : null,
        )}
        onSave={handleSaveComplete}
      />

      {/* Load Team Modal */}
      <LoadTeamModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoadTeam={handleLoadTeam}
      />
    </div>
  );
}
