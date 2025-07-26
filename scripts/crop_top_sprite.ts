import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const SPRITE_DIR = 'polishedcrystal/gfx/pokemon/';
const OUTPUT_DIR = 'public/sprites/pokemon/';
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

type ManifestEntry = {
  normal: string | null;
  shiny: string | null;
};

function loadPalette(palettePath: string): [number, number, number][] {
  const data = fs.readFileSync(palettePath);
  const palette: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 3) {
    palette.push([data[i], data[i + 1], data[i + 2]]);
  }
  return palette;
}

// async function autodetectAndColorizeSprite(
//   filePath: string,
//   outPath: string,
//   palette: [number, number, number][],
// ) {
//   const image = sharp(filePath);
//   const metadata = await image.metadata();
//   const { width, height } = metadata;
//   if (!width || !height) {
//     console.error(`DEBUG: Could not read image size for ${filePath}`);
//     return;
//   }

//   let spriteHeight = width;
//   for (let h = width; h <= height; h++) {
//     if (height % h === 0 && h <= width) {
//       spriteHeight = h;
//       break;
//     }
//   }

//   const croppedBuffer = await image
//     .extract({ left: 0, top: 0, width, height: spriteHeight })
//     .raw()
//     .toBuffer();

//   const colorized = Buffer.alloc(croppedBuffer.length * 4);
//   for (let i = 0; i < croppedBuffer.length; i++) {
//     const gray = croppedBuffer[i];
//     const colorIndex = Math.floor((gray / 255) * (palette.length - 1));
//     const [r, g, b] = palette[colorIndex];

//     colorized[i * 4 + 0] = r;
//     colorized[i * 4 + 1] = g;
//     colorized[i * 4 + 2] = b;
//     colorized[i * 4 + 3] = gray >= 250 ? 0 : 255;
//   }

//   await sharp(colorized, {
//     raw: {
//       width,
//       height: spriteHeight,
//       channels: 4,
//     },
//   })
//     .png()
//     .toFile(outPath);

//   console.log(`✅ Colorized sprite written: ${outPath}`);
// }

async function autodetectAndColorizeSprite(
  filePath: string,
  outPath: string,
  palette: [number, number, number][],
) {
  const image = sharp(filePath);
  const metadata = await image.metadata();
  const { width, height } = metadata;
  if (!width || !height) {
    console.error(`DEBUG: Could not read image size for ${filePath}`);
    return;
  }

  // Detect sprite height (assumes stacked frames or square image)
  let spriteHeight = width;
  for (let h = width; h <= height; h++) {
    if (height % h === 0 && h <= width) {
      spriteHeight = h;
      break;
    }
  }

  // Load the image as single-channel (indexed) grayscale
  const indexedBuffer = await image
    .extract({ left: 0, top: 0, width, height: spriteHeight })
    .removeAlpha()
    .ensureAlpha() // we'll override alpha manually
    .toColourspace('b-w')
    .raw()
    .toBuffer();

  // Allocate color RGBA buffer
  const output = Buffer.alloc(indexedBuffer.length * 4);

  for (let i = 0; i < indexedBuffer.length; i++) {
    const index = indexedBuffer[i] & 0x0f; // clamp to 0–15
    const [r, g, b] = palette[index] || [0, 0, 0]; // default to black if missing

    output[i * 4 + 0] = r;
    output[i * 4 + 1] = g;
    output[i * 4 + 2] = b;
    output[i * 4 + 3] = index === 0 ? 0 : 255; // Index 0 is transparent (background)
  }

  await sharp(output, {
    raw: {
      width,
      height: spriteHeight,
      channels: 4,
    },
  })
    .png()
    .toFile(outPath);

  console.log(`✅ GBC sprite colorized: ${outPath}`);
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
  const manifest: Record<string, ManifestEntry> = {};

  for (const filePath of files) {
    const relPath = path.relative(SPRITE_DIR, filePath).replace(/_plain/g, '');
    const outDir = path.join(OUTPUT_DIR, path.dirname(relPath));
    const name = path.dirname(relPath).replace(/\\/g, '/'); // Normalize path for manifest

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const spriteDir = path.dirname(filePath);
    const normalPalPath = path.join(spriteDir, 'normal.pal');
    const shinyPalPath = path.join(spriteDir, 'shiny.pal');

    const normalOutRel = path.join(name, 'front_color.png');
    const shinyOutRel = path.join(name, 'front_color_shiny.png');

    manifest[name] = {
      normal: fs.existsSync(normalPalPath) ? `sprites/pokemon/${normalOutRel}` : null,
      shiny: fs.existsSync(shinyPalPath) ? `sprites/pokemon/${shinyOutRel}` : null,
    };

    if (manifest[name].normal) {
      const palette = loadPalette(normalPalPath);
      await autodetectAndColorizeSprite(filePath, path.join(OUTPUT_DIR, normalOutRel), palette);
    }

    if (manifest[name].shiny) {
      const palette = loadPalette(shinyPalPath);
      await autodetectAndColorizeSprite(filePath, path.join(OUTPUT_DIR, shinyOutRel), palette);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`📦 Manifest written: ${MANIFEST_PATH}`);
}

processAllSprites().catch(console.error);
