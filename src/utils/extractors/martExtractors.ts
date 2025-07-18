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

      // Debug logging
      console.log(`Processing item "${itemName}" -> "${itemId}" in mart "${currentMartDisplayName}"`);

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
  const unmatchedItems: Record<string, string[]> = {};

  for (const [itemId, locations] of Object.entries(itemLocations)) {
    // Try to find the item in our item data using multiple matching strategies

    // First try exact match
    let matchedItemKey = Object.keys(itemData).find(key => key === itemId);

    // Second, try match by normalized key
    if (!matchedItemKey) {
      matchedItemKey = Object.keys(itemData).find(key => {
        return normalizeItemId(key) === itemId;
      });
    }

    // Third, try partial match (in case the item name is a substring)
    if (!matchedItemKey) {
      matchedItemKey = Object.keys(itemData).find(key =>
        key.includes(itemId) || itemId.includes(key)
      );
    }

    // Fourth, try some common transformations
    if (!matchedItemKey) {
      // Try without hyphens
      const noHyphens = itemId.replace(/-/g, '');
      matchedItemKey = Object.keys(itemData).find(key =>
        key === noHyphens || key.replace(/-/g, '') === noHyphens
      );
    }

    if (matchedItemKey) {
      // Update the item with location information
      if (!itemData[matchedItemKey].locations) {
        itemData[matchedItemKey].locations = [];
      }

      // Add new locations to the array
      locations.forEach(location => {
        // Use non-null assertion since we just initialized it if it was undefined
        (itemData[matchedItemKey].locations as MartLocation[]).push(location);
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

  // Convert to lowercase and handle underscores consistently
  const name = rawName.replace(/_/g, '-').toLowerCase();

  // Special handling for common items that might have inconsistent naming
  if (name === 'fullheal' || name === 'full-heal') {
    return 'full-heal';
  }

  if (name.includes('music')) {
    return 'music';
  }

  // Handle common problem cases directly
  if (name === 'music' || name === 'music-mail' || name === 'musicmail') {
    return 'musicmail';
  }

  if (name === 'flower' || name === 'flower-mail' || name === 'flowermail') {
    return 'flowermail';
  }

  if (name === 'surf' || name === 'surf-mail' || name === 'surfmail') {
    return 'surfmail';
  }

  if (name === 'mirage' || name === 'mirage-mail' || name === 'miragemail') {
    return 'miragemail';
  }

  if (name === 'portrait' || name === 'portrait-mail' || name === 'portraitmail') {
    return 'portraitmail';
  }

  if (name === 'bluesky' || name === 'bluesky-mail' || name === 'blueskymail') {
    return 'blueskymail';
  }

  if (name === 'eon' || name === 'eon-mail' || name === 'eonmail') {
    return 'eonmail';
  }

  if (name === 'morph' || name === 'morph-mail' || name === 'morphmail') {
    return 'morphmail';
  }

  if (name === 'liteblue' || name === 'liteblue-mail' || name === 'litebluemail') {
    return 'litebluemail';
  }

  if (name === 'lovely' || name === 'lovely-mail' || name === 'lovelymail') {
    return 'lovelymail';
  }

  if (name === 'full' || name === 'fullrestore') {
    return 'fullrestore';
  }

  if (name === 'exp' || name === 'expshare') {
    return 'expshare';
  }

  // Map common item name patterns to their expected IDs - align with how item IDs are generated in itemExtractors.ts
  const itemMappings: Record<string, string> = {
    // Poké Balls - these match the IDs in items_data.json
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
    'potion': 'potion',
    'superpotion': 'super',
    'hyperpotion': 'hyper',
    'maxpotion': 'max',
    'fullrestore': 'full',
    'revive': 'revive',
    'maxrevive': 'max-revive',
    'freshwater': 'fresh-water',
    'sodapop': 'soda-pop',
    'lemonade': 'lemonade',
    'moomoomilk': 'moomoo-milk',

    // Fix for Full Heal - it might be under a different name
    'full_heal': 'antidote', // Try different potential matches

    'awakening': 'awakening',
    'antidote': 'antidote',
    'burnheal': 'burn-heal',
    'iceheal': 'ice-heal',
    'paralyzeheal': 'paralyze-heal',
    'energypowder': 'energypowder',
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
    'everstone': 'everstone',

    // Hold items
    'leftovers': 'leftovers',
    'luckyegg': 'lucky-egg',
    'amuletcoin': 'amulet-coin',
    'kingsrock': 'kings-rock',
    'blackbelt': 'black-belt',
    'brightpowder': 'brightpowder',
    'quickclaw': 'quick-claw',
    'choiceband': 'choice-band',
    'choicescarf': 'choice-scarf',
    'choicespecs': 'choice-specs',
    'scopelens': 'scope-lens',
    'focusband': 'focus-band',
    'focussash': 'focus-sash',
    'airballoon': 'air-balloon',

    // Field items
    'escaperope': 'escape-rope',
    'repel': 'repel',
    'superrepel': 'super-repel',
    'maxrepel': 'max-repel',
    'pokedoll': 'poke-doll',

    // Mail
    'flowermail': 'flower',
    'surfmail': 'surf',
    'litebluemail': 'liteblue',
    'portraitmail': 'portrait',
    'lovelymail': 'lovely',
    'eonmail': 'eon',
    'morphmail': 'morph',
    'blueskymail': 'bluesky',
    'musicmail': 'music',
    'miragemail': 'mirage',

    // Other - Fix common specific mappings
    'ragecandybar': 'ragecandybar',
    'expshare': 'exp',
    'charcoal': 'charcoal',

    // Special handling for Battle Tower/Factory items with pricing
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

  // Check for Battle Tower/Factory items with "db " prefix
  if (name.startsWith('db ')) {
    const itemWithoutPrefix = name.substring(3);
    return itemMappings[itemWithoutPrefix] || itemWithoutPrefix;
  }

  // Return the mapped ID if it exists, otherwise return the original name
  return itemMappings[name] || name;
}
