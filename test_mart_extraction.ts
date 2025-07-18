import { extractItemData } from './src/utils/extractors/itemExtractors.ts';
import { extractMartData } from './src/utils/extractors/martExtractors.ts';

// Extract item data
console.log('🔍 Extracting item data...');
const itemData = extractItemData();
console.log(`📊 Total items extracted: ${Object.keys(itemData).length}`);

// Extract mart data
extractMartData(itemData);

console.log('✅ Done!');
