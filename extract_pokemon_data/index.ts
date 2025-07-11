/**
 * Main entry point for Pokémon data extraction
 */

// Import all parsers
import { extractAbilityDescriptions } from './parsers/abilityParser.js';
import { extractMoveDescriptions } from './parsers/moveParser.js';
import { extractPokemonLocations } from './parsers/locationParser.js';
import { extractEvolutionData } from './parsers/evolutionParser.js';
import { extractBaseData } from './parsers/baseDataParser.js';
import { extractDetailedStats } from './parsers/detailedStatsParser.js';
import { extractPokedexEntries } from './parsers/pokedexEntryParser.js';
import { extractEggMoves } from './parsers/eggMovesParser.js';
import { extractLevelMoves } from './parsers/levelMovesParser.js';

// Import output utilities
import { combineDataFiles } from './output/saveData.js';

/**
 * Run the full data extraction process
 */
async function main() {
  console.log('Starting Pokémon data extraction...');
  const startTime = Date.now();

  try {
    // Extract ability descriptions
    const abilityDescriptions = extractAbilityDescriptions();
    console.log(`Extracted ${Object.keys(abilityDescriptions).length} ability descriptions.`);

    // Extract move descriptions
    const moveDescriptions = extractMoveDescriptions();
    console.log(`Extracted ${Object.keys(moveDescriptions).length} move descriptions.`);

    // Extract Pokémon locations
    const locationsByMon = extractPokemonLocations();
    console.log(`Extracted location data for ${Object.keys(locationsByMon).length} Pokémon.`);

    // Extract evolution data
    const evolutionData = extractEvolutionData();
    console.log(`Extracted evolution data for ${Object.keys(evolutionData).length} Pokémon.`);

    // Extract base data
    const baseData = extractBaseData();
    console.log(`Extracted base data for ${Object.keys(baseData).length} Pokémon.`);

    // Extract detailed stats
    const detailedStats = extractDetailedStats();
    console.log(`Extracted detailed stats for ${Object.keys(detailedStats).length} Pokémon.`);

    // Extract Pokédex entries
    const pokedexEntries = extractPokedexEntries();
    console.log(`Extracted Pokédex entries for ${Object.keys(pokedexEntries).length} Pokémon.`);

    // Extract egg moves
    const eggMoves = extractEggMoves();
    console.log(`Extracted egg moves for ${Object.keys(eggMoves).length} Pokémon.`);

    // Extract level moves
    const levelMoves = extractLevelMoves();
    console.log(`Extracted level-up moves for ${Object.keys(levelMoves).length} Pokémon.`);

    // Optional: Create a combined data file
    const combinedPath = './pokemon_combined_data.json';
    combineDataFiles(combinedPath, {
      pokedex: pokedexEntries,
      baseData,
      detailedStats,
      evolution: evolutionData,
      levelMoves,
      eggMoves,
      locations: locationsByMon,
      abilities: abilityDescriptions,
      moves: moveDescriptions
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`Data extraction completed successfully in ${duration.toFixed(2)} seconds!`);
  } catch (error) {
    console.error('Error during data extraction:', error);
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
