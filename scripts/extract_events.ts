import { 
  extractEventData, 
  writeEventDataToFile,
  extractGiftEventsForPokemon,
  writeGiftLocationDataToFile
} from '../src/utils/extractors/eventExtractors.ts';
import path from 'path';

function main() {
  console.log('🎯 Starting event data extraction...');
  
  // Extract the event data
  const eventData = extractEventData();
  
  // Extract gift events for Pokemon location data
  const giftLocationData = extractGiftEventsForPokemon();
  
  // Define output paths
  const eventOutputPath = path.join(process.cwd(), 'output', 'events.json');
  const giftLocationOutputPath = path.join(process.cwd(), 'output', 'pokemon_gift_locations.json');
  
  // Write to files
  writeEventDataToFile(eventData, eventOutputPath);
  writeGiftLocationDataToFile(giftLocationData, giftLocationOutputPath);
  
  console.log('✅ Event extraction completed successfully!');
}

main();