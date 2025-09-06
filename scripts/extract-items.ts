import reduce from '../src/lib/reduce.ts';
import splitFile from '../src/lib/split.ts';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ItemsData } from '../src/types/new.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const itemsASM = join(__dirname, '../polishedcrystal/data/items/attributes.asm');
const itemNamesASM = join(__dirname, '../polishedcrystal/data/items/names.asm');
const itemDescriptionsASM = join(__dirname, '../polishedcrystal/data/items/descriptions.asm');

const itemsManifest: ItemsData[] = [];

const extractItemsData = async (
  itemsData: string[],
  itemNamesData: string[],
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

    console.log(`🛍️ Extracted item: ${name} (${itemId})`);

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
};

export default async function extractItems() {
  console.log('🛍️  Starting item extraction...');

  //#1: Extract Items
  let raw = await readFile(itemsASM, 'utf-8');
  const itemsFiles = splitFile(raw);
  raw = await readFile(itemNamesASM, 'utf-8');
  const itemNamesFiles = splitFile(raw);
  raw = await readFile(itemDescriptionsASM, 'utf-8');
  const itemDescriptionsData = raw
    .trim()
    .split('\n')
    .map((line) => line.trim());

  await extractItemsData(itemsFiles[0], itemNamesFiles[0], itemDescriptionsData); // Use Polished version for items

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
