#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface LocationManifest {
  totalLocations: number;
  regions: Record<string, number>;
  flyableLocations: number;
  landmarks: number;
  locations: Array<{
    fileName: string;
    name: string;
    displayName: string;
    region: string;
    id: number;
    flyable: boolean;
    order: number;
    trainerCount: number;
    pokemonCount: number;
    locationType: string;
  }>;
}

interface LocationSummary {
  name: string;
  displayName: string;
  region: string;
  flyable: boolean;
  locationType: string;
  pokemonCount: number;
  trainerCount: number;
  itemCount: number;
  connectionCount: number;
  eventCount: number;
  hasHiddenGrottoes: boolean;
  coordinates?: { x: number; y: number };
}

interface OptimizedLocationManifest {
  metadata: {
    totalLocations: number;
    regions: Record<string, number>;
    flyableLocations: number;
    landmarks: number;
  };
  locations: Record<string, LocationSummary>; // Contains only summary data
}

async function createLocationsManifest() {
  console.log('🗺️ Creating comprehensive locations manifest...');

  const locationsDir = path.join(process.cwd(), 'output/locations');
  const indexPath = path.join(locationsDir, '_index.json');
  const outputPath = path.join(process.cwd(), 'output/manifests/locations.json');

  // Ensure manifests directory exists
  const manifestsDir = path.dirname(outputPath);
  if (!fs.existsSync(manifestsDir)) {
    fs.mkdirSync(manifestsDir, { recursive: true });
  }

  if (!fs.existsSync(indexPath)) {
    console.error('❌ Location index file not found:', indexPath);
    return;
  }

  // Load the existing index
  const indexData: LocationManifest = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  console.log(`📊 Processing ${indexData.totalLocations} locations...`);

  // Process locations to create optimized summaries
  const optimizedLocationData: Record<string, LocationSummary> = {};
  let loadedCount = 0;
  let errorCount = 0;

  for (const locationInfo of indexData.locations) {
    try {
      const locationPath = path.join(locationsDir, locationInfo.fileName);

      if (fs.existsSync(locationPath)) {
        const locationData = JSON.parse(fs.readFileSync(locationPath, 'utf8'));

        // Count pokemon encounters
        const pokemonCount = locationData.pokemon ? Object.keys(locationData.pokemon).length : 0;

        // Count trainers
        const trainerCount = locationData.trainers ? locationData.trainers.length : 0;

        // Count items
        const itemCount = locationData.items ? locationData.items.length : 0;

        // Count connections
        const connectionCount = locationData.connections ? locationData.connections.length : 0;

        // Count events
        const eventCount = locationData.events ? locationData.events.length : 0;

        // Check for hidden grottoes
        const hasHiddenGrottoes = locationData.pokemon
          ? Object.values(locationData.pokemon).some(
              (pokemon: any) =>
                pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto'),
            )
          : false;

        // Create the summary
        optimizedLocationData[locationInfo.name] = {
          name: locationInfo.name,
          displayName: locationInfo.displayName,
          region: locationInfo.region,
          flyable: locationInfo.flyable,
          locationType: locationInfo.locationType,
          pokemonCount,
          trainerCount,
          itemCount,
          connectionCount,
          eventCount,
          hasHiddenGrottoes,
          coordinates:
            locationData.x >= 0 && locationData.y >= 0
              ? { x: locationData.x, y: locationData.y }
              : undefined,
        };

        loadedCount++;

        if (loadedCount % 100 === 0) {
          console.log(`📄 Processed ${loadedCount}/${indexData.totalLocations} locations...`);
        }
      } else {
        console.warn(`⚠️ Location file not found: ${locationInfo.fileName}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Error loading ${locationInfo.fileName}:`, error);
      errorCount++;
    }
  }

  // Create the optimized manifest
  const optimizedManifest: OptimizedLocationManifest = {
    metadata: {
      totalLocations: indexData.totalLocations,
      regions: indexData.regions,
      flyableLocations: indexData.flyableLocations,
      landmarks: indexData.landmarks,
    },
    locations: optimizedLocationData,
  };

  // Write the manifest
  fs.writeFileSync(outputPath, JSON.stringify(optimizedManifest, null, 2));

  console.log(`✅ Created optimized locations manifest with ${loadedCount} locations`);
  console.log(`📁 Saved to: ${outputPath}`);

  if (errorCount > 0) {
    console.log(`⚠️ ${errorCount} locations had errors`);
  }

  // Output file size information
  const stats = fs.statSync(outputPath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Optimized manifest size: ${sizeInMB} MB`);

  return optimizedManifest;
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createLocationsManifest()
    .then(() => {
      console.log('🎉 Locations manifest creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error creating locations manifest:', error);
      process.exit(1);
    });
}

export { createLocationsManifest };
export type { OptimizedLocationManifest, LocationSummary };
