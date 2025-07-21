import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { LocationData, LocationAreaData } from '@/types/types';
// import LocationCard from '@/components/pokemon/LocationCard';
import LocationSearch from '@/components/pokemon/LocationSearch';

// Function to load Pokemon encounter data by area
async function loadPokemonLocationData(): Promise<Record<string, LocationAreaData>> {
  try {
    const locationsFile = path.join(process.cwd(), 'output/locations_by_area.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    return JSON.parse(data) as Record<string, LocationAreaData>;
  } catch (error) {
    console.error('Error loading Pokemon location data:', error);
    return {};
  }
}

// Function to load comprehensive location data in proper order
async function loadAllLocationData(): Promise<EnhancedLocation[]> {
  try {
    const orderedLocationsFile = path.join(process.cwd(), 'output/all_locations_ordered.json');

    // Try to load the ordered array first (preserves logical order)
    if (fs.existsSync(orderedLocationsFile)) {
      const data = await fs.promises.readFile(orderedLocationsFile, 'utf8');
      const orderedLocations = JSON.parse(data) as (LocationData & { key: string; order: number })[];

      // Convert to EnhancedLocation format
      return orderedLocations.map(location => ({
        area: location.key,
        urlName: location.key,
        displayName: location.displayName,
        types: getLocationTypes(location.displayName),
        pokemonCount: 0, // Will be filled later from Pokemon data
        hasHiddenGrottoes: false, // Will be filled later from Pokemon data
        region: location.region,
        flyable: location.flyable,
        connections: location.connections,
        coordinates: location.x >= 0 && location.y >= 0
          ? { x: location.x, y: location.y }
          : undefined,
      }));
    }

    // Fallback to the object format if ordered array doesn't exist
    const locationsFile = path.join(process.cwd(), 'output/all_locations.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    const allLocationData = JSON.parse(data) as Record<string, LocationData>;

    return Object.entries(allLocationData).map(([locationKey, locationInfo]) => {
      return {
        area: locationKey,
        urlName: locationKey,
        displayName: locationInfo.displayName,
        types: getLocationTypes(locationInfo.displayName),
        pokemonCount: 0,
        hasHiddenGrottoes: false,
        region: locationInfo.region,
        flyable: locationInfo.flyable,
        connections: locationInfo.connections,
        coordinates: locationInfo.x >= 0 && locationInfo.y >= 0
          ? { x: locationInfo.x, y: locationInfo.y }
          : undefined,
      };
    });
  } catch (error) {
    console.error('Error loading comprehensive location data:', error);
    return [];
  }
}

// Enhanced location type with additional data
interface EnhancedLocation {
  area: string; // Key used for internal processing
  urlName: string; // Name used for URLs (matches Pokemon location data keys)
  displayName: string;
  types: string[];
  pokemonCount: number;
  hasHiddenGrottoes: boolean;
  region?: 'johto' | 'kanto' | 'orange';
  flyable?: boolean;
  connections?: Array<{
    direction: string;
    targetLocation: string;
    targetLocationDisplay: string;
    offset: number;
  }>;
  coordinates?: { x: number; y: number };
}

// Type for Pokemon methods in location data
interface PokemonWithMethods {
  methods?: Record<string, unknown>;
}


/**
 * Normalize location names to consistent snake_case keys
 * This ensures all data sources use the same keys for matching
 * @param input - Input location name in any format
 * @returns Normalized key like "burned_tower_1f"
 */
function normalizeLocationKey(input: string): string {
  return input
    // Convert CamelCase/PascalCase to snake_case first
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    // Handle "Tower1 F" and "tower1_f" patterns specifically
    .replace(/(\w)1[\s_]+f/i, '$1_1f')
    // Handle "Tower1" pattern at end (e.g., "Burned Tower1" -> "burned_tower_1")
    .replace(/(\w)1$/i, '$1_1')
    // Handle various floor patterns - normalize all to standard format
    // Handle B1F variations (with or without spaces, with or without F)
    .replace(/\s*b\s*1\s*f?\s*$/i, '_b1f')
    .replace(/\s*b\s*2\s*f?\s*$/i, '_b2f')
    .replace(/\s*b\s*3\s*f?\s*$/i, '_b3f')
    .replace(/\s*b\s*4\s*f?\s*$/i, '_b4f')
    .replace(/\s*b\s*5\s*f?\s*$/i, '_b5f')
    // Handle regular floor patterns (with or without spaces, with or without F)
    .replace(/\s*1\s*f?\s*$/i, '_1f')
    .replace(/\s*2\s*f?\s*$/i, '_2f')
    .replace(/\s*3\s*f?\s*$/i, '_3f')
    .replace(/\s*4\s*f?\s*$/i, '_4f')
    .replace(/\s*5\s*f?\s*$/i, '_5f')
    .replace(/\s*6\s*f?\s*$/i, '_6f')
    .replace(/\s*7\s*f?\s*$/i, '_7f')
    .replace(/\s*8\s*f?\s*$/i, '_8f')
    .replace(/\s*9\s*f?\s*$/i, '_9f')
    .replace(/\s*10\s*f?\s*$/i, '_10f')
    // Convert spaces, hyphens, and other separators to underscores
    .replace(/[\s\-\.]+/g, '_')
    // Clean up multiple underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');
}


/**
 * Infer region from location name using known patterns
 * @param locationName - The name of the location
 * @returns Inferred region or undefined
 */
function inferRegion(locationName: string): 'johto' | 'kanto' | 'orange' | undefined {
  const name = locationName.toLowerCase();

  // Johto locations
  if (name.includes('national park') ||
      name.includes('ilex forest') ||
      name.includes('burned tower') ||
      name.includes('ecruteak') ||
      name.includes('olivine') ||
      name.includes('cianwood') ||
      name.includes('mahogany') ||
      name.includes('blackthorn') ||
      name.includes('lake of rage') ||
      name.includes('ice path') ||
      name.includes('dragon\'s den') ||
      name.includes('whirl islands') ||
      name.includes('new bark') ||
      name.includes('cherrygrove') ||
      name.includes('violet city') ||
      name.includes('azalea') ||
      name.includes('goldenrod') ||
      name.includes('ruins of alph') ||
      name.includes('sprout tower') ||
      name.includes('slowpoke well') ||
      name.includes('union cave') ||
      name.includes('dark cave') ||
      name.includes('tin tower') ||
      name.includes('mt silver') ||
      name.includes('tohjo falls') ||
      /route (29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46)/.test(name)) {
    return 'johto';
  }

  // Kanto locations
  if (name.includes('pallet') ||
      name.includes('viridian') ||
      name.includes('pewter') ||
      name.includes('cerulean') ||
      name.includes('vermilion') ||
      name.includes('lavender') ||
      name.includes('celadon') ||
      name.includes('fuchsia') ||
      name.includes('saffron') ||
      name.includes('cinnabar') ||
      name.includes('indigo plateau') ||
      name.includes('mt moon') ||
      name.includes('rock tunnel') ||
      name.includes('power plant') ||
      name.includes('pokemon tower') ||
      name.includes('safari zone') ||
      name.includes('seafoam islands') ||
      name.includes('victory road') ||
      name.includes('cerulean cave') ||
      name.includes('digletts cave') ||
      name.includes('pokemon mansion') ||
      /route ([1-9]|1[0-9]|2[0-8])(?:\s|$)/.test(name)) {
    return 'kanto';
  }

  // Orange Islands locations
  if (name.includes('valencia') ||
      name.includes('tangelo') ||
      name.includes('mikan') ||
      name.includes('mandarin') ||
      name.includes('navel') ||
      name.includes('trovita') ||
      name.includes('kumquat') ||
      name.includes('pummelo') ||
      name.includes('shamouti') ||
      name.includes('beautiful beach') ||
      name.includes('crystal beach') ||
      name.includes('bellchime trail') ||
      name.includes('seven grapefruit islands') ||
      /gi\s*\d+/.test(name)) {
    return 'orange';
  }

  return undefined;
}

/**
 * Determines location types based on the location name.
 * Uses a simple heuristic mapping for biome/environment.
 * @param locationName - The name of the location
 * @returns Array of type strings
 */
function getLocationTypes(locationName: string): string[] {
  if (locationName.includes('Forest') || locationName.includes('Woods')) {
    return ['Grass'];
  } else if (locationName.includes('Cave') || locationName.includes('Mountain')) {
    return ['Rock'];
  } else if (locationName.includes('Lake') || locationName.includes('Sea') || locationName.includes('Ocean')) {
    return ['Water'];
  } else if (locationName.includes('Tower') || locationName.includes('Ruins')) {
    return ['Ghost'];
  } else if (locationName.includes('Power Plant')) {
    return ['Electric'];
  } else if (locationName.includes('Desert') || locationName.includes('Sand')) {
    return ['Ground'];
  } else if (locationName.includes('Volcano') || locationName.includes('Lava')) {
    return ['Fire'];
  } else if (locationName.includes('Route')) {
    return ['Grass'];
  } else if (locationName.includes('City') || locationName.includes('Town')) {
    return ['Normal'];
  }
  return ['Normal'];
}

export default async function LocationsPage() {
  const pokemonLocationData = await loadPokemonLocationData();
  const comprehensiveLocations = await loadAllLocationData(); // This now returns EnhancedLocation[] in proper order

  // Create a normalized Pokemon location map for efficient lookups
  const normalizedPokemonData: Record<string, { originalKey: string; data: LocationAreaData }> = {};
  Object.keys(pokemonLocationData).forEach(originalKey => {
    const normalizedKey = normalizeLocationKey(originalKey);
    normalizedPokemonData[normalizedKey] = {
      originalKey,
      data: pokemonLocationData[originalKey]
    };
  });

  // Merge Pokemon data into comprehensive locations (preserving order)
  const enhancedLocations: EnhancedLocation[] = comprehensiveLocations.map(location => {
    // Find matching Pokemon data using normalized keys
    let pokemonData: LocationAreaData | null = null;
    const normalizedKey = normalizeLocationKey(location.area);

    if (normalizedPokemonData[normalizedKey]) {
      pokemonData = normalizedPokemonData[normalizedKey].data;
    }

    // Calculate Pokemon count if Pokemon data exists
    const pokemonCount = pokemonData ? Object.keys(pokemonData.pokemon).length : 0;

    // Check for hidden grottoes if Pokemon data exists
    const hasHiddenGrottoes = pokemonData
      ? Object.values(pokemonData.pokemon).some(
          (pokemon: PokemonWithMethods) =>
            pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto')
        )
      : false;

    return {
      ...location,
      pokemonCount,
      hasHiddenGrottoes,
    };
  });

  // Find Pokemon-only locations that weren't matched with comprehensive data
  const usedPokemonKeys = new Set<string>();

  // Mark all Pokemon locations that were already matched with comprehensive data
  enhancedLocations.forEach(location => {
    const normalizedKey = normalizeLocationKey(location.area);
    if (normalizedPokemonData[normalizedKey]) {
      usedPokemonKeys.add(normalizedKey);
    }
  });

  // Create entries for unmatched Pokemon locations (append at the end to preserve order)
  const pokemonOnlyLocations: EnhancedLocation[] = Object.keys(normalizedPokemonData)
    .filter(normalizedKey => !usedPokemonKeys.has(normalizedKey))
    .map(normalizedKey => {
      const { originalKey, data: pokemonData } = normalizedPokemonData[normalizedKey];
      const pokemonCount = Object.keys(pokemonData.pokemon).length;

      const hasHiddenGrottoes = Object.values(pokemonData.pokemon).some(
        (pokemon: PokemonWithMethods) =>
          pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto')
      );

      return {
        area: normalizedKey,
        urlName: normalizedKey, // Use normalized format for URLs
        displayName: originalKey, // Use original display name
        types: getLocationTypes(originalKey),
        pokemonCount,
        hasHiddenGrottoes,
        region: inferRegion(originalKey), // Infer region from location name
        flyable: false, // Pokemon-only locations don't have flyable info
        connections: [],
        coordinates: undefined,
      };
    });

  // Combine both arrays - DON'T SORT, preserve the logical order from extraction
  const processedLocations = [...enhancedLocations, ...pokemonOnlyLocations];

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto p-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbLink asChild>
            <Link href="/" className="hover:underline dark:text-blue-200 text-blue-700">
              Home
            </Link>
          </BreadcrumbLink>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Locations</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-6 sr-only">Game Locations</h1>

      {/* Display summary of location data */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Location Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{processedLocations.length}</div>
            <div className="text-slate-600 dark:text-slate-300">Total Locations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{processedLocations.filter(l => l.pokemonCount > 0).length}</div>
            <div className="text-slate-600 dark:text-slate-300">With Pokémon</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{processedLocations.filter(l => l.flyable).length}</div>
            <div className="text-slate-600 dark:text-slate-300">Flyable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{processedLocations.reduce((sum, l) => sum + (l.connections?.length || 0), 0)}</div>
            <div className="text-slate-600 dark:text-slate-300">Connections</div>
          </div>
        </div>
      </div>

      <LocationSearch locations={processedLocations} />

      {/* <h1 className="text-3xl font-bold mb-6">Game Locations</h1>

      <h2 className="text-xl font-semibold mb-4">All Locations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationNames.map((locationName) => {
          const pokemonCount = Object.keys(locationData[locationName].pokemon).length;

          const hasHiddenGrottoes = Object.values(locationData[locationName].pokemon).some(
            (pokemon: PokemonMethods) =>
              pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
          );


          return (
            <LocationCard
              key={locationName}
              location={{
                area: locationName,
                types: getLocationTypes(locationName),
                pokemonCount,
                hasHiddenGrottoes
              }}
            />
          );
        })}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Hidden Grotto Locations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationNames
            .filter((locationName) => {
              return Object.values(locationData[locationName].pokemon).some(
                (pokemon: PokemonMethods) =>
                  pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
              );
            })
            .map((locationName) => {
              // Count total Pokémon in hidden grottoes at this location
              const pokemonCount = Object.values(locationData[locationName].pokemon).filter(
                (pokemon: PokemonMethods) =>
                  pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
              ).length;

              return (
                <LocationCard
                  key={locationName + '-grotto'}
                  location={{
                    area: locationName,
                    types: getLocationTypes(locationName),
                    pokemonCount,
                    hasHiddenGrottoes: true
                  }}
                />
              );
            })}
        </div>
      </div> */}
    </div>
  );
}
