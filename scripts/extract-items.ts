import splitFile from '@/lib/split';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ItemData, ItemsManifest, ComprehensiveItemsData, ItemLocation } from '@/types/new';
import {
  reduce,
  parseItemballEvent,
  parseHiddenItemEvent,
  parseFruitTreeEvent,
  parseVerboseGiveItemEvent,
  parseMartItem,
  parseVerboseGiveTMHMEvent,
} from '@/lib/extract-utils';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const itemsASM = join(__dirname, '../polishedcrystal/data/items/attributes.asm');
const itemNamesASM = join(__dirname, '../polishedcrystal/data/items/names.asm');
const keyItemNamesASM = join(__dirname, '../polishedcrystal/data/items/key_names.asm');
const apricornNamesASM = join(__dirname, '../polishedcrystal/data/items/apricorn_names.asm');
const expCandyNamesASM = join(__dirname, '../polishedcrystal/data/items/exp_candy_names.asm');
const wingNamesASM = join(__dirname, '../polishedcrystal/data/items/wing_names.asm');
const specialNamesASM = join(__dirname, '../polishedcrystal/data/items/special_names.asm');
const itemDescriptionsASM = join(__dirname, '../polishedcrystal/data/items/descriptions.asm');
const martsASM = join(__dirname, '../polishedcrystal/data/items/marts.asm');
const tmhmMovesASM = join(__dirname, '../polishedcrystal/data/moves/tmhm_moves.asm');

// Maps directory for extracting item locations
const mapsDir = join(__dirname, '../polishedcrystal/maps');

const itemData: Record<string, ItemData[]> = {
  polished: [],
  faithful: [],
};
// Store items by location name - separate for each version
const itemsByLocation: Record<'polished' | 'faithful', Record<string, ItemLocation[]>> = {
  polished: {},
  faithful: {},
};

/**
 * Extracts all items from a map file's content
 */
export const extractItemsFromMapData = (mapData: string[]): ItemLocation[] => {
  const items: ItemLocation[] = [];

  for (const line of mapData) {
    const trimmedLine = line.trim();

    // Parse visible items (itemball_event)
    if (trimmedLine.startsWith('itemball_event ')) {
      const item = parseItemballEvent(trimmedLine);
      if (item) items.push(item);
    }

    // Parse hidden items (bg_event with BGEVENT_ITEM)
    else if (trimmedLine.includes('BGEVENT_ITEM +')) {
      const item = parseHiddenItemEvent(trimmedLine);
      if (item) items.push(item);
    }

    // Parse fruit trees (fruittree_event)
    else if (trimmedLine.startsWith('fruittree_event ')) {
      const item = parseFruitTreeEvent(trimmedLine);
      if (item) items.push(item);
    } else if (trimmedLine.startsWith('verbosegiveitem ')) {
      const item = parseVerboseGiveItemEvent(trimmedLine);
      if (item) items.push(item);
    } else if (trimmedLine.startsWith('verbosegivetmhm ')) {
      const item = parseVerboseGiveTMHMEvent(trimmedLine);
      if (item) items.push(item);
    }
  }

  return items;
};

const extractMartData = (data: string[], version: 'polished' | 'faithful') => {
  // Parse marts.asm file structure following the same pattern as move descriptions
  // Multiple mart labels can share the same item list

  for (let i = 0; i < data.length; i++) {
    const line = data[i].trim();

    // Find mart labels (e.g., "Goldenrod4FMart:", "Celadon5FMart1:")
    if (line.endsWith(':') && !line.startsWith('db') && !line.startsWith(';')) {
      const martLabels = []; // Store all labels that share the same item list
      let currentIndex = i;

      // Collect all consecutive mart labels
      while (
        currentIndex < data.length &&
        data[currentIndex].trim().endsWith(':') &&
        !data[currentIndex].trim().startsWith('db') &&
        !data[currentIndex].trim().startsWith(';')
      ) {
        const labelLine = data[currentIndex].trim();
        const martName = reduce(labelLine.replace(':', ''));
        martLabels.push(martName);
        currentIndex++;
      }

      // Parse the item list that follows all the labels
      const items: string[] = [];
      i = currentIndex; // Start from after all labels

      // Look for the item count line (db #)
      if (i < data.length) {
        const itemCountLine = data[i].trim();
        if (itemCountLine.startsWith('db ')) {
          const parts = itemCountLine.split(' ');
          if (parts.length >= 2 && !isNaN(parseInt(parts[1]))) {
            const itemCount = parseInt(parts[1]);

            if (itemCount > 0) {
              // Collect the next itemCount lines
              for (let j = i + 1; j < i + 1 + itemCount && j < data.length; j++) {
                const itemLine = data[j].trim();
                const item = parseMartItem(itemLine);
                if (item) items.push(item.name);
              }
            }
          }
        }
      }

      // Assign the same item list to all marts that shared the labels
      for (const martName of martLabels) {
        if (!itemsByLocation[version][martName]) {
          itemsByLocation[version][martName] = [];
        }

        for (const itemName of items) {
          itemsByLocation[version][martName].push({
            name: itemName,
            type: 'purchase',
          });
        }
      }
    }
  }
};

