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
        const normalizedId = normalizeItemId(currentItem);

        // Check if we have attributes for this item
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
      const normalizedId = normalizeItemId(currentItem);

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

      currentItem = null;
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

    // Sample a few unmatched attributes for debugging
    const itemIds = Object.keys(items).map(id => normalizeItemId(id));
    const unmatchedAttrs = Object.keys(itemAttributes).filter(id => !itemIds.includes(id));
    if (unmatchedAttrs.length > 0) {
      console.log(`🔍 Sample unmatched attribute keys: ${unmatchedAttrs.slice(0, 5).join(', ')}`);
    }
  }

  console.log("📦 Extracted item data contains", Object.keys(items).length, "items.");

  console.log("🔧 Extracting mart data...");
  extractMartData(items);

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
  if (name === 'full' || name === 'fullheal' || name === 'full-heal') return 'full-heal';
  if (name === 'fullrestore') return 'fullrestore';
  if (name === 'exp' || name === 'expshare') return 'expshare';

  // Replace special characters
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

    // Medicine
    'superpotion': 'super',
    'hyperpotion': 'hyper',
    'maxpotion': 'max',
    'fullrestore': 'full',
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

    // Battle items
    'xattack': 'x-attack',
    'xdefend': 'x-defend',
    'xspeed': 'x-speed',
    'xspatk': 'x-sp-atk',
    'xspdef': 'x-sp-def',
    'xaccuracy': 'x-accuracy',
    'direhit': 'dire-hit',
    'guardspec': 'guard-spec',

    // Evolution items
    'firestone': 'fire-stone',
    'thunderstone': 'thunderstone',
    'waterstone': 'water-stone',
    'leafstone': 'leaf-stone',
    'moonstone': 'moon-stone',
    'sunstone': 'sun-stone',
    'icestone': 'ice-stone',
    'duskstone': 'dusk-stone',
    'shinystone': 'shiny-stone',

    // Hold items
    'luckyegg': 'lucky-egg',
    'amuletcoin': 'amulet-coin',
    'kingsrock': 'kings-rock',
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
    'mintleaf': 'mint'
  };

  // Return the mapped ID if it exists, otherwise return the original normalized name
  return itemMappings[name] || name;
}
