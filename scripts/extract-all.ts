import extractPokemon from './extract-pokemon.ts';
import extractLocations from './extract-locations.ts';
import extractItems from './extract-items.ts';

console.log('🚀 Starting comprehensive data extraction...');
console.log('━'.repeat(50));

try {
  // Run Pokemon extraction first since it's the most complex
  console.log('1️⃣  Running Pokemon extraction...');
  await extractPokemon();
  console.log('✅ Pokemon extraction completed\n');

  // Run Items extraction second
  console.log('2️⃣  Running Items extraction...');
  await extractItems();
  console.log('✅ Items extraction completed\n');

  // Run Locations extraction last
  console.log('3️⃣  Running Locations extraction...');
  await extractLocations();
  console.log('✅ Locations extraction completed\n');

  console.log('━'.repeat(50));
  console.log('🎉 All extractions completed successfully!');
  console.log('   Check the /new and /output directories for results.');

} catch (error) {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
}
