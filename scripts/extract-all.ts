import extractPokemon from './extract-pokemon.ts';
import extractLocations from './extract-locations.ts';
import extractItems from './extract-items.ts';
import extractMoves from './extract-moves.ts';

console.log('🚀 Starting comprehensive data extraction...');
console.log('━'.repeat(50));

try {
  // Run Moves extraction first since they're independent
  console.log('1️⃣  Running Moves extraction...');
  await extractMoves();
  console.log('✅ Moves extraction completed\n');

  // Run Pokemon extraction second since it references moves
  console.log('2️⃣  Running Pokemon extraction...');
  await extractPokemon();
  console.log('✅ Pokemon extraction completed\n');

  // Run Items extraction third
  console.log('3️⃣  Running Items extraction...');
  await extractItems();
  console.log('✅ Items extraction completed\n');

  // Run Locations extraction last
  console.log('4️⃣  Running Locations extraction...');
  await extractLocations();
  console.log('✅ Locations extraction completed\n');

  console.log('━'.repeat(50));
  console.log('🎉 All extractions completed successfully!');
  console.log('   Check the /public/new directory for results.');
} catch (error) {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
}
