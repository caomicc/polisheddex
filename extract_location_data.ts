import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCATIONS_DATA_PATH = path.join(__dirname, 'pokemon_locations.json');
const LOCATIONS_BY_AREA_OUTPUT = path.join(__dirname, 'locations_by_area.json');

interface LocationEntry {
  area: string | null;
  method: string | null;
  time: string | null;
  level: string;
  chance: number;
  rareItem?: string; // Optional property for hidden grottoes
}

// Extended interface for encounter details that may include rare items (for grottoes)
interface EncounterDetail {
  level: string;
  chance: number;
  rareItem?: string;
}

// Load the Pokemon location data
async function extractLocationsByArea() {
  try {
    const pokemonLocationsData = JSON.parse(await fs.promises.readFile(LOCATIONS_DATA_PATH, 'utf8'));

    // Organize by area
    const locationsByArea: Record<string, {
      pokemon: Record<string, {
        methods: Record<string, {
          times: Record<string, EncounterDetail[]>
        }>
      }>
    }> = {};

    // Process each Pokemon and its locations
    for (const [pokemon, locations] of Object.entries<LocationEntry[]>(pokemonLocationsData)) {
      for (const location of locations) {
        if (!location.area) continue;

        // Format the area name to match UI component formatting (converting DIGLETTS_CAVE to "Digletts Cave")
        const areaName = location.area
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        const method = location.method || 'unknown';
        const time = location.time || 'any';

        // Initialize area if it doesn't exist
        if (!locationsByArea[areaName]) {
          locationsByArea[areaName] = { pokemon: {} };
        }

        // Initialize Pokemon in this area if it doesn't exist
        if (!locationsByArea[areaName].pokemon[pokemon]) {
          locationsByArea[areaName].pokemon[pokemon] = { methods: {} };
        }

        // Initialize method if it doesn't exist
        if (!locationsByArea[areaName].pokemon[pokemon].methods[method]) {
          locationsByArea[areaName].pokemon[pokemon].methods[method] = { times: {} };
        }

        // Initialize time if it doesn't exist
        if (!locationsByArea[areaName].pokemon[pokemon].methods[method].times[time]) {
          locationsByArea[areaName].pokemon[pokemon].methods[method].times[time] = [];
        }

        // Add encounter details
        const encounterDetail: EncounterDetail = {
          level: location.level,
          chance: location.chance
        };

        // Add rareItem if present (for hidden grottoes)
        if ('rareItem' in location && location.rareItem) {
          encounterDetail.rareItem = location.rareItem;
        }

        locationsByArea[areaName].pokemon[pokemon].methods[method].times[time].push(encounterDetail);
      }
    }

    // Convert area names to more readable format
    const prettyLocationsByArea: Record<string, typeof locationsByArea[string]> = {};
    for (const [areaKey, areaData] of Object.entries(locationsByArea)) {
      const prettyAreaName = areaKey
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      prettyLocationsByArea[prettyAreaName] = areaData;
    }

    // Write to file
    await fs.promises.writeFile(
      LOCATIONS_BY_AREA_OUTPUT,
      JSON.stringify(prettyLocationsByArea, null, 2)
    );

    console.log(`Location data by area extracted to ${LOCATIONS_BY_AREA_OUTPUT}`);
  } catch (error) {
    console.error('Error extracting locations by area:', error);
  }
}

// Run the extraction
extractLocationsByArea().catch(console.error);
