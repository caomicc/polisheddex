import splitFile from '../src/lib/split.ts';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ItemsData } from '../src/types/new.ts';
import { reduce } from '@/lib/extract-utils.ts';
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

const itemsManifest: ItemsData[] = [];

const extractItemsData = async (
  itemsData: string[],
  itemNamesData: string[],
  keyItemNamesData: string[],
  apricornNamesData: string[],
  expCandyNamesData: string[],
  wingNamesData: string[],
  specialNamesData: string[],
  itemDescriptionsData: string[],
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
      itemsManifest.push({
        id: itemId,
        name: name,
        description: descriptions[itemId] || 'No description available.',
        attributes: {
          price: parseInt(parts[0].trim(), 10) || undefined,
          effect: parts[1].trim() !== '0' ? parts[1].trim() : undefined,
          params: parts[2].trim() !== '0' ? parts[2].trim() : undefined,
          category: parts[4].trim() !== '0' ? parts[4].trim() : undefined,
        },
        locations: [],
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
      itemsManifest.push({
        id: itemId,
        name: name,
        description: descriptions[itemId] || 'No description available.',
        attributes: {
          price: undefined, // Key items don't have prices
          effect: undefined,
          params: undefined,
          category: parts[1].trim() !== '0' ? parts[1].trim() : 'KEY', // Use KEY as default category
        },
        locations: [],
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

    itemsManifest.push({
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

    itemsManifest.push({
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

    itemsManifest.push({
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

    itemsManifest.push({
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

  await extractItemsData(
    itemsFiles[0],
    itemNamesFiles[0],
    keyItemNamesFiles[0],
    apricornNamesFiles[0],
    expCandyNamesFiles[0],
    wingNamesFiles[0],
    specialNamesFiles[0],
    itemDescriptionsData,
  ); // Use Polished version for items

  const outputDir = join(__dirname, '..', 'new');

  try {
    await mkdir(outputDir, { recursive: true });
    console.log('Created output directories');
  } catch (error) {
    console.warn('Output directory already exists', error);
    // Directory might already exist, continue
  }

  // Write items manifest file
  const itemsManifestPath = join(outputDir, 'items_manifest.json');
  await writeFile(itemsManifestPath, JSON.stringify(itemsManifest, null, 2), 'utf-8');

  console.log(`✅ Items extraction completed successfully!`);
  console.log(`   • ${itemsManifest.length} items extracted`);
  console.log(`   • Manifest written to ${itemsManifestPath}`);
}

// Allow running this script directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  extractItems();
}
