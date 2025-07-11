'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { MoveRow, LocationListItem } from '@/components/pokemon';
import {
  FormData,
  EvolutionMethod,
  Move,
  MoveDescription,
  PokemonType,
  LocationEntry,
} from '@/types/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { EvolutionChain } from '@/components/ui/EvolutionChain';
import { TypeRelationsChart } from './TypeRelationsChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

export default function PokemonFormClient({
  forms,
  allFormData,
  moveDescData,
  pokemonName,
}: {
  forms: string[];
  allFormData: Record<string, FormData>;
  moveDescData: Record<string, MoveDescription>;
  pokemonName: string;
}) {
  const [selectedForm, setSelectedForm] = useState('default');
  const formData = allFormData[selectedForm] || allFormData['default'];

  return (
    <div className="space-y-6">
      {forms.length > 0 && (
        <div className="mb-4">
          <label className="font-semibold mr-2" htmlFor="form-select">
            Form:
          </label>
          <Select value={selectedForm} onValueChange={setSelectedForm}>
            <SelectTrigger id="form-select" className="min-w-[180px] bg-white">
              <SelectValue placeholder="Select form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {forms.map((form) => (
                <SelectItem key={form} value={form}>
                  {form.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="max-w-4xl mx-auto rounded-xl overflow-hidden">
        <div
          className={cn(
            'relative py-4 px-4 md:p-6 md:dark:from-gray-800 md:dark:to-gray-900 flex flex-row items-center justify-start gap-6',
            `bg-${
              formData.types
                ? typeof formData.types === 'string'
                  ? formData.types.toLowerCase()
                  : Array.isArray(formData.types) && formData.types.length > 0
                  ? formData.types[0].toLowerCase()
                  : 'unknown'
                : 'unknown'
            }-20`,
            `dark:bg-${
              formData.types
                ? typeof formData.types === 'string'
                  ? formData.types.toLowerCase()
                  : Array.isArray(formData.types) && formData.types.length > 0
                  ? formData.types[0].toLowerCase()
                  : 'unknown'
                : 'unknown'
            }-dark`
          )}
        >
          <div className="w-24 p-1 md:p-0 md:w-24 md:h-auto ">
            <Image
              src={formData.frontSpriteUrl ?? ''}
              alt={`Sprite of Pokémon ${pokemonName}`}
              width={200}
              height={200}
              className="object-contain w-24 md:drop-shadow-xs md:w-24 md:h-auto md:mb-0"
              priority
            />
          </div>
          <div className="text-left">
            <div className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              National #{String(formData.nationalDex).padStart(3, '0')}
              {formData.johtoDex && (
                <span className="ml-2">Johto #{String(formData.johtoDex).padStart(3, '0')}</span>
              )}
            </div>
            <p className="text-sm md:text-4xl font-bold capitalize text-gray-900 dark:text-gray-50">
              {pokemonName}
            </p>
            <p className="text-xs md:text-lg text-muted-grass mt-1">
              {formData.species} type Pokémon
            </p>
            <div className="flex flex-wrap gap-2 mt-2" aria-label="Pokemon Types" role="group">
              {formData.types ? (
                Array.isArray(formData.types) ? (
                  formData.types.map((type: string) => (
                    <Badge key={type} variant={type.toLowerCase() as PokemonType['name']}>
                      {type}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    key={formData.types}
                    variant={formData.types.toLowerCase() as PokemonType['name']}
                  >
                    {formData.types}
                  </Badge>
                )
              ) : (
                <Badge variant="secondary">Unknown</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-md md:text-2xl font-bold mb-3">Pokedex Entry</h2>
        <p className="text-sm md:text-md text-muted-foreground">{formData.description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-md md:text-2xl font-bold mb-3">About</h2>
          <Table className="max-w-full">
            <TableHeader className="sr-only">
              <TableRow>
                <TableHead className="font-medium w-[120px]">Stat</TableHead>
                <TableHead className="font-medium">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Height</TableCell>
                <TableCell>{((formData.height as number) / 10).toFixed(1)} m</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Weight</TableCell>
                <TableCell>{((formData.weight as number) / 10).toFixed(1)} kg</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Abilities</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {formData.abilities && formData.abilities.length > 0 ? (
                      formData.abilities.map((ability, idx) => {
                        const abilityName =
                          typeof ability === 'string' ? ability : ability?.name || 'Unknown';
                        return <span key={idx}>{abilityName}</span>;
                      })
                    ) : (
                      <span className="text-gray-500">No abilities data</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Color</TableCell>
                <TableCell>{formData.bodyColor || 'Unknown'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Shape</TableCell>
                <TableCell>{formData.bodyShape || 'Unknown'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div>
          <h2 className="text-md md:text-2xl font-bold mb-3">Breeding</h2>
          <Table className="max-w-full">
            <TableHeader className="sr-only">
              <TableRow>
                <TableHead className="font-medium w-[120px]">Breeding Stats</TableHead>
                <TableHead className="font-medium">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Gender Dist</TableCell>
                <TableCell>{formData.genderRatio}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Growth Rate</TableCell>
                <TableCell>{formData.growthRate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Egg Groups</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {formData.eggGroups && formData.eggGroups.length > 0 ? (
                      formData.eggGroups.map((group, idx) => (
                        <span key={idx}>
                          {group}
                          {idx < formData.eggGroups.length - 1 && <span>,</span>}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Unknown</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium w-[120px]">Hatch Rate</TableCell>
                <TableCell>{formData.hatchRate}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-md md:text-2xl font-bold mb-3">Training</h2>
          <Table className="w-full">
            <TableHeader className="sr-only">
              <TableRow>
                <TableHead className="font-medium w-[120px]">Stat</TableHead>
                <TableHead className="font-medium">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Base Exp.</TableCell>
                <TableCell>{formData.baseExp}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium w-[120px]">Catch Rate</TableCell>
                <TableCell>{formData.catchRate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">EV Yield</TableCell>
                <TableCell>{formData.evYield || 'None'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <h2 className="text-md md:text-2xl font-bold mb-3">Type Relations</h2>
          {formData.types && (
            <TypeRelationsChart
              types={
                Array.isArray(formData.types)
                  ? formData.types.map((t: string) => t.toLowerCase())
                  : formData.types
                  ? [formData.types.toLowerCase()]
                  : []
              }
            />
          )}
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      <div className="mb-4">
        <h2 className="text-md md:text-2xl font-bold mb-3">Evolution Chain</h2>
        {formData.evolution && formData.evolution.chain ? (
          <EvolutionChain
            chain={formData.evolution.chain}
            spritesByGen={formData.evolution.chain.reduce((acc, name) => {
              // Try to get sprite from allFormData if available
              // Use the key as in allFormData, which is usually the normalized name
              const formEntry = Object.entries(allFormData).find(
                ([, f]) =>
                  f.nationalDex && name && name.toLowerCase() === pokemonName.toLowerCase(),
              );
              acc[name] = formEntry?.[1]?.frontSpriteUrl || '';
              return acc;
            }, {} as Record<string, string>)}
          />
        ) : (
          <div className="text-gray-500">No evolution data.</div>
        )}
      </div>

      <div>
        {formData.evolution &&
          formData.evolution.methods &&
          formData.evolution.methods.length > 0 && (
            <div className="mt-2">
              <h2 className="text-md md:text-2xl font-bold mb-3">Evolution Methods</h2>
              <ul className="list-disc ml-6">
                {formData.evolution.methods.map((m: EvolutionMethod, idx: number) => (
                  <li key={idx}>
                    <span className="font-mono">
                      {m.method.replace('EVOLVE_', '').toLowerCase()}
                    </span>
                    {m.parameter !== null && (
                      <>
                        : <span className="font-mono">{String(m.parameter)}</span>
                      </>
                    )}
                    {m.form && (
                      <>
                        (form: <span className="font-mono">{m.form}</span>)
                      </>
                    )}
                    {m.target && (
                      <>
                        → <span className="font-mono">{m.target}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />
      {/* Moves List */}
      <h2 className="text-md md:text-2xl font-bold mb-3">Moves</h2>
      {formData.moves && Array.isArray(formData.moves) && formData.moves.length > 0 ? (
        <Table>
          <TableHeader className={'hidden md:table-header-group'}>
            <TableRow>
              <TableHead className="attheader cen align-middle text-left w-[60px]">Level</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[180px]">
                Attack Name
              </TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Type</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Cat.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Att.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Acc.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">PP</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">
                Effect %
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.moves.map((moveData: Move) => {
              const moveInfo = moveDescData[moveData.name] || null;
              return (
                <MoveRow
                  key={`move-${moveData.name}-${moveData.level}`}
                  name={moveData.name}
                  level={moveData.level}
                  info={moveInfo}
                />
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No move data</div>
      )}
      <h2 className="text-md md:text-2xl font-bold mb-3">Egg Moves</h2>
      {formData.eggMoves && Array.isArray(formData.eggMoves) && formData.eggMoves.length > 0 ? (
        <Table>
          <TableHeader className={'hidden md:table-header-group'}>
            <TableRow>
              <TableHead className="attheader cen align-middle text-left w-[60px]">Level</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[180px]">
                Attack Name
              </TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Type</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Cat.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Att.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Acc.</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">PP</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">
                Effect %
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.eggMoves.map((moveName: string) => {
              const moveInfo = moveDescData[moveName] || null;
              return <MoveRow key={`egg-${moveName}`} name={moveName} level={1} info={moveInfo} />;
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No egg moves</div>
      )}

      <h2 className="text-md md:text-2xl font-bold mb-3">Base Stats</h2>
      {formData.baseStats ? (
        <div className="space-y-6">
          {[
            { label: 'HP', value: formData.baseStats.hp },
            { label: 'Atk', value: formData.baseStats.attack },
            { label: 'Def', value: formData.baseStats.defense },
            { label: 'Sp. Atk', value: formData.baseStats.specialAttack },
            { label: 'Sp. Def', value: formData.baseStats.specialDefense },
            { label: 'Spd', value: formData.baseStats.speed },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-row gap-4 items-center">
              <div className="flex justify-between items-center w-[120px]">
              <span className="text-xs font-bold leading-none">{label}</span>
              <span className="text-xs leading-none text-muted-foreground">{value ?? 'N/A'}</span>
              </div>
              <Progress
                value={typeof value === 'number' ? Math.round((value / 255) * 100) : 0}
                aria-label={`${label} stat`}
              />
            </div>
          ))}
          <div className="flex justify-between items-center mt-2">
            <span className="font-semibold">Total</span>
            <span className="text-xs text-muted-foreground">
              {[
                formData.baseStats.hp,
                formData.baseStats.attack,
                formData.baseStats.defense,
                formData.baseStats.specialAttack,
                formData.baseStats.specialDefense,
                formData.baseStats.speed,
              ].reduce((sum, stat) => (typeof stat === 'number' ? sum + stat : sum), 0)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No base stat data</div>
      )}

      <h2 className="text-md md:text-2xl font-bold mb-3">Locations</h2>
      {formData.locations && Array.isArray(formData.locations) && formData.locations.length > 0 ? (
        <Table>
          <TableHeader className={'hidden md:table-header-group'}>
            <TableRow>
              <TableHead className="attheader cen align-middle text-left w-[60px]">Area</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[180px]">
                Method
              </TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Time</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">Level</TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">
                Encounter Rate
              </TableHead>
              <TableHead className="attheader cen align-middle text-left w-[80px]">
                Held Item
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Show all slots for this Pokémon, not just one per area/method/time */}
            {formData.locations.map((loc: LocationEntry, idx: number) => (
              <LocationListItem
                key={idx}
                area={loc.area}
                method={loc.method}
                time={loc.time}
                level={loc.level}
                chance={loc.chance}
                rareItem={loc.rareItem}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No location data</div>
      )}
    </div>
  );
}
