import fs from 'node:fs';
import type { EncounterDetail, LocationAreaData, LocationEntry, PokemonLocationData } from "../../types/types.ts";
import path from "node:path";
import { normalizeMonName } from '../stringUtils.ts';
import { getFullPokemonName } from './pokedexExtractors.ts';
import { processLocations } from '../helpers.ts';
import { fileURLToPath } from 'node:url';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const LOCATIONS_DATA_PATH = path.join(__dirname, '../../../output/pokemon_locations.json');
const LOCATIONS_BY_AREA_OUTPUT = path.join(__dirname, '../../../output/locations_by_area.json');

// --- Hidden Grotto Extraction ---
export function extractHiddenGrottoes(): Record<string, LocationEntry[]> {
  // Result will be keyed by Pokémon name, containing location entries
  const grottoLocations: Record<string, LocationEntry[]> = {};

  // Read the grottoes.asm file
  const grottoeFilePath = path.join(__dirname, '../../../rom/data/events/hidden_grottoes/grottoes.asm');
  if (!fs.existsSync(grottoeFilePath)) {
    console.warn('Hidden grottoes file not found, skipping extraction');
    return {};
  }

  const grottoeContents = fs.readFileSync(grottoeFilePath, 'utf8');
  const lines = grottoeContents.split(/\r?\n/);

  // Maps for item names and location names
  const itemNames: Record<string, string> = {
    'FIRE_STONE': 'Fire Stone',
    'WATER_STONE': 'Water Stone',
    'THUNDER_STONE': 'Thunder Stone',
    'LEAF_STONE': 'Leaf Stone',
    'MOON_STONE': 'Moon Stone',
    'SUN_STONE': 'Sun Stone',
    'SHINY_STONE': 'Shiny Stone',
    'DUSK_STONE': 'Dusk Stone',
    'ICE_STONE': 'Ice Stone',
    'EVERSTONE': 'Everstone',
  };

  // Maps for location names (from CONSTANT to human-readable name)
  const locationNames: Record<string, string> = {
    'HIDDENGROTTO_ROUTE_32': 'Route 32',
    'HIDDENGROTTO_ILEX_FOREST': 'Ilex Forest',
    'HIDDENGROTTO_ROUTE_35': 'Route 35',
    'HIDDENGROTTO_ROUTE_36': 'Route 36',
    'HIDDENGROTTO_CHERRYGROVE_BAY': 'Cherrygrove Bay',
    'HIDDENGROTTO_VIOLET_OUTSKIRTS': 'Violet Outskirts',
    'HIDDENGROTTO_ROUTE_32_COAST': 'Route 32 Coast',
    'HIDDENGROTTO_STORMY_BEACH': 'Stormy Beach',
    'HIDDENGROTTO_ROUTE_35_COAST': 'Route 35 Coast',
    'HIDDENGROTTO_RUINS_OF_ALPH': 'Ruins of Alph',
    'HIDDENGROTTO_ROUTE_47': 'Route 47',
    'HIDDENGROTTO_YELLOW_FOREST': 'Yellow Forest',
    'HIDDENGROTTO_RUGGED_ROAD_NORTH': 'Rugged Road North',
    'HIDDENGROTTO_SNOWTOP_MOUNTAIN_INSIDE': 'Snowtop Mountain Inside',
    'HIDDENGROTTO_ROUTE_42': 'Route 42',
    'HIDDENGROTTO_LAKE_OF_RAGE': 'Lake of Rage',
    'HIDDENGROTTO_BELLCHIME_TRAIL': 'Bellchime Trail',
    'HIDDENGROTTO_ROUTE_44': 'Route 44',
    'HIDDENGROTTO_ROUTE_45': 'Route 45',
    'HIDDENGROTTO_ROUTE_46': 'Route 46',
    'HIDDENGROTTO_SINJOH_RUINS': 'Sinjoh Ruins',
    'HIDDENGROTTO_SILVER_CAVE': 'Silver Cave',
  };

  let currentLocation: string | null = null;
  let rareItem: string | null = null;
  let level: string | number | null = null;
  let common1: string | null = null;
  let common2: string | null = null;
  let uncommon: string | null = null;
  let rare: string | null = null;

  // Process the file line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and table headers
    if (!line || line.startsWith('HiddenGrottoData:') || line.startsWith('table_width')) continue;

    // Parse location headers
    if (line.startsWith('; HIDDENGROTTO_') || line.match(/^;\s*HIDDENGROTTO_/)) {
      const locationMatch = line.match(/;\s*(HIDDENGROTTO_[A-Z_]+)/);
      if (locationMatch) {
        const locationKey = locationMatch[1];
        currentLocation = locationNames[locationKey] || locationKey.replace('HIDDENGROTTO_', '').replace(/_/g, ' ');
      }
      continue;
    }

    // Parse the grotto data line (db warp number, rare item, level)
    if (line.startsWith('db') && currentLocation) {
      const dataMatch = line.match(/db\s+(\d+),\s+([A-Z_]+),\s+([A-Z0-9_\+\-\s]+)/);
      if (dataMatch) {
        rareItem = itemNames[dataMatch[2]] || dataMatch[2];

        // Normalize LEVEL_FROM_BADGES to a consistent string
        if (/LEVEL_FROM_BADGES/.test(dataMatch[3])) {
          const modifierMatch = dataMatch[3].match(/LEVEL_FROM_BADGES\s*([\+\-]\s*\d+)?/);
          if (modifierMatch && modifierMatch[1]) {
            level = `Badge Level ${modifierMatch[1].replace(/\s+/g, ' ')}`;
          } else {
            level = 'Badge Level';
          }
        } else {
          level = dataMatch[3];
        }
      }
      continue;
    }

    // Parse Pokemon entries
    if (line.startsWith('dp') && currentLocation && rareItem && level !== null) {
      const pokemonMatch = line.match(/dp\s+([A-Z0-9_]+)(?:,\s+([A-Z0-9_]+))?/);
      if (pokemonMatch) {
        const pokemonName = pokemonMatch[1];
        const formName = pokemonMatch[2] || null;

        // Get the formatted Pokémon name using our normalizeMonName function
        const { baseName: baseFormattedName } = normalizeMonName(pokemonName, null);
        const { formName: normalizedFormName } = normalizeMonName(pokemonName, formName); // Extract form name
        const fullName = getFullPokemonName(pokemonName, formName); // Legacy full name for indexing

        // Determine which slot this is and set rarity
        let rarity: string;
        if (common1 === null) {
          common1 = baseFormattedName;
          rarity = 'common';
        } else if (common2 === null) {
          common2 = baseFormattedName;
          rarity = 'common';
        } else if (uncommon === null) {
          uncommon = baseFormattedName;
          rarity = 'uncommon';
        } else if (rare === null) {
          rare = baseFormattedName;
          rarity = 'rare';

          // Reset for next grotto
          common1 = null;
          common2 = null;
          uncommon = null;
          rare = null;
        } else {
          continue; // Something went wrong with the parsing
        }

        // Add this location to the Pokémon's entry
        if (!grottoLocations[fullName]) {
          grottoLocations[fullName] = [];
        }

        grottoLocations[fullName].push({
          area: currentLocation,
          method: 'hidden_grotto',
          time: rarity,
          level: String(level), // Convert to string regardless of type
          chance: rarity === 'rare' ? 5 : rarity === 'uncommon' ? 15 : 40,
          rareItem: rareItem,
          formName: normalizedFormName // Add form information
        });
      }
    }
  }

  return grottoLocations;
}