/**
 * Extracts item locations from all map files
 */
const extractItemLocations = async () => {
  const { readdir } = await import('fs/promises');

  try {
    const mapFiles = await readdir(mapsDir);
    const martRaw = await readFile(martsASM, 'utf-8');
    const martData = splitFile(martRaw);
    let totalItemsFound = 0;

    for (const mapFile of mapFiles) {
      if (!mapFile.endsWith('.asm')) continue;

      const mapFilePath = join(mapsDir, mapFile);
      const mapName = mapFile.replace('.asm', '');

      try {
        const raw = await readFile(mapFilePath, 'utf-8');
        const mapData = splitFile(raw, false)[0] as string[]; // Don't remove @ symbols

        const mapItems = extractItemsFromMapData(mapData);

        if (mapItems.length > 0) {
          // For now, assume map items are the same in both versions
          // This might need refinement later if maps differ between versions
          itemsByLocation.polished[mapName] = mapItems;
          itemsByLocation.faithful[mapName] = [...mapItems]; // copy for faithful
          totalItemsFound += mapItems.length;
        }
      } catch (error) {
        console.warn(`Could not read map file: ${mapFilePath}`, error);
        // Skip files that can't be read - some might be binary or have permissions issues
        continue;
      }
    }

    // Extract mart data for both versions
    extractMartData(martData[0], 'polished');
    extractMartData(martData[1], 'faithful');

    console.log(
      `Extracted ${totalItemsFound} items from ${Object.keys(itemsByLocation.polished).length} maps`,
    );
  } catch (error) {
    console.error('Error reading maps directory:', error);
  }
};

/**
 * Gets all locations where an item can be found
 */
const getItemLocations = (
  itemId: string,
  version: 'polished' | 'faithful',
): Array<{ area: string; method: string }> => {
  const locations: Array<{ area: string; method: string }> = [];

  for (const [locationName, locationItems] of Object.entries(itemsByLocation[version])) {
    const itemsFound = locationItems.filter((item) => item.name === itemId);
    for (const item of itemsFound) {
      locations.push({
        area: reduce(locationName),
        method: item.type || 'unknown',
      });
    }
  }

  return locations;
};

/**
 * Extracts TM/HM data and adds to itemData
 */
const extractTMHMData = async (version: 'polished' | 'faithful') => {
  // Read the moves file
  const movesRaw = await readFile(tmhmMovesASM, 'utf-8');
  const movesFiles = splitFile(movesRaw, false);
  const movesData = (version === 'polished' ? movesFiles[0] : movesFiles[1]) as string[];

  for (const line of movesData) {
    const trimmedLine = line.trim();

    // Skip non-data lines
    if (
      trimmedLine.startsWith(';') ||
      trimmedLine.startsWith('TMHMMoves:') ||
      trimmedLine.startsWith('table_width') ||
      trimmedLine.includes('; end') ||
      !trimmedLine.startsWith('db ')
    ) {
      continue;
    }

    // Parse: db MOVE_NAME ; TM01 (location info)
    if (trimmedLine.startsWith('db ')) {
      const parts = trimmedLine.split(';');
      const moveName = parts[0].replace('db ', '').trim();
      const itemName = parts[1].trim().split(' (')[0]; // e.g., TM01 or HM02

      // Skip MT (Move Tutor) items
      if (itemName.startsWith('MT')) {
        continue;
      }

      // Extract location info if available
      let location = undefined;
      if (parts.length > 1) {
        const commentPart = parts[1].trim();
        const locationMatch = commentPart.match(/\(([^)]+)\)/);
        if (locationMatch) {
          location = locationMatch[1];
        }
      }

      // Create TM/HM item entry
      itemData[version].push({
        id: reduce(itemName),
        name: itemName,
        description: `Teaches the move ${moveName.replace(/_/g, ' ').toLowerCase()} to a compatible Pokémon.`,
        attributes: {
          moveName: reduce(moveName),
        },
        locations: location ? [{ area: reduce(location), method: 'gift' }] : [],
      });
    }
  }
};

