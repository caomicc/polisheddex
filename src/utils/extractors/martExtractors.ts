import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ItemData } from './itemExtractors.ts';

interface MartLocation {
  area: string;
  details?: string;
  price?: number;
}

/**
 * Extract Pokémart data from marts.asm and add location information to item data
 * @param itemData The existing item data to update with location information
 */
export function extractMartData(itemData: Record<string, ItemData>): void {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to marts.asm file
  const martsFile = path.join(__dirname, '../../../rom/data/items/marts.asm');

  console.log('🔧 Extracting Pokémart data...');

  // Read marts.asm file
  const martsData = fs.readFileSync(martsFile, 'utf8');
  const lines = martsData.split(/\r?\n/);

  // Store all mart locations
  const itemLocations: Record<string, MartLocation[]> = {};

  // Track current mart being processed
  let currentMart = '';
  let currentMartDisplayName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for mart name declarations (e.g. "CherrygroveMart:")
    if (line.endsWith('Mart:') || line.endsWith('Mart1:') || line.endsWith('Mart2:') || line.endsWith('Mart3:') ||
      line.endsWith('TMMart:') || line.endsWith('Souvenir:') || line.endsWith('Eevee:')) {
      // Extract the mart name and format it
      currentMart = line.replace(':', '');
      currentMartDisplayName = formatMartName(currentMart);
      continue;
    }

    // If we have a current mart and this line has an item
    if (currentMart && line.startsWith('db ') && !line.startsWith('db -1') && !line.match(/db \d+ ; # items/)) {
      let itemName = line.replace('db ', '').trim();
      let price: number | undefined = undefined;

      // Handle TMs with pricing (dbw TM_NAME, PRICE format)
      if (line.startsWith('dbw TM_')) {
        const parts = line.replace('dbw ', '').split(',').map(p => p.trim());
        itemName = parts[0];
        price = parseInt(parts[1], 10);
      } else if (line.includes(',')) {
        // Handle battle items with pricing (ITEM_NAME, PRICE format)
        const parts = line.split(',').map(p => p.trim());
        itemName = parts[0];
        price = parseInt(parts[1], 10);
      }

      // Convert the item name to a key that matches our item data
      const itemId = normalizeItemId(itemName);

      // Add the location to our tracking object
      if (!itemLocations[itemId]) {
        itemLocations[itemId] = [];
      }

      // Add this mart as a location
      const location: MartLocation = {
        area: currentMartDisplayName,
        details: 'For sale'
      };

      // Add price if available (for battle facilities)
      if (price) {
        location.price = price;
        location.details = `For sale (BP: ${price})`;
      }

      // Check if this mart is already in the locations
      if (!itemLocations[itemId].some(loc => loc.area === currentMartDisplayName)) {
        itemLocations[itemId].push(location);
      }
    }
  }

  // Now update the item data with location information
  let itemsWithLocations = 0;

  for (const [itemId, locations] of Object.entries(itemLocations)) {
    // Try to find the item in our item data
    // First try exact match
    let matchedItemKey = Object.keys(itemData).find(key => key === itemId);

    // If no exact match, try a more flexible approach
    if (!matchedItemKey) {
      matchedItemKey = Object.keys(itemData).find(key => {
        const normalizedKey = normalizeItemId(key);
        return normalizedKey === itemId;
      });
    }

    if (matchedItemKey) {
      // Update the item with location information
      if (!itemData[matchedItemKey].locations) {
        itemData[matchedItemKey].locations = [];
      }

      // Add new locations to the array
      locations.forEach(location => {
        itemData[matchedItemKey].locations.push(location);
      });

      itemsWithLocations++;
    } else {
      console.log(`⚠️ Could not find item "${itemId}" in item data`);
    }
  }

  console.log(`✅ Added mart location data to ${itemsWithLocations} items`);
}

/**
 * Format the mart name into a readable display name
 * @param martName The raw mart name
 * @returns A formatted display name
 */
