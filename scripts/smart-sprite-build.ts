#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Paths
const POKEMON_SOURCE_DIR = 'polishedcrystal/gfx/pokemon';
const TRAINER_SOURCE_DIR = 'polishedcrystal/gfx/trainers';
const POKEMON_OUTPUT_DIR = 'public/sprites/pokemon';
const TRAINER_OUTPUT_DIR = 'public/sprites/trainers';
const POKEMON_MANIFEST = 'public/sprite_manifest.json';
const TRAINER_MANIFEST = 'public/trainer_manifest.json';

function getLastModified(dir: string) {
  if (!existsSync(dir)) return 0;

  let lastModified = 0;

  function traverse(currentDir: string) {
    const items = readdirSync(currentDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(currentDir, item.name);
      if (item.isDirectory()) {
        traverse(fullPath);
      } else {
        const stat = statSync(fullPath);
        lastModified = Math.max(lastModified, stat.mtime.getTime());
      }
    }
  }

  traverse(dir);
  return lastModified;
}

function getManifestTime(manifestPath: string) {
  if (!existsSync(manifestPath)) return 0;
  const stat = statSync(manifestPath);
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

function checkPythonAvailable() {
  try {
    execSync('python --version', { stdio: 'pipe' });
    return 'python';
  } catch {
    try {
      execSync('python3 --version', { stdio: 'pipe' });
      return 'python3';
    } catch {
      return null;
    }
  }
}

function main() {
  console.log('🔍 Checking if sprite processing is needed...\n');

  // Check if we're in Vercel environment or if Python is available
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  const pythonCmd = checkPythonAvailable();

  if (isVercel && !pythonCmd) {
    console.log('⚠️  Running in Vercel environment without Python');
    console.log('📦 Skipping sprite processing - using pre-built sprites');
    console.log('💡 To rebuild sprites, run locally or use GitHub Actions workflow');
    return;
  }

  if (!pythonCmd) {
    console.log('❌ Python not found. Please install Python to process sprites.');
    console.log('📦 Skipping sprite processing - using existing sprites');
    return;
  }

  const pokemonNeedsRebuild = needsPokemonRebuild();
  const trainerNeedsRebuild = needsTrainerRebuild();

  if (!pokemonNeedsRebuild && !trainerNeedsRebuild) {
    console.log('✅ Sprites are up to date, skipping processing');
    return;
  }

  console.log('\n🚀 Running sprite processing...');

  try {
    if (pokemonNeedsRebuild && trainerNeedsRebuild) {
      console.log('📦 Processing both Pokemon and trainer sprites');
      execSync(`${pythonCmd} process_sprites.py --all`, { stdio: 'inherit' });
    } else if (pokemonNeedsRebuild) {
      console.log('🐾 Processing Pokemon sprites only');
      execSync(`${pythonCmd} process_sprites.py --pokemon`, { stdio: 'inherit' });
    } else if (trainerNeedsRebuild) {
      console.log('👤 Processing trainer sprites only');
      execSync(`${pythonCmd} process_sprites.py --trainers`, { stdio: 'inherit' });
    }

    console.log('✅ Sprite processing complete');
  } catch (error) {
    if (error instanceof Error) {
      console.log('❌ Sprite processing failed:', error.message);
    } else {
      console.log('❌ Sprite processing failed:', error);
    }
    console.log('📦 Continuing build with existing sprites');
  }
}

main();

// eslint-disable-next-line import/no-anonymous-default-export
export default { needsPokemonRebuild, needsTrainerRebuild };
