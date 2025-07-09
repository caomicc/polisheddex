import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { MoveCard, LocationListItem } from '@/components/pokemon';

interface Move {
  level: number;
  move: string;
}

interface MoveDetail {
  description: string;
  type: string;
  pp: number;
  power: number;
  category: string;
}

interface EvolutionMethod {
  method: string;
  parameter: string | number | null;
  target: string;
  form?: string;
}

interface Evolution {
  methods: EvolutionMethod[];
  chain: string[];
}

interface BaseData {
  nationalDex: number | null;
  types: string[] | string;
}

interface LocationEntry {
  area: string | null;
  method: string | null;
  time: string | null;
  level: string;
  chance: number;
  rareItem?: string; // Optional for hidden grottoes
}

// Function to safely load JSON data
async function loadJsonData<T>(filePath: string): Promise<T> {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return {} as T;
  }
}

// Moved outside the component to use for generateStaticParams
let cachedBaseStatsData: Record<string, BaseData> | null = null;

// This function helps Next.js pre-render pages at build time
export async function generateStaticParams() {
  const baseStatsFile = path.join(process.cwd(), 'pokemon_base_data.json');
  try {
    const data = await fs.promises.readFile(baseStatsFile, 'utf8');
    const parsed = JSON.parse(data);
    cachedBaseStatsData = parsed;
    return Object.keys(parsed).map(name => ({ name }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function PokemonDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const pokemonName = name;

  // Define file paths
  const baseStatsFile = path.join(process.cwd(), 'pokemon_base_data.json');
  const moveDescFile = path.join(process.cwd(), 'pokemon_move_descriptions.json');
  const eggMovesFile = path.join(process.cwd(), 'pokemon_egg_moves.json');
  const levelMovesFile = path.join(process.cwd(), 'pokemon_level_moves.json');
  const locationsFile = path.join(process.cwd(), 'pokemon_locations.json');
  const evolutionDataFile = path.join(process.cwd(), 'pokemon_evolution_data.json');

  // Load data using Promise.all for parallel loading
  const [
    baseStatsData,
    moveDescData,
    eggMovesData,
    levelMovesData,
    locationsData,
    evolutionData
  ] = await Promise.all([
    cachedBaseStatsData || loadJsonData<Record<string, BaseData>>(baseStatsFile),
    loadJsonData<Record<string, MoveDetail>>(moveDescFile),
    loadJsonData<Record<string, string[]>>(eggMovesFile),
    loadJsonData<Record<string, Move[]>>(levelMovesFile),
    loadJsonData<Record<string, LocationEntry[]>>(locationsFile),
    loadJsonData<Record<string, Evolution | null>>(evolutionDataFile)
  ]);

  // Save the loaded base stats data for future use
  if (!cachedBaseStatsData) {
    cachedBaseStatsData = baseStatsData;
  }

  // Combine data for this Pokémon
  const baseStats = baseStatsData[pokemonName];
  const evolution = evolutionData[pokemonName];
  const moves = levelMovesData[pokemonName] || [];

  if (!baseStats) return notFound();

  // Combined Pokemon data
  const mon = {
    types: baseStats.types,
    evolution,
    moves,
    nationalDex: baseStats.nationalDex
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <nav className="mb-4 text-sm">
        <ol className="list-reset flex text-gray-600">
          <li>
            <Link href="/" className="hover:underline text-blue-700">Home</Link>
            <span className="mx-2">/</span>
          </li>
          <li>
            <Link href="/pokemon" className="hover:underline text-blue-700">Pokemon</Link>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-900 font-semibold">{pokemonName}</li>
        </ol>
      </nav>
      <h1 className="text-2xl font-bold mb-4">{pokemonName}</h1>

      {/* Evolution Info */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Type{Array.isArray(mon.types) && mon.types.length > 1 ? 's' : ''}</h2>
        <div className="flex gap-2">
          {Array.isArray(mon.types)
        ? mon.types.map((type: string) => (
            <span key={type} className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm">{type}</span>
          ))
        : (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm">{mon.types}</span>
          )
          }
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Evolution Chain</h2>
        {mon.evolution ? (
          <div className="mb-2 flex flex-wrap gap-2 items-center">
            {mon.evolution.chain.map((name: string, i: number) => (
              <React.Fragment key={name}>
              <span className="px-2 py-1 rounded bg-gray-100 font-mono">
                <Link href={`/pokemon/${name}`} className="hover:underline text-blue-700">{name}</Link>
              </span>
              {i < (mon.evolution?.chain.length ?? 0) - 1 && <span className="mx-1">→</span>}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No evolution data.</div>
        )}
        {mon.evolution && mon.evolution.methods.length > 0 && (
          <div className="mt-2">
            <h3 className="font-semibold">Evolution Methods:</h3>
            <ul className="list-disc ml-6">
              {mon.evolution.methods.map((m: EvolutionMethod, idx: number) => (
                <li key={idx}>
                  <span className="font-mono">{m.method.replace('EVOLVE_', '').toLowerCase()}</span>
                  {m.parameter !== null && (
                    <>: <span className="font-mono">{String(m.parameter)}</span></>
                  )}
                  {m.form && (
                    <> (form: <span className="font-mono">{m.form}</span>)</>
                  )}
                  {m.target && (
                    <> → <span className="font-mono">{m.target}</span></>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Moves List */}
      <h2 className="text-xl font-semibold mb-2">Moves</h2>
      <ul className="grid gap-3">
        {mon.moves.map((moveData: Move) => {
          const moveInfo = moveDescData[moveData.move] || null;
          return (
            <MoveCard
              key={moveData.move + moveData.level}
              name={moveData.move}
              level={moveData.level}
              info={moveInfo}
            />
          );
        })}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Egg Moves</h2>
      {eggMovesData[pokemonName] && eggMovesData[pokemonName].length > 0 ? (
        <ul className="grid gap-3">
          {eggMovesData[pokemonName].map((move: string) => {
            const moveInfo = moveDescData[move] || null;
            const level = 1; // Default to 1 if no level info
            return (
              <MoveCard key={move + level} name={move} level={level} info={moveInfo} />
            );
          })}
        </ul>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No egg moves</div>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">Locations</h2>
      {locationsData[pokemonName] && locationsData[pokemonName].length > 0 ? (
        <div className="mb-6">
          <ul className="divide-y divide-gray-200">
            {locationsData[pokemonName].map((loc: LocationEntry, idx: number) => (
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
          </ul>
        </div>
      ) : (
        <div className="text-gray-400 text-sm mb-6">No location data</div>
      )}
    </div>
  );
}
