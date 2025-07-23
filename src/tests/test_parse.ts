// Quick test script to verify form parsing
import { normalizeMoveString } from '../utils/stringNormalizer/stringNormalizer.ts';

// Helper function to extract base Pokemon name and form from evos_attacks entries
function parseFormName(pokemonName: string): { baseName: string; formName: string | null } {
  // Handle patterns like TyphlosionHisuian, TyphlosionPlain, MrMimeGalarian, etc.
  const formPatterns = [
    { suffix: 'Plain', form: null }, // Plain forms are considered base forms
    { suffix: 'Hisuian', form: 'hisuian' },
    { suffix: 'Galarian', form: 'galarian' },
    { suffix: 'Alolan', form: 'alolan' },
    { suffix: 'Paldean', form: 'paldean' },
    { suffix: 'PaldeanFire', form: 'paldean-fire' },
    { suffix: 'PaldeanWater', form: 'paldean-water' },
    { suffix: 'Armored', form: 'armored' },
    { suffix: 'BloodMoon', form: 'bloodmoon' },
  ];

  for (const pattern of formPatterns) {
    if (pokemonName.endsWith(pattern.suffix)) {
      const baseName = pokemonName.slice(0, -pattern.suffix.length);
      return { baseName: normalizeMoveString(baseName), formName: pattern.form };
    }
  }

  // No form pattern found, treat as base form
  return { baseName: normalizeMoveString(pokemonName), formName: null };
}

console.log('Testing TyphlosionHisuian:', parseFormName('TyphlosionHisuian'));
console.log('Testing TyphlosionPlain:', parseFormName('TyphlosionPlain'));
console.log('Testing MrMimeGalarian:', parseFormName('MrMimeGalarian'));