const extractItemsData = async (
  itemsData: string[],
  itemNamesData: string[],
  keyItemNamesData: string[],
  apricornNamesData: string[],
  expCandyNamesData: string[],
  wingNamesData: string[],
  specialNamesData: string[],
  itemDescriptionsData: string[],
  version: 'polished' | 'faithful',
) => {
  // Find item attribute lines and their preceding comments
  const itemEntries: Array<{ comment: string; attributes: string }> = [];

  for (let i = 0; i < itemsData.length; i++) {
    const line = itemsData[i].trim();

    if (line.startsWith('item_attribute ') && !line.includes(';')) {
      // Look back for the comment line
      let commentLine = '';
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = itemsData[j].trim();
        if (prevLine.startsWith(';') && prevLine.length > 2) {
          commentLine = prevLine.substring(1).trim(); // Remove ';' and trim
          break;
        }
        if (prevLine !== '' && !prevLine.startsWith(';')) {
          break; // Stop if we hit a non-comment, non-empty line
        }
      }

      if (commentLine) {
        itemEntries.push({ comment: commentLine, attributes: line });
      }
    }
  }

  const nameLines = itemNamesData.filter((line) => line.trim().startsWith('li "'));

  const descriptions: Record<string, string> = {};

  for (let i = 0; i < itemDescriptionsData.length; i++) {
    const line = itemDescriptionsData[i].trim();

    // Find description labels (e.g., "NetBallDesc:")
    if (line.endsWith('Desc:')) {
      const itemLabels = []; // Store all labels that share the same description
      let currentIndex = i;

      // Collect all consecutive description labels
      while (
        currentIndex < itemDescriptionsData.length &&
        itemDescriptionsData[currentIndex].trim().endsWith('Desc:')
      ) {
        const labelLine = itemDescriptionsData[currentIndex].trim();
        const itemDescriptionName = labelLine.replace('Desc:', '');
        const itemId = reduce(itemDescriptionName);
        itemLabels.push(itemId);
        currentIndex++;
      }

      // Parse the description text that follows all the labels
      let description = '';
      i = currentIndex; // Start from after all labels

      while (i < itemDescriptionsData.length) {
        const descLine = itemDescriptionsData[i].trim();

        if (descLine === 'done') {
          break; // End of this description
        }

        // Check if we've hit the next description label (stop condition for db format)
        if (descLine.endsWith('Desc:')) {
          i--; // Step back so outer loop will process this label
          break;
        }

        // Extract text from 'text "..."', 'next "..."', or 'db "..."' lines (with flexible spacing)
        if (
          descLine.startsWith('text "') ||
          descLine.startsWith('next "') ||
          descLine.match(/^db\s+"/) // Allow flexible spacing after db
        ) {
          let textContent = descLine.replace(/^(text|next|db)\s*"/, '').replace(/"$/, '');

          // Handle special @ terminator (like in Thunder Wave)
          let isEndOfDescription = false;
          if (textContent.endsWith('@')) {
            textContent = textContent.replace('@', '').trim();
            isEndOfDescription = true;
          }

          // Add the text content
          if (description) {
            description += ' ' + textContent; // Add space between lines
          } else {
            description = textContent;
          }

          description = description.replace(/-\s+/g, '').replace(/#mon/g, 'Pokemon').trim(); // Clean up extra spaces

          // Break after adding the content if @ was found
          if (isEndOfDescription) {
            break; // @ indicates end of description
          }
        }

        i++;
      }

      // Assign the same description to all items that shared the labels
      for (const itemId of itemLabels) {
        descriptions[itemId] = description;
      }
    }
  }

  // Skip the first name entry ("Park Ball") as it doesn't have a corresponding attribute entry
  const nameEntries = nameLines.slice(1);

  for (let i = 0; i < itemEntries.length && i < nameEntries.length; i++) {
    const entry = itemEntries[i];
    const nameLine = nameEntries[i].trim();

    // Use the comment as the item ID (after applying reduce)
    const itemId: string = reduce(entry.comment);

    // Parse item attributes: item_attribute 200, 0, 0, BALL, ITEMMENU_PARTY, ITEMMENU_CLOSE
    const parts = entry.attributes.replace('item_attribute ', '').split(',');

    // Extract name: li "Poke Ball"
    const name = nameLine.replace('li "', '').replace('"', '').trim();

    // console.log(`🛍️ Extracted item: ${name} (${itemId})`);

    if (parts.length >= 6) {
      itemData[version].push({
        id: itemId,
        name: name,
        description: descriptions[itemId] || 'No description available.',
        attributes: {
          price: parseInt(parts[0].trim(), 10) || undefined,
          effect: parts[1].trim() !== '0' ? parts[1].trim() : undefined,
          params: parts[2].trim() !== '0' ? parts[2].trim() : undefined,
          category: parts[4].trim() !== '0' ? parts[4].trim() : undefined,
        },
        locations: getItemLocations(itemId, version),
      });
    }
  }

  // Extract key items
  const keyItemEntries: Array<{ comment: string; attributes: string }> = [];
  let inKeyItemSection = false;

  for (let i = 0; i < itemsData.length; i++) {
    const line = itemsData[i].trim();

    // Check if we've entered the KeyItemAttributes section
    if (line === 'KeyItemAttributes:') {
      inKeyItemSection = true;
      continue;
    }

    // Stop processing if we've left the key items section
    if (inKeyItemSection && line.startsWith('assert_table_length NUM_KEY_ITEMS')) {
      break;
    }

    if (inKeyItemSection && line.startsWith('key_item_attribute ') && !line.includes(';')) {
      // Look back for the comment line
      let commentLine = '';
      for (let j = i - 1; j >= 0; j--) {
        const prevLine = itemsData[j].trim();
        if (prevLine.startsWith(';') && prevLine.length > 2) {
          commentLine = prevLine.substring(1).trim(); // Remove ';' and trim
          break;
        }
        if (prevLine !== '' && !prevLine.startsWith(';')) {
          break; // Stop if we hit a non-comment, non-empty line
        }
      }

      if (commentLine) {
        keyItemEntries.push({ comment: commentLine, attributes: line });
      }
    }
  }

  // Process key items (skip the first name "Cancel" as it doesn't have attributes)
  const keyNameEntries = keyItemNamesData.filter((line) => line.trim().startsWith('li "')).slice(1);

  for (let i = 0; i < keyItemEntries.length && i < keyNameEntries.length; i++) {
    const entry = keyItemEntries[i];
    const nameLine = keyNameEntries[i].trim();

    // Use the comment as the item ID (after applying reduce)
    const itemId: string = reduce(entry.comment);

    // Parse key item attributes: key_item_attribute 1, ITEMMENU_CLOSE, ITEMMENU_NOUSE
    const parts = entry.attributes.replace('key_item_attribute ', '').split(',');

    // Extract name: li "Bicycle"
    const name = nameLine.replace('li "', '').replace('"', '').trim();

    // console.log(`🔑 Extracted key item: ${name} (${itemId})`);

    if (parts.length >= 3) {
      itemData[version].push({
        id: itemId,
        name: name,
        description: descriptions[itemId] || 'No description available.',
        attributes: {
          price: undefined, // Key items don't have prices
          effect: undefined,
          params: undefined,
          category: parts[1].trim() !== '0' ? parts[1].trim() : 'KEY', // Use KEY as default category
        },
        locations: getItemLocations(itemId, version),
      });
    }
  }

  // Extract apricorns (they don't have attributes in ROM, so we create them manually)
  const apricornNameEntries = apricornNamesData.filter((line) => line.trim().startsWith('li "'));

  // Define apricorn descriptions and properties, they don't exist in descriptions.asm!
  const apricornDescriptions: Record<string, string> = {
    redapricorn: 'A red apricorn that can be used by Kurt to make Level Balls.',
    bluapricorn: 'A blue apricorn that can be used by Kurt to make Lure Balls.',
    ylwapricorn: 'A yellow apricorn that can be used by Kurt to make Moon Balls.',
    grnapricorn: 'A green apricorn that can be used by Kurt to make Friend Balls.',
    whtapricorn: 'A white apricorn that can be used by Kurt to make Fast Balls.',
    blkapricorn: 'A black apricorn that can be used by Kurt to make Heavy Balls.',
    pnkapricorn: 'A pink apricorn that can be used by Kurt to make Love Balls.',
  };

  for (let i = 0; i < apricornNameEntries.length; i++) {
    const nameLine = apricornNameEntries[i].trim();
    const name = nameLine.replace('li "', '').replace('"', '').trim();
    const itemId = reduce(name);

    // console.log(`🌰 Extracted apricorn: ${name} (${itemId})`);

    itemData[version].push({
      id: itemId,
      name: name,
      description:
        apricornDescriptions[itemId] ||
        descriptions[itemId] ||
        'A fruit that can be used by Kurt to make Poké Balls.',
      attributes: {
        price: undefined, // Apricorns are free from trees
        category: 'Berry', // Use Berry category like other fruit tree items
      },
      locations: [],
    });
  }

  // Extract Experience Candies (they don't have attributes in ROM, so we create them manually)
  const expCandyNameEntries = expCandyNamesData.filter((line) => line.trim().startsWith('li "'));

  // Define exp candy descriptions and properties
  const expCandyDescriptions: Record<string, string> = {
    expcandyxs: "Increases a Pokémon's Exp. Points by 100.",
    expcandys: "Increases a Pokémon's Exp. Points by 800.",
    expcandym: "Increases a Pokémon's Exp. Points by 3000.",
    expcandyl: "Increases a Pokémon's Exp. Points by 10000.",
    expcandyxl: "Increases a Pokémon's Exp. Points by 30000.",
  };

  for (let i = 0; i < expCandyNameEntries.length; i++) {
    const nameLine = expCandyNameEntries[i].trim();
    const name = nameLine.replace('li "', '').replace('"', '').trim();
    const itemId = reduce(name);

    // console.log(`🍬 Extracted exp candy: ${name} (${itemId})`);

    itemData[version].push({
      id: itemId,
      name: name,
      description:
        expCandyDescriptions[itemId] ||
        descriptions[itemId] ||
        "A candy that increases a Pokémon's experience points.",
      attributes: {
        price: undefined,
        category: 'CANDY',
      },
      locations: [],
    });
  }

  // Extract Wings (they don't have attributes in ROM, so we create them manually)
  const wingNameEntries = wingNamesData.filter((line) => line.trim().startsWith('li "'));

  // Define wing descriptions and properties
  const wingDescriptions: Record<string, string> = {
    healthwing: "Slightly increases a Pokémon's HP base points.",
    musclewing: "Slightly increases a Pokémon's Attack base points.",
    resistwing: "Slightly increases a Pokémon's Defense base points.",
    swiftwing: "Slightly increases a Pokémon's Speed base points.",
    geniuswing: "Slightly increases a Pokémon's Sp. Attack base points.",
    cleverwing: "Slightly increases a Pokémon's Sp. Defense base points.",
  };

  for (let i = 0; i < wingNameEntries.length; i++) {
    const nameLine = wingNameEntries[i].trim();
    const name = nameLine.replace('li "', '').replace('"', '').trim();
    const itemId = reduce(name);

    // console.log(`🪶 Extracted wing: ${name} (${itemId})`);

    itemData[version].push({
      id: itemId,
      name: name,
      description:
        wingDescriptions[itemId] ||
        descriptions[itemId] ||
        "A feather that slightly increases a Pokémon's base points.",
      attributes: {
        price: undefined,
        category: 'Medicine',
      },
      locations: [],
    });
  }

  // Extract Special Items (they don't have attributes in ROM, so we create them manually)
  const specialNameEntries = specialNamesData.filter((line) => line.trim().startsWith('li "'));

  // Define special item descriptions and properties
  const specialDescriptions: Record<string, string> = {
    pokedex: 'A high-tech encyclopedia of Pokémon.',
    mapcard: 'A card that shows your location.',
    radiocard: 'A card that enables radio programs.',
    expncard: 'A card that expands radio programs.',
    pokegear: 'A multifunctional device.',
  };

  for (let i = 0; i < specialNameEntries.length; i++) {
    const nameLine = specialNameEntries[i].trim();
    const name = nameLine.replace('li "', '').replace('"', '').trim();
    const itemId = reduce(name);

    // console.log(`⚙️ Extracted special item: ${name} (${itemId})`);

    itemData[version].push({
      id: itemId,
      name: name,
      description:
        specialDescriptions[itemId] ||
        descriptions[itemId] ||
        'A special item with unique properties.',
      attributes: {
        price: undefined,
        category: 'KEY',
      },
      locations: [],
    });
  }
};

export default async function extractItems() {
  // console.log('🛍️  Starting item extraction...');

  // First, extract item locations from map files
  await extractItemLocations();

  //#1: Extract Items
  let raw = await readFile(itemsASM, 'utf-8');
  const itemsFiles = splitFile(raw);
  raw = await readFile(itemNamesASM, 'utf-8');
  const itemNamesFiles = splitFile(raw);
  raw = await readFile(keyItemNamesASM, 'utf-8');
  const keyItemNamesFiles = splitFile(raw);
  raw = await readFile(apricornNamesASM, 'utf-8');
  const apricornNamesFiles = splitFile(raw);
  raw = await readFile(expCandyNamesASM, 'utf-8');
  const expCandyNamesFiles = splitFile(raw);
  raw = await readFile(wingNamesASM, 'utf-8');
  const wingNamesFiles = splitFile(raw);
  raw = await readFile(specialNamesASM, 'utf-8');
  const specialNamesFiles = splitFile(raw);
  raw = await readFile(itemDescriptionsASM, 'utf-8');
  const itemDescriptionsData = raw
    .trim()
    .split('\n')
    .map((line) => line.trim());

  // Extract items for both versions
  await extractItemsData(
    itemsFiles[0],
    itemNamesFiles[0],
    keyItemNamesFiles[0],
    apricornNamesFiles[0],
    expCandyNamesFiles[0],
    wingNamesFiles[0],
    specialNamesFiles[0],
    itemDescriptionsData,
    'polished',
  );

  await extractItemsData(
    itemsFiles[1],
    itemNamesFiles[1],
    keyItemNamesFiles[1],
    apricornNamesFiles[1],
    expCandyNamesFiles[1],
    wingNamesFiles[1],
    specialNamesFiles[1],
    itemDescriptionsData,
    'faithful',
  );

  // Extract TM/HM data for both versions
  await extractTMHMData('polished');
  await extractTMHMData('faithful');

  const outputDir = join(__dirname, '..', 'new');
  const itemsDir = join(outputDir, 'items');
  const itemsManifestPath = join(outputDir, 'items_manifest.json');

  // Clear and recreate items directory and delete manifest
  try {
    await rm(itemsDir, { recursive: true, force: true });
    await rm(itemsManifestPath, { force: true });
    await mkdir(itemsDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    console.log('Cleared items directory and deleted items manifest');
  } catch (error) {
    if (error) {
      throw error;
    }
  }

  // Consolidate items from both versions into comprehensive format
  const consolidatedItems: ComprehensiveItemsData[] = [];
  const seenItems = new Set<string>();

  // Process polished items
  for (const item of itemData.polished) {
    consolidatedItems.push({
      id: item.id,
      versions: {
        polished: {
          name: item.name,
          description: item.description,
          attributes: item.attributes,
          locations: item.locations,
        },
      },
    });
    seenItems.add(item.id);
  }

  // Add faithful items (merge if already exists)
  for (const item of itemData.faithful) {
    const existingIndex = consolidatedItems.findIndex((ci) => ci.id === item.id);
    if (existingIndex >= 0) {
      // Add faithful version to existing item
      consolidatedItems[existingIndex].versions.faithful = {
        name: item.name,
        description: item.description,
        attributes: item.attributes,
        locations: item.locations,
      };
    } else {
      // Create new item with only faithful version
      consolidatedItems.push({
        id: item.id,
        versions: {
          faithful: {
            name: item.name,
            description: item.description,
            attributes: item.attributes,
            locations: item.locations,
          },
        },
      });
    }
  }

  // Write individual item files
  await Promise.all(
    consolidatedItems.map(async (item) => {
      const itemPath = join(itemsDir, `${item.id}.json`);
      await writeFile(itemPath, JSON.stringify(item, null, 2), 'utf-8');
    }),
  );

  // Create items manifest with proper format (using polished version for manifest)
  const itemsManifest: ItemsManifest[] = consolidatedItems.map((item) => {
    const polishedVersion = item.versions.polished || item.versions.faithful;
    return {
      id: item.id,
      name: polishedVersion!.name,
      locationCount: polishedVersion!.locations?.length,
    };
  });

  // Write items manifest file
  await writeFile(itemsManifestPath, JSON.stringify(itemsManifest, null, 2), 'utf-8');

  console.log(`✅ Items extraction completed successfully!`);
  console.log(`   • ${consolidatedItems.length} items extracted`);
  console.log(`   • Polished version: ${itemData.polished.length} items`);
  console.log(`   • Faithful version: ${itemData.faithful.length} items`);
  console.log(`   • Individual files written to ${itemsDir}`);
  console.log(`   • Manifest with ${itemsManifest.length} items written to ${itemsManifestPath}`);
}

// Allow running this script directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  extractItems();
}
