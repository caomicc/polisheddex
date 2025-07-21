import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LocationData, LocationConnection, NPCTrade, LocationEvent } from './src/types/types.ts';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Normalize Location Key ---
/**
 * Normalize location names to consistent snake_case keys
 * This ensures all data sources (Pokemon locations, comprehensive locations, etc.) use the same keys
 */
export function normalizeLocationKey(input: string): string {
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

// --- NPC Trades Extraction ---
export function extractNPCTrades(): Record<string, NPCTrade[]> {
  console.log('💱 Extracting NPC trades...');
  const tradesPath = path.join(__dirname, 'rom/data/events/npc_trades.asm');

  if (!fs.existsSync(tradesPath)) {
    console.warn('NPC trades file not found');
    return {};
  }

  const tradesContent = fs.readFileSync(tradesPath, 'utf8');
  const lines = tradesContent.split(/\r?\n/);
  const tradesByLocation: Record<string, NPCTrade[]> = {};

  let currentTrade: Partial<NPCTrade> = {};
  let currentLocation: string = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse location from comments like "; NPC_TRADE_MIKE in Goldenrod City"
    const locationMatch = line.match(/;\s*NPC_TRADE_\w+\s+in\s+(.+)/i);
    if (locationMatch) {
      currentLocation = normalizeLocationKey(locationMatch[1]);
      currentTrade = {};
      continue;
    }

    // Parse wants Pokemon: dp ABRA, NO_FORM
    const wantsMatch = line.match(/dp\s+(\w+),\s*(\w+)\s*;\s*wants/);
    if (wantsMatch) {
      currentTrade.wantsPokemon = wantsMatch[1].toLowerCase();
      if (wantsMatch[2] !== 'NO_FORM') {
        currentTrade.wantsForm = wantsMatch[2].toLowerCase();
      }
      continue;
    }

    // Parse gives Pokemon: dp MACHOP, FEMALE
    const givesMatch = line.match(/dp\s+(\w+),\s*(\w+)\s*;\s*gives/);
    if (givesMatch) {
      currentTrade.givesPokemon = givesMatch[1].toLowerCase();
      if (givesMatch[2] === 'MALE' || givesMatch[2] === 'FEMALE') {
        currentTrade.givesGender = givesMatch[2].toLowerCase();
      } else if (givesMatch[2] !== 'NO_FORM') {
        currentTrade.givesForm = givesMatch[2].toLowerCase();
      }
      continue;
    }

    // Parse nickname: rawchar "Muscle@@@@@"
    const nicknameMatch = line.match(/rawchar\s+"([^"@]+)@*/);
    if (nicknameMatch && !currentTrade.nickname) {
      currentTrade.nickname = nicknameMatch[1];
      continue;
    }

    // Parse trainer name: rawchar "Mike@@@@", $00
    const trainerMatch = line.match(/rawchar\s+"([^"@]+)@*",\s*\$00/);
    if (trainerMatch) {
      currentTrade.traderName = trainerMatch[1];

      // Complete trade entry
      if (currentLocation && currentTrade.wantsPokemon && currentTrade.givesPokemon) {
        if (!tradesByLocation[currentLocation]) {
          tradesByLocation[currentLocation] = [];
        }
        tradesByLocation[currentLocation].push(currentTrade as NPCTrade);
      }
      continue;
    }
  }

  const totalTrades = Object.values(tradesByLocation).reduce((sum, trades) => sum + trades.length, 0);
  console.log(`💱 Found ${totalTrades} NPC trades across ${Object.keys(tradesByLocation).length} locations`);

  return tradesByLocation;
}

