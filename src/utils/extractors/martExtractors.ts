import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeItemId, type ItemData } from './itemExtractors.ts';

interface MartLocation {
  area: string;
  details?: string;
  price?: number;
}

/**
 * Extract Pokémart data from marts.asm and add location information to item data
 * @param itemData The existing item data to update with location information
 *
 * @returns Updated item data with mart locations added
 */
export function extractMartData(itemData: Record<string, ItemData>): void {

  // Logging itemData for debugging
  console.log(`📦 Initial item data contains ${Object.values(itemData).flatMap(i => i.locations ?? []).length} locations.`);

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

      console.log(`Processing item line: "${line}" in mart "${currentMartDisplayName}", current item: "${itemName}"`);

      // Handle TMs with pricing (dbw TM_NAME, PRICE format)
      if (line.startsWith('dbw TM_')) {
        const parts = line.replace('dbw ', '').split(',').map(p => p.trim());
        itemName = parts[0];
        price = parseInt(parts[1], 10);
      } else if (line.includes(',')) {
        // Handle battle items with pricing (ITEM_NAME, PRICE format)
        const parts = line.split(',').map(p => p.trim());
        itemName = parts[0];
        console.log(`Processing item line: "${parts}", current item: "${itemName}"`);
        price = parseInt(parts[1], 10);
        console.log(`Processing price line: "${price}", current item: "${itemName}"`);
      }

      // Convert the item name to a key that matches our item data
      const itemId = normalizeItemId(itemName);

      // Debug logging
      console.log(`Processing item "${itemName}" -> "${itemId}" in mart "${currentMartDisplayName}"`);

      // Add the location to our tracking object
      if (!itemLocations[itemId]) {
        itemLocations[itemId] = [];
        console.log(`Adding new item location for "${itemId}" in "${currentMartDisplayName}"`);
      }

      // Add this mart as a location
      const location: MartLocation = {
        area: currentMartDisplayName,
        details: 'For sale'
      };

      console.log(`Adding location for item "${itemId}":`, location);

      // Add price if available (for battle facilities)
      if (price) {
        location.price = price;
        location.details = `For sale (BP: ${price})`;
        console.log(`Item "${itemId}" is a battle item with price ${price}`);
      }



      // Check if this mart is already in the locations
      if (!itemLocations[itemId].some(loc => loc.area === currentMartDisplayName)) {
        itemLocations[itemId].push(location);
        console.log(`Added location for item "${itemId}" in "${currentMartDisplayName}"`);
      }
    }
  }

  // Now update the item data with location information
  let itemsWithLocations = 0;
  const unmatchedItems: Record<string, string[]> = {};

  for (const [itemId, locations] of Object.entries(itemLocations)) {
    // Try to find the item in our item data using multiple matching strategies
    console.log(`🔍 Matching item "${itemId}" to item data...`, locations);
    console.log(`🔍 Object.entries(itemLocations)`, JSON.stringify(Object.entries(itemLocations)));
    // First try exact match
    let matchedItemKey = Object.keys(itemData).find(key => key === itemId);

    console.log(`🔍 Matched item key: ${matchedItemKey}`);

    // Second, try match by normalized key
    if (!matchedItemKey) {
      console.log(`🔍 Normalizing item ID: ${itemId}`);
      matchedItemKey = Object.keys(itemData).find(key => {
        console.log(`🔍 Checking key: ${key}`, normalizeItemId(key), itemId);
        return normalizeItemId(key) === itemId;
      });
    }

    // Third, try partial match (in case the item name is a substring)
    if (!matchedItemKey) {
      console.log(`🔍 Trying partial match for item ID: ${itemId}`);
      matchedItemKey = Object.keys(itemData).find(key =>
        key.includes(itemId) || itemId.includes(key)
      );
      console.log(`🔍 Partial match found: ${matchedItemKey}`);
    }

    // Fourth, try some common transformations
    if (!matchedItemKey) {
      console.log(`🔍 Trying transformations for item ID: ${itemId}`);
      // Try without hyphens
      const noHyphens = itemId.replace(/-/g, '');
      matchedItemKey = Object.keys(itemData).find(key =>
        key === noHyphens || key.replace(/-/g, '') === noHyphens
      );
      console.log(`🔍 No hyphens match found: ${matchedItemKey}`);
    }

    if (matchedItemKey) {
      console.log(`✅ Found item "${itemId}" matched to key "${matchedItemKey}"`);
      // Update the item with location information
      if (!itemData[matchedItemKey].locations) {
        itemData[matchedItemKey].locations = [];
        console.log(`Initialized locations array for item "${matchedItemKey}"`);
      }

      // Add new locations to the array
      locations.forEach(location => {
        // Use non-null assertion since we just initialized it if it was undefined
        (itemData[matchedItemKey].locations as MartLocation[]).push(location);
        console.log(`Added location "${location.area}" to item "${matchedItemKey}"`);
      });

      // Log successful match for debugging
      if (matchedItemKey !== itemId) {
        console.log(`✓ Matched mart item "${itemId}" to data key "${matchedItemKey}"`);
      }

      itemsWithLocations++;
    } else {
      console.log(`⚠️ Could not find item "${itemId}" in item data`);

      // Log a few potential candidate keys to help debug
      const potentialMatches = Object.keys(itemData)
        .filter(k => k.includes(itemId.substring(0, 3)) || itemId.includes(k.substring(0, 3)))
        .slice(0, 3);

      if (potentialMatches.length > 0) {
        console.log(`   Potential matches: ${potentialMatches.join(', ')}`);
      }

      // Keep track of locations where this item appears for debugging
      if (!unmatchedItems[itemId]) {
        unmatchedItems[itemId] = [];
      }
      locations.forEach(loc => unmatchedItems[itemId].push(loc.area));
    }
  }

  console.log(`✅ Added mart location data to ${itemsWithLocations} items`);

  // Log unmatched items with their locations for debugging
  if (Object.keys(unmatchedItems).length > 0) {
    console.log(`⚠️ Found ${Object.keys(unmatchedItems).length} items that couldn't be matched:`);
    for (const [itemId, locations] of Object.entries(unmatchedItems)) {
      console.log(`   - "${itemId}" appears in: ${locations.join(', ')}`);
    }

    // Show a few item IDs from the data for comparison
    console.log('📝 Sample item IDs from data:', Object.keys(itemData).slice(0, 10));
  }

  // Logging itemData for debugging
  console.log(`📦 Final item data contains ${Object.values(itemData).flatMap(i => i.locations ?? []).length} locations.`);
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
