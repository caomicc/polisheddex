'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { MoveRow, LocationListItem } from '@/components/pokemon';
import {
  LocationEntryProps,
  FormData,
  EvolutionMethod,
  Move,
  MoveDescription,
  PokemonType,
} from '@/types/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { EvolutionChain } from '@/components/ui/EvolutionChain';
import { WeaknessChart } from './WeaknessChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
      <div className="max-w-4xl mx-auto md:rounded-xl overflow-hidden md:shadow-lg">
        <div className="relative md:p-6 md:bg-gradient-to-br md:from-gray-100 md:to-gray-300 md:dark:from-gray-800 md:dark:to-gray-900 flex flex-row items-center justify-start gap-6">
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
              National Dex #{String(formData.nationalDex).padStart(3, '0')}
              {formData.johtoDex && (
                <span className="block md:inline-block md:ml-2">
                  Johto Dex #{String(formData.johtoDex).padStart(3, '0')}
                </span>
              )}
            </div>
            <p className="text-sm md:text-4xl font-bold capitalize text-gray-900 dark:text-gray-50">
              {pokemonName}
            </p>
            <p className="text-xs md:text-lg text-muted-foreground mt-1">
              {formData.species} type Pokémon
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-md md:text-2xl font-bold mb-3">Pokedex Entry</h2>
        <p className="text-muted-foreground">{formData.description}</p>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-md md:text-2xl font-bold mb-3">Basic Information</h2>
          <Table className="max-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Stat</TableHead>
                <TableHead className="font-medium">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Height</TableCell>
                <TableCell>{((formData.height as number) / 10).toFixed(1)} m</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Weight</TableCell>
                <TableCell>{((formData.weight as number) / 10).toFixed(1)} kg</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Base Exp.</TableCell>
                <TableCell>{formData.baseExp}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Catch Rate</TableCell>
                <TableCell>{formData.catchRate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Growth Rate</TableCell>
                <TableCell>{formData.growthRate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Hatch Rate</TableCell>
                <TableCell>{formData.hatchRate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Egg Groups</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {formData.eggGroups && formData.eggGroups.length > 0 ? (
                      formData.eggGroups.map((group, idx) => (
                        <Badge key={idx} variant="default">
                          {group}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">Unknown</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">EV Yield</TableCell>
                <TableCell>{formData.evYield || 'None'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Body Color</TableCell>
                <TableCell>{formData.bodyColor || 'Unknown'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Body Shape</TableCell>
                <TableCell>{formData.bodyShape || 'Unknown'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-3">Abilities</h2>
          <div className="flex flex-wrap gap-2">
            {formData.abilities && formData.abilities.length > 0 ? (
              formData.abilities.map((ability, idx) => {
                const abilityName =
                  typeof ability === 'string' ? ability : ability?.name || 'Unknown';
                return (
                  <Badge key={idx} variant="default">
                    {abilityName}
                  </Badge>
                );
              })
            ) : (
              <span className="text-gray-500">No abilities data</span>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-3">Types</h2>
          <div className="flex flex-wrap gap-2">
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
        <div>
          <h2 className="text-2xl font-bold mb-3">Weaknesses</h2>
          <div className="flex flex-wrap gap-2">
            {formData.types && (
              <WeaknessChart
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
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Evolution Chain</h2>
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
        {formData.evolution &&
          formData.evolution.methods &&
          formData.evolution.methods.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold">Evolution Methods:</h3>
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
      <h2 className="text-xl font-semibold mb-2">Moves</h2>
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
      <h2 className="text-xl font-semibold mt-6 mb-2">Egg Moves</h2>
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

      <h2 className="text-xl font-semibold mt-6 mb-2">Base Stats</h2>
      {formData.baseStats ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] "></TableHead>
              <TableHead className="w-[80px] text-center">HP</TableHead>
              <TableHead className="w-[80px] text-center">Attack</TableHead>
              <TableHead className="w-[80px] text-center">Defense</TableHead>
              <TableHead className="w-[80px] text-center">Sp. Atk</TableHead>
              <TableHead className="w-[80px] text-center">Sp. Def</TableHead>
              <TableHead className="w-[80px] text-center">Speed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-left">
                Base Stats - Total:{' '}
                {[
                  formData.baseStats.hp,
                  formData.baseStats.attack,
                  formData.baseStats.defense,
                  formData.baseStats.specialAttack,
                  formData.baseStats.specialDefense,
                  formData.baseStats.speed,
                ].reduce((sum, stat) => (typeof stat === 'number' ? sum + stat : sum), 0)}
              </TableCell>
              <TableCell className="text-center">{formData.baseStats.hp ?? 'N/A'}</TableCell>
              <TableCell className="text-center">{formData.baseStats.attack ?? 'N/A'}</TableCell>
              <TableCell className="text-center">{formData.baseStats.defense ?? 'N/A'}</TableCell>
              <TableCell className="text-center">
                {formData.baseStats.specialAttack ?? 'N/A'}
              </TableCell>
              <TableCell className="text-center">
                {formData.baseStats.specialDefense ?? 'N/A'}
              </TableCell>
              <TableCell className="text-center">{formData.baseStats.speed ?? 'N/A'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No base stat data</div>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">Locations</h2>
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
            {formData.locations.map((loc: LocationEntryProps, idx: number) => (
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
