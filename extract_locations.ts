import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LocationData, LocationConnection, NPCTrade, LocationEvent, LocationItem, GymLeader, TrainerPokemon } from './src/types/types.ts';
import { extractTrainerData } from './src/utils/extractors/trainerExtractors.ts';

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
    // Convert spaces, hyphens, and other separators to underscores
    .replace(/[\s\-\.]+/g, '_')
    // Handle basement floor patterns: "b_1_f" -> "b_1f"
    .replace(/_b_(\d+)_f(_|$)/g, '_b_$1f$2')
    // Handle regular floor patterns: "tower_1_f" -> "tower_1f"
    .replace(/(\w)_?(\d+)_+f(_|$)/gi, '$1_$2f$3')
    // Pattern for standalone numbers that should be floors - but NOT for routes
    // Only add "f" to numbers that are likely floors (between words that suggest buildings/areas)
    .replace(/(tower|building|floor|level|gym|center|house|cave|tunnel|path|mansion)_(\d+)(_|$)/gi, '$1_$2f$3')
    .replace(/(\w)_(\d+)_(\w+)_side(_|$)/gi, '$1_$2f_$3_side$4') // Handle "ice_path_2_blackthorn_side" -> "ice_path_2f_blackthorn_side"
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

// --- TM/HM Location Extraction ---
export function extractTMHMLocations(): Record<string, { tmNumber: string; moveName: string; location: string }[]> {
  console.log('🔧 Extracting TM/HM locations...');

  const tmhmMovesPath = path.join(__dirname, 'rom/data/moves/tmhm_moves.asm');

  if (!fs.existsSync(tmhmMovesPath)) {
    console.warn('TM/HM moves file not found');
    return {};
  }

  const tmhmContent = fs.readFileSync(tmhmMovesPath, 'utf8');
  const lines = tmhmContent.split(/\r?\n/);
  const tmhmByLocation: Record<string, { tmNumber: string; moveName: string; location: string }[]> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for lines that define TM/HM moves with locations
    // Format: db MOVE_NAME ; TMXX (Location)
    if (line.startsWith('db ')) {
      const parts = line.split(';');

      if (parts.length >= 2) {
        // Extract move name
        const moveName = parts[0].replace('db', '').trim();

        // Extract TM/HM info and location
        const tmhmInfo = parts[1].trim();
        const tmhmMatch = tmhmInfo.match(/(TM|HM)(\d+)\s*(?:\(([^)]+)\))?/);

        if (tmhmMatch) {
          const tmType = tmhmMatch[1];
          const tmNumber = tmhmMatch[2].padStart(2, '0');
          const location = tmhmMatch[3] || '';

          if (location) {
            const locationKey = normalizeLocationKey(location);
            const tmhmNumber = `${tmType}${tmNumber}`;

            if (!tmhmByLocation[locationKey]) {
              tmhmByLocation[locationKey] = [];
            }

            tmhmByLocation[locationKey].push({
              tmNumber: tmhmNumber,
              moveName: formatMoveName(moveName),
              location: location
            });
          }
        }
      }
    }
  }

  const totalTMs = Object.values(tmhmByLocation).reduce((sum, tms) => sum + tms.length, 0);
  console.log(`🔧 Found ${totalTMs} TM/HMs across ${Object.keys(tmhmByLocation).length} locations`);

  return tmhmByLocation;
}

/**
 * Format move name from ASM format to display format
 */
