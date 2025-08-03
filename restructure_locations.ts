import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LocationData } from './src/types/types.ts';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LocationManifestEntry {
  fileName: string;
  name: string;
  displayName: string;
  region: 'johto' | 'kanto' | 'orange';
  id: number;
  flyable: boolean;
  order: number;
  trainerCount: number;
  pokemonCount: number;
  parentLocation?: string;
  locationType: string;
}

interface LocationManifest {
  totalLocations: number;
  regions: {
    johto: number;
    kanto: number;
    orange: number;
  };
  flyableLocations: number;
  landmarks: number;
  locations: LocationManifestEntry[];
}

/**
 * Calculate trainer count for a location (including gym leaders, areas, and Elite 4)
 */
function calculateTrainerCount(locationData: LocationData): number {
  let count = 0;

  // Count regular trainers
  if (locationData.trainers) {
    count += locationData.trainers.length;
  }

  // Count gym leader (always counts as 1 trainer if present)
  if (locationData.gymLeader) {
    count += 1;
  }

  // Count Elite 4 trainers (for Indigo Plateau)
  if (locationData.eliteFour) {
    count += locationData.eliteFour.length;
  }

  // Count trainers in areas (for consolidated locations)
  if (locationData.areas) {
    for (const area of locationData.areas) {
      if (area.trainers) {
        count += area.trainers.length;
      }
    }
  }

  return count;
}

/**
 * Get Pokemon count from encounter data
 */
function getPokemonCount(locationName: string, pokemonLocationData: Record<string, any>): number {
  const locationData = pokemonLocationData[locationName];
  if (!locationData || !locationData.pokemon) {
    return 0;
  }

  return Object.keys(locationData.pokemon).length;
}

/**
 * Determine location type based on name and properties
 */
function determineLocationType(locationData: LocationData): string {
  const name = locationData.name.toLowerCase();
  const displayName = locationData.displayName.toLowerCase();

  // Gym detection
  if (locationData.gymLeader || name.includes('gym')) {
    return 'gym';
  }

  // Mart/shop detection
  if (name.includes('mart') || name.includes('shop') || name.includes('store')) {
    return 'mart';
  }

  // Pokemon Center detection
  if (name.includes('poke_center') || name.includes('pokecenter')) {
    return 'pokecenter';
  }

  // Route detection
  if (name.startsWith('route_') || displayName.startsWith('route ')) {
    return 'route';
  }

  // Cave/dungeon detection
  if (
    name.includes('cave') ||
    name.includes('tower') ||
    name.includes('ruins') ||
    name.includes('well') ||
    name.includes('tunnel') ||
    name.includes('hideout')
  ) {
    return 'dungeon';
  }

  // City/town detection
  if (
    name.includes('city') ||
    name.includes('town') ||
    displayName.includes('city') ||
    displayName.includes('town')
  ) {
    return 'city';
  }

  // House/building detection
  if (
    name.includes('house') ||
    name.includes('lab') ||
    name.includes('academy') ||
    name.includes('cafe') ||
    name.includes('hotel')
  ) {
    return 'building';
  }

  // Island detection
  if (name.includes('island')) {
    return 'island';
  }

  // Forest/outdoor areas
  if (
    name.includes('forest') ||
    name.includes('park') ||
    name.includes('beach') ||
    name.includes('cape') ||
    name.includes('falls')
  ) {
    return 'outdoor';
  }

  // Floor/room detection (inside areas)
  if (
    name.includes('_1f') ||
    name.includes('_2f') ||
    name.includes('_b_') ||
    name.includes('floor') ||
    name.includes('room')
  ) {
    return 'inside';
  }

  // Default
  return 'other';
}

/**
 * Determine parent location based on naming patterns
 */
