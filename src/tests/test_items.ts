import fs from 'fs';
import path from 'path';

// Test script to validate items data structure
const testItemsData = () => {
  try {
    const filePath = path.join(process.cwd(), 'output/items_data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log('✅ Items data loaded successfully');
    console.log(`📊 Total items: ${Object.keys(data).length}`);

    // Test first few items
    const items = Object.values(data).slice(0, 3);
    console.log('🔍 Sample items:');
    items.forEach((item: any) => {
      console.log(`  - ${item.name} (${item.attributes.category}) - ₽${item.attributes.price}`);
    });

    // Test categories
    const categories = new Set<string>();
    Object.values(data).forEach((item: any) => {
      categories.add(item.attributes.category);
    });
    console.log(`🏷️  Categories found: ${categories.size}`);
    console.log(`📁 Categories: ${Array.from(categories).join(', ')}`);

    return true;
  } catch (error) {
    console.error('❌ Error loading items data:', error);
    return false;
  }
};

testItemsData();
