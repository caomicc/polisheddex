import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function rebuildLocationFiles() {
  console.log('🔄 Rebuilding consolidated location files from individual files...');

  const locationsDir = path.join(__dirname, 'output/locations');
  const allLocationsPath = path.join(__dirname, 'output/all_locations.json');
  const allLocationsOrderedPath = path.join(__dirname, 'output/all_locations_ordered.json');

  if (!fs.existsSync(locationsDir)) {
    console.error('❌ Locations directory not found');
    return;
  }

  // Read all location files
  const locationFiles = fs
    .readdirSync(locationsDir)
    .filter((file) => file.endsWith('.json') && file !== '_index.json');

  console.log(`📁 Found ${locationFiles.length} location files`);

  const allLocations: Record<string, unknown> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderedLocations: any[] = [];

  for (const file of locationFiles) {
    try {
      const filePath = path.join(locationsDir, file);
      const locationData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Use the filename (without .json) as the key
      const locationKey = path.basename(file, '.json');
      allLocations[locationKey] = locationData;

      // Add to ordered array with the key
      orderedLocations.push({
        ...locationData,
        key: locationKey,
      });
    } catch (error) {
      console.warn(`⚠️  Could not read ${file}:`, error);
    }
  }

  // Sort ordered locations by ID (if available) or alphabetically
  orderedLocations.sort((a, b) => {
    if (a.id !== undefined && b.id !== undefined) {
      return a.id - b.id;
    }
    return a.displayName?.localeCompare(b.displayName) || 0;
  });

  // Write consolidated files
  try {
    fs.writeFileSync(allLocationsPath, JSON.stringify(allLocations, null, 2));
    console.log(`✅ Created all_locations.json with ${Object.keys(allLocations).length} locations`);

    fs.writeFileSync(allLocationsOrderedPath, JSON.stringify(orderedLocations, null, 2));
    console.log(`✅ Created all_locations_ordered.json with ${orderedLocations.length} locations`);

    // Create a basic summary
    const summary = {
      total: orderedLocations.length,
      regions: {
        johto: orderedLocations.filter((l) => l.region === 'johto').length,
        kanto: orderedLocations.filter((l) => l.region === 'kanto').length,
        orange: orderedLocations.filter((l) => l.region === 'orange').length,
      },
      flyable: orderedLocations.filter((l) => l.flyable).length,
    };

    console.log('📊 Summary:', summary);
  } catch (error) {
    console.error('❌ Error writing consolidated files:', error);
  }
}

// Run the rebuild
rebuildLocationFiles().catch(console.error);
