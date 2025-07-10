import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import PokemonCard from '@/components/pokemon/PokemonCard';
import { BaseData } from '@/types/types';

export default async function PokemonList({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  // Read the JSON file at build time
  const filePath = path.join(process.cwd(), 'pokemon_base_data.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const { sort = 'alphabetical' } = await searchParams ?? {};

  // Determine sort type from query param
  const sortType = sort === 'nationaldex' ? 'nationaldex' : 'alphabetical';

  // Prepare an array of Pokémon with their names and dex numbers
  // eslint-disable-next-line
  const pokemonList: BaseData[] = Object.values(data) as BaseData[];

  // Sort based on selected sort type
  const sortedPokemon = [...pokemonList].sort((a, b) => {
    if (sortType === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (sortType === 'nationaldex') {
      return (a.nationalDex ?? 0) - (b.nationalDex ?? 0) || a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto p-4">
      <nav className="mb-4 text-sm">
        <ol className="list-reset flex text-gray-600">
          <li>
            <Link href="/" className="hover:underline text-blue-700">Home</Link>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-900 font-semibold">Pokemon</li>
        </ol>
      </nav>
      <h1 className="text-2xl font-bold mb-4">Pokémon List</h1>
      <div className="mb-4 flex gap-4">
        <SortLink label="Alphabetical" sort="alphabetical" current={sortType} />
        <SortLink label="National Dex" sort="nationaldex" current={sortType} />
      </div>
      <ul className="grid gap-2 md:gap-8 grid-cols-2 md:grid-cols-3">
        {sortedPokemon.map((p) => (
          <li key={p.name}>
            <PokemonCard  pokemon={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SortLink({ label, sort, current }: { label: string; sort: string; current: string }) {
  return (
    <Link
      href={`?sort=${sort}`}
      className={
        'px-2 py-1 rounded ' +
        (current === sort ? 'bg-blue-600 text-white' : 'bg-gray-100 text-blue-700 hover:bg-blue-200')
      }
      aria-current={current === sort ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}