function determineParentLocation(locationData: LocationData): string | undefined {
  const name = locationData.name;

  // Floor patterns (1f, 2f, b1f, etc.)
  if (/_\d+f$|_b\d+f$/.test(name)) {
    return name.replace(/_\d+f$|_b\d+f$/, '');
  }

  // Gym belongs to city
  if (name.includes('_gym')) {
    return name.replace('_gym', '_city');
  }

  // Mart belongs to city
  if (name.includes('_mart')) {
    return name.replace('_mart', '_city');
  }

  // Poke Center belongs to city
  if (name.includes('_poke_center') || name.includes('_pokecenter')) {
    return name.replace(/_poke_center.*|_pokecenter.*/, '_city');
  }

  // House patterns - extract city/town name
  const housePatterns = [
    /_house$/,
    /_house_\d+f$/,
    /_speech_house$/,
    /_pharmacy$/,
    /_shop$/,
    /_lab$/,
    /_academy$/,
    /_cafe$/,
    /_hotel.*$/,
  ];

  for (const pattern of housePatterns) {
    if (pattern.test(name)) {
      const parts = name.split('_');
      if (parts.length > 1) {
        // Try to find corresponding city/town
        const cityName = `${parts[0]}_city`;
        const townName = `${parts[0]}_town`;
        // We'll return the city version and let the caller validate
        return cityName;
      }
    }
  }

  // Tower/dungeon sub-areas
  if (name.includes('_tower_') && !name.endsWith('_tower')) {
    return name.split('_tower_')[0] + '_tower';
  }

  // Cave sub-areas
  if (name.includes('_cave_') && !name.endsWith('_cave')) {
    return name.split('_cave_')[0] + '_cave';
  }

  // Gate patterns
  if (name.includes('_gate')) {
    const routeMatch = name.match(/route_(\d+)_.*_gate/);
    if (routeMatch) {
      return `route_${routeMatch[1]}`;
    }
  }

  return undefined;
}

/**
 * Converts location data into individual files with a manifest structure
 * Similar to the pokemon files structure
 */
