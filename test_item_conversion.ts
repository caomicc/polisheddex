import { getItemIdFromDisplayName } from './src/utils/itemUtils';
import fs from 'fs';
import path from 'path';

// Test the item ID conversion function
const testCases = [
  'Leaf Stone',
  'Dusk Stone',
  'Poké Ball',
  'Great Ball',
  'Ultra Ball',
  'Master Ball',
  'Rare Candy',
  'Max Revive',
  'Full Restore'
];

console.log('Testing item ID conversion...');

// Load items data to verify our conversions
const itemsFile = path.join(process.cwd(), 'output/items_data.json');
const itemsData = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));

testCases.forEach(testCase => {
  const itemId = getItemIdFromDisplayName(testCase);
  const exists = itemId && itemsData[itemId];
  console.log(`${testCase} -> ${itemId} ${exists ? '✅' : '❌'}`);
  if (exists) {
    console.log(`  Found: "${itemsData[itemId].name}"`);
  }
});

console.log('\nAll item IDs in database:');
console.log(Object.keys(itemsData).slice(0, 20).join(', ') + '...');
