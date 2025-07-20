import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LocationData, LocationConnection } from './src/types/types.ts';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Comprehensive Location Extraction ---
export function extractAllLocations(): Record<string, LocationData> {
  console.log('🗺️  Extracting all locations from landmarks, flypoints, and map attributes...');

  const locations: Record<string, LocationData> = {};

  // Read landmark constants to get the mapping of names to IDs
  const landmarkConstantsPath = path.join(__dirname, 'rom/constants/landmark_constants.asm');
  const landmarksPath = path.join(__dirname, 'rom/data/maps/landmarks.asm');
  const flyPointsPath = path.join(__dirname, 'rom/data/maps/flypoints.asm');
  const mapAttributesPath = path.join(__dirname, 'rom/data/maps/attributes.asm');

  if (!fs.existsSync(landmarkConstantsPath) || !fs.existsSync(landmarksPath)) {
    console.warn('Landmark files not found, skipping comprehensive location extraction');
    return {};
  }

  // Parse landmark constants to get ID mapping
  const constantsContent = fs.readFileSync(landmarkConstantsPath, 'utf8');
  const landmarkIdMap: Record<string, number> = {};
  const landmarkRegionMap: Record<string, 'johto' | 'kanto' | 'orange'> = {};

  const constantsLines = constantsContent.split(/\r?\n/);
  let currentValue = 0;
  let currentRegion: 'johto' | 'kanto' | 'orange' = 'johto';

  for (const line of constantsLines) {
    const trimmedLine = line.trim();

    if (trimmedLine.includes('const_def')) {
      currentValue = 0;
      continue;
    }

    if (trimmedLine.includes('KANTO_LANDMARK EQU')) {
      currentRegion = 'kanto';
      continue;
    }

    if (trimmedLine.includes('SHAMOUTI_LANDMARK EQU')) {
      currentRegion = 'orange';
      continue;
    }

    const constMatch = trimmedLine.match(/^\s*const\s+([A-Z_0-9]+)/);
    if (constMatch) {
      const constantName = constMatch[1];
      landmarkIdMap[constantName] = currentValue;
      landmarkRegionMap[constantName] = currentRegion;
      currentValue++;
    }
  }

  // Parse landmarks.asm to get coordinates and display names
  const landmarksContent = fs.readFileSync(landmarksPath, 'utf8');
  const landmarkLines = landmarksContent.split(/\r?\n/);

  let landmarkIndex = 0;
  const displayNameMap: Record<string, string> = {};

  for (const line of landmarkLines) {
    const trimmedLine = line.trim();

    // Parse landmark macro calls
    const landmarkMatch = trimmedLine.match(/^\s*landmark\s+(-?\d+),\s*(-?\d+),\s*(\w+)/);
    if (landmarkMatch) {
      const x = parseInt(landmarkMatch[1]);
      const y = parseInt(landmarkMatch[2]);
      const nameConstant = landmarkMatch[3];

      // Find the landmark constant name for this index
      const landmarkConstantName = Object.keys(landmarkIdMap).find(name => landmarkIdMap[name] === landmarkIndex);

      if (landmarkConstantName && landmarkConstantName !== 'SPECIAL_MAP') {
        const region = landmarkRegionMap[landmarkConstantName] || 'johto';

        locations[landmarkConstantName.toLowerCase()] = {
          id: landmarkIndex,
          name: landmarkConstantName.toLowerCase(),
          displayName: '', // Will be filled from display names
          region,
          x,
          y,
          flyable: false, // Will be updated from flypoints
          connections: [], // Will be filled from map attributes
        };
      }

      landmarkIndex++;
    }

    // Parse display name definitions
    const nameMatch = trimmedLine.match(/^(\w+):\s*rawchar\s*"([^@]+)@"/);
    if (nameMatch) {
      const nameConstant = nameMatch[1];
      let displayName = nameMatch[2];

      // Clean up display name (remove ¯ characters used for line breaks)
      displayName = displayName.replace(/¯/g, ' ');

      displayNameMap[nameConstant] = displayName;
    }
  }

  // Parse map attributes to get ALL maps (including non-landmark maps) and their connections
  if (fs.existsSync(mapAttributesPath)) {
    console.log('🗺️  Parsing all maps from map attributes...');
    const mapAttributesContent = fs.readFileSync(mapAttributesPath, 'utf8');
    const mapLines = mapAttributesContent.split(/\r?\n/);

    let currentMapName: string | null = null;
    let currentConnections: LocationConnection[] = [];

    for (let i = 0; i < mapLines.length; i++) {
      const line = mapLines[i].trim();

      // Parse map_attributes macro calls to identify current map
      const mapAttributesMatch = line.match(/^\s*map_attributes\s+(\w+),\s*([A-Z_0-9_]+),\s*\$[0-9a-fA-F]+,\s*(.*)/);
      if (mapAttributesMatch) {
        // Save connections for the previous map
        if (currentMapName && currentConnections.length > 0) {
          const locationKey = currentMapName.toLowerCase();
          if (locations[locationKey]) {
            locations[locationKey].connections = [...currentConnections];
          } else {
            // Create a non-landmark location entry for maps that aren't landmarks
            locations[locationKey] = {
              id: -1, // Non-landmark locations get -1 ID
              name: locationKey,
              displayName: currentMapName
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' '),
              region: 'johto', // Default region, could be refined later
              x: -1, // No coordinates for non-landmark locations
              y: -1,
              flyable: false,
              connections: [...currentConnections],
            };
          }
        }

        // Start processing new map
        currentMapName = mapAttributesMatch[2]; // Use the constant name (e.g., NEW_BARK_TOWN)
        currentConnections = [];
        continue;
      }

      // Parse connection lines
      const connectionMatch = line.match(/^\s*connection\s+(north|south|east|west),\s*(\w+),\s*([A-Z_0-9_]+),\s*(-?\d+)/);
      if (connectionMatch && currentMapName) {
        const direction = connectionMatch[1] as 'north' | 'south' | 'east' | 'west';
        const targetMapLabel = connectionMatch[2]; // e.g., Route29
        const targetMapConstant = connectionMatch[3]; // e.g., ROUTE_29
        const offset = parseInt(connectionMatch[4]);

        // Find the target location's display name
        const targetLocationKey = targetMapConstant.toLowerCase();
        let targetDisplayName = targetMapConstant
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        currentConnections.push({
          direction,
          targetLocation: targetLocationKey,
          targetLocationDisplay: targetDisplayName,
          offset
        });
      }
    }

    // Don't forget to save connections for the last map
    if (currentMapName && currentConnections.length > 0) {
      const locationKey = currentMapName.toLowerCase();
      if (locations[locationKey]) {
        locations[locationKey].connections = [...currentConnections];
      } else {
        // Create a non-landmark location entry for maps that aren't landmarks
        locations[locationKey] = {
          id: -1, // Non-landmark locations get -1 ID
          name: locationKey,
          displayName: currentMapName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' '),
          region: 'johto', // Default region, could be refined later
          x: -1, // No coordinates for non-landmark locations
          y: -1,
          flyable: false,
          connections: [...currentConnections],
        };
      }
    }
  }

  // Map display names to locations
  for (const [locationKey, locationData] of Object.entries(locations)) {
    // Skip if display name is already set for non-landmark locations
    if (locationData.displayName && locationData.displayName !== '') {
      continue;
    }

    // Try to find matching display name
    const nameConstant = Object.keys(displayNameMap).find(name =>
      name.toLowerCase().replace('name', '') === locationKey ||
      name.toLowerCase() === locationKey + 'name'
    );

    if (nameConstant) {
      locationData.displayName = displayNameMap[nameConstant];
    } else {
      // Fallback: convert constant name to readable format
      locationData.displayName = locationKey
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Update target location display names now that all locations exist
  for (const location of Object.values(locations)) {
    for (const connection of location.connections) {
      const targetLocation = locations[connection.targetLocation];
      if (targetLocation && targetLocation.displayName) {
        connection.targetLocationDisplay = targetLocation.displayName;
      }
    }
  }

  // Parse flypoints to determine which locations are flyable
  if (fs.existsSync(flyPointsPath)) {
    const flyPointsContent = fs.readFileSync(flyPointsPath, 'utf8');
    const flyPointsLines = flyPointsContent.split(/\r?\n/);

    for (const line of flyPointsLines) {
      const trimmedLine = line.trim();
      const flyPointMatch = trimmedLine.match(/^\s*db\s+([A-Z_]+),\s*([A-Z_]+)/);

      if (flyPointMatch) {
        const landmarkConstant = flyPointMatch[1];
        const spawnPoint = flyPointMatch[2];
        const locationKey = landmarkConstant.toLowerCase();

        if (locations[locationKey]) {
          locations[locationKey].flyable = true;
          locations[locationKey].spawnPoint = spawnPoint;
        }
      }
    }
  }

  const landmarkLocations = Object.values(locations).filter(l => l.id >= 0).length;
  const nonLandmarkLocations = Object.values(locations).filter(l => l.id < 0).length;
  const totalConnections = Object.values(locations).reduce((sum, loc) => sum + loc.connections.length, 0);
  const flyableCount = Object.values(locations).filter(l => l.flyable).length;

  console.log(`✅ Extracted ${Object.keys(locations).length} total locations:`);
  console.log(`   📍 ${landmarkLocations} landmark locations with coordinates`);
  console.log(`   🗺️  ${nonLandmarkLocations} map-only locations (no world map coordinates)`);
  console.log(`   🔗 ${totalConnections} total map connections`);
  console.log(`   ✈️  ${flyableCount} flyable locations`);

  return locations;
}

// --- Export all locations to JSON ---
export async function exportAllLocations() {
  try {
    const allLocations = extractAllLocations();

    // Sort locations by region, then landmarks first, then by ID/name
    const sortedLocations = Object.entries(allLocations)
      .sort(([, a], [, b]) => {
        // First sort by region (johto, kanto, orange)
        const regionOrder: Record<string, number> = { johto: 0, kanto: 1, orange: 2 };
        if (regionOrder[a.region] !== regionOrder[b.region]) {
          return regionOrder[a.region] - regionOrder[b.region];
        }

        // Then landmarks first (positive IDs), then map-only locations (negative IDs)
        if ((a.id >= 0) !== (b.id >= 0)) {
          return b.id - a.id; // Positive IDs (landmarks) come first
        }

        // Within same type, sort by ID or name
        if (a.id >= 0 && b.id >= 0) {
          return a.id - b.id; // Sort landmarks by ID
        } else {
          return a.name.localeCompare(b.name); // Sort map-only by name
        }
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, LocationData>);

    const outputPath = path.join(__dirname, 'output/all_locations.json');
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(sortedLocations, null, 2)
    );

    console.log(`📍 Exported ${Object.keys(sortedLocations).length} locations to ${outputPath}`);

    // Also create a summary by region
    const locationsByRegion = {
      johto: Object.values(sortedLocations).filter(l => l.region === 'johto'),
      kanto: Object.values(sortedLocations).filter(l => l.region === 'kanto'),
      orange: Object.values(sortedLocations).filter(l => l.region === 'orange'),
    };

    const summaryPath = path.join(__dirname, 'output/locations_by_region.json');
    await fs.promises.writeFile(
      summaryPath,
      JSON.stringify({
        summary: {
          total: Object.keys(sortedLocations).length,
          flyable: Object.values(sortedLocations).filter(l => l.flyable).length,
          landmarks: Object.values(sortedLocations).filter(l => l.id >= 0).length,
          mapOnly: Object.values(sortedLocations).filter(l => l.id < 0).length,
          johto: locationsByRegion.johto.length,
          kanto: locationsByRegion.kanto.length,
          orange: locationsByRegion.orange.length,
        },
        locations: locationsByRegion
      }, null, 2)
    );

    console.log(`📊 Exported location summary to ${summaryPath}`);

    return sortedLocations;
  } catch (error) {
    console.error('❌ Error exporting locations:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportAllLocations().catch(console.error);
}