export async function restructureLocationsToIndividualFiles(): Promise<void> {
  console.log('🏗️  Starting location restructuring...');

  try {
    // Read the current all_locations.json file
    const allLocationsPath = path.join(__dirname, 'output/all_locations.json');

    if (!fs.existsSync(allLocationsPath)) {
      console.error('❌ all_locations.json not found. Please run the location extraction first.');
      return;
    }

    const allLocationsData = JSON.parse(fs.readFileSync(allLocationsPath, 'utf8')) as Record<
      string,
      LocationData
    >;

    // Load Pokemon location data for encounter counts
    let pokemonLocationData: Record<string, any> = {};
    const pokemonLocationPath = path.join(__dirname, 'output/locations_by_area.json');
    if (fs.existsSync(pokemonLocationPath)) {
      pokemonLocationData = JSON.parse(fs.readFileSync(pokemonLocationPath, 'utf8'));
    }

    // Create locations directory if it doesn't exist
    const locationsDir = path.join(__dirname, 'output/locations');
    if (!fs.existsSync(locationsDir)) {
      fs.mkdirSync(locationsDir, { recursive: true });
    }

    console.log(
      `📁 Creating individual location files for ${Object.keys(allLocationsData).length} locations...`,
    );

    // Prepare manifest data
    const manifestEntries: LocationManifestEntry[] = [];
    let order = 0;

    // Create individual location files and collect manifest data
    for (const [locationKey, locationData] of Object.entries(allLocationsData)) {
      // Create filename from location key (already normalized)
      const fileName = `${locationKey}.json`;
      const filePath = path.join(locationsDir, fileName);

      // Write individual location file
      await fs.promises.writeFile(filePath, JSON.stringify(locationData, null, 2));

      // Calculate additional metadata
      const trainerCount = calculateTrainerCount(locationData);
      const pokemonCount = getPokemonCount(locationData.displayName, pokemonLocationData);
      const locationType = determineLocationType(locationData);
      const parentLocation = determineParentLocation(locationData);

      // Add to manifest
      manifestEntries.push({
        fileName,
        name: locationData.name,
        displayName: locationData.displayName,
        region: locationData.region,
        id: locationData.id,
        flyable: locationData.flyable,
        order: order++,
        trainerCount,
        pokemonCount,
        locationType,
        parentLocation,
      });
    }

    // Validate and clean up parent location references
    const locationNames = new Set(Object.keys(allLocationsData));
    manifestEntries.forEach((entry) => {
      if (entry.parentLocation && !locationNames.has(entry.parentLocation)) {
        // Try alternative naming patterns
        const alternatives = [
          entry.parentLocation.replace('_city', '_town'),
          entry.parentLocation.replace('_town', '_city'),
        ];

        let found = false;
        for (const alt of alternatives) {
          if (locationNames.has(alt)) {
            entry.parentLocation = alt;
            found = true;
            break;
          }
        }

        if (!found) {
          // Parent doesn't exist, remove it
          entry.parentLocation = undefined;
        }
      }
    });

    // Sort manifest entries by order (which follows the logical grouping from extraction)
    manifestEntries.sort((a, b) => a.order - b.order);

    // Count by region
    const regionCounts = {
      johto: manifestEntries.filter((entry) => entry.region === 'johto').length,
      kanto: manifestEntries.filter((entry) => entry.region === 'kanto').length,
      orange: manifestEntries.filter((entry) => entry.region === 'orange').length,
    };

    // Create manifest
    const manifest: LocationManifest = {
      totalLocations: manifestEntries.length,
      regions: regionCounts,
      flyableLocations: manifestEntries.filter((entry) => entry.flyable).length,
      landmarks: manifestEntries.filter((entry) => entry.id >= 0).length,
      locations: manifestEntries,
    };

    // Write manifest file
    const manifestPath = path.join(locationsDir, '_index.json');
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`📋 Created location manifest with ${manifestEntries.length} entries`);
    console.log(`   • Johto: ${regionCounts.johto} locations`);
    console.log(`   • Kanto: ${regionCounts.kanto} locations`);
    console.log(`   • Orange Islands: ${regionCounts.orange} locations`);
    console.log(`   • Flyable: ${manifest.flyableLocations} locations`);
    console.log(`   • Landmarks: ${manifest.landmarks} locations`);

    console.log('✅ Location restructuring completed successfully!');
    console.log(`📁 Individual location files created in: ${locationsDir}`);
    console.log(`📋 Location manifest created at: ${manifestPath}`);
  } catch (error) {
    console.error('❌ Error during location restructuring:', error);
    throw error;
  }
}

/**
 * Utility function to load a specific location by name
 */
export async function loadLocationByName(locationName: string): Promise<LocationData | null> {
  try {
    const locationPath = path.join(__dirname, 'output/locations', `${locationName}.json`);

    if (!fs.existsSync(locationPath)) {
      return null;
    }

    const locationData = JSON.parse(fs.readFileSync(locationPath, 'utf8')) as LocationData;

    return locationData;
  } catch (error) {
    console.error(`Error loading location ${locationName}:`, error);
    return null;
  }
}

/**
 * Utility function to load the location manifest
 */
export async function loadLocationManifest(): Promise<LocationManifest | null> {
  try {
    const manifestPath = path.join(__dirname, 'output/locations/_index.json');

    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as LocationManifest;

    return manifest;
  } catch (error) {
    console.error('Error loading location manifest:', error);
    return null;
  }
}

/**
 * Utility function to load all locations by region
 */
export async function loadLocationsByRegion(
  region: 'johto' | 'kanto' | 'orange',
): Promise<LocationData[]> {
  try {
    const manifest = await loadLocationManifest();
    if (!manifest) {
      return [];
    }

    const regionEntries = manifest.locations.filter((entry) => entry.region === region);
    const locations: LocationData[] = [];

    for (const entry of regionEntries) {
      const location = await loadLocationByName(entry.name);
      if (location) {
        locations.push(location);
      }
    }

    return locations;
  } catch (error) {
    console.error(`Error loading locations for region ${region}:`, error);
    return [];
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  restructureLocationsToIndividualFiles().catch(console.error);
}
