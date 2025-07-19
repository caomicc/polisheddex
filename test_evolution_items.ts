import { getItemIdFromDisplayName } from './src/utils/itemUtils';

// Test evolution items mapping
const testEvolutionItems = [
  'Fire Stone',
  'Water Stone',
  'Thunder Stone',
  'Leaf Stone',
  'Moon Stone',
  'Sun Stone',
  'Dusk Stone',
  'Shiny Stone',
  'Dawn Stone',
  'King\'s Rock',
  'Metal Coat',
  'Dragon Scale',
  'Upgrade',
];

console.log('Testing evolution item ID conversion:');
testEvolutionItems.forEach(item => {
  const itemId = getItemIdFromDisplayName(item);
  console.log(`${item} -> ${itemId}`);
});
