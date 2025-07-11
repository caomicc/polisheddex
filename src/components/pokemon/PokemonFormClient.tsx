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

  // console.log('Form Data:', formData);

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
      <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg">
        <div className="relative p-6 bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-800 dark:to-gray-900 flex flex-col md:flex-row items-center justify-center md:justify-start gap-6">
          <Image
            src={formData.frontSpriteUrl ?? ''}
            alt={`Sprite of Pokémon ${pokemonName}`}
            width={200}
            height={200}
            className="object-contain drop-shadow-lg"
            priority
          />
          <div className="text-center md:text-left">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              National Dex #{String(formData.nationalDex).padStart(3, '0')}
              {formData.johtoDex && (
                <span className="ml-2">Johto #{String(formData.johtoDex).padStart(3, '0')}</span>
              )}
            </div>
            <p className="text-4xl font-extrabold capitalize text-gray-900 dark:text-gray-50">
              {pokemonName}
            </p>
            <p className="text-lg text-muted-foreground mt-1">{formData.species}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-3">Pokedex Entry</h2>
        <p className="text-muted-foreground">{formData.description}</p>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-3">Basic Information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm space-y-2">
            <div className="font-medium">Height:</div>
            <div>{((formData.height as number) / 10).toFixed(1)} m</div>
            <div className="font-medium">Weight:</div>
            <div>{((formData.weight as number) / 10).toFixed(1)} kg</div>
            <div className="font-medium">Base Exp.:</div>
            <div>{formData.baseExp}</div>
            <div className="font-medium">Catch Rate:</div>
            <div>{formData.catchRate}</div>
            <div className="font-medium">Growth Rate:</div>
            <div>{formData.growthRate}</div>
            <div className="font-medium">Hatch Rate:</div>
            <div>{formData.hatchRate}</div>
            <div className="font-medium">Egg Groups:</div>
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
          </div>
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
