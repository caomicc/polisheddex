#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const POKEMON_SOURCE_DIR = 'polishedcrystal/gfx/pokemon';
const TRAINER_SOURCE_DIR = 'polishedcrystal/gfx/trainers';
const POKEMON_OUTPUT_DIR = 'public/sprites/pokemon';
const TRAINER_OUTPUT_DIR = 'public/sprites/trainers';
const POKEMON_MANIFEST = 'public/sprite_manifest.json';
const TRAINER_MANIFEST = 'public/trainer_manifest.json';

function getLastModified(dir) {
  if (!fs.existsSync(dir)) return 0;
  
  let lastModified = 0;
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      if (item.isDirectory()) {
        traverse(fullPath);
      } else {
        const stat = fs.statSync(fullPath);
        lastModified = Math.max(lastModified, stat.mtime.getTime());
      }
    }
  }
  
  traverse(dir);
  return lastModified;
}

function getManifestTime(manifestPath) {
  if (!fs.existsSync(manifestPath)) return 0;
  const stat = fs.statSync(manifestPath);
  return stat.mtime.getTime();
}

function needsPokemonRebuild() {
  const sourceTime = getLastModified(POKEMON_SOURCE_DIR);
  const outputTime = getLastModified(POKEMON_OUTPUT_DIR);
  const manifestTime = getManifestTime(POKEMON_MANIFEST);
  
  console.log('Pokemon check:');
  console.log(`  Source last modified: ${new Date(sourceTime).toISOString()}`);
  console.log(`  Output last modified: ${new Date(outputTime).toISOString()}`);
  console.log(`  Manifest last modified: ${new Date(manifestTime).toISOString()}`);
  
  return sourceTime > Math.min(outputTime, manifestTime);
}

function needsTrainerRebuild() {
  const sourceTime = getLastModified(TRAINER_SOURCE_DIR);
  const outputTime = getLastModified(TRAINER_OUTPUT_DIR);
  const manifestTime = getManifestTime(TRAINER_MANIFEST);
  
  console.log('Trainer check:');
  console.log(`  Source last modified: ${new Date(sourceTime).toISOString()}`);
  console.log(`  Output last modified: ${new Date(outputTime).toISOString()}`);
  console.log(`  Manifest last modified: ${new Date(manifestTime).toISOString()}`);
  
  return sourceTime > Math.min(outputTime, manifestTime);
}

function main() {
  console.log('🔍 Checking if sprite processing is needed...\n');
  
  const pokemonNeedsRebuild = needsPokemonRebuild();
  const trainerNeedsRebuild = needsTrainerRebuild();
  
  if (!pokemonNeedsRebuild && !trainerNeedsRebuild) {
    console.log('✅ Sprites are up to date, skipping processing');
    return;
  }
  
  console.log('\n🚀 Running sprite processing...');
  
  if (pokemonNeedsRebuild && trainerNeedsRebuild) {
    console.log('📦 Processing both Pokemon and trainer sprites');
    execSync('python process_sprites.py --all', { stdio: 'inherit' });
  } else if (pokemonNeedsRebuild) {
    console.log('🐾 Processing Pokemon sprites only');
    execSync('python process_sprites.py --pokemon', { stdio: 'inherit' });
  } else if (trainerNeedsRebuild) {
    console.log('👤 Processing trainer sprites only');
    execSync('python process_sprites.py --trainers', { stdio: 'inherit' });
  }
  
  console.log('✅ Sprite processing complete');
}

if (require.main === module) {
  main();
}

module.exports = { needsPokemonRebuild, needsTrainerRebuild };