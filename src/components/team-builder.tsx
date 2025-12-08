'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Upload, Download, Calculator, Share, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import PokemonSlot, { type PokemonEntry, emptyPokemonEntry } from './pokemon-slot';
import CalculationsPanel from './calculations-panel';
import { useLocalStorage } from '@/lib/use-local-storage';
import { generateShareUrl, getTeamFromUrl, copyToClipboard } from '@/lib/team-url-sharing';
import { PokemonSprite } from './pokemon/pokemon-sprite';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export default function TeamBuilder() {
  const [team, setTeam] = useLocalStorage<PokemonEntry[]>('pokedex-team', []);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [essentialDataLoaded, setEssentialDataLoaded] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    // Progressive loading strategy: Load essential data first, then background data
    const loadEssentialData = async () => {
      try {
        // Load only Pokemon data first to show the team builder quickly
        // await loadPokemonData();
        setEssentialDataLoaded(true);

        // Then load the rest in the background
        // await Promise.all([loadMovesData(), loadAbilitiesData(), loadTypesData(), loadTypeChart()]);
        setDataLoaded(true);
      } catch (error) {
        console.error('Failed to load data:', error);
        setEssentialDataLoaded(true);
        setDataLoaded(true);
      }
    };

    loadEssentialData();
  }, []);

  useEffect(() => {
    // Check for shared team in URL first, only run once on mount
    const sharedTeam = getTeamFromUrl();
    if (sharedTeam) {
      setTeam(sharedTeam);
      // Clear the URL parameter after loading
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('team');
        window.history.replaceState({}, '', url.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleUpdate = (index: number, data: Partial<PokemonEntry>) => {
    setTeam((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...data };
      return copy;
    });
  };

  const clearTeam = () => {
    setTeam([]);
  };

  const exportTeam = () => {
    const payload = JSON.stringify(team, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tryImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed) && parsed.length === 6) {
        setTeam(parsed);
        setImporting(false);
        setImportText('');
      } else {
        alert('Invalid format. Expecting an array of 6 Pokémon entries.');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      alert('Failed to parse JSON.');
    }
  };

  const shareTeam = async () => {
    try {
      const shareUrl = generateShareUrl(team);
      const success = await copyToClipboard(shareUrl);

      if (success) {
        setShareMessage('Share URL copied to clipboard!');
        setTimeout(() => setShareMessage(null), 3000);
      } else {
        setShareMessage('Failed to copy URL. Please try again.');
        setTimeout(() => setShareMessage(null), 3000);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Cannot share an empty team') {
        setShareMessage('Cannot share an empty team. Add some Pokémon first!');
      } else {
        setShareMessage('Failed to generate share URL. Please try again.');
      }
      setTimeout(() => setShareMessage(null), 3000);
    }
  };

  const isEmptyTeam = useMemo(
    () => team.every((p) => !p.name && !p.types[0] && !p.moves.some((m) => m.name || m.type)),
    [team],
  );

  if (!essentialDataLoaded) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Pokédex Team Builder</h1>
          <p className="text-muted-foreground mt-2">
            Loading Pokémon data... This could take a second!
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to format pokemon name for sprite
  const formatPokemonNameForSprite = (name: string) => {
    if (!name) return 'egg';
    return name
      .toLowerCase()
      .replace(/\s*\(([^)]+)\)/g, '_$1')
      .replace(/\s+/g, '');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Compact Header Toolbar */}
      <header className="flex flex-wrap gap-2 items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Team Builder</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={shareTeam} disabled={isEmptyTeam}>
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Share</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setImporting((v) => !v)}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Import</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={exportTeam}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Export</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={clearTeam} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Clear</span>
          </Button>
        </div>
      </header>

      {/* Share/Import Messages */}
      {shareMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 text-center">
          {shareMessage}
        </div>
      )}

      {importing && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Import Team JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste team.json content here"
              rows={4}
              className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none"
              aria-label="Import JSON"
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={tryImport}>Import</Button>
              <Button size="sm" variant="ghost" onClick={() => setImporting(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Team Strip - Always Visible */}
      <div className="bg-card border border-border rounded-xl p-3 mb-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {team.map((entry, i) => (
            <button
              key={i}
              onClick={() => setSelectedSlot(selectedSlot === i ? null : i)}
              className={cn(
                'relative flex flex-col items-center p-2 rounded-lg transition-all',
                'hover:bg-accent/50 cursor-pointer',
                selectedSlot === i && 'ring-2 ring-primary bg-accent',
                !entry.name && 'border-2 border-dashed border-muted-foreground/30'
              )}
            >
              {entry.name ? (
                <>
                  <PokemonSprite
                    pokemonName={formatPokemonNameForSprite(entry.name)}
                    size="sm"
                    className="shadow-none"
                    primaryType={entry.types?.[0] || 'normal'}
                  />
                  <span className="text-xs font-medium mt-1 truncate w-full text-center">
                    {entry.name.replace(/\s*\([^)]+\)/g, '')}
                  </span>
                  <div className="flex gap-0.5 mt-0.5">
                    {entry.types?.[0] && (
                      <Badge variant={entry.types[0].toLowerCase()} className="text-[10px] px-1 py-0">
                        {entry.types[0].slice(0, 3)}
                      </Badge>
                    )}
                    {entry.types?.[1] && entry.types[1] !== entry.types[0] && (
                      <Badge variant={entry.types[1].toLowerCase()} className="text-[10px] px-1 py-0">
                        {entry.types[1].slice(0, 3)}
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-16">
                  <Plus className="h-6 w-6 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground mt-1">Slot {i + 1}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pokemon Editor - Always visible, shows placeholder or content */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 min-h-[400px]">
        {selectedSlot !== null ? (
          <PokemonSlot
            index={selectedSlot}
            entry={team[selectedSlot]}
            onChange={(data) => handleUpdate(selectedSlot, data)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-muted-foreground">
            <div className="text-6xl mb-4">👆</div>
            <p className="text-lg font-medium">Select a slot to edit</p>
            <p className="text-sm mt-1">Click on any of the 6 slots above to add or edit a Pokémon</p>
          </div>
        )}
      </div>

      {/* Team Analysis Section */}
      {team.some((entry) => entry.name) && (
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <span className="font-semibold">Team Analysis</span>
            </div>
            {showAnalysis ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {showAnalysis && (
            <div className="p-4 pt-0 border-t">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {team.map((entry, i) => {
                  if (!entry.name) return null;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedSlot(i)}
                    >
                      <PokemonSprite
                        pokemonName={formatPokemonNameForSprite(entry.name)}
                        size="sm"
                        className="shadow-none flex-shrink-0"
                        primaryType={entry.types?.[0] || 'normal'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{entry.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.ability && <span>{entry.ability}</span>}
                          {entry.nature && <span> • {entry.nature}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.item && <span>🎒 {entry.item}</span>}
                          {entry.level && <span className="ml-2">Lv.{entry.level}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              {/* Calculations Panel */}
              <CalculationsPanel team={team} disabled={isEmptyTeam || !dataLoaded} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
