import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractMartData } from './martExtractors.ts';

// Define types for item data
export interface ItemData {
  id: string;          // URI-friendly ID
  name: string;        // Display name
  description: string; // Item description
  attributes?: {
    price: number;     // Item price/value
    effect?: string;   // Held item effect type
    parameter?: number | string; // Effect parameter
    category?: string; // Item category (MEDICINE, BERRIES, ITEM, etc.)
    useOutsideBattle?: string; // How the item can be used outside battle
    useInBattle?: string; // How the item can be used in battle
    isKeyItem?: boolean; // Whether this is a key item
  };
  locations?: Array<{
    area: string;      // Location name
    details?: string;  // Additional details like "For sale" or "Hidden item"
    price?: number;    // Price in BP for battle facilities
  }>;
}

export function extractItemData(): Record<string, ItemData> {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to files
  const descriptionsFile = path.join(__dirname, '../../../rom/data/items/descriptions.asm');
  const attributesFile = path.join(__dirname, '../../../rom/data/items/attributes.asm');

  // Output file path
  const outputFile = path.join(__dirname, '../../../output/items_data.json');

  console.log('🔧 Extracting item data...');

  // Read item descriptions file
  const descriptionsData = fs.readFileSync(descriptionsFile, 'utf8');
  const lines = descriptionsData.split(/\r?\n/);

  // Parse item attributes if file exists
  const itemAttributes: Record<string, {
    price: number;
    effect?: string;
    parameter?: number | string;
    category?: string;
    useOutsideBattle?: string;
    useInBattle?: string;
    isKeyItem?: boolean;
  }> = {};

  if (fs.existsSync(attributesFile)) {
    console.log('🔍 Found attributes.asm file, extracting attributes...');
    const attributesData = fs.readFileSync(attributesFile, 'utf8');
    const attributeLines = attributesData.split(/\r?\n/);

    // Map of effect codes to readable effect names
    const effectMap: Record<string, string> = {
      'HELD_NONE': 'None',
      'HELD_BERRY': 'Restore HP',
      'HELD_RESTORE_PP': 'Restore PP',
      'HELD_HEAL_STATUS': 'Heal Status',
      'HELD_HEAL_CONFUSE': 'Heal Confusion',
      'HELD_HEAL_PARALYZE': 'Heal Paralysis',
      'HELD_HEAL_FREEZE': 'Heal Freeze',
      'HELD_HEAL_BURN': 'Heal Burn',
      'HELD_HEAL_POISON': 'Heal Poison',
      'HELD_HEAL_SLEEP': 'Heal Sleep',
      'HELD_ESCAPE': 'Escape from wild battles',
      'HELD_PREVENT_EVOLVE': 'Prevent Evolution',
      'HELD_FOCUS_BAND': 'Focus Band Effect',
      'HELD_LEFTOVERS': 'Leftovers Recovery',
      'HELD_CLEANSE_TAG': 'Reduce Wild Encounters',
      'HELD_QUICK_CLAW': 'Quick Claw Effect',
      'HELD_BRIGHTPOWDER': 'Reduce Accuracy',
      'HELD_LUCKY_EGG': 'Extra EXP',
      'HELD_METAL_POWDER': 'Boost Defense (Ditto)',
      'HELD_QUICK_POWDER': 'Boost Speed (Ditto)',
      'HELD_LIGHT_BALL': 'Boost Special Attack (Pikachu)',
      'HELD_FLINCH_UP': 'Increase Flinch Chance',
      'HELD_CRITICAL_UP': 'Increase Critical Hit Ratio',
      'HELD_AMULET_COIN': 'Double Prize Money',
      'HELD_EVIOLITE': 'Boost Defense/Sp.Defense (Unevolved)',
      'HELD_TYPE_BOOST': 'Boost Move Type Power',
      'HELD_CATEGORY_BOOST': 'Boost Move Category Power',
      'HELD_BERSERK_GENE': 'Berserk Gene Effect',
      'HELD_ACCURACY_BOOST': 'Boost Move Accuracy',
      'HELD_BLACK_SLUDGE': 'Black Sludge Effect',
      'HELD_ZOOM_LENS': 'Zoom Lens Effect',
      'HELD_SHELL_BELL': 'Shell Bell Effect',
      'HELD_POWER_HERB': 'Power Herb Effect',
      'HELD_MENTAL_HERB': 'Mental Herb Effect',
      'HELD_WHITE_HERB': 'White Herb Effect',
      'HELD_LIFE_ORB': 'Life Orb Effect',
      'HELD_FOCUS_SASH': 'Focus Sash Effect',
      'HELD_IRON_BALL': 'Iron Ball Effect',
      'HELD_SHED_SHELL': 'Shed Shell Effect',
      'HELD_BIG_ROOT': 'Big Root Effect',
      'HELD_EXP_SHARE': 'Share Experience',
      'HELD_EXPERT_BELT': 'Expert Belt Effect',
      // Add more effect mappings as needed
    };

    // Map of category codes to readable names
    const categoryMap: Record<string, string> = {
      'MEDICINE': 'Medicine',
      'BERRIES': 'Berry',
      'ITEM': 'Item',
      'BALL': 'Poké Ball',
      'KEY': 'Key Item',
      'TMHM': 'TM/HM',
      'CANDY': 'Experience Candy'
    };

    // Map of use codes to readable descriptions
    const useMap: Record<string, string> = {
      'ITEMMENU_NOUSE': 'Cannot use',
      'ITEMMENU_PARTY': 'Use on party Pokémon',
      'ITEMMENU_CLOSE': 'Use and close menu',
      'ITEMMENU_CURRENT': 'Use without closing'
    };

    // Parse each item_attribute line
    let currentItem = '';

    for (let i = 0; i < attributeLines.length; i++) {
      const line = attributeLines[i].trim();

      // Check for item comment (usually above the item_attribute line)
      if (line.startsWith(';')) {
        currentItem = line.substring(1).trim();
        continue;
      }

      // Check for item_attribute pattern: item_attribute price, effect, parameter, category, outBattle, inBattle
      if (line.startsWith('item_attribute')) {
        const parts = line.replace('item_attribute', '').trim().split(',');
        if (parts.length >= 3) {
          const price = parseInt(parts[0].trim(), 10) || 0;
          const effect = parts[1].trim();
          const parameter = parts[2].trim();
          const category = parts.length > 3 ? parts[3].trim() : '';
          const outBattle = parts.length > 4 ? parts[4].trim() : '';
          const inBattle = parts.length > 5 ? parts[5].trim() : '';

          // Normalize the item name to match the ID we'll use
          const normalizedId = normalizeItemId(currentItem);

          itemAttributes[normalizedId] = {
            price,
            effect: effectMap[effect] || effect,
            parameter: isNaN(parseInt(parameter, 10)) ? parameter : parseInt(parameter, 10),
            category: categoryMap[category] || category,
            useOutsideBattle: useMap[outBattle] || outBattle,
            useInBattle: useMap[inBattle] || inBattle
          };
        }
      }

      // Special handling for key items section
      if (line.includes('KeyItemAttributes:')) {
        // Mark any following items as key items until we reach the end
        for (let j = i + 1; j < attributeLines.length; j++) {
          const keyLine = attributeLines[j].trim();
          if (keyLine.startsWith(';')) {
            const keyItem = keyLine.substring(1).trim();
            const normalizedKeyId = normalizeItemId(keyItem);

            if (itemAttributes[normalizedKeyId]) {
              itemAttributes[normalizedKeyId].isKeyItem = true;
            } else {
              itemAttributes[normalizedKeyId] = {
                price: 0,
                isKeyItem: true
              };
            }
          }
        }
      }
    }

    console.log(`✅ Extracted attributes for ${Object.keys(itemAttributes).length} items`);

    // Debug: Log a few sample attribute keys for debugging
    const sampleKeys = Object.keys(itemAttributes).slice(0, 5);
    console.log('🔍 Sample attribute keys:', sampleKeys);
  } else {
    console.log('⚠️ attributes.asm file not found, skipping attributes extraction');
  }

  // Extract item descriptions
  const items: Record<string, ItemData> = {};
  let currentItems: string[] = []; // Track multiple items sharing the same description
  let description = '';

  // Process item description sections
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for item description labels (e.g. "PokeBallDesc:")
    if (line.endsWith('Desc:')) {
      console.log(`🔍 Found item description label: ${line}`);

      // Add this item to the current group sharing a description
      const itemName = line.replace('Desc:', '');
      currentItems.push(itemName);
      continue;
    }

    // Inside a description block, look for text content
    if (currentItems.length > 0 && (line.startsWith('text "') || line.startsWith('next "'))) {
      // Extract the text content between quotes
      const match = line.match(/"([^"]+)"/);
      if (match && match[1]) {
        const textContent = match[1];
        // Add space between lines for readability
        description += (description ? ' ' : '') + textContent;
      }
    }

    // Check for end of description
    if (line === 'done' && currentItems.length > 0) {
      console.log(`🔍 Processing ${currentItems.length} items with shared description: ${currentItems.join(', ')}`);

      // Save all items that share this description
      for (const itemName of currentItems) {
        const displayName = formatItemName(itemName);
        const itemId = generateItemId(itemName);
        const normalizedId = normalizeItemId(itemName);

        console.log(`🔍 Saving item: ${displayName} (${itemId})`);

        const itemData: ItemData = {
          id: itemId,
          name: displayName,
          description: description.trim()
        };

        // Add attributes if available
        if (itemAttributes[normalizedId]) {
          itemData.attributes = itemAttributes[normalizedId];
        }

        items[itemId] = itemData;
      }

      // Reset for the next group
      currentItems = [];
      description = '';
    }
  }

  // Count items with attributes for debugging
  const itemsWithAttributes = Object.values(items).filter(item => item.attributes).length;
  console.log(`✅ Item data extracted to ${outputFile}`);
  console.log(`📊 Stats: ${Object.keys(items).length} total items, ${itemsWithAttributes} items with attributes`);

  // Check for items without attributes
  if (itemsWithAttributes < Object.keys(itemAttributes).length) {
    console.log(`⚠️ Warning: ${Object.keys(itemAttributes).length - itemsWithAttributes} attributes were not matched to any item`);
    // List which attribute keys were not matched
    const itemIds = Object.keys(items).map(id => normalizeItemId(id));
    const unmatchedAttrs = Object.keys(itemAttributes).filter(id => !itemIds.includes(id));
    if (unmatchedAttrs.length > 0) {
      console.log('🔍 Unmatched attribute keys:', unmatchedAttrs.join(', '));
    }

    // Sample a few unmatched attributes for debugging
    console.log('🔍 declared itemIds:', JSON.stringify(itemIds));
    console.log('🔍 unmatchedAttrs:', JSON.stringify(unmatchedAttrs));
    if (unmatchedAttrs.length > 0) {
      console.log(`🔍 Sample unmatched attribute keys: ${unmatchedAttrs.slice(0, 20).join(', ')}`);
    }
  }

  console.log("📦 Extracted item data contains", Object.keys(items).length, "items.");

  console.log("🔧 Extracting mart data...");
  extractMartData(items);

  console.log("🔧 Extracting pickup items data...");
  extractPickupItems(items);

  console.log("🔧 Extracting rock smashing items data...");
  extractRockItems(items);

  console.log("🔧 Extracting fishing items data...");
  extractFishingItems(items);

  console.log("🔧 Extracting rooftop sale data...");
  extractRooftopSale(items);

  console.log("🔧 Extracting item maniacs data...");
  extractItemManiacs(items);

  // Write the extracted data to a JSON file
  fs.writeFileSync(outputFile, JSON.stringify(items, null, 2));

  return items;
}

