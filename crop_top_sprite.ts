import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const SPRITE_DIR = 'gfx/pokemon/'; // Directory containing front.png files
const OUTPUT_DIR = 'public/sprites/pokemon/'; // Where to save cropped PNGs

async function autodetectAndCropSprite(filePath: string, outPath: string) {
  const image = sharp(filePath);
  const metadata = await image.metadata();
  const { width, height } = metadata;
  if (!width || !height) {
    console.error(`Could not read image size for ${filePath}`);
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
  await image.extract({ left: 0, top: 0, width, height: spriteHeight }).toFile(outPath);
  console.log(`Cropped top sprite from ${filePath} -> ${outPath}`);
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
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
  const files = findAllFrontPngs(SPRITE_DIR);
  for (const filePath of files) {
    // Preserve subdirectory structure in output
    const relPath = path.relative(SPRITE_DIR, filePath);
    const outPath = path.join(OUTPUT_DIR, relPath.replace('front.png', 'front_cropped.png'));
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await autodetectAndCropSprite(filePath, outPath);
  }
}

processAllSprites().catch(console.error);
