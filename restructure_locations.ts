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

      // Add to manifest
      manifestEntries.push({
        fileName,
        name: locationData.name,
        displayName: locationData.displayName,
        region: locationData.region,
        id: locationData.id,
        flyable: locationData.flyable,
        order: order++,
      });
    }

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