function formatMoveName(asmName: string): string {
  // Special cases
  if (asmName === 'PSYCHIC_M') return 'Psychic';

  // Replace underscores with spaces and convert to title case
  return asmName.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// --- Comprehensive Location Extraction ---
export function extractAllLocations(): Record<string, LocationData> {
  console.log('🗺️  Extracting all locations from landmarks, flypoints, and map attributes...');

  const locations: Record<string, LocationData> = {};

  // Extract NPC trades, events, items, TM/HM locations, and trainer data first
  const tradesByLocation = extractNPCTrades();
  const eventsByLocation = extractLocationEvents();
  const itemsByLocation = extractLocationItems();
  const tmhmByLocation = extractTMHMLocations();
  const trainerData = extractTrainerData();
  const gymLeadersByLocation = extractGymLeaders();

  // Read landmark constants to get the mapping of names to IDs
  const landmarkConstantsPath = path.join(__dirname, 'rom/constants/landmark_constants.asm');
  const landmarksPath = path.join(__dirname, 'rom/data/maps/landmarks.asm');
  const flyPointsPath = path.join(__dirname, 'rom/data/maps/flypoints.asm');
  const mapAttributesPath = path.join(__dirname, 'rom/data/maps/attributes.asm');

  if (!fs.existsSync(landmarkConstantsPath) || !fs.existsSync(landmarksPath)) {
    console.warn('Landmark files not found, skipping comprehensive location extraction');
    return {};
  }

  // Parse landmark constants to get the canonical ordering and ID mapping for ALL locations
  const constantsContent = fs.readFileSync(landmarkConstantsPath, 'utf8');
  const landmarkIdMap: Record<string, number> = {};
  const landmarkRegionMap: Record<string, 'johto' | 'kanto' | 'orange'> = {};
  const canonicalOrder: string[] = []; // Track the canonical order of all locations

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
      canonicalOrder.push(constantName); // Track canonical order
      currentValue++;
    }
  }

  console.log(`📋 Loaded canonical ordering: ${canonicalOrder.length} locations from landmark constants`);

  // Initialize ALL locations from the canonical order first
  // This ensures we have entries for every location in landmark_constants.asm
  for (const constantName of canonicalOrder) {
    if (constantName !== 'SPECIAL_MAP') { // Skip SPECIAL_MAP
      const normalizedKey = normalizeLocationKey(constantName);
      const id = landmarkIdMap[constantName];
      const region = landmarkRegionMap[constantName] || 'johto';

      locations[normalizedKey] = {
        id,
        name: normalizedKey,
        displayName: formatDisplayName(normalizedKey),
        region,
        x: -1, // Default to no coordinates; will be updated from landmarks.asm if available
        y: -1,
        flyable: false, // Will be updated from flypoints
        connections: [], // Will be filled from map attributes
      };
    }
  }

  console.log(`📍 Initialized ${Object.keys(locations).length} locations from canonical order`);

  // Parse landmarks.asm to get coordinates and display names for locations that have them
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

      // Find the landmark constant name for this index using our canonical order
      if (landmarkIndex < canonicalOrder.length) {
        const landmarkConstantName = canonicalOrder[landmarkIndex];

        if (landmarkConstantName && landmarkConstantName !== 'SPECIAL_MAP') {
          const normalizedKey = normalizeLocationKey(landmarkConstantName);

          // Update the existing location entry with coordinates
          if (locations[normalizedKey]) {
            locations[normalizedKey].x = x;
            locations[normalizedKey].y = y;
          }
        }
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
              displayName: formatDisplayName(locationKey),
              region: inferLocationRegion(locationKey),
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
          displayName: formatDisplayName(locationKey),
          region: inferLocationRegion(locationKey),
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
            displayName: formatDisplayName(sourceLocationKey),
            region: inferLocationRegion(sourceLocationKey),
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
      locationData.displayName = formatDisplayName(locationKey);
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
          displayName: formatDisplayName(normalizedPokemonKey),
          region: inferLocationRegion(normalizedPokemonKey),
          x: -1,
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

  // Merge TM/HM locations into location data
  console.log('🔧 Merging TM/HM locations...');
  for (const [locationKey, tmhms] of Object.entries(tmhmByLocation)) {
    if (locations[locationKey]) {
      locations[locationKey].tmhms = tmhms;
    } else {
      console.log(`⚠️  TM/HM locations found for unknown location: ${locationKey}`);
    }
  }

  // Merge trainer data into location data
  console.log('🎯 Merging trainer data...');
  for (const [trainerKey, trainers] of Object.entries(trainerData)) {
    // Find matching location by trying various key matching strategies
    let matchedLocationKey: string | null = null;

    // Strategy 1: Direct match
    if (locations[trainerKey]) {
      matchedLocationKey = trainerKey;
    } else {
      // Strategy 2: Try to match trainer key to location names
      const possibleKeys = [
        trainerKey,
        trainerKey.replace(/_/g, ''),
        trainerKey.replace(/bug_catcher/g, 'bugcatcher'),
        trainerKey.replace(/youngster/g, 'youngster'),
        // Add more trainer class mappings as needed
      ];

      for (const key of possibleKeys) {
        if (locations[key]) {
          matchedLocationKey = key;
          break;
        }
      }

      // Strategy 3: Search for partial matches in location names
      if (!matchedLocationKey) {
        for (const locationKey of Object.keys(locations)) {
          // Check if location name contains the trainer location info
          // This is a fallback for trainers whose location isn't directly mappable
          if (locationKey.includes('route') || locationKey.includes('city') || locationKey.includes('town')) {
            // For now, let's skip this complex matching and rely on map data
            continue;
          }
        }
      }
    }

    if (matchedLocationKey) {
      if (!locations[matchedLocationKey].trainers) {
        locations[matchedLocationKey].trainers = [];
      }
      locations[matchedLocationKey].trainers!.push(...trainers);
      console.log(`✅ Added ${trainers.length} trainers to ${matchedLocationKey}`);
    } else {
      console.log(`⚠️  Could not match trainer group "${trainerKey}" to any location`);
    }
  }

  // Merge gym leaders into location data
  console.log('🏆 Merging gym leaders...');
  for (const [locationKey, gymLeader] of Object.entries(gymLeadersByLocation)) {
    if (locations[locationKey]) {
      locations[locationKey].gymLeader = gymLeader;
      console.log(`✅ Added gym leader ${gymLeader.name} to ${locationKey}`);
    } else {
      console.log(`⚠️  Gym leader ${gymLeader.name} found for unknown location: ${locationKey}`);
    }
  }

  // Merge items into location data
  console.log('📦 Merging location items...');
  for (const [locationKey, items] of Object.entries(itemsByLocation)) {
    if (locations[locationKey]) {
      locations[locationKey].items = items;
    } else {
      console.log(`⚠️  Items found for unknown location: ${locationKey}`);
    }
  }

  const totalTrades = Object.values(locations).reduce((sum, loc) => sum + (loc.npcTrades?.length || 0), 0);
  const totalEvents = Object.values(locations).reduce((sum, loc) => sum + (loc.events?.length || 0), 0);
  const totalItems = Object.values(locations).reduce((sum, loc) => sum + (loc.items?.length || 0), 0);
  const totalTMHMs = Object.values(locations).reduce((sum, loc) => sum + (loc.tmhms?.length || 0), 0);
  const totalTrainers = Object.values(locations).reduce((sum, loc) => sum + (loc.trainers?.length || 0), 0);
  const totalGymLeaders = Object.values(locations).reduce((sum, loc) => sum + (loc.gymLeader ? 1 : 0), 0);

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
  console.log(`   � ${totalItems} items`);
  console.log(`   �🔧 ${totalTMHMs} TM/HM locations`);
  console.log(`   🎯 ${totalTrainers} trainers`);
  console.log(`   🏆 ${totalGymLeaders} gym leaders`);

  return locations;
}