function formatMartName(martName: string): string {
  // Special cases for specific marts
  if (martName === 'CherrygroveMart' || martName === 'CherrygroveMartAfterDex') {
    return 'Cherrygrove City Poké Mart';
  } else if (martName === 'VioletMart') {
    return 'Violet City Poké Mart';
  } else if (martName === 'AzaleaMart') {
    return 'Azalea Town Poké Mart';
  } else if (martName.startsWith('Goldenrod2FMart')) {
    return 'Goldenrod Dept. Store 2F';
  } else if (martName.startsWith('Goldenrod3FMart')) {
    return 'Goldenrod Dept. Store 3F';
  } else if (martName.startsWith('Goldenrod4FMart')) {
    return 'Goldenrod Dept. Store 4F';
  } else if (martName.startsWith('Goldenrod5FTMMart')) {
    return 'Goldenrod Dept. Store 5F TM Shop';
  } else if (martName === 'GoldenrodHarborMart') {
    return 'Goldenrod Harbor Shop';
  } else if (martName === 'UndergroundMart') {
    return 'Underground Herb Shop';
  } else if (martName === 'EcruteakMart') {
    return 'Ecruteak City Poké Mart';
  } else if (martName === 'OlivineMart') {
    return 'Olivine City Poké Mart';
  } else if (martName === 'CianwoodMart') {
    return 'Cianwood City Pharmacy';
  } else if (martName === 'YellowForestMart') {
    return 'Yellow Forest Shop';
  } else if (martName === 'MahoganyMart1') {
    return 'Mahogany Town Shop (Before Team Rocket)';
  } else if (martName === 'MahoganyMart2') {
    return 'Mahogany Town Poké Mart';
  } else if (martName === 'BlackthornMart') {
    return 'Blackthorn City Poké Mart';
  } else if (martName === 'IndigoPlateauMart') {
    return 'Indigo Plateau Poké Mart';
  } else if (martName === 'ViridianMart') {
    return 'Viridian City Poké Mart';
  } else if (martName === 'PewterMart') {
    return 'Pewter City Poké Mart';
  } else if (martName === 'MtMoonMart') {
    return 'Mt. Moon Shop';
  } else if (martName === 'CeruleanMart') {
    return 'Cerulean City Poké Mart';
  } else if (martName === 'LavenderMart') {
    return 'Lavender Town Poké Mart';
  } else if (martName === 'VermilionMart') {
    return 'Vermilion City Poké Mart';
  } else if (martName.startsWith('Celadon2FMart')) {
    return 'Celadon Dept. Store 2F';
  } else if (martName.startsWith('Celadon3FTMMart')) {
    return 'Celadon Dept. Store 3F TM Shop';
  } else if (martName.startsWith('Celadon4FMart')) {
    return 'Celadon Dept. Store 4F';
  } else if (martName.startsWith('Celadon5FMart')) {
    return 'Celadon Dept. Store 5F';
  } else if (martName === 'SaffronMart') {
    return 'Saffron City Poké Mart';
  } else if (martName === 'SilphCoMart') {
    return 'Silph Co. Shop';
  } else if (martName === 'FuchsiaMart') {
    return 'Fuchsia City Poké Mart';
  } else if (martName.startsWith('ShamoutiMart')) {
    return 'Shamouti Island Shop';
  } else if (martName.startsWith('BattleTowerMart')) {
    return 'Battle Tower Exchange';
  } else if (martName.startsWith('BattleFactoryMart')) {
    return 'Battle Factory Exchange';
  }

  // General formatting for other mart names
  return martName
    .replace(/Mart\d?$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/Dept$/, 'Department Store')
    .replace(/Tm$/, 'TM Shop')
    .replace(/Souvenir$/, 'Souvenir Shop')
    .replace(/Eevee$/, '(With Eevee)');
}

/**
 * Normalize item ID to match the format used in item data
 * @param rawName The raw item name from marts.asm
 * @returns A normalized item ID
 */
function normalizeItemId(rawName: string): string {
  // Handle TM prefix
  if (rawName.startsWith('TM_')) {
    return 'tm' + rawName.substring(3).toLowerCase();
  }

  // Remove underscore and convert to lowercase
  const name = rawName.replace(/_/g, '').toLowerCase();

  return name;
}
