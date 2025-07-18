import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define types for item data
export interface ItemData {
  id: string;          // URI-friendly ID
  name: string;        // Display name
  description: string; // Item description
}

/**
 * Extracts item data from ROM files
 * @returns A record of items with their descriptions
 */
export function extractItemData(): Record<string, ItemData> {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to descriptions.asm file
  const descriptionsFile = path.join(__dirname, '../../../rom/data/items/descriptions.asm');

  // Output file path
  const outputFile = path.join(__dirname, '../../../output/items_data.json');

  console.log('🔧 Extracting item data...');

  // Read item descriptions file
  const descriptionsData = fs.readFileSync(descriptionsFile, 'utf8');
  const lines = descriptionsData.split(/\r?\n/);

  // Extract item descriptions
  const items: Record<string, ItemData> = {};
  let currentItem: string | null = null;
  let description = '';

  // Process item description sections
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for item description labels (e.g. "PokeBallDesc:")
    if (line.endsWith('Desc:')) {
      // Save previous item if we were processing one
      if (currentItem && description) {
        const displayName = formatItemName(currentItem);
        const itemId = generateItemId(currentItem);

        items[itemId] = {
          id: itemId,
          name: displayName,
          description: description.trim()
        };
      }

      // Start new item
      currentItem = line.replace('Desc:', '');
      description = '';
      continue;
    }

    // Inside a description block, look for text content
    if (currentItem && (line.startsWith('text "') || line.startsWith('next "'))) {
      // Extract the text content between quotes
      const match = line.match(/"([^"]+)"/);
      if (match && match[1]) {
        const textContent = match[1];
        // Add space between lines for readability
        description += (description ? ' ' : '') + textContent;
      }
    }

    // Check for end of description
    if (line === 'done' && currentItem) {
      // Save this item and reset for the next one
      const displayName = formatItemName(currentItem);
      const itemId = generateItemId(currentItem);

      items[itemId] = {
        id: itemId,
        name: displayName,
        description: description.trim()
      };

      currentItem = null;
      description = '';
    }
  }

  // Write the extracted data to a JSON file
  fs.writeFileSync(outputFile, JSON.stringify(items, null, 2));
  console.log(`✅ Item data extracted to ${outputFile}`);

  return items;
}

/**
 * Format the item ID from the description label
 * @param rawName The raw item name from the description label
 * @returns URI-friendly ID
 */
function generateItemId(rawName: string): string {
  // Remove "Ball" or other suffixes, replace underscores, convert to lowercase
  return rawName
    .replace(/ball$/i, '')
    .replace(/desc$/i, '')
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * Format the display name from the description label
 * @param rawName The raw item name from the description label
 * @returns User-friendly display name
 */
function formatItemName(rawName: string): string {
  // Handle special cases first
  if (rawName === 'PokeBallDesc') return 'Poké Ball';
  if (rawName === 'GreatBallDesc') return 'Great Ball';
  if (rawName === 'UltraBallDesc') return 'Ultra Ball';
  if (rawName === 'MasterBallDesc') return 'Master Ball';
  if (rawName === 'SafariBallDesc') return 'Safari Ball';
  if (rawName === 'LevelBallDesc') return 'Level Ball';
  if (rawName === 'LureBallDesc') return 'Lure Ball';
  if (rawName === 'MoonBallDesc') return 'Moon Ball';
  if (rawName === 'FriendBallDesc') return 'Friend Ball';
  if (rawName === 'FastBallDesc') return 'Fast Ball';
  if (rawName === 'HeavyBallDesc') return 'Heavy Ball';
  if (rawName === 'LoveBallDesc') return 'Love Ball';

  // Remove "Desc" suffix and handle general case
  let name = rawName.replace('Desc', '');

  // Handle camelCase to space-separated words
  name = name.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Special character handling for Poké
  name = name.replace(/Poke/g, 'Poké');

  return name;
}
