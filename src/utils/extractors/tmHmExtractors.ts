import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define types for TM/HM item data
export interface TmHmItemData {
  id: string;              // URI-friendly ID (e.g., "tm01")
  tmNumber: string;        // TM/HM number (e.g., "TM01", "HM01")
  moveName: string;        // Move name (e.g., "Dynamicpunch")
  displayName: string;     // Display name (e.g., "TM01 Dynamicpunch")
  description: string;     // Move description
  type: string;            // Move type
  power: number;           // Move power
  pp: number;              // Move PP
  accuracy: number | string; // Move accuracy
  category: string;        // Move category
  location?: {             // Structured location data for lookups
    area: string;          // Area name for location table lookup
    details?: string;      // Additional location details if available
  };
}

/**
 * Extracts TM/HM item data from ROM files and adds them to the items_data.json file
 * @returns A record of TM/HM items with their details
 */
export function extractTmHmItems(): Record<string, TmHmItemData> {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to tmhm_moves.asm file
  const tmhmMovesFile = path.join(__dirname, '../../../rom/data/moves/tmhm_moves.asm');

  // Output and items data file paths
  const itemsDataFile = path.join(__dirname, '../../../output/items_data.json');

  console.log('🔧 Extracting TM/HM item data and integrating with items_data.json...');

  // Read TM/HM moves file
  const tmhmMovesData = fs.readFileSync(tmhmMovesFile, 'utf8');
  const lines = tmhmMovesData.split(/\r?\n/);

  // Load move descriptions from the existing file
  const moveDescriptionsFile = path.join(__dirname, '../../../output/pokemon_move_descriptions.json');

  // Define interface for move description data
  interface MoveDescriptionData {
    description: string;
    type: string;
    pp: number;
    power: number;
    category: string;
    accuracy: number | string;
    effectPercent?: number;
  }

  let moveDescriptions: Record<string, MoveDescriptionData> = {};

  if (fs.existsSync(moveDescriptionsFile)) {
    moveDescriptions = JSON.parse(fs.readFileSync(moveDescriptionsFile, 'utf8'));
  } else {
    console.warn('Move descriptions file not found. TM/HM data will be incomplete.');
  }

  // Note: We'll load the items data later, before merging
  console.log('Checking for existing items_data.json file...');
  const itemsDataExists = fs.existsSync(itemsDataFile);
  if (!itemsDataExists) {
    console.log('items_data.json file not found. A new file will be created.');
  }  // Extract TM/HM data
  const tmhmItems: Record<string, TmHmItemData> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for lines that define TM/HM moves
    // Format: db MOVE_NAME ; TMXX (Location)
    if (line.startsWith('db ')) {
      const parts = line.split(';');

      if (parts.length >= 2) {
        // Extract move name
        const moveName = parts[0].replace('db', '').trim();

        // Extract TM/HM number and location
        const tmhmInfo = parts[1].trim();
        const tmhmMatch = tmhmInfo.match(/(TM|HM)(\d+)\s*(?:\(([^)]+)\))?/);

        if (tmhmMatch) {
          const tmType = tmhmMatch[1]; // TM or HM
          const tmNumber = tmhmMatch[2].padStart(2, '0'); // Pad with leading zero if needed
          const location = tmhmMatch[3] || '';

          // Format the move name properly
          const formattedMoveName = formatMoveName(moveName);

          // Get move data from move descriptions
          const moveData = moveDescriptions[formattedMoveName] || {
            description: '',
            type: '',
            power: 0,
            pp: 0,
            accuracy: 0,
            category: ''
          };          // Create item ID
          const itemId = `${tmType.toLowerCase()}${tmNumber}`;

          // Create display name
          const displayName = `${tmType}${tmNumber} ${formattedMoveName}`;

          // Create description
          const description = moveData.description || '';

          // Convert location hint to a structured location object
          const locationInfo = formatLocation(location);

          tmhmItems[itemId] = {
            id: itemId,
            tmNumber: `${tmType}${tmNumber}`,
            moveName: formattedMoveName,
            displayName,
            description,
            type: moveData.type || '',
            power: moveData.power || 0,
            pp: moveData.pp || 0,
            accuracy: moveData.accuracy || 0,
            category: moveData.category || '',
            location: locationInfo
          };
        }
      }
    }
  }

  // Now load the existing items_data.json if it exists and merge the TM/HM data into it
  interface ItemsDataRecord {
    id: string;
    name: string;
    description: string;
    // Additional properties for TM/HM items
    tmNumber?: string;
    moveName?: string;
    type?: string;
    power?: number;
    pp?: number;
    accuracy?: number | string;
    category?: string;
    location?: {
      area: string;
      details?: string;
    };
  }

  let existingItems: Record<string, ItemsDataRecord> = {};

  if (fs.existsSync(itemsDataFile)) {
    try {
      existingItems = JSON.parse(fs.readFileSync(itemsDataFile, 'utf8'));
    } catch (error) {
      console.warn('Error reading items_data.json. Creating a new file.', error);
    }
  }

  // Merge TM/HM items into the existing items data
  for (const [itemId, tmhmData] of Object.entries(tmhmItems)) {
    existingItems[itemId] = {
      id: tmhmData.id,
      name: tmhmData.displayName,
      description: tmhmData.description,
      tmNumber: tmhmData.tmNumber,
      moveName: tmhmData.moveName,
      type: tmhmData.type,
      power: tmhmData.power,
      pp: tmhmData.pp,
      accuracy: tmhmData.accuracy,
      category: tmhmData.category,
      location: tmhmData.location
    };
  }

  // Write the combined data back to the items_data.json file
  fs.writeFileSync(itemsDataFile, JSON.stringify(existingItems, null, 2));
  console.log(`✅ TM/HM item data integrated into items_data.json`);

  return tmhmItems;
}

/**
 * Format move name from ASM format to display format
 * @param asmName Move name from ASM file
 * @returns Properly formatted move name
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

/**
 * Formats a location string from comments into a structured location object
 * @param locationStr The location string from the comment (e.g., "Goldenrod Dept. Store")
 * @returns A structured location object for lookups
 */
function formatLocation(locationStr: string): { area: string; details?: string } {
  if (!locationStr) {
    return { area: "Unknown" };
  }

  // Process location string to handle common patterns
  const area = locationStr.trim();
  // We'll set details in the return objects where needed

  // Handle "Route XX" format
  if (area.startsWith("Route ")) {
    return { area: area };
  }

  // Handle location with department stores
  if (area.includes("Dept. Store")) {
    const cityName = area.split("Dept.")[0].trim();
    return {
      area: cityName,
      details: "Department Store"
    };
  }

  // Handle Game Corner locations
  if (area.includes("Game Corner")) {
    const cityName = area.split("Game")[0].trim();
    return {
      area: cityName,
      details: "Game Corner"
    };
  }

  // Handle tower/cave/forest/etc.
  if (area.includes("Tower") ||
    area.includes("Cave") ||
    area.includes("Forest") ||
    area.includes("Path") ||
    area.includes("Tunnel") ||
    area.includes("Road")) {
    return { area: area };
  }

  // Handle gym leaders (these are typically just the leader's name)
  const gymLeaders = ["Falkner", "Bugsy", "Whitney", "Morty", "Chuck",
    "Jasmine", "Pryce", "Clair", "Brock", "Misty",
    "Lt. Surge", "Erika", "Janine", "Sabrina", "Blaine", "Blue"];

  if (gymLeaders.includes(area)) {
    return {
      area: area + "'s Gym",
      details: "Gym Leader"
    };
  }

  // Default case
  return { area: area };
}
