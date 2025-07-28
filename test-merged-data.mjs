import { loadMergedPokemonLocationData } from './src/utils/location-data-loader.ts';

async function testMergedData() {
  try {
    const data = await loadMergedPokemonLocationData();

    console.log('Testing Route 28...');
    const route28 = data['route_28'];
    if (route28) {
      console.log('✅ Route 28 data found!');
      console.log('Pokemon:', Object.keys(route28.pokemon));
      Object.entries(route28.pokemon).forEach(([pokemon, pokemonData]) => {
        console.log(`  ${pokemon}:`, Object.keys(pokemonData.methods));
      });
    } else {
      console.log('❌ Route 28 not found in merged data');
      console.log('Available areas (first 10):', Object.keys(data).slice(0, 10));
    }

    console.log('\nTesting Route 33...');
    const route33 = data['route_33'];
    if (route33) {
      console.log('✅ Route 33 data found!');
      console.log('Pokemon:', Object.keys(route33.pokemon));
      Object.entries(route33.pokemon).forEach(([pokemon, pokemonData]) => {
        console.log(`  ${pokemon}:`, Object.keys(pokemonData.methods));
      });
    } else {
      console.log('❌ Route 33 not found in merged data');
    }
  } catch (error) {
    console.error('Error testing merged data:', error);
  }
}

testMergedData();