/**
 * Format the item ID from the description label
 * @param rawName The raw item name from the description label
 * @returns URI-friendly ID
 */
export function generateItemId(rawName: string): string {
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
export function formatItemName(rawName: string): string {
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

/**
 * Normalize item ID to ensure consistent keys across all sections of the codebase
 * @param rawName The raw item name (can be from description, attributes, or mart sections)
 * @returns Normalized ID that will be consistent across the code
 */
export function normalizeItemId(rawName: string): string {
  // Remove Desc suffix if present
  let name = rawName.replace(/Desc$/, '');

  // Handle TM prefix
  if (name.startsWith('TM_')) {
    return 'tm' + name.substring(3).toLowerCase();
  }

  // Check for Battle Tower/Factory items with "db " prefix
  if (name.startsWith('db ')) {
    name = name.substring(3);
  }

  // Replace spaces with empty strings and convert to lowercase
  name = name.replace(/\s+/g, '').toLowerCase();

  // Convert underscores to dashes for consistency
  name = name.replace(/_/g, '-');

  // Handle special cases for consistency - balls
  name = name.replace(/poke(ball)?$/, 'pokeball');
  name = name.replace(/great(ball)?$/, 'greatball');
  name = name.replace(/ultra(ball)?$/, 'ultraball');
  name = name.replace(/master(ball)?$/, 'masterball');

  // Handle mail items consistently
  if (name.includes('mail') || name.match(/^(music|flower|surf|mirage|portrait|bluesky|eon|morph|liteblue|lovely)$/)) {
    if (name === 'music' || name === 'music-mail' || name === 'musicmail') return 'musicmail';
    if (name === 'flower' || name === 'flower-mail' || name === 'flowermail') return 'flowermail';
    if (name === 'surf' || name === 'surf-mail' || name === 'surfmail') return 'surfmail';
    if (name === 'mirage' || name === 'mirage-mail' || name === 'miragemail') return 'miragemail';
    if (name === 'portrait' || name === 'portrait-mail' || name === 'portraitmail') return 'portraitmail';
    if (name === 'bluesky' || name === 'bluesky-mail' || name === 'blueskymail') return 'blueskymail';
    if (name === 'eon' || name === 'eon-mail' || name === 'eonmail') return 'eonmail';
    if (name === 'morph' || name === 'morph-mail' || name === 'morphmail') return 'morphmail';
    if (name === 'liteblue' || name === 'liteblue-mail' || name === 'litebluemail') return 'litebluemail';
    if (name === 'lovely' || name === 'lovely-mail' || name === 'lovelymail') return 'lovelymail';
  }

  // Handle other special cases
  // if (name === 'full' || name === 'fullheal' || name === 'full-heal') return 'full-heal';
  // if (name === 'fullrestore') return 'fullrestore';
  // if (name === 'exp' || name === 'expshare') return 'expshare';

  // Replace special characters
  console.log('🔍 looking for item name:', name);
  name = name.replace(/'/, '');

  // Map common item names to their expected IDs
  const itemMappings: Record<string, string> = {
    // Poké Balls
    'pokeball': 'poke',
    'poke-ball': 'poke',
    'greatball': 'great',
    'great-ball': 'great',
    'ultraball': 'ultra',
    'ultra-ball': 'ultra',
    'masterball': 'master',
    'master-ball': 'master',
    'safariball': 'safari',
    'safari-ball': 'safari',
    'levelball': 'level',
    'level-ball': 'level',
    'lureball': 'lure',
    'lure-ball': 'lure',
    'moonball': 'moon',
    'moon-ball': 'moon',
    'friendball': 'friend',
    'friend-ball': 'friend',
    'fastball': 'fast',
    'fast-ball': 'fast',
    'heavyball': 'heavy',
    'heavy-ball': 'heavy',
    'loveball': 'love',
    'love-ball': 'love',
    'healball': 'heal',
    'heal-ball': 'heal',
    'netball': 'net',
    'net-ball': 'net',
    'nestball': 'nest',
    'nest-ball': 'nest',
    'repeatball': 'repeat',
    'repeat-ball': 'repeat',
    'timerball': 'timer',
    'timer-ball': 'timer',
    'luxuryball': 'luxury',
    'luxury-ball': 'luxury',
    'premierball': 'premier',
    'premier-ball': 'premier',
    'diveball': 'dive',
    'dive-ball': 'dive',
    'duskball': 'dusk',
    'dusk-ball': 'dusk',
    'quickball': 'quick',
    'quick-ball': 'quick',
    'dreamball': 'dream',
    'dream-ball': 'dream',
    'cherishball': 'cherish',

    // Medicine
    'superpotion': 'super',
    'hyperpotion': 'hyper',
    'maxpotion': 'max',
    // 'fullrestore': 'full',
    'maxrevive': 'max-revive',
    'freshwater': 'fresh-water',
    'sodapop': 'soda-pop',
    'moomoomilk': 'moomoo-milk',
    'burnheal': 'burn-heal',
    'iceheal': 'ice-heal',
    'paralyzeheal': 'paralyze-heal',
    'energyroot': 'energy-root',
    'healpowder': 'heal-powder',
    'revivalherb': 'revival-herb',
    'fullheal': 'full-heal',

    // Battle items
    'xattack': 'x-attack',
    'xdefend': 'x-defend',
    'xspeed': 'x-speed',
    'xspatk': 'x-sp-atk',
    'xspdef': 'x-sp-def',
    'xaccuracy': 'x-accuracy',
    'direhit': 'dire-hit',
    'guardspec': 'guard-spec',
    'guardspec.': 'guard-spec',

    // Evolution items
    'firestone': 'firestone',
    'fire-stone': 'firestone',
    'thunderstone': 'thunderstone',
    'waterstone': 'waterstone',
    'leafstone': 'leafstone',
    'leaf-stone': 'leafstone',
    'moonstone': 'moonstone',
    'shiny-stone': 'shinystone',
    'sunstone': 'sunstone',
    'sun-stone': 'sunstone',
    'icestone': 'icestone',
    'ice-stone': 'icestone',
    'duskstone': 'duskstone',
    'dusk-stone': 'duskstone',
    'shinystone': 'shinystone',

    // Hold items
    'luckyegg': 'lucky-egg',
    'amuletcoin': 'amulet-coin',
    'kingsrock': 'kings-rock',
    'kings-rock': 'kings-rock',
    'blackbelt': 'black-belt',
    'choiceband': 'choice-band',
    'choicescarf': 'choice-scarf',
    'choicespecs': 'choice-specs',
    'scopelens': 'scope-lens',
    'focusband': 'focus-band',
    'focussash': 'focus-sash',
    'airballoon': 'air-balloon',

    // Field items
    'escaperope': 'escape-rope',
    'superrepel': 'super-repel',
    'maxrepel': 'max-repel',
    'pokedoll': 'poke-doll',

    // Other items
    'ragecandybar': 'ragecandybar',
    'expshare': 'exp',
    'exp.share': 'exp',
    'metronomei': 'metronome',
    'rarecandy': 'rare',
    'ppmax': 'pp',
    'abilitycap': 'ability-cap',
    'weakpolicy': 'weak',
    'blundrpolicy': 'blundr',
    'widelens': 'wide',
    'zoomlens': 'zoom',
    'machobrace': 'macho',
    'powerweight': 'power-weight',
    'powerbracer': 'power-bracer',
    'powerbelt': 'power-belt',
    'powerlens': 'power-lens',
    'powerband': 'power-band',
    'poweranklet': 'power-anklet',
    'assaultvest': 'assault',
    'protectpads': 'protect',
    'rockyhelmet': 'rocky',
    'safegoggles': 'safe',
    'heavyboots': 'heavy',
    'punchinglove': 'punching',
    'covertcloak': 'covert',
    'ejectbutton': 'eject',
    'ejectpack': 'eject-pack',
    'redcard': 'red',
    'ironball': 'iron',
    'laggingtail': 'lagging',
    'flameorb': 'flame',
    'toxicorb': 'toxic',
    'blacksludge': 'black',
    'clearamulet': 'clear',
    'bindingband': 'binding',
    'gripclaw': 'grip',
    'loadeddice': 'loaded',
    'throatspray': 'throat',
    'roomservice': 'room',
    'lifeorb': 'life',
    'smokeball': 'smoke',
    'lightball': 'light',
    'mintleaf': 'mint',
    'bottlecap': 'bottlecap'
  };

  console.log('🔍 Normalizing item ID:', itemMappings[name], name);

  // Return the mapped ID if it exists, otherwise return the original normalized name
  return itemMappings[name] || name;
}

/**
 * Extract pickup items data from pickup_items.asm and add location information to item data
 * @param itemData The existing item data to update with location information
 */
export function extractPickupItems(itemData: Record<string, ItemData>): void {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to pickup_items.asm file
  const pickupFile = path.join(__dirname, '../../../rom/data/items/pickup_items.asm');

  console.log('🔧 Extracting pickup items data...');

  // Check if the file exists
  if (!fs.existsSync(pickupFile)) {
    console.log('⚠️ pickup_items.asm file not found, skipping pickup extraction');
    return;
  }

  // Read pickup_items.asm file
  const pickupData = fs.readFileSync(pickupFile, 'utf8');
  const lines = pickupData.split(/\r?\n/);

  // Store pickup items with their rarity
  const basePickupItems: Set<string> = new Set();
  const rarePickupItems: Set<string> = new Set();

  // Track current table being processed
  let currentTable = '';

  // Process the file content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (line.startsWith(';') || line.startsWith('//') || line === '') continue;

    // Check for table headers
    if (line.includes('BasePickupTable:')) {
      currentTable = 'base';
      continue;
    } else if (line.includes('RarePickupTable:')) {
      currentTable = 'rare';
      continue;
    }

    // Look for item entries (db ITEM_NAME)
    if (line.startsWith('db ') && !line.includes('NO_ITEM') && !line.includes('-1')) {
      const itemName = line.replace('db ', '').trim();
      if (itemName && itemName !== 'NO_ITEM') {
        if (currentTable === 'base') {
          basePickupItems.add(itemName);
        } else if (currentTable === 'rare') {
          rarePickupItems.add(itemName);
        }
      }
    }
  }

  // Update item data with pickup location information
  let itemsWithPickup = 0;
  const unmatchedItems: string[] = [];

  // Process base pickup items
  for (const itemName of basePickupItems) {
    const normalizedId = normalizeItemId(itemName);

    // Try different ID variations
    const possibleIds = [
      normalizedId,
      generateItemId(itemName),
      itemName.toLowerCase().replace(/_/g, '-')
    ];

    let found = false;
    for (const id of possibleIds) {
      if (itemData[id]) {
        if (!itemData[id].locations) {
          itemData[id].locations = [];
        }

        itemData[id].locations.push({
          area: 'Pickup',
          details: 'Common'
        });

        itemsWithPickup++;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatchedItems.push(itemName);
    }
  }

  // Process rare pickup items
  for (const itemName of rarePickupItems) {
    const normalizedId = normalizeItemId(itemName);

    // Try different ID variations
    const possibleIds = [
      normalizedId,
      generateItemId(itemName),
      itemName.toLowerCase().replace(/_/g, '-')
    ];

    let found = false;
    for (const id of possibleIds) {
      if (itemData[id]) {
        if (!itemData[id].locations) {
          itemData[id].locations = [];
        }

        itemData[id].locations.push({
          area: 'Pickup',
          details: 'Rare'
        });

        itemsWithPickup++;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatchedItems.push(itemName);
    }
  }

  console.log(`✅ Added pickup location data to ${itemsWithPickup} items`);

  if (unmatchedItems.length > 0) {
    console.log(`⚠️ Could not match ${unmatchedItems.length} pickup items:`, unmatchedItems.join(', '));
  }
}

/**
 * Extract rock smashing items data from rock_items.asm and add location information to item data
 * @param itemData The existing item data to update with location information
 */
export function extractRockItems(itemData: Record<string, ItemData>): void {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to rock_items.asm file
  const rockFile = path.join(__dirname, '../../../rom/data/items/rock_items.asm');

  console.log('🔧 Extracting rock smashing items data...');

  // Check if the file exists
  if (!fs.existsSync(rockFile)) {
    console.log('⚠️ rock_items.asm file not found, skipping rock items extraction');
    return;
  }

  // Read rock_items.asm file
  const rockData = fs.readFileSync(rockFile, 'utf8');
  const lines = rockData.split(/\r?\n/);

  // Store rock items with their rarity
  const rockItems: Array<{ item: string; rarity: number }> = [];

  // Process the file content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (line.startsWith(';') || line.startsWith('//') || line === '') continue;

    // Look for item entries (db rarity, ITEM_NAME)
    if (line.startsWith('db ') && line.includes(',')) {
      const parts = line.replace('db ', '').split(',').map(p => p.trim());
      if (parts.length >= 2 && !parts[1].includes('NO_ITEM') && !parts[0].includes('-1')) {
        const rarity = parseInt(parts[0], 10);
        const itemName = parts[1];

        if (itemName && itemName !== 'NO_ITEM' && !isNaN(rarity)) {
          rockItems.push({ item: itemName, rarity });
        }
      }
    }
  }

  // Update item data with rock smashing location information
  let itemsWithRock = 0;
  const unmatchedItems: string[] = [];

  for (const { item: itemName, rarity } of rockItems) {
    const normalizedId = normalizeItemId(itemName);

    // Try different ID variations
    const possibleIds = [
      normalizedId,
      generateItemId(itemName),
      itemName.toLowerCase().replace(/_/g, '-')
    ];

    let found = false;
    for (const id of possibleIds) {
      if (itemData[id]) {
        if (!itemData[id].locations) {
          itemData[id].locations = [];
        }

        // Add rarity information to the details
        const rarityText = rarity === 1 ? 'Very rare' :
          rarity <= 4 ? 'Rare' :
            rarity <= 24 ? 'Uncommon' : 'Common';

        itemData[id].locations.push({
          area: 'Rock Smash',
          details: `Rock smashing (${rarityText})`
        });

        itemsWithRock++;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatchedItems.push(itemName);
    }
  }

  console.log(`✅ Added rock smashing location data to ${itemsWithRock} items`);

  if (unmatchedItems.length > 0) {
    console.log(`⚠️ Could not match ${unmatchedItems.length} rock items:`, unmatchedItems.join(', '));
  }
}

/**
 * Extract fishing items data from fish_items.asm and add location information to item data
 * @param itemData The existing item data to update with location information
 */
export function extractFishingItems(itemData: Record<string, ItemData>): void {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to fish_items.asm file
  const fishFile = path.join(__dirname, '../../../rom/data/items/fish_items.asm');

  console.log('🔧 Extracting fishing items data...');

  // Check if the file exists
  if (!fs.existsSync(fishFile)) {
    console.log('⚠️ fish_items.asm file not found, skipping fishing items extraction');
    return;
  }

  // Read fish_items.asm file
  const fishData = fs.readFileSync(fishFile, 'utf8');
  const lines = fishData.split(/\r?\n/);

  // Store fishing items
  const fishItems: Set<string> = new Set();

  // Process the file content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (line.startsWith(';') || line.startsWith('//') || line === '') continue;

    // Look for item entries - could be various formats
    if (line.startsWith('db ') && !line.includes('NO_ITEM')) {
      // Handle different formats like "db rarity, ITEM" or just "db ITEM"
      const parts = line.replace('db ', '').split(',').map(p => p.trim());
      const itemName = parts.length > 1 ? parts[1] : parts[0];

      if (itemName && itemName !== 'NO_ITEM' && itemName !== '-1') {
        fishItems.add(itemName);
      }
    }
  }

  // Update item data with fishing location information
  let itemsWithFish = 0;
  const unmatchedItems: string[] = [];

  for (const itemName of fishItems) {
    const normalizedId = normalizeItemId(itemName);

    // Try different ID variations
    const possibleIds = [
      normalizedId,
      generateItemId(itemName),
      itemName.toLowerCase().replace(/_/g, '-')
    ];

    let found = false;
    for (const id of possibleIds) {
      if (itemData[id]) {
        if (!itemData[id].locations) {
          itemData[id].locations = [];
        }

        itemData[id].locations.push({
          area: 'Fishing',
          details: 'Fishing spots'
        });

        itemsWithFish++;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatchedItems.push(itemName);
    }
  }

  console.log(`✅ Added fishing location data to ${itemsWithFish} items`);

  if (unmatchedItems.length > 0) {
    console.log(`⚠️ Could not match ${unmatchedItems.length} fishing items:`, unmatchedItems.join(', '));
  }
}

/**
 * Extract rooftop sale data from rooftop_sale.asm and add location information to item data
 * @param itemData The existing item data to update with location information
 */
export function extractRooftopSale(itemData: Record<string, ItemData>): void {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to rooftop_sale.asm file
  const rooftopFile = path.join(__dirname, '../../../rom/data/items/rooftop_sale.asm');

  console.log('🔧 Extracting rooftop sale data...');

  // Check if the file exists
  if (!fs.existsSync(rooftopFile)) {
    console.log('⚠️ rooftop_sale.asm file not found, skipping rooftop sale extraction');
    return;
  }

  // Read rooftop_sale.asm file
  const rooftopData = fs.readFileSync(rooftopFile, 'utf8');
  const lines = rooftopData.split(/\r?\n/);

  // Store rooftop sale items with their prices
  const rooftopItems: Array<{ item: string; price?: number }> = [];

  // Process the file content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (line.startsWith(';') || line.startsWith('//') || line === '') continue;

    // Look for item entries - could be "db ITEM, price" or just "db ITEM"
    if (line.startsWith('db ') && !line.includes('NO_ITEM')) {
      const parts = line.replace('db ', '').split(',').map(p => p.trim());
      const itemName = parts[0];
      const price = parts.length > 1 ? parseInt(parts[1], 10) : undefined;

      if (itemName && itemName !== 'NO_ITEM') {
        rooftopItems.push({ item: itemName, price });
      }
    }
  }

  // Update item data with rooftop sale location information
  let itemsWithRooftop = 0;
  const unmatchedItems: string[] = [];

  for (const { item: itemName, price } of rooftopItems) {
    const normalizedId = normalizeItemId(itemName);

    // Try different ID variations
    const possibleIds = [
      normalizedId,
      generateItemId(itemName),
      itemName.toLowerCase().replace(/_/g, '-')
    ];

    let found = false;
    for (const id of possibleIds) {
      if (itemData[id]) {
        if (!itemData[id].locations) {
          itemData[id].locations = [];
        }

        const details = price ? `Rooftop Sale (₽${price})` : 'Rooftop Sale';

        itemData[id].locations.push({
          area: 'Goldenrod City',
          details,
          price
        });

        itemsWithRooftop++;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatchedItems.push(itemName);
    }
  }

  console.log(`✅ Added rooftop sale location data to ${itemsWithRooftop} items`);

  if (unmatchedItems.length > 0) {
    console.log(`⚠️ Could not match ${unmatchedItems.length} rooftop sale items:`, unmatchedItems.join(', '));
  }
}

/**
 * Extract item maniacs data from item_maniacs.asm and add location information to item data
 * @param itemData The existing item data to update with location information
 */
export function extractItemManiacs(itemData: Record<string, ItemData>): void {
  // Use this workaround for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to item_maniacs.asm file
  const maniacFile = path.join(__dirname, '../../../rom/data/items/item_maniacs.asm');

  console.log('🔧 Extracting item maniacs data...');

  // Check if the file exists
  if (!fs.existsSync(maniacFile)) {
    console.log('⚠️ item_maniacs.asm file not found, skipping item maniacs extraction');
    return;
  }

  // Read item_maniacs.asm file
  const maniacData = fs.readFileSync(maniacFile, 'utf8');
  const lines = maniacData.split(/\r?\n/);

  // Store maniac items with their type and cost
  const maniacItems: Array<{ item: string; maniacType: string; cost: number }> = [];

  // Track current maniac type being processed
  let currentManiac = '';

  // Process the file content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (line.startsWith(';') || line.startsWith('//') || line === '') continue;

    // Check for maniac type headers
    if (line.includes('GourmetManiacItemRewards:')) {
      currentManiac = 'Gourmet Maniac';
      continue;
    } else if (line.includes('OreManiacItemRewards:')) {
      currentManiac = 'Ore Maniac';
      continue;
    } else if (line.includes('FossilManiacItemRewards:')) {
      currentManiac = 'Fossil Maniac';
      continue;
    }

    // Look for item entries (dbw ITEM_NAME, cost)
    if (line.startsWith('dbw ') && line.includes(',') && !line.includes('-1')) {
      const parts = line.replace('dbw ', '').split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const itemName = parts[0];
        const cost = parseInt(parts[1], 10);
        
        if (itemName && !isNaN(cost) && currentManiac) {
          maniacItems.push({ item: itemName, maniacType: currentManiac, cost });
        }
      }
    }
  }

  // Update item data with maniac location information
  let itemsWithManiac = 0;
  const unmatchedItems: string[] = [];

  for (const { item: itemName, maniacType, cost } of maniacItems) {
    const normalizedId = normalizeItemId(itemName);
    
    // Try different ID variations
    const possibleIds = [
      normalizedId,
      generateItemId(itemName),
      itemName.toLowerCase().replace(/_/g, '-')
    ];

    let found = false;
    for (const id of possibleIds) {
      if (itemData[id]) {
        if (!itemData[id].locations) {
          itemData[id].locations = [];
        }
        
        itemData[id].locations.push({
          area: maniacType,
          details: `${cost} points`,
          price: cost
        });
        
        itemsWithManiac++;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatchedItems.push(`${itemName} (${maniacType})`);
    }
  }

  console.log(`✅ Added item maniac location data to ${itemsWithManiac} items`);

  if (unmatchedItems.length > 0) {
    console.log(`⚠️ Could not match ${unmatchedItems.length} maniac items:`, unmatchedItems.join(', '));
  }
}
