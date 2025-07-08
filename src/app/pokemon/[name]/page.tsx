import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

interface Move {
  level: number;
  move: string;
}

interface PokemonData {
  evolution_level: number | null;
  moves: Move[];
}

export default function PokemonDetail({ params }: { params: { name: string } }) {
  const evoFile = path.join(process.cwd(), 'pokemon_evo_moves.json');
  const descFile = path.join(process.cwd(), 'move_descriptions.json');
  const evoData: Record<string, PokemonData> = JSON.parse(fs.readFileSync(evoFile, 'utf8'));
  const moveDescs: Record<string, string> = JSON.parse(fs.readFileSync(descFile, 'utf8'));

  const mon = evoData[params.name];
  if (!mon) return notFound();

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{params.name}</h1>
      <div className="mb-2">Evolution Level: {mon.evolution_level ?? 'N/A'}</div>
      <h2 className="text-xl font-semibold mt-6 mb-2">Moves</h2>
      <ul className="grid gap-3">
        {mon.moves.map(({ level, move }) => (
          <li key={move + level} className="border rounded p-2">
            <div className="font-bold">{move} <span className="text-gray-500">(Lv. {level})</span></div>
            <div className="text-sm text-gray-700 mt-1">{moveDescs[move] || <span className="text-red-500">No description found.</span>}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
