import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const POKEMON_SPRITE_DIR = 'polishedcrystal/gfx/pokemon/'; // Directory containing front.png files
const POKEMON_OUTPUT_DIR = 'public/sprites/pokemon/'; // Where to save cropped PNGs
const TRAINER_SPRITE_DIR = 'polishedcrystal/gfx/trainers/'; // Directory containing trainer.png files
const TRAINER_OUTPUT_DIR = 'public/sprites/trainers/'; // Where to save cropped trainer PNGs

async function autodetectAndCropSprite(filePath: string, outPath: string) {
  const image = sharp(filePath);
  const metadata = await image.metadata();
  const { width, height } = metadata;
  if (!width || !height) {
    console.error(`DEBUG: Could not read image size for ${filePath}`);
    return;
  }
  // Try to find the largest divisor of height that is <= width (assume square sprites)
  let spriteHeight = width;
  for (let h = width; h <= height; h++) {
    if (height % h === 0 && h <= width) {
      spriteHeight = h;
      break;
    }
  }
  // Crop the top sprite
  const cropped = await image.extract({ left: 0, top: 0, width, height: spriteHeight }).toBuffer();

  // Make white pixels transparent
  await sharp(cropped)
    .png()
    .ensureAlpha()
    .recomb([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ])
    .joinChannel(
      await sharp(cropped)
        .removeAlpha()
        .toColourspace('b-w')
        .threshold(254) // 254 to catch near-white
        .negate()
        .toBuffer(),
    )
    .toFile(outPath);
  console.log(`DEBUG: Cropped top sprite from ${filePath} -> ${outPath} (white made transparent)`);
}

function findAllFrontPngs(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findAllFrontPngs(filePath));
    } else if (file === 'front.png') {
      results.push(filePath);
    }
  }
  return results;
}

async function processAllSprites() {
  if (!fs.existsSync(POKEMON_OUTPUT_DIR)) fs.mkdirSync(POKEMON_OUTPUT_DIR);
  const files = findAllFrontPngs(POKEMON_SPRITE_DIR);
  for (const filePath of files) {
    // Preserve subdirectory structure in output, but remove '_plain' from any part of the path
    const relPath = path.relative(POKEMON_SPRITE_DIR, filePath).replace(/_plain/g, '');
    const outPath = path.join(POKEMON_OUTPUT_DIR, relPath.replace('front.png', 'normal_front.png'));
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await autodetectAndCropSprite(filePath, outPath);
  }
}

function findAllTrainerPngs(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    console.log(`DEBUG: Checking ${filePath}`);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findAllTrainerPngs(filePath));
    } else if (file.endsWith('.png')) {
      results.push(filePath);
    }
  }
  console.log(`DEBUG: Found ${results.length} trainer sprites`);
  return results;
}

async function processTrainerSprites() {
  console.log('Processing trainer sprites...');
  if (!fs.existsSync(TRAINER_OUTPUT_DIR)) fs.mkdirSync(TRAINER_OUTPUT_DIR);
  const files = findAllTrainerPngs(TRAINER_SPRITE_DIR);
  for (const filePath of files) {
    const relPath = path.relative(TRAINER_SPRITE_DIR, filePath);
    const outPath = path.join(
      TRAINER_OUTPUT_DIR,
      relPath.replace('trainer.png', 'trainer_cropped.png'),
    );
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await autodetectAndCropSprite(filePath, outPath);
  }
}

processAllSprites().then(processTrainerSprites).catch(console.error);
