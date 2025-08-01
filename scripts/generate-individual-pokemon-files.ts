// #!/usr/bin/env ts-node

// import fs from 'fs/promises';
// import path from 'path';
// import { deepReplaceMonString } from '../src/utils/stringUtils.ts';
// import { normalizePokemonUrlKey } from '../src/utils/pokemonUrlNormalizer.ts';

// /**
//  * Generate individual Pokemon JSON files from the aggregated detailed stats file
//  * This ensures individual files stay in sync with the main data
//  */
// async function generateIndividualPokemonFiles(): Promise<void> {
//   console.log('🔧 Generating individual Pokemon files from detailed stats...');

//   try {
//     // Load the detailed stats file
//     const detailedStatsPath = path.join(process.cwd(), 'output', 'pokemon_detailed_stats.json');
//     const detailedStatsData = JSON.parse(await fs.readFile(detailedStatsPath, 'utf8'));

//     // Load the location data file
//     const locationsPath = path.join(process.cwd(), 'output', 'pokemon_locations.json');
//     let locationsData: Record<string, { locations: unknown[] }> = {};
//     try {
//       locationsData = JSON.parse(await fs.readFile(locationsPath, 'utf8'));
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     } catch (error) {
//       console.warn('pokemon_locations.json not found, individual files will have no location data');
//     }

//     // Ensure output directory exists
//     const pokemonDir = path.join(process.cwd(), 'output', 'pokemon');
//     await fs.mkdir(pokemonDir, { recursive: true });

//     let processed = 0;
//     const total = Object.keys(detailedStatsData).length;

//     for (const [pokemonKey, pokemonData] of Object.entries(detailedStatsData)) {
//       try {
//         // Apply string replacements to ensure #mon is fixed
//         const cleanedData = deepReplaceMonString(pokemonData);

//         // Generate the sprite URL using the Pokemon URL normalizer
//         const urlKey = normalizePokemonUrlKey(pokemonKey);
//         const spriteUrl = `/sprites/pokemon/${urlKey}/front_cropped.png`;

//         // Get location data for this Pokemon
//         const pokemonLocations = locationsData[urlKey]?.locations || [];

//         // Debug logging for Shellder
//         if (urlKey === 'shellder') {
//           console.log(`DEBUG: Shellder individual file generation:`);
//           console.log(`  pokemonKey: ${pokemonKey}`);
//           console.log(`  urlKey: ${urlKey}`);
//           console.log(`  pokemonLocations count: ${pokemonLocations.length}`);
//           console.log(
//             `  grass locations: ${pokemonLocations.filter((l) => l.method === 'grass').length}`,
//           );
//           console.log(
//             `  fishing locations: ${pokemonLocations.filter((l) => l.method?.includes('fish')).length}`,
//           );
//         }

//         // Add the sprite URL and location data to the data
//         const finalData = {
//           ...(cleanedData as object),
//           frontSpriteUrl: spriteUrl,
//           locations: pokemonLocations,
//         };

//         // Write individual file
//         const fileName = `${urlKey}.json`;
//         const filePath = path.join(pokemonDir, fileName);

//         await fs.writeFile(filePath, JSON.stringify(finalData, null, 2));

//         processed++;

//         if (processed % 50 === 0) {
//           console.log(`Generated ${processed}/${total} Pokemon files...`);
//         }
//       } catch (error) {
//         console.error(`Error processing ${pokemonKey}:`, error);
//       }
//     }

//     console.log(`✅ Generated ${processed} individual Pokemon files.`);
//   } catch (error) {
//     console.error('Error generating individual Pokemon files:', error);
//   }
// }

// async function main(): Promise<void> {
//   console.log('🚀 Starting individual Pokemon file generation...\n');

//   await generateIndividualPokemonFiles();

//   console.log('\n✅ Individual Pokemon file generation complete!');
// }

// // Run if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main().catch(console.error);
// }

// export { generateIndividualPokemonFiles };
