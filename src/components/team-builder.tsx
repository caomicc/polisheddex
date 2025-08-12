'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Upload, Download, Calculator, Share } from 'lucide-react';
import PokemonSlot, { type PokemonEntry } from './pokemon-slot';
import CalculationsPanel from './calculations-panel';
import { DEFAULT_TEAM, emptyPokemonEntry, loadPokemonData } from '@/lib/pokemon-data';
import { loadMovesData } from '@/lib/moves-data';
import { loadAbilitiesData } from '@/lib/abilities-data';
import { loadTypesData } from '@/lib/types-data';
import { loadTypeChart } from '@/lib/calculations';
import { useLocalStorage } from '@/lib/use-local-storage';
import { generateShareUrl, getTeamFromUrl, copyToClipboard } from '@/lib/team-url-sharing';

export default function TeamBuilder() {
  const [team, setTeam] = useLocalStorage<PokemonEntry[]>('pokedex-team', DEFAULT_TEAM);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load all the real data first
    const loadAllData = async () => {
      try {
        await Promise.all([
          loadPokemonData(),
          loadMovesData(),
          loadAbilitiesData(),
          loadTypesData(),
          loadTypeChart(),
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error('Failed to load data:', error);
        setDataLoaded(true); // Still set to true to show component with fallback data
      }
    };

    loadAllData();
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
    } else {
      // Ensure length is 6 for existing teams
      if (!team || team.length !== 6) {
        setTeam(new Array(6).fill(0).map(() => ({ ...emptyPokemonEntry })));
      }
    }
  }, [setTeam, team]);

  const handleUpdate = (index: number, data: Partial<PokemonEntry>) => {
    setTeam((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...data };
      return copy;
    });
  };

  const clearTeam = () => {
    setTeam(new Array(6).fill(0).map(() => ({ ...emptyPokemonEntry })));
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

  if (!dataLoaded) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Pokédex Team Builder</h1>
          <p className="text-muted-foreground mt-2">Loading Pokémon data...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Button variant="secondary" onClick={shareTeam} disabled={isEmptyTeam}>
          <Share className="mr-2 h-4 w-4" />
          Share Team
        </Button>
        <Button variant="secondary" onClick={() => setImporting((v) => !v)}>
          <Upload className="mr-2 h-4 w-4" />
          Import JSON
        </Button>
        <Button variant="secondary" onClick={exportTeam}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button variant="destructive" onClick={clearTeam}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Team
        </Button>
      </header>

      {shareMessage && (
        <Card className="my-4">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-green-600 dark:text-green-400">
              {shareMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {importing && (
        <Card className="my-4">
          <CardHeader>
            <CardTitle>Import Team JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste team.json content here"
              rows={6}
              className="w-full rounded-md border bg-background p-3 text-sm outline-none"
              aria-label="Import JSON"
            />
            <div className="mt-3 flex gap-2">
              <Button onClick={tryImport}>Import</Button>
              <Button variant="ghost" onClick={() => setImporting(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section aria-label="Team slots" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {team.map((entry, i) => (
          <PokemonSlot key={i} index={i} entry={entry} onChange={(data) => handleUpdate(i, data)} />
        ))}
      </section>

      <Separator className="my-8" />

      <section aria-label="Calculations" className="mb-10">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Calculations</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          See your team&apos;s defensive type weaknesses/resistances and offensive coverage based on
          selected move types.
        </p>
        <div className="mt-4">
          <CalculationsPanel team={team} disabled={isEmptyTeam} />
        </div>
      </section>
    </div>
  );
}
