'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import TypeBadge from './type-badge';
import type { PokemonEntry } from './pokemon-slot';
import { TYPES } from '@/lib/types-data';
import { computeDefensiveSummary, computeOffensiveCoverage } from '@/lib/calculations';

export default function CalculationsPanel({
  team,
  disabled,
}: {
  team: PokemonEntry[];
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Alert>
        <AlertTitle>No data yet</AlertTitle>
        <AlertDescription>
          Add at least one Pokémon with types or moves to see calculations.
        </AlertDescription>
      </Alert>
    );
  }

  const defensive = computeDefensiveSummary(team);
  const offensive = computeOffensiveCoverage(team);

  const maxWeak = Math.max(...TYPES.map((t) => defensive[t]?.weak ?? 0));

  return (
    <Tabs defaultValue="defensive">
      <TabsList>
        <TabsTrigger value="defensive">Defensive</TabsTrigger>
        <TabsTrigger value="offensive">Offensive</TabsTrigger>
      </TabsList>

      <TabsContent value="defensive" className="mt-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-x-auto">
            <Table>
              <TableCaption>Team defensive profile by attacking type</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Attack Type</TableHead>
                  <TableHead className="text-right">Weak (≥2x)</TableHead>
                  <TableHead className="text-right">Resist (≤0.5x)</TableHead>
                  <TableHead className="text-right">Immune (0x)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TYPES.map((t) => {
                  const row = defensive[t];
                  return (
                    <TableRow key={t}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge variant={t.toLowerCase()}>{t}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row?.weak ?? 0}</TableCell>
                      <TableCell className="text-right">{row?.resist ?? 0}</TableCell>
                      <TableCell className="text-right">{row?.immune ?? 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">At-risk weaknesses</div>
              <p className="text-xs text-muted-foreground">
                Types with the most team members weak.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TYPES.filter((t) => (defensive[t]?.weak ?? 0) === maxWeak && maxWeak > 0).map(
                  (t) => (
                    <div
                      key={t}
                      className="flex p-1 border-red-100 border bg-red-50 items-center gap-2 rounded-md"
                    >
                      <Badge variant={t.toLowerCase()}>{t}</Badge>
                      <p className="text-xs text-red-800 ">{defensive[t]?.weak} weak</p>
                    </div>
                  ),
                )}
                {maxWeak <= 0 && (
                  <span className="text-sm text-muted-foreground">No standout weaknesses yet.</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Team immunities</div>
              <p className="text-xs text-muted-foreground">
                You have at least one immunity to these types.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TYPES.filter((t) => (defensive[t]?.immune ?? 0) > 0).map((t) => (
                  <div
                    key={t}
                    className="flex p-1 border-emerald-100 border bg-emerald-50 items-center gap-2 rounded-md"
                  >
                    <Badge variant={t.toLowerCase()}>{t}</Badge>
                    <p className="text-xs text-emerald-800 ">{defensive[t]?.immune} immune</p>
                  </div>
                ))}
                {TYPES.every((t) => (defensive[t]?.immune ?? 0) === 0) && (
                  <span className="text-sm text-muted-foreground">No immunities detected.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="offensive" className="mt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-sm font-medium">Super-effective coverage</div>
            <p className="text-xs text-muted-foreground">
              Defender single-types you can hit for 2x with at least one move type.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {offensive.covered.length > 0 ? (
                offensive.covered.map((t) => <TypeBadge key={t} type={t} />)
              ) : (
                <span className="text-sm text-muted-foreground">
                  No super-effective coverage yet.
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">No super-effective coverage</div>
            <p className="text-xs text-muted-foreground">
              Types you cannot hit super-effectively with any selected move types.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {offensive.missing.length > 0 ? (
                offensive.missing.map((t) => (
                  <div
                    key={t}
                    className="flex p-1 border-amber-100 border bg-amber-50 items-center gap-2 rounded-md"
                  >
                    <Badge variant={t.toLowerCase()}>{t}</Badge>
                    <p className="text-xs text-amber-800">Missing</p>
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  You have super-effective coverage for all types.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium">Move types used</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {offensive.moveTypes.length > 0 ? (
              offensive.moveTypes.map((t) => <TypeBadge key={t} type={t} />)
            ) : (
              <span className="text-sm text-muted-foreground">No move types selected.</span>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
