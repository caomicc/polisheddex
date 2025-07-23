import { extractItemData } from '../utils/extractors/itemExtractors.ts';
import { extractMartData } from '../utils/extractors/martExtractors.ts';

// Extract item data
console.log('🔍 Extracting item data...');
const itemData = extractItemData();
console.log(`📊 Total items extracted: ${Object.keys(itemData).length}`);

// Extract mart data
extractMartData(itemData);

console.log('✅ Done!');
