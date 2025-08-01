/**
 * Script to pre-compute normalized URLs for all Pokemon to reduce runtime processing
 */

import fs from 'fs';
import path from 'path';
import { normalizePokemonUrlKey } from '../src/utils/pokemonUrlNormalizer';

interface BaseData {
  name: string;
  nationalDex: number;
  johtoDex?: number;
  types: string | string[];
  updatedTypes?: string | string[];
  formName?: string;
  normalizedUrl?: string; // We'll add this
}

async function addNormalizedUrls() {
  try {
    console.log('🔧 Adding normalized URLs to Pokemon base data...');
    
    // Load the base data file
    const baseDataPath = path.join(process.cwd(), 'output/pokemon_base_data.json');
    const rawData = fs.readFileSync(baseDataPath, 'utf8');
    const pokemonData: Record<string, BaseData> = JSON.parse(rawData);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    // Process each Pokemon
    for (const [key, pokemon] of Object.entries(pokemonData)) {
      processedCount++;
      
      // Check if normalized URL already exists
      if (!pokemon.normalizedUrl) {
        // Compute normalized URL
        const normalizedUrl = normalizePokemonUrlKey(pokemon.name).toLowerCase();
        pokemon.normalizedUrl = normalizedUrl;
        updatedCount++;
      }
      
      // Show progress for every 50 Pokemon
      if (processedCount % 50 === 0) {
        console.log(`  Processed ${processedCount} Pokemon...`);
      }
    }
    
    // Write the updated data back
    fs.writeFileSync(baseDataPath, JSON.stringify(pokemonData, null, 2));
    
    console.log(`✅ Successfully processed ${processedCount} Pokemon:`);
    console.log(`   - ${updatedCount} URLs added/updated`);
    console.log(`   - ${processedCount - updatedCount} URLs already existed`);
    
  } catch (error) {
    console.error('❌ Error adding normalized URLs:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  addNormalizedUrls();
}

export { addNormalizedUrls };