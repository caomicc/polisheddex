import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export default async function PokemonList({ params }: { params: Promise<{ sort: string }> }) {
  // Read the JSON file at build time
  const filePath = path.join(process.cwd(), 'pokemon_base_data.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const { sort } = await params;

  // Determine sort type from query param
  const sortType = sort === 'nationaldex' ? sort : 'alphabetical';

  // Prepare an array of Pokémon with their names and dex numbers
  // eslint-disable-next-line
  const pokemonList = Object.entries(data).map(([name, info]: [string, any]) => ({
    name,
    nationaldex: info.nationalDex ?? Infinity,
  }));

  // Sort based on selected sort type
  const sortedPokemon = [...pokemonList].sort((a, b) => {
    if (sortType === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (sortType === 'nationaldex') {
      return a.nationaldex - b.nationaldex || a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="max-w-xl mx-auto p-4">
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
        {/* <SortLink label="Local Dex" sort="localdex" current={sortType} /> */}
        <SortLink label="National Dex" sort="nationaldex" current={sortType} />
      </div>
      <ul className="grid gap-2">
        {sortedPokemon.map((p) => (
          <li key={p.name} className="border rounded p-2 flex items-center justify-between">
            <div>
              <Link href={`/pokemon/${encodeURIComponent(p.name)}`} className="text-blue-600 hover:underline font-semibold">
                {p.name}
              </Link>
            </div>
            <span className="ml-2 text-xs text-gray-500">
              National: {p.nationaldex !== Infinity ? p.nationaldex : '—'}
            </span>
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
