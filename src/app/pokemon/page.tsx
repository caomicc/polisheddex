import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export default function PokemonList() {
  // Read the JSON file at build time
  const filePath = path.join(process.cwd(), 'pokemon_evo_moves.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const pokemonNames = Object.keys(data).sort();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Pokémon List</h1>
      <ul className="grid gap-2">
        {pokemonNames.map((name) => (
          <li key={name}>
            <Link href={`/pokemon/${encodeURIComponent(name)}`} className="text-blue-600 hover:underline">
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
