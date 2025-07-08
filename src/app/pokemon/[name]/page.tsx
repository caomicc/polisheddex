import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Move {
  level: number;
  move: string;
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
interface PokemonData {
  evolution: Evolution | null;
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
      {/* Evolution Info */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Evolution Chain</h2>
        {mon.evolution ? (
          <div className="mb-2 flex flex-wrap gap-2 items-center">
            {mon.evolution.chain.map((name, i) => (
              <span key={name} className="px-2 py-1 rounded bg-default-100 font-mono">
                <Link href={`/pokemon/${name}`} className="hover:underline text-blue-700">{name}</Link>
                {i < (mon.evolution?.chain.length ?? 0) - 1 && <span className="mx-1">→</span>}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No evolution data.</div>
        )}
        {mon.evolution && mon.evolution.methods.length > 0 && (
          <div className="mt-2">
            <h3 className="font-semibold">Evolution Methods:</h3>
            <ul className="list-disc ml-6">
              {mon.evolution.methods.map((m, idx) => (
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
