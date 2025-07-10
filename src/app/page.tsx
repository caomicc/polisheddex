import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center my-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to PolishedDex</h1>
        <p className="text-xl text-gray-600 mb-8">Your comprehensive guide to Pokémon Polished Crystal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/pokemon" className="group">
          <div className="border rounded-lg p-6 h-full transition hover:shadow-lg hover:border-blue-500">
            <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-700">Pokémon Database</h2>
            <p className="text-gray-600 mb-4">
              Browse all Pokémon, their types, evolutions, moves, and where to find them.
            </p>
            <span className="text-blue-600 font-medium group-hover:underline">
              Browse Pokémon &rarr;
            </span>
          </div>
        </Link>

        <Link href="/locations" className="group">
          <div className="border rounded-lg p-6 h-full transition hover:shadow-lg hover:border-blue-500">
            <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-700">Location Guide</h2>
            <p className="text-gray-600 mb-4">
              Explore all areas in the game and discover which Pokémon you can find in each location.
            </p>
            <span className="text-blue-600 font-medium group-hover:underline">
              View Locations &rarr;
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
