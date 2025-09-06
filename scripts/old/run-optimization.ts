#!/usr/bin/env ts-node

import { createAbilitiesManifest, createMovesManifest, createItemsManifest } from './create-manifests';
import { compressAllPokemonFiles, compressDetailedStats } from './compress-pokemon-data';
import fs from 'fs/promises';
import path from 'path';

async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.log(`Could not read directory ${dirPath}: ${error}`);
  }
  
  return totalSize;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function measureDirectorySizes(): Promise<void> {
  console.log('\n📊 Measuring directory sizes...');
  
  const outputDir = path.join(process.cwd(), 'output');
  const pokemonDir = path.join(outputDir, 'pokemon');
  const locationsDir = path.join(outputDir, 'locations');
  const manifestsDir = path.join(outputDir, 'manifests');
  
  const [totalSize, pokemonSize, locationsSize] = await Promise.all([
    getDirectorySize(outputDir),
    getDirectorySize(pokemonDir),
    getDirectorySize(locationsDir)
  ]);
  
  let manifestsSize = 0;
  try {
    manifestsSize = await getDirectorySize(manifestsDir);
  } catch {
    // Manifests directory might not exist yet
  }
  
  console.log(`Total output directory: ${formatBytes(totalSize)}`);
  console.log(`Pokemon files: ${formatBytes(pokemonSize)}`);
  console.log(`Location files: ${formatBytes(locationsSize)}`);
  if (manifestsSize > 0) {
    console.log(`Manifests: ${formatBytes(manifestsSize)}`);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting Pokemon data optimization...\n');
  
  // Measure "before" sizes
  console.log('📏 BEFORE optimization:');
  await measureDirectorySizes();
  
  console.log('\n🔧 Phase 1: Creating manifests...');
  await createAbilitiesManifest();
  await createMovesManifest();
  await createItemsManifest();
  
  console.log('\n🗜️  Phase 2: Compressing Pokemon data...');
  await compressDetailedStats();
  await compressAllPokemonFiles();
  
  // Measure "after" sizes
  console.log('\n📏 AFTER optimization:');
  await measureDirectorySizes();
  
  console.log('\n✅ Optimization complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your components to use the new manifest-resolver utilities');
  console.log('2. Test the optimized data with your existing components');
  console.log('3. Run `npm run build` to ensure everything works correctly');
  console.log('4. Consider updating your extraction scripts to generate optimized format by default');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}