// Load the Pokemon location data
export async function extractLocationsByArea() {
  try {
    const pokemonLocationsData = JSON.parse(await fs.promises.readFile(LOCATIONS_DATA_PATH, 'utf8'));

    // Organize by area
    const locationsByArea: Record<string, LocationAreaData> = {};

    // Process each Pokemon and its locations
    for (const [pokemon, pokemonData] of Object.entries<PokemonLocationData>(pokemonLocationsData)) {
      // Process base form locations
      if (pokemonData.locations && Array.isArray(pokemonData.locations)) {
        processLocations(pokemon, pokemonData.locations, null, locationsByArea);
      }

      // Process alternate forms if they exist
      if (pokemonData.forms) {
        for (const [formName, formData] of Object.entries(pokemonData.forms)) {
          if (formData.locations && Array.isArray(formData.locations)) {
            processLocations(pokemon, formData.locations, formName, locationsByArea);
          }
        }
      }
    }

    // --- Map encounter rates to each area and method ---
    for (const [, areaData] of Object.entries(locationsByArea)) {
      // Collect all unique methods and times for this area
      const allMethods = new Set<string>();
      const allTimesByMethod: Record<string, Set<string>> = {};
      for (const pokemonData of Object.values(areaData.pokemon)) {
        for (const [method, methodData] of Object.entries(pokemonData.methods)) {
          allMethods.add(method);
          if (!allTimesByMethod[method]) allTimesByMethod[method] = new Set();
          for (const time of Object.keys(methodData.times)) {
            allTimesByMethod[method].add(time);
          }
        }
      }
      // Iterate over all methods and times
      for (const method of allMethods) {
        for (const time of allTimesByMethod[method]) {
          // Collect all Pokémon for this area/method/time in slot order
          const slotPokemon = [];
          for (const [pokemonName, pokemonData] of Object.entries(areaData.pokemon)) {
            const details = pokemonData.methods[method]?.times[time];
            if (details && details.length > 0) {
              for (let i = 0; i < details.length; i++) {
                slotPokemon.push(pokemonName);
              }
            }
          }
          // Determine encounter type
          const encounterType =
            method.toLowerCase().includes('surf') || method.toLowerCase().includes('water') ? 'surf'
              : method.toLowerCase().includes('fish') ? 'fish'
                : 'grass';
          // Use correct slot count for each type
          const maxSlots =
            encounterType === 'grass' ? 10 : encounterType === 'surf' ? 3 : 4;
          // Map canonical rates to first N slots, extras get 0
          const mappedRates = mapEncounterRatesToPokemon(slotPokemon.slice(0, maxSlots), encounterType);
          // Assign rates to EncounterDetails in slot order
          let slotIdx = 0;
          for (const [, pokemonData] of Object.entries(areaData.pokemon)) {
            const details = pokemonData.methods[method]?.times[time];
            if (details && details.length > 0) {
              for (let i = 0; i < details.length; i++) {
                if (slotIdx < maxSlots) {
                  details[i].chance = mappedRates[slotIdx]?.rate ?? 0;
                } else {
                  details[i].chance = 0;
                }
                slotIdx++;
              }
            }
          }
        }
      }
    }

    // Write to file
    await fs.promises.writeFile(
      LOCATIONS_BY_AREA_OUTPUT,
      JSON.stringify(locationsByArea, null, 2)
    );

    console.log(`Location data by area extracted to ${LOCATIONS_BY_AREA_OUTPUT}`);
  } catch (error) {
    console.error('Error extracting locations by area:', error);
  }
}




