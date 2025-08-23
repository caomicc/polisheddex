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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import StatsDisplay from './pokemon/stats-display';
import { BentoGrid, BentoGridNoLink } from './ui/bento-box';
import { PokemonSprite } from './pokemon/pokemon-sprite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export default function TeamBuilder() {
  const [team, setTeam] = useLocalStorage<PokemonEntry[]>('pokedex-team', DEFAULT_TEAM);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [essentialDataLoaded, setEssentialDataLoaded] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    // Progressive loading strategy: Load essential data first, then background data
    const loadEssentialData = async () => {
      try {
        // Load only Pokemon data first to show the team builder quickly
        await loadPokemonData();
        setEssentialDataLoaded(true);

        // Then load the rest in the background
        await Promise.all([loadMovesData(), loadAbilitiesData(), loadTypesData(), loadTypeChart()]);
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

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end max-w-xl md:max-w-5xl mx-auto mb-4">
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

      <div className="max-w-xl md:max-w-5xl mx-auto relative z-10 rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900 w-full">
        {!dataLoaded && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading additional features (moves, abilities, calculations)...
            </div>
          </div>
        )}

        {shareMessage && (
          <Card className="my-4">
            <CardContent className="pt-0">
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

        {/* <section aria-label="Team slots" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"> */}
        <Tabs defaultValue="0" className="mb-4" aria-label="Team slots">
          <TabsList className="w-full flex-col sm:flex-row h-auto md:h-9">
            {team.map((entry, i) => (
              <TabsTrigger
                key={i}
                value={`${i}`}
                className="text-xs data-[state=active]:bg-cyan-200 data-[state=active]:text-cyan-900 data-[state=active]:border-cyan-300 h-auto"
              >
                {entry.name ? entry.name : `Slot ${i + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>

          {team.map((entry, i) => (
            <TabsContent key={i} value={`${i}`} className="">
              <PokemonSlot index={i} entry={entry} onChange={(data) => handleUpdate(i, data)} />
            </TabsContent>
          ))}
        </Tabs>

        {/* Display calculated stats for each team member */}
        {team.some((entry) => entry.name) && (
          <>
            <Separator className="my-2" />
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="weakness-table">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Team Summary</h2>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <BentoGrid className="mx-auto md:auto-rows-auto md:grid-cols-3">
                    {team.map((entry, i) => {
                      if (!entry.name) return null;
                      return (
                        <BentoGridNoLink key={i}>
                          <div className="flex flex-row gap-4">
                            <PokemonSprite hoverAnimate pokemonName={entry.name} />
                            <div className="flex gap-0 flex-col">
                              <div className="font-bold">{entry.name}</div>
                              <div className="text-xs">{entry.nature}</div>
                              {entry.level && <div className="text-xs">Lv. {entry.level}</div>}
                              {entry.item && <div className="text-xs">Item: {entry.item}</div>}
                            </div>
                          </div>
                          <StatsDisplay
                            pokemonName={entry.name}
                            ivs={entry.ivs}
                            evs={entry.evs}
                            level={entry.level || 50}
                            nature={entry.nature}
                          />
                        </BentoGridNoLink>
                      );
                    })}
                  </BentoGrid>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}

        <Separator className="my-2" />

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="weakness-table">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Calculations</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {!dataLoaded && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                  Loading...
                </div>
              )}
              <CalculationsPanel team={team} disabled={isEmptyTeam || !dataLoaded} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
}