// --- Location Events Extraction ---
export function extractLocationEvents(): Record<string, LocationEvent[]> {
  console.log('⚡ Extracting location events...');
  const mapsDir = path.join(__dirname, 'rom/maps');
  const eventsByLocation: Record<string, LocationEvent[]> = {};

  if (!fs.existsSync(mapsDir)) {
    console.warn('Maps directory not found');
    return {};
  }

  const mapFiles = fs.readdirSync(mapsDir).filter(file => file.endsWith('.asm'));

  for (const mapFile of mapFiles) {
    const locationKey = path.basename(mapFile, '.asm');
    // Use the normalization function for consistent keys
    const normalizedKey = normalizeLocationKey(locationKey);

    const mapPath = path.join(mapsDir, mapFile);
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    const lines = mapContent.split(/\r?\n/);

    const events: LocationEvent[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Rival battles
      if (line.includes('RivalBattle') || line.includes('RIVAL_')) {
        events.push({
          type: 'rival_battle',
          description: 'Rival Battle',
          details: 'Battle with your rival'
        });
      }

      // Coordinate events that trigger battles
      const coordEventMatch = line.match(/coord_event\s+(\d+),\s*(\d+),\s*\d+,\s*(.+)/);
      if (coordEventMatch) {
        const eventName = coordEventMatch[3];
        if (eventName.includes('Battle') || eventName.includes('Trigger')) {
          events.push({
            type: 'coordinate_trigger',
            description: eventName.replace(/([A-Z])/g, ' $1').trim(),
            coordinates: { x: parseInt(coordEventMatch[1]), y: parseInt(coordEventMatch[2]) }
          });
        }
      }

      // Special events
      if (line.includes('CelebiTrigger')) {
        events.push({
          type: 'special',
          description: 'Celebi Event',
          details: 'Time travel encounter with Celebi'
        });
      }

      // Visible item events (itemball_event)
      const visibleItemMatch = line.match(/itemball_event\s+(\d+),\s*(\d+),\s*(\w+),/);
      if (visibleItemMatch) {
        const itemName = visibleItemMatch[3].replace(/_/g, ' ').toLowerCase();
        const formattedItemName = itemName.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        events.push({
          type: 'item',
          description: `Visible Item: ${formattedItemName}`,
          coordinates: {
            x: parseInt(visibleItemMatch[1]),
            y: parseInt(visibleItemMatch[2])
          }
        });
      }

      // Hidden item events (bg_event with BGEVENT_ITEM)
      const hiddenItemMatch = line.match(/bg_event\s+(\d+),\s*(\d+),\s*BGEVENT_ITEM\s*\+\s*(\w+),/);
      if (hiddenItemMatch) {
        const itemName = hiddenItemMatch[3].replace(/_/g, ' ').toLowerCase();
        const formattedItemName = itemName.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        events.push({
          type: 'item',
          description: `Hidden Item: ${formattedItemName}`,
          coordinates: {
            x: parseInt(hiddenItemMatch[1]),
            y: parseInt(hiddenItemMatch[2])
          }
        });
      }
    }

    if (events.length > 0) {
      // Try both the original key and normalized key
      eventsByLocation[normalizedKey] = events;
      if (normalizedKey !== locationKey) {
        eventsByLocation[locationKey] = events;
      }
    }
  }

  const totalEvents = Object.values(eventsByLocation).reduce((sum, events) => sum + events.length, 0);
  console.log(`⚡ Found ${totalEvents} events across ${Object.keys(eventsByLocation).length} locations`);

  return eventsByLocation;
}

