'use client';

import { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import {
  getSavedTeams,
  deleteTeam,
  SavedTeam,
  SavedTeamPokemon,
  formatTeamForUrl,
} from '@/utils/team-storage';

interface LoadTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTeam: (teamUrlParam: string) => void;
}

export function LoadTeamModal({ isOpen, onClose, onLoadTeam }: LoadTeamModalProps) {
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = () => {
    setLoading(true);
    const teams = getSavedTeams();
    setSavedTeams(teams);
    setLoading(false);
  };

  const handleLoadTeam = (team: SavedTeam) => {
    const teamParam = formatTeamForUrl(team.pokemon);
    onLoadTeam(teamParam);
    onClose();
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (confirm(`Are you sure you want to delete "${teamName}"?`)) {
      const result = deleteTeam(teamId);
      if (result.success) {
        loadTeams(); // Refresh the list
      } else {
        alert('Failed to delete team: ' + (result.error || 'Unknown error'));
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPokemonSummary = (pokemon: (SavedTeamPokemon | null)[]) => {
    const validPokemon = pokemon.filter((p) => p !== null);
    if (validPokemon.length === 0) return 'Empty team';

    const names = validPokemon.slice(0, 3).map((p) => {
      const displayName = p.formName
        ? `${p.name} (${p.formName.charAt(0).toUpperCase() + p.formName.slice(1)})`
        : p.name.charAt(0).toUpperCase() + p.name.slice(1);
      return displayName;
    });

    if (validPokemon.length > 3) {
      names.push(`+${validPokemon.length - 3} more`);
    }

    return names.join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Load Saved Team</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading teams...</div>
            </div>
          ) : savedTeams.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">No saved teams</div>
              <div className="text-sm text-gray-400">Save your current team to see it here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {savedTeams.map((team) => (
                <div
                  key={team.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1">{team.name}</h4>
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        {getPokemonSummary(team.pokemon)}
                      </p>
                      <div className="flex items-center text-xs text-gray-400 gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Saved {formatDate(team.createdAt)}</span>
                        {team.updatedAt !== team.createdAt && (
                          <span> • Updated {formatDate(team.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button onClick={() => handleLoadTeam(team)} size="sm">
                        Load
                      </Button>
                      <Button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
