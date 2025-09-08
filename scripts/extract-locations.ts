import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LocationData, LocationManifest } from '../src/types/new.ts';
import splitFile from '@/lib/split.ts';
import reduce from '@/lib/reduce.ts';
import displayName from '@/lib/displayName.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const attributesASM = join(__dirname, '../polishedcrystal/data/maps/attributes.asm');
// const landmarksASM = join(__dirname, '../polishedcrystal/data/maps/landmarks.asm');

// const locationsManifest: LocationManifest[] = [];
const locations: LocationData[] = [];

const extractLocationsData = async (attributesData: string[]) => {
  // Parse location names from landmarks file

  // Parse connections from attributes file
  const locationConnections: Record<string, number> = {};

  let currentLocation = '';
  let connectionCount = 0;

  for (let i = 0; i < attributesData.length; i++) {
    const line = attributesData[i].trim();

    // Find map_attributes lines
    if (line.startsWith('map_attributes ')) {
      // Save previous location if exists
      if (currentLocation) {
        locationConnections[currentLocation] = connectionCount;
      }

      // Parse: map_attributes NewBarkTown, NEW_BARK_TOWN, $5, WEST | EAST
      const parts = line.replace('map_attributes ', '').split(',');
      if (parts.length >= 4) {
        currentLocation = parts[0].trim();

        // Count connections from the connection flags
        const connectionsStr = parts[3].trim();
        connectionCount = 0;

        // Count each direction mentioned
        if (connectionsStr.includes('NORTH')) connectionCount++;
        if (connectionsStr.includes('SOUTH')) connectionCount++;
        if (connectionsStr.includes('EAST')) connectionCount++;
        if (connectionsStr.includes('WEST')) connectionCount++;
      }
    }

    // Count individual connection lines for verification
    if (line.startsWith('connection ')) {
      // This should match our flag count, but we'll use the flags as primary source
      // connection west, Route29, ROUTE_29, 0
    }
  }

  // Don't forget the last location
  if (currentLocation) {
    locationConnections[currentLocation] = connectionCount;
  }

  // Convert location names to proper display names and create manifest entries
  for (const [locationKey, connections] of Object.entries(locationConnections)) {
    const locationId = reduce(locationKey);
    const locationName = displayName(locationKey);
    // Try to find a matching landmark name
    locations.push({
      id: locationId,
      name: locationName,
      connectionCount: connections,
    });
  }

  console.log(`Extracted ${locations.length} locations.`);

  // Sort by name for better organization
  locations.sort((a, b) => a.name.localeCompare(b.name));
};

//#1: Map Attributes
const raw = await readFile(attributesASM, 'utf-8');
const locationNames = splitFile(raw);
extractLocationsData(locationNames[0]);

// Create output directories
const locationsDir = join(__dirname, '..', 'new', 'locations');
const outputDir = join(__dirname, '..', 'new');

try {
  await mkdir(locationsDir, { recursive: true });
  console.log('Created output directories');
} catch (error) {
  if (error) {
    throw error;
  }
  // Directory might already exist, continue
}

// Write individual Location files
const manifest: LocationManifest[] = [];
for (const location of locations) {
  // Create individual Location file
  const locationPath = join(locationsDir, `${location.id}.json`);
  await writeFile(locationPath, JSON.stringify(location, null, 2), 'utf-8');

  // Add to manifest with compact data
  const manifestEntry = {
    id: location.id,
    name: location.name,
  };
  manifest.push(manifestEntry);
}

// Write compact manifest file
const manifestPath = join(outputDir, 'locations_manifest.json');
await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

//Location GETTER
const getLocations = () => {
  return locations;
};

export default getLocations;