/**
 * Converts cumulative probability thresholds to individual slot percentages.
 * @param cumulative Array of cumulative values (e.g., [30, 60, 80, ...])
 * @returns Array of slot percentages (e.g., [30, 30, 20, ...])
 */
function getSlotPercentages(cumulative: number[]): number[] {
  return cumulative.map((val, idx, arr) => val - (arr[idx - 1] ?? 0));
}

/**
 * Maps encounter rates to Pokémon for a given area using the ASM probability tables.
 * @param pokemonList - Array of Pokémon names in encounter slot order.
 * @param encounterType - 'grass' | 'surf' | 'fish'
 * @returns Array of objects: { name: string, rate: number }
 */
export function mapEncounterRatesToPokemon(
  pokemonList: string[],
  encounterType: 'grass' | 'surf' | 'fish'
): Array<{ name: string; rate: number }> {
  // Probability tables from probabilities.asm (cumulative)
  const GRASS_PROBABILITIES_CUMULATIVE = [30, 60, 80, 90, 95, 98, 100];
  const SURF_PROBABILITIES_CUMULATIVE = [60, 90, 100]; // Surf: 3 slots
  const FISH_PROBABILITIES_CUMULATIVE = [70, 90, 98, 100]; // Example: 4 slots for fishing

  let probabilities: number[];
  if (encounterType === 'grass') {
    probabilities = getSlotPercentages(GRASS_PROBABILITIES_CUMULATIVE);
  } else if (encounterType === 'surf') {
    probabilities = getSlotPercentages(SURF_PROBABILITIES_CUMULATIVE);
  } else if (encounterType === 'fish') {
    probabilities = getSlotPercentages(FISH_PROBABILITIES_CUMULATIVE);
  } else {
    probabilities = [];
  }

  return pokemonList.map((name, idx) => ({
    name,
    rate: probabilities[idx] || 0 // 0 if more Pokémon than slots
  }));
}


// --- Synchronize encounter rates from locations_by_area.json to pokemon_locations.json ---
export async function synchronizeLocationChances() {
  const locationsByArea = JSON.parse(await fs.promises.readFile(LOCATIONS_BY_AREA_OUTPUT, 'utf8'));
  const pokemonLocations = JSON.parse(await fs.promises.readFile(LOCATIONS_DATA_PATH, 'utf8'));

  // Helper to normalize area names for matching
  function normalizeArea(area: string): string {
    return area
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  for (const [pokemon, rawData] of Object.entries(pokemonLocations)) {
    const data = rawData as PokemonLocationData;
    // Handle base form locations
    if (Array.isArray(data.locations)) {
      for (const loc of data.locations) {
        const areaName = normalizeArea(loc.area ?? "");
        const method = loc.method || 'unknown';
        const time = loc.time || 'any';
        const level = loc.level;
        // Find matching slot in locations_by_area.json
        const areaObj = locationsByArea[areaName]?.pokemon?.[pokemon]?.methods?.[method]?.times?.[time];
        if (areaObj) {
          // Find matching slot by level and (optionally) formName
          const match = areaObj.find(
            (slot: EncounterDetail) => String(slot.level) === String(level) && (loc.formName == null || slot.formName === loc.formName)
          );
          if (match) {
            loc.chance = match.chance;
          }
        }
      }
    }
    // Handle alternate forms
    if (data.forms) {
      for (const [, formData] of Object.entries(data.forms)) {
        if (Array.isArray(formData.locations)) {
          for (const loc of formData.locations) {
            const areaName = normalizeArea(loc.area ?? "");
            const method = loc.method || 'unknown';
            const time = loc.time || 'any';
            const level = loc.level;
            const areaObj = locationsByArea[areaName]?.pokemon?.[pokemon]?.methods?.[method]?.times?.[time];
            if (areaObj) {
              const match = areaObj.find(
                (slot: EncounterDetail) => String(slot.level) === String(level) && (loc.formName == null || slot.formName === loc.formName)
              );
              if (match) {
                loc.chance = match.chance;
              }
            }
          }
        }
      }
    }
  }

  // Write updated pokemon_locations.json
  await fs.promises.writeFile(
    LOCATIONS_DATA_PATH,
    JSON.stringify(pokemonLocations, null, 2)
  );
  console.log('Synchronized encounter rates in pokemon_locations.json');
}