// --- Extract Gym Leader Pokemon Parties ---
export function extractGymLeaderParties(): Record<string, { level: number; species: string; item?: string; gender?: string; moves?: string[] }[]> {
  console.log('🏆 Extracting gym leader Pokemon parties...');
  const partiesPath = path.join(__dirname, 'rom/data/trainers/parties.asm');

  if (!fs.existsSync(partiesPath)) {
    console.warn('Trainer parties file not found');
    return {};
  }

  const partiesContent = fs.readFileSync(partiesPath, 'utf8');
  const lines = partiesContent.split(/\r?\n/);
  const gymLeaderParties: Record<string, { level: number; species: string; item?: string; gender?: string; moves?: string[] }[]> = {};

  let currentTrainerClass: string | null = null;
  let currentTrainerNumber: number | null = null;
  let currentParty: { level: number; species: string; item?: string; gender?: string; moves?: string[] }[] = [];
  let currentPokemon: { level: number; species: string; item?: string; gender?: string; moves?: string[] } | null = null;

  // Define gym leader classes we're interested in
  const gymLeaderClasses = ['FALKNER', 'BUGSY', 'WHITNEY', 'MORTY', 'CHUCK', 'JASMINE', 'PRYCE', 'CLAIR', 'BROCK', 'MISTY', 'LT_SURGE', 'ERIKA', 'JANINE', 'SABRINA', 'BLAINE', 'BLUE'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for trainer class definitions: def_trainer_class FALKNER
    const classMatch = line.match(/def_trainer_class\s+([A-Z_]+)/);
    if (classMatch) {
      const trainerClass = classMatch[1];
      if (gymLeaderClasses.includes(trainerClass)) {
        currentTrainerClass = trainerClass;
        console.log(`🏆 Found gym leader class: ${trainerClass}`);
      } else {
        currentTrainerClass = null;
      }
      continue;
    }

    // Only process lines if we're in a gym leader class
    if (!currentTrainerClass) continue;

    // Look for trainer definitions: def_trainer 1, "Falkner"
    const trainerMatch = line.match(/def_trainer\s+(\d+),\s*"([^"]+)"/);
    if (trainerMatch) {
      // Save previous trainer's data if we had one
      if (currentTrainerNumber !== null && currentParty.length > 0) {
        const key = `${currentTrainerClass}_${currentTrainerNumber}`;
        gymLeaderParties[key] = [...currentParty];
        console.log(`🏆 Saved party for ${key}: ${currentParty.length} Pokemon`);
      }

      currentTrainerNumber = parseInt(trainerMatch[1]);
      currentParty = [];
      currentPokemon = null;
      continue;
    }

    // Look for Pokemon definitions: tr_mon <LEVEL>, [Nickname], <SPECIES/SPECIES @ ITEM>, [GENDER+FORM]
    const pokemonMatch = line.match(/tr_mon\s+(\d+),\s*([^,\s]+)(?:\s*@\s*([^,\s]+))?\s*(?:,\s*(MALE|FEMALE))?/);
    if (pokemonMatch) {
      // Save previous Pokemon if we had one
      if (currentPokemon) {
        currentParty.push(currentPokemon);
      }

      currentPokemon = {
        level: parseInt(pokemonMatch[1]),
        species: pokemonMatch[2].toLowerCase().replace(/-/g, '_'),
      };

      if (pokemonMatch[3]) {
        currentPokemon.item = pokemonMatch[3].toLowerCase();
      }

      if (pokemonMatch[4]) {
        currentPokemon.gender = pokemonMatch[4].toLowerCase();
      }
      continue;
    }

    // Look for moves: tr_moves MOVE1, MOVE2, MOVE3, MOVE4
    const movesMatch = line.match(/tr_moves\s+(.+)/);
    if (movesMatch && currentPokemon) {
      const moves = movesMatch[1]
        .split(',')
        .map(move => move.trim().toLowerCase().replace(/_/g, ' '))
        .filter(move => move.length > 0);
      currentPokemon.moves = moves;
      continue;
    }

    // Look for end of trainer: end_trainer
    if (line === 'end_trainer') {
      // Save current Pokemon if we have one
      if (currentPokemon) {
        currentParty.push(currentPokemon);
        currentPokemon = null;
      }

      // Save current trainer's party if we have one
      if (currentTrainerNumber !== null && currentParty.length > 0) {
        const key = `${currentTrainerClass}_${currentTrainerNumber}`;
        gymLeaderParties[key] = [...currentParty];
        console.log(`🏆 Saved party for ${key}: ${currentParty.length} Pokemon`);
      }

      // Reset for next trainer (but stay in same class)
      currentTrainerNumber = null;
      currentParty = [];
      currentPokemon = null;
      continue;
    }
  }

  const totalParties = Object.keys(gymLeaderParties).length;
  console.log(`🏆 Extracted ${totalParties} gym leader parties`);

  return gymLeaderParties;
}

