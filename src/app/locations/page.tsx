import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { LocationData, LocationAreaData } from '@/types/types';
// import LocationCard from '@/components/pokemon/LocationCard';
import LocationSearch from '@/components/pokemon/LocationSearch';
import { normalizeLocationKey } from '@/utils/locationUtils';
import { Hero } from '@/components/ui/Hero';

// Interface for items data
interface ItemData {
  id: string;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
  locations: Array<{
    area: string;
    details: string;
  }>;
}

// Function to load items data
async function loadItemsData(): Promise<Record<string, ItemData>> {
  try {
    const itemsFile = path.join(process.cwd(), 'output/items_data.json');
    const data = await fs.promises.readFile(itemsFile, 'utf8');
    const parsed = JSON.parse(data) as Record<string, ItemData>;
    console.log('Items data loaded successfully, keys:', Object.keys(parsed).length);
    return parsed;
  } catch (error) {
    console.error('Error loading items data:', error);
    return {};
  }
}

// Function to load Pokemon encounter data by area
async function loadPokemonLocationData(): Promise<Record<string, LocationAreaData>> {
  try {
    const locationsFile = path.join(process.cwd(), 'output/locations_by_area.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    return JSON.parse(data) as Record<string, LocationAreaData>;
  } catch (error) {
    console.error('Error loading Pokemon location data:', error);
    return {};
  }
}

// Function to load comprehensive location data in proper order
async function loadAllLocationData(): Promise<EnhancedLocation[]> {
  try {
    const orderedLocationsFile = path.join(process.cwd(), 'output/all_locations_ordered.json');

    // Try to load the ordered array first (preserves logical order)
    if (fs.existsSync(orderedLocationsFile)) {
      const data = await fs.promises.readFile(orderedLocationsFile, 'utf8');
      const orderedLocations = JSON.parse(data) as (LocationData & { key: string; order: number })[];

      // Convert to EnhancedLocation format
      return orderedLocations.map(location => ({
        area: location.key,
        urlName: location.key,
        displayName: location.displayName,
        types: getLocationTypes(location.displayName),
        pokemonCount: 0, // Will be filled later from Pokemon data
        hasHiddenGrottoes: false, // Will be filled later from Pokemon data
        hasTrainers: Boolean(location.trainers && location.trainers.length > 0), // Check if location has trainers
        trainerCount: location.trainers ? location.trainers.length : 0, // Count of trainers
        items: location.items ? location.items.map(item => ({
          type: (item.type as 'item' | 'hiddenItem' | 'tmHm') || 'item',
          name: item.name,
          details: item.coordinates ? `Found at coordinates (${item.coordinates.x}, ${item.coordinates.y})` : undefined
        })) : [], // Convert location items to EnhancedLocation format
        region: location.region,
        flyable: location.flyable,
        connections: location.connections,
        coordinates: location.x >= 0 && location.y >= 0
          ? { x: location.x, y: location.y }
          : undefined,
      }));
    }

    // Fallback to the object format if ordered array doesn't exist
    const locationsFile = path.join(process.cwd(), 'output/all_locations.json');
    const data = await fs.promises.readFile(locationsFile, 'utf8');
    const allLocationData = JSON.parse(data) as Record<string, LocationData>;

    return Object.entries(allLocationData).map(([locationKey, locationInfo]) => {
      return {
        area: locationKey,
        urlName: locationKey,
        displayName: locationInfo.displayName,
        types: getLocationTypes(locationInfo.displayName),
        pokemonCount: 0,
        hasHiddenGrottoes: false,
        hasTrainers: Boolean(locationInfo.trainers && locationInfo.trainers.length > 0), // Check if location has trainers
        trainerCount: locationInfo.trainers ? locationInfo.trainers.length : 0, // Count of trainers
        items: locationInfo.items ? locationInfo.items.map(item => ({
          type: (item.type as 'item' | 'hiddenItem' | 'tmHm') || 'item',
          name: item.name,
          details: item.coordinates ? `Found at coordinates (${item.coordinates.x}, ${item.coordinates.y})` : undefined
        })) : [], // Convert location items to EnhancedLocation format
        region: locationInfo.region,
        flyable: locationInfo.flyable,
        connections: locationInfo.connections,
        coordinates: locationInfo.x >= 0 && locationInfo.y >= 0
          ? { x: locationInfo.x, y: locationInfo.y }
          : undefined,
      };
    });
  } catch (error) {
    console.error('Error loading comprehensive location data:', error);
    return [];
  }
}

// Enhanced location type with additional data
export interface EnhancedLocation {
  area: string; // Key used for internal processing
  urlName: string; // Name used for URLs (matches Pokemon location data keys)
  displayName: string;
  types: string[];
  pokemonCount: number;
  hasHiddenGrottoes: boolean;
  hasTrainers: boolean; // Whether location has any trainers
  trainerCount: number; // Number of trainers in location
  items?: Array<{ type: 'item' | 'hiddenItem' | 'tmHm'; name: string; details?: string }>; // Items available at this location
  region?: 'johto' | 'kanto' | 'orange';
  flyable?: boolean;
  connections?: Array<{
    direction: string;
    targetLocation: string;
    targetLocationDisplay: string;
    offset: number;
  }>;
  coordinates?: { x: number; y: number };
}

// Type for Pokemon methods in location data
interface PokemonWithMethods {
  methods?: Record<string, unknown>;
}


/**
 * Create a more intelligent location matching system for items
 * Maps item location names to normalized location keys
 */
function createLocationMappingForItems(locations: EnhancedLocation[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  locations.forEach(location => {
    const normalized = normalizeLocationKey(location.area);
    const displayName = location.displayName.toLowerCase();

    // Direct mapping
    mapping[normalizeLocationKey(location.displayName)] = normalized;

    // Handle common variations
    // Poké Mart -> Mart
    if (displayName.includes('mart') && !displayName.includes('dept')) {
      const baseName = displayName.replace(' mart', '');
      // Map from "City/Town Poké Mart" format to just "Mart" format
      mapping[normalizeLocationKey(baseName + ' City Poké Mart')] = normalized;
      mapping[normalizeLocationKey(baseName + ' Town Poké Mart')] = normalized;
      mapping[normalizeLocationKey(baseName + ' Poké Mart')] = normalized;
    }

    // Department Store variations
    if (displayName.includes('dept') || displayName.includes('department')) {
      const baseName = displayName.replace(/\s*(dept|department).*$/i, '');
      mapping[normalizeLocationKey(baseName + ' Dept. Store 2F')] = normalized;
      mapping[normalizeLocationKey(baseName + ' Department Store 2F')] = normalized;
      mapping[normalizeLocationKey(baseName + ' Dept Store 2F')] = normalized;
    }

    // Game Corner variations
    if (displayName.includes('game corner')) {
      const baseName = displayName.replace(' game corner', '');
      mapping[normalizeLocationKey(baseName + ' Game Corner')] = normalized;
    }

    // Handle special locations
    if (displayName.includes('radio tower')) {
      mapping[normalizeLocationKey('Radio Tower')] = normalized;
      mapping[normalizeLocationKey('Radio Tower Buena\'s Password Club')] = normalized;
    }
  });

  return mapping;
}
function inferRegion(locationName: string): 'johto' | 'kanto' | 'orange' | undefined {
  const name = locationName.toLowerCase();

  // Johto locations
  if (name.includes('national park') ||
      name.includes('ilex forest') ||
      name.includes('burned tower') ||
      name.includes('ecruteak') ||
      name.includes('olivine') ||
      name.includes('cianwood') ||
      name.includes('mahogany') ||
      name.includes('blackthorn') ||
      name.includes('lake of rage') ||
      name.includes('ice path') ||
      name.includes('dragon\'s den') ||
      name.includes('whirl islands') ||
      name.includes('new bark') ||
      name.includes('cherrygrove') ||
      name.includes('violet city') ||
      name.includes('azalea') ||
      name.includes('goldenrod') ||
      name.includes('ruins of alph') ||
      name.includes('sprout tower') ||
      name.includes('slowpoke well') ||
      name.includes('union cave') ||
      name.includes('dark cave') ||
      name.includes('tin tower') ||
      name.includes('mt silver') ||
      name.includes('tohjo falls') ||
      /route (29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46)/.test(name)) {
    return 'johto';
  }

  // Kanto locations
  if (name.includes('pallet') ||
      name.includes('viridian') ||
      name.includes('pewter') ||
      name.includes('cerulean') ||
      name.includes('vermilion') ||
      name.includes('lavender') ||
      name.includes('celadon') ||
      name.includes('fuchsia') ||
      name.includes('saffron') ||
      name.includes('cinnabar') ||
      name.includes('indigo plateau') ||
      name.includes('mt moon') ||
      name.includes('rock tunnel') ||
      name.includes('power plant') ||
      name.includes('pokemon tower') ||
      name.includes('safari zone') ||
      name.includes('seafoam islands') ||
      name.includes('victory road') ||
      name.includes('cerulean cave') ||
      name.includes('digletts cave') ||
      name.includes('pokemon mansion') ||
      /route ([1-9]|1[0-9]|2[0-8])(?:\s|$)/.test(name)) {
    return 'kanto';
  }

  // Orange Islands locations
  if (name.includes('valencia') ||
      name.includes('tangelo') ||
      name.includes('mikan') ||
      name.includes('mandarin') ||
      name.includes('navel') ||
      name.includes('trovita') ||
      name.includes('kumquat') ||
      name.includes('pummelo') ||
      name.includes('shamouti') ||
      name.includes('beautiful beach') ||
      name.includes('crystal beach') ||
      name.includes('bellchime trail') ||
      name.includes('seven grapefruit islands') ||
      /gi\s*\d+/.test(name)) {
    return 'orange';
  }

  return undefined;
}

/**
 * Determines location types based on the location name.
 * Uses a simple heuristic mapping for biome/environment.
 * @param locationName - The name of the location
 * @returns Array of type strings
 */
function getLocationTypes(locationName: string): string[] {
  if (locationName.includes('Forest') || locationName.includes('Woods')) {
    return ['Grass'];
  } else if (locationName.includes('Cave') || locationName.includes('Mountain')) {
    return ['Rock'];
  } else if (locationName.includes('Lake') || locationName.includes('Sea') || locationName.includes('Ocean')) {
    return ['Water'];
  } else if (locationName.includes('Tower') || locationName.includes('Ruins')) {
    return ['Ghost'];
  } else if (locationName.includes('Power Plant')) {
    return ['Electric'];
  } else if (locationName.includes('Desert') || locationName.includes('Sand')) {
    return ['Ground'];
  } else if (locationName.includes('Volcano') || locationName.includes('Lava')) {
    return ['Fire'];
  } else if (locationName.includes('Route')) {
    return ['Grass'];
  } else if (locationName.includes('City') || locationName.includes('Town')) {
    return ['Normal'];
  }
  return ['Normal'];
}

export default async function LocationsPage() {
  const pokemonLocationData = await loadPokemonLocationData();
  const comprehensiveLocations = await loadAllLocationData(); // This now returns EnhancedLocation[] in proper order
  const itemsData = await loadItemsData(); // Load items data

  // Create a more comprehensive location mapping for items
  const itemLocationMapping: Record<string, string> = {};

  // First, create the basic mapping using the function
  const basicMapping = createLocationMappingForItems(comprehensiveLocations);
  Object.assign(itemLocationMapping, basicMapping);

  // Add some manual mappings for common patterns we know about
  comprehensiveLocations.forEach(location => {
    const normalized = normalizeLocationKey(location.area);
    const displayName = location.displayName.toLowerCase();

    // Additional manual mappings for department stores
    if (displayName.includes('goldenrod') && displayName.includes('dept')) {
      itemLocationMapping[normalizeLocationKey('Goldenrod Dept. Store 2F')] = normalized;
      itemLocationMapping[normalizeLocationKey('Goldenrod Department Store 2F')] = normalized;
    }
    if (displayName.includes('celadon') && displayName.includes('dept')) {
      itemLocationMapping[normalizeLocationKey('Celadon Dept. Store 2F')] = normalized;
      itemLocationMapping[normalizeLocationKey('Celadon Department Store 2F')] = normalized;
    }

    // Radio Tower special mappings
    if (displayName.includes('radio tower')) {
      itemLocationMapping[normalizeLocationKey('Radio Tower Buena\'s Password Club')] = normalized;
    }
  });

  // Create a map of items by location (normalized location names as keys)
  const itemsByLocation: Record<string, Array<{ type: 'item' | 'hiddenItem' | 'tmHm'; name: string; details?: string }>> = {};

  // Check if itemsData exists and is an object before processing
  if (itemsData && typeof itemsData === 'object') {
    Object.values(itemsData).forEach(item => {
      if (item && item.locations && Array.isArray(item.locations)) {
        item.locations.forEach(location => {
          if (location && location.area && location.details) {
            // Skip non-location items like "Pickup"
            if (location.area.toLowerCase() === 'pickup') {
              return;
            }

            // Try multiple approaches to find the right location
            let normalizedLocationKey = normalizeLocationKey(location.area);

            // First, check if we have a direct mapping
            if (itemLocationMapping[normalizedLocationKey]) {
              normalizedLocationKey = itemLocationMapping[normalizedLocationKey];
            } else {
              // Try some common patterns
              const areaLower = location.area.toLowerCase();

              // Look for partial matches in comprehensive locations
              const partialMatch = comprehensiveLocations.find(loc => {
                const displayLower = loc.displayName.toLowerCase();
                // Check if the area name contains the location name or vice versa
                return displayLower.includes(areaLower.split(' ')[0]) ||
                       areaLower.includes(displayLower.split(' ')[0]);
              });

              if (partialMatch) {
                normalizedLocationKey = normalizeLocationKey(partialMatch.area);
              }
            }

            if (!itemsByLocation[normalizedLocationKey]) {
              itemsByLocation[normalizedLocationKey] = [];
            }
            // Determine the item type based on the details or item name
            let itemType: 'item' | 'hiddenItem' | 'tmHm' = 'item';
            if (location.details && location.details.toLowerCase().includes('hidden')) {
              itemType = 'hiddenItem';
            } else if (item.name && (item.name.startsWith('TM') || item.name.startsWith('HM'))) {
              itemType = 'tmHm';
            }

            itemsByLocation[normalizedLocationKey].push({
              type: itemType,
              name: item.name,
              details: location.details
            });
          }
        });
      }
    });
  }  // Create a normalized Pokemon location map for efficient lookups
  const normalizedPokemonData: Record<string, { originalKey: string; data: LocationAreaData }> = {};
  Object.keys(pokemonLocationData).forEach(originalKey => {
    const normalizedKey = normalizeLocationKey(originalKey);
    normalizedPokemonData[normalizedKey] = {
      originalKey,
      data: pokemonLocationData[originalKey]
    };
  });

  // Merge Pokemon data into comprehensive locations (preserving order)
  const enhancedLocations: EnhancedLocation[] = comprehensiveLocations.map(location => {
    // Find matching Pokemon data using normalized keys
    let pokemonData: LocationAreaData | null = null;
    const normalizedKey = normalizeLocationKey(location.area);

    if (normalizedPokemonData[normalizedKey]) {
      pokemonData = normalizedPokemonData[normalizedKey].data;
    }

    // Calculate Pokemon count if Pokemon data exists
    const pokemonCount = pokemonData ? Object.keys(pokemonData.pokemon).length : 0;

    // Check for hidden grottoes if Pokemon data exists
    const hasHiddenGrottoes = pokemonData
      ? Object.values(pokemonData.pokemon).some(
          (pokemon: PokemonWithMethods) =>
            pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto')
        )
      : false;

    // Get items for this location from items_data.json
    const itemsFromItemsData = itemsByLocation[normalizedKey] || [];

    // The location already has items from the comprehensive location data (loaded in loadAllLocationData)
    // So we just need to add any additional items from items_data.json
    const combinedItems = [...(location.items || []), ...itemsFromItemsData];

    return {
      ...location,
      pokemonCount,
      hasHiddenGrottoes,
      items: combinedItems,
    };
  });

  // Find Pokemon-only locations that weren't matched with comprehensive data
  const usedPokemonKeys = new Set<string>();

  // Mark all Pokemon locations that were already matched with comprehensive data
  enhancedLocations.forEach(location => {
    const normalizedKey = normalizeLocationKey(location.area);
    if (normalizedPokemonData[normalizedKey]) {
      usedPokemonKeys.add(normalizedKey);
    }
  });

  // Create entries for unmatched Pokemon locations (append at the end to preserve order)
  const pokemonOnlyLocations: EnhancedLocation[] = Object.keys(normalizedPokemonData)
    .filter(normalizedKey => !usedPokemonKeys.has(normalizedKey))
    .map(normalizedKey => {
      const { originalKey, data: pokemonData } = normalizedPokemonData[normalizedKey];
      const pokemonCount = Object.keys(pokemonData.pokemon).length;

      const hasHiddenGrottoes = Object.values(pokemonData.pokemon).some(
        (pokemon: PokemonWithMethods) =>
          pokemon.methods && Object.keys(pokemon.methods).includes('hidden_grotto')
      );

      // Get items for this location from both sources
      const itemsFromItemsData = itemsByLocation[normalizedKey] || [];
      // Pokemon-only locations don't have comprehensive location data, so no items from that source

      return {
        area: normalizedKey,
        urlName: normalizedKey, // Use normalized format for URLs
        displayName: originalKey, // Use original display name
        types: getLocationTypes(originalKey),
        pokemonCount,
        hasHiddenGrottoes,
        hasTrainers: false, // Pokemon-only locations don't have trainer data in comprehensive file
        trainerCount: 0, // Pokemon-only locations don't have trainers
        items: itemsFromItemsData,
        region: inferRegion(originalKey), // Infer region from location name
        flyable: false, // Pokemon-only locations don't have flyable info
        connections: [],
        coordinates: undefined,
      };
    });

  // Combine both arrays - DON'T SORT, preserve the logical order from extraction
  const processedLocations = [...enhancedLocations, ...pokemonOnlyLocations];

  return (
    <>
    <Hero
      className="text-white"
      headline={'Locations'}
      description={
        'Explore the diverse locations in Pokémon Polished Crystal'
      }
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="hover:underline text-white hover:text-slate-200">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Locations</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    />
    <div className="max-w-xl md:max-w-4xl mx-auto px-4">
      {/* Display summary of location data */}
      {/* <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{processedLocations.length}</div>
            <div className="text-slate-600 dark:text-slate-300">Total Locations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{processedLocations.filter(l => l.pokemonCount > 0).length}</div>
            <div className="text-slate-600 dark:text-slate-300">With Pokémon</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{processedLocations.filter(l => l.hasTrainers).length}</div>
            <div className="text-slate-600 dark:text-slate-300">With Trainers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{processedLocations.filter(l => l.items && l.items.length > 0).length}</div>
            <div className="text-slate-600 dark:text-slate-300">With Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{processedLocations.filter(l => l.flyable).length}</div>
            <div className="text-slate-600 dark:text-slate-300">Flyable</div>
          </div>
        </div>
      </div> */}


      <LocationSearch locations={processedLocations as LocationData[]} />

    </div>
    </>
  );
}
