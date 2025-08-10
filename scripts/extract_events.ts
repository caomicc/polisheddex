import { extractEventData, writeEventDataToFile } from '../src/utils/extractors/eventExtractors.ts';
import path from 'path';

function main() {
  console.log('🎯 Starting event data extraction...');
  
  // Extract the event data
  const eventData = extractEventData();
  
  // Define output path
  const outputPath = path.join(process.cwd(), 'output', 'events.json');
  
  // Write to file
  writeEventDataToFile(eventData, outputPath);
  
  console.log('✅ Event extraction completed successfully!');
}

main();