// --- Extract Gym Leaders ---
export function extractGymLeaders(): Record<string, GymLeader> {
  console.log('🏆 Extracting gym leaders...');
  const mapsDir = path.join(__dirname, 'rom/maps');
  const gymLeadersByLocation: Record<string, GymLeader> = {};

  if (!fs.existsSync(mapsDir)) {
    console.warn('Maps directory not found');
    return {};
  }

  // Extract Pokemon party data first
  const gymLeaderParties = extractGymLeaderParties();

  // Define gym leader mapping
  const gymLeaderData: Record<string, { badge: string; speciality: string; region: 'johto' | 'kanto' }> = {
    'FALKNER': { badge: 'ZEPHYRBADGE', speciality: 'Flying', region: 'johto' as const },
    'BUGSY': { badge: 'HIVEBADGE', speciality: 'Bug', region: 'johto' as const },
    'WHITNEY': { badge: 'PLAINBADGE', speciality: 'Normal', region: 'johto' as const },
    'MORTY': { badge: 'FOGBADGE', speciality: 'Ghost', region: 'johto' as const },
    'CHUCK': { badge: 'STORMBADGE', speciality: 'Fighting', region: 'johto' as const },
    'JASMINE': { badge: 'MINERALBADGE', speciality: 'Steel', region: 'johto' as const },
    'PRYCE': { badge: 'GLACIERBADGE', speciality: 'Ice', region: 'johto' as const },
    'CLAIR': { badge: 'RISINGBADGE', speciality: 'Dragon', region: 'johto' as const },

    'BROCK': { badge: 'BOULDERBADGE', speciality: 'Rock', region: 'kanto' as const },
    'MISTY': { badge: 'CASCADEBADGE', speciality: 'Water', region: 'kanto' as const },
    'LT_SURGE': { badge: 'THUNDERBADGE', speciality: 'Electric', region: 'kanto' as const },
    'ERIKA': { badge: 'RAINBOWBADGE', speciality: 'Grass', region: 'kanto' as const },
    'JANINE': { badge: 'SOULBADGE', speciality: 'Poison', region: 'kanto' as const },
    'SABRINA': { badge: 'MARSHBADGE', speciality: 'Psychic', region: 'kanto' as const },
    'BLAINE': { badge: 'VOLCANOBADGE', speciality: 'Fire', region: 'kanto' as const },
    'BLUE': { badge: 'EARTHBADGE', speciality: 'Mixed', region: 'kanto' as const },
  };

  const mapFiles = fs.readdirSync(mapsDir).filter(file => file.endsWith('Gym.asm'));

  for (const mapFile of mapFiles) {
    const locationKey = path.basename(mapFile, '.asm');
    const normalizedKey = normalizeLocationKey(locationKey);

    const mapPath = path.join(mapsDir, mapFile);
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    const lines = mapContent.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for gym leader trainer loading: loadtrainer FALKNER, 1
      const trainerMatch = line.match(/loadtrainer\s+([A-Z_]+),\s*(\d+)/);
      if (trainerMatch) {
        const trainerClass = trainerMatch[1];
        const trainerNumber = parseInt(trainerMatch[2]);

        if (gymLeaderData[trainerClass]) {
          const leaderData = gymLeaderData[trainerClass];

          // Look for coordinates from object_event - search backwards for sprite
          let coordinates: { x: number; y: number } | undefined;
          for (let j = Math.max(0, i - 50); j < i; j++) {
            const prevLine = lines[j].trim();
            const spriteMatch = prevLine.match(/object_event\s+(\d+),\s*(\d+),\s*SPRITE_([A-Z_]+)/);
            if (spriteMatch && spriteMatch[3] === trainerClass) {
              coordinates = {
                x: parseInt(spriteMatch[1]),
                y: parseInt(spriteMatch[2])
              };
              break;
            }
          }

          // Get Pokemon party data
          const partyKey = `${trainerClass}_${trainerNumber}`;
          const partyData = gymLeaderParties[partyKey];

          let pokemon: TrainerPokemon[] | undefined;
          if (partyData) {
            pokemon = partyData.map(p => ({
              level: p.level,
              species: p.species,
              item: p.item,
              gender: p.gender,
              moves: p.moves
            }));
          }

          gymLeadersByLocation[normalizedKey] = {
            name: trainerClass.charAt(0).toUpperCase() + trainerClass.slice(1).toLowerCase().replace('_', ' '),
            trainerClass: trainerClass,
            badge: leaderData.badge,
            region: leaderData.region,
            speciality: leaderData.speciality,
            coordinates,
            pokemon
          };

          console.log(`🏆 Found gym leader ${trainerClass} in ${normalizedKey}${pokemon ? ` with ${pokemon.length} Pokemon` : ''}`);
          break;
        }
      }
    }
  }

  const totalGymLeaders = Object.keys(gymLeadersByLocation).length;
  console.log(`🏆 Found ${totalGymLeaders} gym leaders across ${Object.keys(gymLeadersByLocation).length} locations`);

  return gymLeadersByLocation;
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

        // Merge all TM/HM locations, removing duplicates
        const allTMHMs = originalKeys.flatMap(key => allLocations[key].tmhms || []);
        const uniqueTMHMs = allTMHMs.filter((tmhm, index, self) =>
          index === self.findIndex(t =>
            t.tmNumber === tmhm.tmNumber &&
            t.moveName === tmhm.moveName
          )
        );
        if (uniqueTMHMs.length > 0) {
          baseLocation.tmhms = uniqueTMHMs;
        }

        // Merge gym leader data (there should only be one per location)
        const gymLeaders = originalKeys.map(key => allLocations[key].gymLeader).filter(Boolean);
        if (gymLeaders.length > 0) {
          baseLocation.gymLeader = gymLeaders[0]; // Take the first one (should only be one)
        }

        // Merge all trainers, removing duplicates
        const allTrainers = originalKeys.flatMap(key => allLocations[key].trainers || []);
        const uniqueTrainers = allTrainers.filter((trainer, index, self) =>
          index === self.findIndex(t =>
            t.name === trainer.name &&
            t.coordinates.x === trainer.coordinates.x &&
            t.coordinates.y === trainer.coordinates.y
          )
        );
        if (uniqueTrainers.length > 0) {
          baseLocation.trainers = uniqueTrainers;
        }

        // Merge all items, removing duplicates
        const allItems = originalKeys.flatMap(key => allLocations[key].items || []);
        const uniqueItems = allItems.filter((item, index, self) =>
          index === self.findIndex(i =>
            i.type === item.type &&
            i.name === item.name &&
            i.coordinates?.x === item.coordinates?.x &&
            i.coordinates?.y === item.coordinates?.y
          )
        );
        if (uniqueItems.length > 0) {
          baseLocation.items = uniqueItems;
        }

        consolidatedLocations[normalizedKey] = baseLocation;
      }
    }

    /**
     * Create a logical ordering system that groups related locations together.
     * This ensures that floors, houses, and other sub-locations appear near their parent landmark.
     */
    function createLogicalLocationOrder(): Map<string, number> {
      const logicalOrder = new Map<string, number>();
      let currentOrder = 0;

      // Define logical groupings based on common patterns and game structure
      const locationGroups = [
        // Special/System
        ['special_map'],

        // Johto - following canonical order with logical sub-location groupings
        ['new_bark_town', 'players_house_1f', 'players_house_2f', 'players_neighbors_house', 'lyras_house_1f', 'lyras_house_2f', 'elms_house', 'elms_lab'],
        ['route_29'],
        ['cherrygrove_city', 'cherrygrove_pokecenter_1f', 'cherrygrove_mart', 'guide_gents_house', 'cherrygrove_gym_speech_house'],
        ['cherrygrove_bay'],
        ['route_30', 'route_30_berry_house', 'mr_pokemons_house'],
        ['route_31', 'route_31_violet_gate', 'dark_cave_violet_entrance'],
        ['violet_city', 'violet_gym', 'violet_mart', 'violet_pokecenter_1f', 'violet_nickname_speech_house', 'violet_onix_trade_house', 'earls_pokemon_academy', 'route_36_violet_gate'],
        ['sprout_tower', 'sprout_tower_1f', 'sprout_tower_2f', 'sprout_tower_3f'],
        ['violet_outskirts', 'violet_outskirts_house'],
        ['ruins_of_alph', 'ruins_of_alph_outside', 'ruins_of_alph_ho_oh_chamber', 'ruins_of_alph_kabuto_chamber', 'ruins_of_alph_omanyte_chamber', 'ruins_of_alph_aerodactyl_chamber', 'ruins_of_alph_ho_oh_item_room', 'ruins_of_alph_kabuto_item_room', 'ruins_of_alph_omanyte_item_room', 'ruins_of_alph_aerodactyl_item_room', 'ruins_of_alph_inner_chamber', 'ruins_of_alph_research_center'],
        ['route_32', 'route_32_ruins_of_alph_gate', 'route_32_pokecenter_1f'],
        ['route_32_coast'],
        ['union_cave', 'union_cave_1f', 'union_cave_b1f_north', 'union_cave_b1f_south', 'union_cave_b2f'],
        ['route_33'],
        ['azalea_town', 'azalea_pokecenter_1f', 'azalea_mart', 'azalea_gym', 'kurts_house', 'charcoal_kiln'],
        ['slowpoke_well', 'slowpoke_well_entrance', 'slowpoke_well_b1f', 'slowpoke_well_b2f'],
        ['ilex_forest', 'ilex_forest_gate', 'forest_shrine'],
        ['route_34', 'route_34_ilex_forest_gate', 'daycare_house'],
        ['route_34_coast'],
        ['stormy_beach'],
        ['murky_swamp'],
        ['goldenrod_city', 'goldenrod_gym', 'goldenrod_bike_shop', 'goldenrod_happiness_rater', 'goldenrod_bills_house', 'goldenrod_pokecenter_1f', 'goldenrod_pp_speech_house', 'goldenrod_name_rater', 'goldenrod_dept_store_1f', 'goldenrod_dept_store_2f', 'goldenrod_dept_store_3f', 'goldenrod_dept_store_4f', 'goldenrod_dept_store_5f', 'goldenrod_dept_store_6f', 'goldenrod_dept_store_b1f', 'goldenrod_dept_store_elevator', 'goldenrod_game_corner', 'goldenrod_pokecom_center_1f', 'goldenrod_pokecom_center_2f_mobile', 'goldenrod_flower_shop', 'goldenrod_harbor_gate', 'goldenrod_museum_1f', 'goldenrod_net_ball_house', 'goldenrod_band_house', 'goldenrod_honey_house', 'underground_path_switch_room_entrances', 'underground_warehouse', 'warehouse_entrance'],
        ['radio_tower', 'radio_tower_1f', 'radio_tower_2f', 'radio_tower_3f', 'radio_tower_4f', 'radio_tower_5f'],
        ['goldenrod_harbor'],
        ['magnet_tunnel', 'magnet_tunnel_inside'],
        ['route_35', 'route_35_goldenrod_gate', 'route_35_national_park_gate'],
        ['route_35_coast', 'route_35_coast_north', 'route_35_coast_south'],
        ['national_park', 'national_park_bug_contest'],
        ['route_36', 'route_36_national_park_gate', 'route_36_ruins_of_alph_gate'],
        ['route_37'],
        ['ecruteak_city', 'ecruteak_pokecenter_1f', 'ecruteak_lugia_speech_house', 'ecruteak_dance_theatre', 'ecruteak_gym', 'ecruteak_mart', 'ecruteak_house', 'wise_trios_room', 'valeries_house'],
        ['bellchime_trail'],
        ['tin_tower', 'tin_tower_1f', 'tin_tower_2f', 'tin_tower_3f', 'tin_tower_4f', 'tin_tower_5f', 'tin_tower_6f', 'tin_tower_7f', 'tin_tower_8f', 'tin_tower_9f', 'tin_tower_10f', 'tin_tower_roof'],
        ['burned_tower', 'burned_tower_1f', 'burned_tower_b1f'],
        ['route_38', 'route_38_ecruteak_gate'],
        ['route_39', 'route_39_barn', 'route_39_farmhouse', 'moomoo_farm', 'route_39_rugged_road_gate'],
        ['rugged_road', 'rugged_road_north', 'rugged_road_south'],
        ['snowtop_mountain', 'snowtop_mountain_outside', 'snowtop_mountain_inside', 'snowtop_pokecenter_1f'],
        ['olivine_city', 'olivine_pokecenter_1f', 'olivine_gym', 'olivine_tims_house', 'olivine_punishment_speech_house', 'olivine_good_rod_house', 'olivine_cafe', 'olivine_mart', 'olivine_port'],
        ['lighthouse', 'olivine_lighthouse_1f', 'olivine_lighthouse_2f', 'olivine_lighthouse_3f', 'olivine_lighthouse_4f', 'olivine_lighthouse_5f', 'olivine_lighthouse_6f'],
        ['route_40', 'route_40_battle_tower_gate'],
        ['battle_tower', 'battle_tower_outside', 'battle_tower_1f', 'battle_tower_elevator', 'battle_tower_hallway', 'battle_tower_battle_room'],
        ['whirl_islands', 'whirl_island_nw', 'whirl_island_ne', 'whirl_island_sw', 'whirl_island_se', 'whirl_island_b1f', 'whirl_island_b2f', 'whirl_island_cave', 'whirl_island_lugia_chamber'],
        ['route_41'],
        ['cianwood_city', 'cianwood_pokecenter_1f', 'cianwood_pharmacy', 'cianwood_photo_studio', 'cianwood_lugia_speech_house', 'cianwood_lassie_speech_house', 'cianwood_gym'],
        ['cliff_edge_gate'],
        ['route_47'],
        ['cliff_cave'],
        ['route_48', 'yellow_forest_gate'],
        ['yellow_forest'],
        ['quiet_cave', 'quiet_cave_1f', 'quiet_cave_b1f', 'quiet_cave_b2f', 'quiet_cave_b3f'],
        ['route_42'],
        ['mt_mortar', 'mount_mortar_1f_outside', 'mount_mortar_1f_inside', 'mount_mortar_2f_inside', 'mount_mortar_b1f'],
        ['mahogany_town', 'mahogany_pokecenter_1f', 'mahogany_gym', 'mahogany_mart_1f', 'mahogany_red_gyarados_speech_house', 'team_rocket_base_b1f', 'team_rocket_base_b2f', 'team_rocket_base_b3f'],
        ['route_43', 'route_43_mahogany_gate', 'route_43_gate'],
        ['lake_of_rage', 'lake_of_rage_hidden_power_house', 'lake_of_rage_magikarp_house'],
        ['route_44'],
        ['ice_path', 'ice_path_1f', 'ice_path_b1f', 'ice_path_b2f_mahogany_side', 'ice_path_b2f_blackthorn_side', 'ice_path_b3f'],
        ['blackthorn_city', 'blackthorn_pokecenter_1f', 'blackthorn_mart', 'blackthorn_gym_1f', 'blackthorn_gym_2f', 'blackthorn_dragon_speech_house', 'blackthorn_emys_house', 'move_deleter_house'],
        ['dragons_den', 'dragon_shrine', 'dragons_den_b1f'],
        ['route_45'],
        ['dark_cave', 'dark_cave_violet_entrance', 'dark_cave_blackthorn_entrance'],
        ['route_46'],
        ['silver_cave', 'silver_cave_outside', 'silver_cave_pokecenter_1f', 'silver_cave_room1', 'silver_cave_room2', 'silver_cave_room3', 'silver_cave_item_rooms'],
        ['fast_ship', 'fast_ship_1f', 'fast_ship_cabins_nne', 'fast_ship_cabins_nw', 'fast_ship_cabins_sw', 'fast_ship_cabins_se', 'fast_ship_b1f'],
        ['sinjoh_ruins', 'sinjoh_ruins_house'],
        ['mystri_stage'],

        // Kanto - following canonical order with sub-locations
        ['pallet_town', 'reds_house_1f', 'reds_house_2f', 'blues_house', 'oaks_lab'],
        ['route_1', 'route_1_viridian_gate'],
        ['viridian_city', 'viridian_pokecenter_1f', 'viridian_mart', 'viridian_gym', 'viridian_nickname_speech_house', 'viridian_school_house', 'trainer_house_1f', 'trainer_house_b1f'],
        ['route_2', 'route_2_north', 'route_2_south', 'route_2_gate', 'viridian_forest_viridian_gate', 'viridian_forest_pewter_gate'],
        ['viridian_forest'],
        ['pewter_city', 'pewter_pokecenter_1f', 'pewter_mart', 'pewter_gym', 'pewter_nidoran_speech_house', 'pewter_gym_speech_house', 'pewter_museum_1f', 'pewter_museum_2f'],
        ['route_3', 'route_3_pokecenter_1f'],
        ['mt_moon', 'mount_moon_1f', 'mount_moon_b1f', 'mount_moon_b2f', 'mount_moon_square'],
        ['route_4'],
        ['cerulean_city', 'cerulean_pokecenter_1f', 'cerulean_gym', 'cerulean_mart', 'cerulean_trade_speech_house', 'cerulean_police_station', 'cerulean_bike_shop'],
        ['cerulean_cave', 'cerulean_cave_1f', 'cerulean_cave_2f', 'cerulean_cave_b1f'],
        ['route_24'],
        ['route_25', 'bills_house'],
        ['cerulean_cape'],
        ['route_5', 'route_5_underground_entrance', 'route_5_saffron_gate', 'route_5_cleanse_tag_house'],
        ['underground'],
        ['route_6', 'route_6_underground_entrance', 'route_6_saffron_gate'],
        ['vermilion_city', 'vermilion_pokecenter_1f', 'vermilion_gym', 'vermilion_mart', 'vermilion_house_digletts_cave_speech_house', 'vermilion_house_fishing_speech_house', 'vermilion_magnet_train_speech_house', 'vermilion_pollution_speech_house', 'vermilion_ssanne_speech_house', 'pokemon_fan_club', 'vermilion_port', 'seagallop_ferry_vermilion_gate', 'battle_factory_1f'],
        ['digletts_cave'],
        ['route_7'],
        ['route_8'],
        ['route_9'],
        ['route_10', 'route_10_north', 'route_10_south', 'power_plant'],
        ['rock_tunnel', 'rock_tunnel_1f', 'rock_tunnel_2f', 'rock_tunnel_b1f'],
        ['power_plant'],
        ['dim_cave', 'dim_cave_1f', 'dim_cave_2f', 'dim_cave_3f', 'dim_cave_4f', 'dim_cave_5f'],
        ['lavender_town', 'lavender_pokecenter_1f', 'lavender_mart', 'lavender_speech_house', 'name_raters_house'],
        ['lav_radio_tower', 'lavender_radio_tower_1f', 'lavender_radio_tower_2f'],
        ['soul_house', 'soul_house_b1f', 'soul_house_b2f', 'soul_house_b3f'],
        ['celadon_city', 'celadon_dept_store_1f', 'celadon_dept_store_2f', 'celadon_dept_store_3f', 'celadon_dept_store_4f', 'celadon_dept_store_5f', 'celadon_dept_store_6f', 'celadon_dept_store_elevator', 'celadon_mansion_1f', 'celadon_mansion_2f', 'celadon_mansion_3f', 'celadon_mansion_roof', 'celadon_mansion_roof_house', 'celadon_pokecenter_1f', 'celadon_game_corner', 'celadon_game_corner_prize_room', 'celadon_gym', 'celadon_cafe', 'celadon_hotel_1f', 'celadon_hotel_2f', 'celadon_hotel_3f', 'celadon_hotel_room1', 'celadon_hotel_room3', 'celadon_chief_house'],
        ['celadon_university', 'celadon_university_1f', 'celadon_university_2f_library', 'celadon_university_2f_pool'],
        ['saffron_city', 'saffron_pokecenter_1f', 'saffron_mart', 'saffron_gym', 'saffron_psychic_house', 'saffron_pidgey_house', 'saffron_magnet_train_station', 'fighting_dojo', 'silph_co_1f', 'silph_co_2f', 'silph_co_3f'],
        ['route_11'],
        ['route_12', 'route_12_super_rod_house', 'route_12_south'],
        ['route_13'],
        ['route_14'],
        ['route_15'],
        ['lucky_island'],
        ['route_16', 'route_16_fuchsia_gate', 'route_16_west', 'route_1617_gate'],
        ['route_17'],
        ['route_18', 'route_18_gate'],
        ['fuchsia_city', 'fuchsia_pokecenter_1f', 'fuchsia_mart', 'fuchsia_gym', 'fuchsia_bills_brothers_house', 'fuchsia_safari_zone_office', 'wardens_home'],
        ['safari_zone', 'safari_zone_hub', 'safari_zone_east', 'safari_zone_north', 'safari_zone_west'],
        ['uraga_channel', 'uraga_channel_east', 'uraga_channel_west'],
        ['scary_cave', 'scary_cave_1f', 'scary_cave_b1f', 'scary_cave_shipwreck'],
        ['route_19'],
        ['route_20'],
        ['seafoam_islands', 'seafoam_islands_1f', 'seafoam_islands_b1f', 'seafoam_islands_b2f', 'seafoam_islands_b3f', 'seafoam_islands_b4f'],
        ['cinnabar_island', 'cinnabar_pokecenter_1f', 'cinnabar_gym'],
        ['pokemon_mansion', 'pokemon_mansion_1f', 'pokemon_mansion_2f', 'pokemon_mansion_3f', 'pokemon_mansion_b1f'],
        ['cinnabar_volcano', 'cinnabar_volcano_1f', 'cinnabar_volcano_b1f', 'cinnabar_volcano_b2f'],
        ['route_21'],
        ['route_22', 'route_22_past'],
        ['route_27', 'tohjo_falls', 'giovannis_cave'],
        ['tohjo_falls'],
        ['route_26', 'route_26_heal_house'],
        ['pokemon_league', 'pokemon_league_gate'],
        ['route_23'],
        ['victory_road', 'victory_road_1f', 'victory_road_2f', 'victory_road_3f'],
        ['indigo_plateau', 'indigo_plateau_pokecenter_1f', 'wills_room', 'kogas_room', 'brunos_room', 'karens_room', 'lances_room', 'hall_of_fame'],
        ['route_28'],
        ['cinnabar_lab'],

        // Orange Islands - following canonical order with sub-locations
        ['shamouti_island', 'shamouti_pokecenter_1f', 'shamouti_hotel_1f', 'shamouti_hotel_2f', 'shamouti_hotel_3f', 'shamouti_hotel_restaurant', 'shamouti_hotel_room2_a', 'shamouti_hotel_room2_b', 'shamouti_hotel_room3_b', 'shamouti_hotel_room3_c', 'shamouti_house', 'shamouti_merchant', 'shamouti_tourist_center'],
        ['beautiful_beach', 'beautiful_beach_villa'],
        ['rocky_beach'],
        ['noisy_forest'],
        ['shrine_ruins', 'shamouti_shrine_ruins'],
        ['shamouti_tunnel'],
        ['warm_beach', 'warm_beach_house', 'warm_beach_shack'],
        ['shamouti_coast'],
        ['fire_island', 'fire_island_roof'],
        ['ice_island', 'ice_island_roof'],
        ['lightning_island', 'lightning_island_roof'],
        ['route_49'],
        ['valencia_island', 'valencia_port', 'valencia_house', 'ivys_lab', 'ivys_house'],
        ['navel_rock', 'navel_rock_outside', 'navel_rock_inside', 'seagallop_ferry_navel_gate'],
        ['faraway_island', 'faraway_jungle'],

        // Region entries (these should come at the very end or be filtered out)
        ['johto_region', 'kanto_region', 'orange_region'],

        // Additional island roof locations
        ['fire_island_roof', 'ice_island_roof', 'lightning_island_roof'],

        // Additional non-landmark locations that don't fit the main groups
        ['colosseum', 'trade_center', 'time_capsule', 'pokecenter_2f', 'hidden_cave_grotto', 'hidden_tree_grotto']
      ];

      // Assign order numbers to each location
      for (const group of locationGroups) {
        for (const location of group) {
          logicalOrder.set(location, currentOrder++);
        }
      }

      // For any locations not in our logical groupings, try to group them with similar locations
      // This provides a fallback for locations we might have missed
      const allLocationNames = Object.keys(filteredLocations);
      for (const locationName of allLocationNames) {
        if (!logicalOrder.has(locationName)) {
          // Try to find a parent location and group it with that
          const parentOrder = findParentLocationForGrouping(locationName, logicalOrder);
          if (parentOrder !== null) {
            logicalOrder.set(locationName, parentOrder + 0.5); // Insert after parent
          } else {
            // Give it a very high order number so it appears at the end
            logicalOrder.set(locationName, currentOrder + 10000);
          }
        }
      }

      return logicalOrder;
    }

    /**
     * Find a logical parent location for grouping purposes
     */
    function findParentLocationForGrouping(locationName: string, logicalOrder: Map<string, number>): number | null {
      // Skip region entries - they should go at the end
      if (locationName.endsWith('_region')) {
        return null;
      }

      // Extract potential parent names from the location name
      const parts = locationName.split('_');

      // Try progressively shorter prefixes to find a parent
      for (let i = parts.length - 1; i >= 1; i--) {
        const potentialParent = parts.slice(0, i).join('_');
        if (logicalOrder.has(potentialParent)) {
          return logicalOrder.get(potentialParent)!;
        }
      }

      return null;
    }

    console.log(`✨ Consolidated ${Object.keys(allLocations).length} entries into ${Object.keys(consolidatedLocations).length} unique locations`);

    // Filter out region entries as they're not actual game locations
    const filteredLocations: Record<string, LocationData> = {};
    for (const [key, location] of Object.entries(consolidatedLocations)) {
      if (!key.endsWith('_region')) {
        filteredLocations[key] = location;
      }
    }

    console.log(`🔍 Filtered out region entries, ${Object.keys(filteredLocations).length} locations remaining`);

    // Sort locations using the canonical order from landmark_constants.asm combined with logical grouping
    // This ensures locations are ordered exactly as they appear in the game's constant definitions
    // with related sub-locations (floors, houses, etc.) grouped logically with their parent landmark
    const logicalOrder = createLogicalLocationOrder();

    const sortedLocations = Object.entries(filteredLocations)
      .sort(([keyA, a], [keyB, b]) => {
        // First sort by region (johto, kanto, orange)
        const regionOrder: Record<string, number> = { johto: 0, kanto: 1, orange: 2 };
        if (regionOrder[a.region] !== regionOrder[b.region]) {
          return regionOrder[a.region] - regionOrder[b.region];
        }

        // Get logical order for both locations
        const orderA = logicalOrder.get(keyA);
        const orderB = logicalOrder.get(keyB);

        // If both locations have logical order, use it
        if (orderA !== undefined && orderB !== undefined) {
          return orderA - orderB;
        }

        // If only one has logical order, it comes first
        if (orderA !== undefined && orderB === undefined) {
          return -1;
        }
        if (orderA === undefined && orderB !== undefined) {
          return 1;
        }

        // For locations not in the logical order, fall back to canonical ID then name
        if (a.id >= 0 && b.id >= 0) {
          return a.id - b.id; // Sort by canonical landmark constant ID
        }

        // Canonical landmark locations come before non-landmark locations
        if ((a.id >= 0) !== (b.id >= 0)) {
          return b.id - a.id; // Positive IDs (canonical landmarks) come first
        }

        // For non-landmark locations not in logical order, sort by name
        return a.name.localeCompare(b.name);
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, LocationData>);

    // Export as both object format (for compatibility) and ordered array format (to preserve order)
    const outputPath = path.join(__dirname, 'output/all_locations.json');
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(sortedLocations, null, 2)
    );

    console.log(`📍 Exported ${Object.keys(sortedLocations).length} locations to ${outputPath}`);

    // Export as ordered array to preserve logical order
    const orderedLocationsArray = Object.entries(sortedLocations).map(([key, location], index) => ({
      ...location,
      key,
      order: index
    }));

    const orderedOutputPath = path.join(__dirname, 'output/all_locations_ordered.json');
    await fs.promises.writeFile(
      orderedOutputPath,
      JSON.stringify(orderedLocationsArray, null, 2)
    );

    console.log(`📍 Exported ${orderedLocationsArray.length} ordered locations to ${orderedOutputPath}`);

    // Also create a summary by region (preserving order within regions)
    const locationsByRegion = {
      johto: orderedLocationsArray.filter(l => l.region === 'johto'),
      kanto: orderedLocationsArray.filter(l => l.region === 'kanto'),
      orange: orderedLocationsArray.filter(l => l.region === 'orange'),
    };

    const summaryPath = path.join(__dirname, 'output/locations_by_region.json');
    await fs.promises.writeFile(
      summaryPath,
      JSON.stringify({
        summary: {
          total: orderedLocationsArray.length,
          flyable: orderedLocationsArray.filter(l => l.flyable).length,
          landmarks: orderedLocationsArray.filter(l => l.id >= 0).length,
          mapOnly: orderedLocationsArray.filter(l => l.id < 0).length,
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

/**
 * Format location key to a proper display name
 * Handles floor numbers, basement levels, and other special patterns
 */
function formatDisplayName(locationKey: string): string {
  const words = locationKey.split('_');

  return words
    .map((word, index, parts) => {
      // Handle floor numbers: "1f", "2f" -> "1F", "2F"
      if (/^\d+f$/.test(word)) {
        return word.toUpperCase();
      }

      // Handle basement letter: "b" -> "B" (will be combined with next floor if applicable)
      if (word === 'b' && index < parts.length - 1 && /^\d+f$/.test(parts[index + 1])) {
        // Combine "b" with next floor number: "b" + "1f" -> "B1F"
        const floorNumber = parts[index + 1].toUpperCase();
        // Mark the next word for skipping by returning special marker
        parts[index + 1] = 'SKIP';
        return `B${floorNumber}`;
      }

      // Skip words marked for skipping
      if (word === 'SKIP') {
        return null;
      }

      // Handle basement floor numbers that are already combined: "b1f", "b2f" -> "B1F", "B2F"
      if (/^b\d+f$/.test(word)) {
        return word.toUpperCase();
      }

      // Handle special directional cases
      if (word === 'nw') return 'NW';
      if (word === 'ne') return 'NE';
      if (word === 'sw') return 'SW';
      if (word === 'se') return 'SE';
      if (word === 'n') return 'N';
      if (word === 's') return 'S';
      if (word === 'e') return 'E';
      if (word === 'w') return 'W';

      // Handle compound location descriptors for better readability
      if (word === 'side' && index > 0) {
        const prevWord = parts[index - 1];
        if (['blackthorn', 'mahogany', 'east', 'west', 'north', 'south'].includes(prevWord)) {
          return 'Side)';
        }
      }

      if (['blackthorn', 'mahogany'].includes(word) && index < parts.length - 1 && parts[index + 1] === 'side') {
        return `(${word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()}`;
      }

      // Regular word capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .filter(part => part !== null) // Remove null values (skipped words)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determine the likely region for a location based on known patterns
 */
function inferLocationRegion(locationKey: string): 'johto' | 'kanto' | 'orange' {
  // Known Kanto locations
  const kantoPatterns = [
    'victory_road', 'cerulean', 'vermilion', 'lavender', 'celadon', 'fuchsia',
    'saffron', 'cinnabar', 'viridian', 'pewter', 'pallet', 'indigo_plateau',
    'route_1', 'route_2', 'route_3', 'route_4', 'route_5', 'route_6', 'route_7',
    'route_8', 'route_9', 'route_10', 'route_11', 'route_12', 'route_13', 'route_14',
    'route_15', 'route_16', 'route_17', 'route_18', 'route_19', 'route_20', 'route_21',
    'route_22', 'route_23', 'route_24', 'route_25', 'route_26', 'route_27', 'route_28',
    'pokemon_league', 'rock_tunnel', 'underground', 'power_plant', 'seafoam', 'pokemon_mansion',
    'silph', 'fighting_dojo', 'digletts_cave', 'mount_moon'
  ];

  // Known Orange Islands locations
  const orangePatterns = [
    'shamouti', 'valencia', 'navel_rock', 'faraway', 'fire_island', 'ice_island',
    'lightning_island', 'beautiful_beach'
  ];

  // Check if location matches any known patterns
  for (const pattern of kantoPatterns) {
    if (locationKey.includes(pattern)) {
      return 'kanto';
    }
  }

  for (const pattern of orangePatterns) {
    if (locationKey.includes(pattern)) {
      return 'orange';
    }
  }

  // Default to johto for everything else
  return 'johto';
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportAllLocations().catch(console.error);
}

// --- Location Items Extraction ---
export function extractLocationItems(): Record<string, LocationItem[]> {
  console.log('📦 Extracting location items...');
  const mapsDir = path.join(__dirname, 'rom/maps');
  const itemsByLocation: Record<string, LocationItem[]> = {};

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

    const items: LocationItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Visible item events (itemball_event)
      const visibleItemMatch = line.match(/itemball_event\s+(\d+),\s*(\d+),\s*(\w+),/);
      if (visibleItemMatch) {
        const itemName = visibleItemMatch[3].replace(/_/g, ' ').toLowerCase();
        const formattedItemName = itemName.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        items.push({
          type: 'item',
          name: formattedItemName,
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

        items.push({
          type: 'hiddenItem',
          name: formattedItemName,
          coordinates: {
            x: parseInt(hiddenItemMatch[1]),
            y: parseInt(hiddenItemMatch[2])
          }
        });
      }
    }

    if (items.length > 0) {
      // Try both the original key and normalized key
      itemsByLocation[normalizedKey] = items;
      if (normalizedKey !== locationKey) {
        itemsByLocation[locationKey] = items;
      }
    }
  }

  // Also add TM/HM locations as items with tmHm type
  const tmhmByLocation = extractTMHMLocations();
  for (const [locationKey, tmhms] of Object.entries(tmhmByLocation)) {
    for (const tmhm of tmhms) {
      const tmhmItem: LocationItem = {
        type: 'tmHm',
        name: `${tmhm.tmNumber} - ${tmhm.moveName}`,
        // TM/HMs don't have specific coordinates in our current data
      };

      if (!itemsByLocation[locationKey]) {
        itemsByLocation[locationKey] = [];
      }
      itemsByLocation[locationKey].push(tmhmItem);
    }
  }

  const totalItems = Object.values(itemsByLocation).reduce((sum, items) => sum + items.length, 0);
  console.log(`📦 Found ${totalItems} items across ${Object.keys(itemsByLocation).length} locations`);

  return itemsByLocation;
}
