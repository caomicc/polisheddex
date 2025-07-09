import fs from 'fs';
import path from 'path';
import Link from 'next/link';

// Function to load location data
async function loadLocationData() {
  try {
    const locationsFile = path.join(process.cwd(), 'locations_by_area.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading location data:', error);
    return {};
  }
}

export default async function LocationsPage() {
  const locationData = await loadLocationData();
  const locationNames = Object.keys(locationData).sort();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <nav className="mb-4 text-sm">
        <ol className="list-reset flex text-gray-600">
          <li>
            <Link href="/" className="hover:underline text-blue-700">Home</Link>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-900 font-semibold">Locations</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold mb-6">Game Locations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationNames.map((locationName) => {
          // Count total Pokémon in this location
          const pokemonCount = Object.keys(locationData[locationName].pokemon).length;

          return (
            <Link
              key={locationName}
              href={`/locations/${encodeURIComponent(locationName)}`}
              className="block p-4 border rounded-lg hover:bg-blue-50 transition-colors"
            >
              <h2 className="text-xl font-semibold">{locationName}</h2>
              <p className="text-gray-600 mt-1">
                {pokemonCount} {pokemonCount === 1 ? 'Pokémon' : 'Pokémon'} available
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
