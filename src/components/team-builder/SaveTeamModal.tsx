'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { saveTeam, SavedTeamPokemon } from '@/utils/team-storage';

interface SaveTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamPokemon: (SavedTeamPokemon | null)[];
  onSave: () => void;
}

export function SaveTeamModal({ isOpen, onClose, teamPokemon, onSave }: SaveTeamModalProps) {
  const [teamName, setTeamName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = saveTeam(teamName.trim(), teamPokemon);

    if (result.success) {
      onSave();
      setTeamName('');
      onClose();
    } else {
      setError(result.error || 'Failed to save team');
    }

    setIsSaving(false);
  };

  const handleClose = () => {
    setTeamName('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3>Save Team</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <Input
              id="team-name"
              type="text"
              placeholder="Enter team name..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full"
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              variant="destructive"
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant={'default'}
              className="flex-1 flex items-center gap-2"
              disabled={isSaving || !teamName.trim()}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Team'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
