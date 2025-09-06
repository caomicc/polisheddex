import { 
  extractEventData, 
  writeEventDataToFile,
  extractGiftEventsForPokemon,
  writeGiftLocationDataToFile,
  extractLegendaryEventLocations
} from '../src/utils/extractors/eventExtractors.ts';
import path from 'path';
import fs from 'fs';

function main() {
  console.log('🎯 Starting event data extraction...');
  
  // Extract the event data
  const eventData = extractEventData();
  
  // Extract gift events for Pokemon location data
  const giftLocationData = extractGiftEventsForPokemon();
  
  // Extract legendary event locations
  const legendaryLocationData = extractLegendaryEventLocations();
  
  // Define output paths
  const eventOutputPath = path.join(process.cwd(), 'output', 'events.json');
  const giftLocationOutputPath = path.join(process.cwd(), 'output', 'pokemon_gift_locations.json');
  const legendaryLocationOutputPath = path.join(process.cwd(), 'output', 'pokemon_legendary_locations.json');
  
  // Write to files
  writeEventDataToFile(eventData, eventOutputPath);
  writeGiftLocationDataToFile(giftLocationData, giftLocationOutputPath);
  
  // Write legendary locations data
  fs.writeFileSync(legendaryLocationOutputPath, JSON.stringify(legendaryLocationData, null, 2));
  console.log(`📁 Legendary location data saved to: ${legendaryLocationOutputPath}`);
  
  console.log('✅ Event extraction completed successfully!');
}

main();