// --- Comprehensive Location Extraction ---
export function extractAllLocations(): Record<string, LocationData> {
  console.log('🗺️  Extracting all locations from landmarks, flypoints, and map attributes...');

  const locations: Record<string, LocationData> = {};

  // Extract NPC trades and events first
  const tradesByLocation = extractNPCTrades();
  const eventsByLocation = extractLocationEvents();

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
      // const nameConstant = landmarkMatch[3];

      // Find the landmark constant name for this index
      const landmarkConstantName = Object.keys(landmarkIdMap).find(name => landmarkIdMap[name] === landmarkIndex);

      if (landmarkConstantName && landmarkConstantName !== 'SPECIAL_MAP') {
        const region = landmarkRegionMap[landmarkConstantName] || 'johto';
        const normalizedKey = normalizeLocationKey(landmarkConstantName);

        locations[normalizedKey] = {
          id: landmarkIndex,
          name: normalizedKey,
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
          const locationKey = normalizeLocationKey(currentMapName);
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
        // const targetMapLabel = connectionMatch[2]; // e.g., Route29
        const targetMapConstant = connectionMatch[3]; // e.g., ROUTE_29
        const offset = parseInt(connectionMatch[4]);

        // Find the target location's display name
        const targetLocationKey = normalizeLocationKey(targetMapConstant);
        const targetDisplayName = targetMapConstant
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
      const locationKey = normalizeLocationKey(currentMapName);
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
  }  // Parse warp events from individual map files to create connections for indoor maps
  console.log('🚪 Parsing warp events from individual map files...');
  const mapsDir = path.join(__dirname, 'rom/maps');

  if (fs.existsSync(mapsDir)) {
    const mapFiles = fs.readdirSync(mapsDir).filter(file => file.endsWith('.asm'));

    for (const mapFile of mapFiles) {
      const sourceLocationKey = normalizeLocationKey(path.basename(mapFile, '.asm'));
      const mapPath = path.join(mapsDir, mapFile);
      const mapContent = fs.readFileSync(mapPath, 'utf8');
      const lines = mapContent.split(/\r?\n/);

      const warpConnections: LocationConnection[] = [];

      for (const line of lines) {
        // Parse warp_event lines: warp_event  X, Y, TARGET_MAP, warp_id
        const warpMatch = line.trim().match(/^warp_event\s+\d+,\s*\d+,\s*([A-Z_0-9_]+),\s*\d+/);
        if (warpMatch) {
          const targetMapConstant = warpMatch[1];
          const targetLocationKey = normalizeLocationKey(targetMapConstant);

          // Debug logging for all warps to understand the pattern
          console.log(`🔍 Found warp from ${sourceLocationKey} (${path.basename(mapFile, '.asm')}) to ${targetLocationKey} (${targetMapConstant})`);

          // Only add if this connection doesn't already exist
          const exists = warpConnections.some(conn => conn.targetLocation === targetLocationKey);
          if (!exists) {
            const targetDisplayName = targetMapConstant
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');

            warpConnections.push({
              direction: 'warp',
              targetLocation: targetLocationKey,
              targetLocationDisplay: targetDisplayName,
              offset: 0
            });
          }
        }
      }

      // Add warp connections to the location if any were found
      if (warpConnections.length > 0) {
        // Debug logging for Burned Tower
        if (sourceLocationKey.includes('burned_tower')) {
          console.log(`🔗 Adding ${warpConnections.length} warp connections to ${sourceLocationKey}`);
        }

        if (!locations[sourceLocationKey]) {
          // Create location entry if it doesn't exist
          locations[sourceLocationKey] = {
            id: -1,
            name: sourceLocationKey,
            displayName: path.basename(mapFile, '.asm')
              .split(/(?=[A-Z])/) // Split on capital letters
              .join(' ')
              .replace(/^\w/, c => c.toUpperCase()),
            region: 'johto',
            x: -1,
            y: -1,
            flyable: false,
            connections: warpConnections,
          };
        } else {
          // Add to existing connections, avoiding duplicates
          const existingTargets = new Set(locations[sourceLocationKey].connections.map(c => c.targetLocation));
          const newConnections = warpConnections.filter(c => !existingTargets.has(c.targetLocation));
          locations[sourceLocationKey].connections.push(...newConnections);
        }
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

  // Load Pokemon location data to ensure all Pokemon locations have entries
  const pokemonLocationPath = path.join(__dirname, 'output/locations_by_area.json');
  if (fs.existsSync(pokemonLocationPath)) {
    console.log('🔄 Merging Pokemon location data...');
    const pokemonLocationData = JSON.parse(fs.readFileSync(pokemonLocationPath, 'utf8'));

    for (const pokemonLocationName of Object.keys(pokemonLocationData)) {
      const normalizedPokemonKey = normalizeLocationKey(pokemonLocationName);

      // If this Pokemon location doesn't exist in our comprehensive data, create an entry
      if (!locations[normalizedPokemonKey]) {
        locations[normalizedPokemonKey] = {
          id: -1, // Non-landmark locations get -1 ID
          name: normalizedPokemonKey,
          displayName: pokemonLocationName, // Use original Pokemon location display name
          region: 'johto', // Default region, could be refined later
          x: -1, // No coordinates for Pokemon-only locations
          y: -1,
          flyable: false,
          connections: [],
        };

        console.log(`📍 Created location entry for Pokemon location: ${pokemonLocationName} -> ${normalizedPokemonKey}`);
      }
    }
  }

  // Merge NPC trades into location data
  console.log('💱 Merging NPC trades...');
  for (const [locationKey, trades] of Object.entries(tradesByLocation)) {
    if (locations[locationKey]) {
      locations[locationKey].npcTrades = trades;
    } else {
      console.log(`⚠️  NPC trades found for unknown location: ${locationKey}`);
    }
  }

  // Merge events into location data
  console.log('⚡ Merging location events...');
  for (const [locationKey, events] of Object.entries(eventsByLocation)) {
    if (locations[locationKey]) {
      locations[locationKey].events = events;
    } else {
      console.log(`⚠️  Events found for unknown location: ${locationKey}`);
    }
  }

  const totalTrades = Object.values(locations).reduce((sum, loc) => sum + (loc.npcTrades?.length || 0), 0);
  const totalEvents = Object.values(locations).reduce((sum, loc) => sum + (loc.events?.length || 0), 0);

  const landmarkLocations = Object.values(locations).filter(l => l.id >= 0).length;
  const nonLandmarkLocations = Object.values(locations).filter(l => l.id < 0).length;
  const totalConnections = Object.values(locations).reduce((sum, loc) => sum + loc.connections.length, 0);
  const flyableCount = Object.values(locations).filter(l => l.flyable).length;

  console.log(`✅ Extracted ${Object.keys(locations).length} total locations:`);
  console.log(`   📍 ${landmarkLocations} landmark locations with coordinates`);
  console.log(`   🗺️  ${nonLandmarkLocations} map-only locations (no world map coordinates)`);
  console.log(`   🔗 ${totalConnections} total map connections`);
  console.log(`   ✈️  ${flyableCount} flyable locations`);
  console.log(`   💱 ${totalTrades} NPC trades`);
  console.log(`   ⚡ ${totalEvents} special events`);

  return locations;
}

// --- Export all locations to JSON ---
export async function exportAllLocations() {
  try {
    const allLocations = extractAllLocations();

    // Consolidate locations with similar normalized keys
    console.log('🔄 Consolidating duplicate location entries...');
    const consolidatedLocations: Record<string, LocationData> = {};
    const consolidationGroups: Record<string, string[]> = {}; // normalizedKey -> originalKeys[]

    // Group locations by their fully normalized keys
    for (const [originalKey] of Object.entries(allLocations)) {
      const normalizedKey = normalizeLocationKey(originalKey);

      if (!consolidationGroups[normalizedKey]) {
        consolidationGroups[normalizedKey] = [];
      }
      consolidationGroups[normalizedKey].push(originalKey);
    }

    // Debug: show groups with multiple entries before consolidation
    const groupsWithMultiples = Object.entries(consolidationGroups).filter(([, keys]) => keys.length > 1);
    if (groupsWithMultiples.length > 0) {
      console.log(`🔍 Found ${groupsWithMultiples.length} groups with multiple entries:`);
      groupsWithMultiples.forEach(([normalizedKey, originalKeys]) => {
        console.log(`   • ${normalizedKey}: [${originalKeys.join(', ')}]`);
      });
    } else {
      console.log('🔍 No duplicate groups found - checking a few examples...');
      const exampleKeys = Object.keys(consolidationGroups).filter(key => key.includes('burned')).slice(0, 5);
      exampleKeys.forEach(key => {
        console.log(`   • ${key}: [${consolidationGroups[key].join(', ')}]`);
      });
    }

    // Consolidate groups that have multiple entries
    for (const [normalizedKey, originalKeys] of Object.entries(consolidationGroups)) {
      if (originalKeys.length === 1) {
        // Single entry, no consolidation needed
        consolidatedLocations[normalizedKey] = allLocations[originalKeys[0]];
      } else {
        // Multiple entries, consolidate them
        console.log(`   🔀 Consolidating ${originalKeys.length} entries for "${normalizedKey}": [${originalKeys.join(', ')}]`);

        // Debug: show display names being consolidated
        const displayNames = originalKeys.map(key => `"${allLocations[key].displayName}"`);
        console.log(`      Display names: [${displayNames.join(', ')}]`);

        // Start with the first location as base
        const baseLocation = { ...allLocations[originalKeys[0]] };
        baseLocation.name = normalizedKey; // Use normalized key as the canonical name

        // Choose the most descriptive display name (prefer ones with floor numbers)
        baseLocation.displayName = displayNames.find(name => /[0-9]f?/i.test(name)) || displayNames[0];

        // Merge all connections, removing duplicates
        const allConnections = originalKeys.flatMap(key => allLocations[key].connections);
        const uniqueConnections = allConnections.filter((conn, index, self) =>
          index === self.findIndex(c =>
            c.direction === conn.direction &&
            c.targetLocation === conn.targetLocation
          )
        );
        baseLocation.connections = uniqueConnections;

        // Merge all NPC trades, removing duplicates
        const allTrades = originalKeys.flatMap(key => allLocations[key].npcTrades || []);
        const uniqueTrades = allTrades.filter((trade, index, self) =>
          index === self.findIndex(t =>
            t.traderName === trade.traderName &&
            t.wantsPokemon === trade.wantsPokemon &&
            t.givesPokemon === trade.givesPokemon
          )
        );
        if (uniqueTrades.length > 0) {
          baseLocation.npcTrades = uniqueTrades;
        }

        // Merge all events, removing duplicates
        const allEvents = originalKeys.flatMap(key => allLocations[key].events || []);
        const uniqueEvents = allEvents.filter((event, index, self) =>
          index === self.findIndex(e =>
            e.type === event.type &&
            e.description === event.description
          )
        );
        if (uniqueEvents.length > 0) {
          baseLocation.events = uniqueEvents;
        }

        consolidatedLocations[normalizedKey] = baseLocation;
      }
    }

    console.log(`✨ Consolidated ${Object.keys(allLocations).length} entries into ${Object.keys(consolidatedLocations).length} unique locations`);

    // Sort locations by region, then landmarks first, then by ID/name
    const sortedLocations = Object.entries(consolidatedLocations)
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
