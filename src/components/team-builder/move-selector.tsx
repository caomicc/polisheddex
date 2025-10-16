'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from 'react';
import { TeamPokemon } from '@/hooks/use-team-search-params';
// import { Move } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X } from 'lucide-react';
// import { PokemonType } from '@/types/types';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
// import movesData from '@/output/manifests/moves.json';

import movesData from '../../../new/moves_manifest.json';

interface MoveSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  pokemon: TeamPokemon;
  currentMoves: string[];
  onMovesUpdate: (moves: string[]) => void;
}

interface MoveOption {
  name: string;
  displayName: string;
  type: string;
  category: string;
  power?: number;
  accuracy?: number;
  pp?: number;
  description: string;
  source: 'level' | 'tm' | 'egg';
}

export function MoveSelector({
  isOpen,
  onClose,
  pokemon,
  currentMoves,
  onMovesUpdate,
}: MoveSelectorProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoves, setSelectedMoves] = useState<string[]>(currentMoves);

  // Get available moves for this Pokemon
  const availableMoves = useMemo((): MoveOption[] => {
    const moves: MoveOption[] = [];

    // Get form-specific moves or default to the first available form (usually 'plain')
    // Base pokemon data doesn't contain moves - all moves are in forms
    const formData =
      pokemon.formName && pokemon.data.forms?.[pokemon.formName]
        ? pokemon.data.forms[pokemon.formName]
        : pokemon.data.forms
          ? pokemon.data.forms[Object.keys(pokemon.data.forms)[0]]
          : pokemon.data;

    // Level-up moves - ensure we access the right properties
    const levelMoves = showFaithful
      ? formData.faithfulMoves || formData.moves
      : formData.updatedMoves || formData.moves;
    if (levelMoves) {
      levelMoves.forEach((move: any) => {
        const moveKey = move.name.toLowerCase().replace(/\s+/g, '-');
        const moveInfo = (movesData as any[]).find((m: any) => m.id === moveKey);
        if (moveInfo) {
          const version = showFaithful ? 'faithful' : 'polished';
          const typeInfo =
            moveInfo.versions?.[version] ||
            moveInfo.versions?.polished ||
            moveInfo.versions?.faithful;
          moves.push({
            name: moveKey,
            displayName: move.name,
            type: typeInfo?.type || 'Normal',
            category: typeInfo?.category || 'Status',
            power: typeInfo?.power,
            accuracy: typeInfo?.accuracy,
            pp: typeInfo?.pp,
            description: typeInfo?.description || '',
            source: 'level',
          });
        }
      });
    }

    // TM/HM moves
    if (formData.tmHmMoves) {
      formData.tmHmMoves.forEach((move: any) => {
        const moveKey = move.name.toLowerCase().replace(/\s+/g, '-');
        const moveInfo = (movesData as any[]).find((m: any) => m.id === moveKey);
        if (moveInfo && !moves.find((m) => m.name === moveKey)) {
          const version = showFaithful ? 'faithful' : 'polished';
          const typeInfo =
            moveInfo.versions?.[version] ||
            moveInfo.versions?.polished ||
            moveInfo.versions?.faithful;
          moves.push({
            name: moveKey,
            displayName: move.name,
            type: typeInfo?.type || move.type || 'Normal',
            category: typeInfo?.category || move.category || 'Status',
            power: typeInfo?.power || move.power,
            accuracy: typeInfo?.accuracy || move.accuracy,
            pp: typeInfo?.pp || move.pp,
            description: typeInfo?.description || move.description || '',
            source: 'tm',
          });
        }
      });
    }

    // Egg moves
    if (formData.eggMoves) {
      formData.eggMoves.forEach((moveName: string) => {
        const moveKey = moveName.toLowerCase().replace(/\s+/g, '-');
        const moveInfo = (movesData as any[]).find((m: any) => m.id === moveKey);
        if (moveInfo && !moves.find((m) => m.name === moveKey)) {
          const version = showFaithful ? 'faithful' : 'polished';
          const typeInfo =
            moveInfo.versions?.[version] ||
            moveInfo.versions?.polished ||
            moveInfo.versions?.faithful;
          moves.push({
            name: moveKey,
            displayName: moveName,
            type: typeInfo?.type || 'Normal',
            category: typeInfo?.category || 'Status',
            power: typeInfo?.power,
            accuracy: typeInfo?.accuracy,
            pp: typeInfo?.pp,
            description: typeInfo?.description || '',
            source: 'egg',
          });
        }
      });
    }

    return moves;
  }, [pokemon, showFaithful]);

  // Filter moves based on search term
  const filteredMoves = useMemo(() => {
    if (!searchTerm) return availableMoves;

    const term = searchTerm.toLowerCase();
    return availableMoves.filter(
      (move) =>
        move.displayName.toLowerCase().includes(term) ||
        move.type.toLowerCase().includes(term) ||
        move.category.toLowerCase().includes(term),
    );
  }, [availableMoves, searchTerm]);

  const handleMoveToggle = (moveName: string) => {
    if (selectedMoves.includes(moveName)) {
      setSelectedMoves(selectedMoves.filter((m) => m !== moveName));
    } else if (selectedMoves.length < 4) {
      setSelectedMoves([...selectedMoves, moveName]);
    }
  };

  const handleSave = () => {
    onMovesUpdate(selectedMoves);
    onClose();
  };

  const handleCancel = () => {
    setSelectedMoves(currentMoves);
    onClose();
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'level':
        return 'bg-green-100 text-green-800';
      case 'tm':
        return 'bg-blue-100 text-blue-800';
      case 'egg':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Select Moves for {pokemon.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {/* Selected moves display */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Selected Moves ({selectedMoves.length}/4)</h3>
            <div className="flex gap-2 flex-wrap min-h-[40px] p-2 border rounded-md bg-gray-50">
              {selectedMoves.map((moveName) => {
                const move = availableMoves.find((m) => m.name === moveName);
                return move ? (
                  <div
                    key={moveName}
                    className="flex items-center gap-1 bg-white px-2 py-1 rounded border"
                  >
                    <Badge variant={move.type.toLowerCase() as any} className="text-xs">
                      {move.type}
                    </Badge>
                    <span className="text-sm">{move.displayName}</span>
                    <button
                      onClick={() => handleMoveToggle(moveName)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search moves by name, type, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Available moves */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {filteredMoves.map((move) => (
                <div
                  key={move.name}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMoves.includes(move.name)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleMoveToggle(move.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={move.type.toLowerCase() as any} className="text-xs">
                          {move.type}
                        </Badge>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getSourceBadgeColor(move.source)}`}
                        >
                          {move.source.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{move.displayName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {move.power && <span>Power: {move.power}</span>}
                      {move.accuracy && (
                        <span>
                          Acc:{' '}
                          {String(move.accuracy) === '--' ? (
                            <span className="text-cell text-cell-muted">—</span>
                          ) : (
                            `${move.accuracy}%`
                          )}
                        </span>
                      )}
                      {move.pp && <span>PP: {move.pp}</span>}
                      <span className="capitalize">{move.category}</span>
                      {selectedMoves.includes(move.name) ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : selectedMoves.length < 4 ? (
                        <Plus className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-gray-400">Full</span>
                      )}
                    </div>
                  </div>
                  {move.description && (
                    <p className="text-sm text-gray-600 mt-1">{move.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Moves</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
