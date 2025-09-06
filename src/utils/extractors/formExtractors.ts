import { KNOWN_FORMS } from '../../data/constants.ts';
import path from 'node:path';
import fs from 'node:fs';
import { toTitleCase } from '../stringUtils.ts';
import { fileURLToPath } from 'node:url';
import { HYPHENATED_POKEMON_NAMES } from '../pokemonUrlNormalizer.ts';
import { isDebugPokemon } from '../helpers.ts';

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of special Pokémon with hyphens in their base names

// --- Type Chart Extraction ---
export function extractTypeChart() {
  const matchupPath = path.join(__dirname, '../../../polishedcrystal/data/types/type_matchups.asm');
  const typeNamesPath = path.join(__dirname, '../../../polishedcrystal/data/types/names.asm');
  const outputPath = path.join(__dirname, '../../../output/type_chart.json');

  // Read type names in order
  const typeNamesRaw = fs.readFileSync(typeNamesPath, 'utf8');
  const typeLines = typeNamesRaw.split(/\r?\n/).filter((l) => l.trim().startsWith('dr '));
  const typeNames = typeLines.map((l) => l.replace('dr ', '').trim().toLowerCase());

  // Parse matchups
  const matchupRaw = fs.readFileSync(matchupPath, 'utf8');
  const lines = matchupRaw.split(/\r?\n/);
  const chart: Record<string, Record<string, number>> = {};
  for (const t of typeNames) chart[t] = {};

  const effectMap: Record<string, number> = {
    SUPER_EFFECTIVE: 2,
    NOT_VERY_EFFECTIVE: 0.5,
    NO_EFFECT: 0,
  };

  for (const line of lines) {
    const m = line.match(/db ([A-Z_]+),\s*([A-Z_]+),\s*([A-Z_]+)/);
    if (m) {
      // eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
      let [_, atk, def, eff] = m;
      atk = atk.toLowerCase();
      def = def.toLowerCase();
      const effVal = effectMap[eff] ?? 1;
      if (!chart[atk]) chart[atk] = {};
      chart[atk][def] = effVal;
    }
  }
  fs.writeFileSync(outputPath, JSON.stringify(chart, null, 2));
  // console.log('Type chart extracted to', outputPath);
}

// Helper function to extract form and base name information from a file name
export function extractFormInfo(fileName: string): {
  basePokemonName: string;
  formName: string | null;
} {
  // Special case for mr__rime (separate Pokémon, not a form)
  if (fileName.toLowerCase() === 'mr__rime') {
    return { basePokemonName: 'mr-rime', formName: null };
  }

  // Special case for porygon_z (separate Pokémon, not a form)
  if (fileName.toLowerCase() === 'porygon_z') {
    return { basePokemonName: 'porygon-z', formName: null };
  }

  // Special case for farfetch_d and sirfetch_d
  if (
    fileName.toLowerCase().startsWith('farfetch_d') ||
    fileName.toLowerCase().startsWith('sirfetch_d')
  ) {
    // For these special cases, properly identify the base name and form
    // farfetch_d_plain -> baseName: farfetch-d, form: plain
    // farfetch_d_galarian -> baseName: farfetch-d, form: galarian
    const baseMatch = fileName
      .toLowerCase()
      .match(/^(farfetch_d|sirfetch_d|pikachu|arbok|unown)(?:_([a-z_]+))?$/);

    if (baseMatch) {
      const baseName = baseMatch[1].replace('_', '-'); // Convert to hyphenated format
      const formPart = baseMatch[2] || null;

      const isDebug = isDebugPokemon(baseName);

      if (isDebug) {
        console.log(
          `DEBUG: Processing special case for fileName: ${fileName}, baseMatch:`,
          baseMatch,
          `baseName: ${baseName}, formPart: ${formPart}`,
        );
      }
      if (isDebug) {
        console.log(
          `DEBUG: Special case detected: ${fileName} -> baseName: ${baseName}, formPart: ${formPart}`,
          {
            baseName: baseName,
            formPart: formPart,
          },
        );
      }

      // Map form name to the standardized form value from KNOWN_FORMS
      let formName = null;
      if (formPart === 'plain') {
        formName = null;
      } else if (formPart === 'galarian') {
        formName = KNOWN_FORMS.GALARIAN;
      } else if (formPart === 'alolan') {
        formName = KNOWN_FORMS.ALOLAN;
      } else if (formPart === 'hisuian') {
        formName = KNOWN_FORMS.HISUIAN;
      } else if (formPart === 'paldean') {
        formName = KNOWN_FORMS.PALDEAN;
      } else if (formPart === 'paldean_fire') {
        formName = KNOWN_FORMS.PALDEAN_FIRE;
      } else if (formPart === 'paldean_water') {
        formName = KNOWN_FORMS.PALDEAN_WATER;
      } else if (formPart === 'armored') {
        formName = KNOWN_FORMS.ARMORED;
      } else if (formPart === 'bloodmoon') {
        formName = KNOWN_FORMS.BLOODMOON;
      } else if (formPart === 'flying') {
        formName = KNOWN_FORMS.PIKACHU_FLY_FORM;
      } else if (formPart === 'surfing') {
        formName = KNOWN_FORMS.PIKACHU_SURF_FORM;
      } else if (formPart === 'red') {
        formName = KNOWN_FORMS.PIKACHU_RED_FORM;
      } else if (formPart === 'yellow') {
        formName = KNOWN_FORMS.PIKACHU_YELLOW_FORM;
      } else if (formPart === 'spark') {
        formName = KNOWN_FORMS.PIKACHU_SPARK_FORM;
      } else if (formPart === 'johto') {
        formName = KNOWN_FORMS.ARBOK_JOHTO_FORM;
      } else if (formPart === 'kanto') {
        formName = KNOWN_FORMS.ARBOK_KANTO_FORM;
      } else if (formPart === 'koga') {
        formName = KNOWN_FORMS.ARBOK_KOGA_FORM;
      } else if (formPart === 'agatha') {
        formName = KNOWN_FORMS.ARBOK_AGATHA_FORM;
      } else if (formPart === 'ariana') {
        formName = KNOWN_FORMS.ARBOK_ARIANA_FORM;
      } else if (formPart) {
        formName = formPart;
      }

      if (isDebug) {
        console.log(`DEBUG: Extracted formName: ${formName}`);
      }

      console.log(
        `Special case detected: ${fileName} -> baseName: ${baseName}, formName: ${formName}`,
      );
      return {
        basePokemonName: toTitleCase(baseName).trimEnd(),
        formName: formName,
      };
    }
  }

  if (fileName.toLowerCase().startsWith('tauros')) {
    const baseMatch = fileName.toLowerCase().match(/^(tauros)(?:_([a-z_]+))?$/);
    console.log(`Processing Tauros fileName: ${fileName}, baseMatch:`, baseMatch);

    if (baseMatch) {
      const baseName = baseMatch[1].replace('_', '-'); // Convert to hyphenated format
      const formPart = baseMatch[2] || null;

      const isDebug = isDebugPokemon(baseName);

      if (isDebug) {
        console.log(
          `DEBUG: Processing special case for fileName: ${fileName}, baseMatch:`,
          baseMatch,
          `baseName: ${baseName}, formPart: ${formPart}`,
        );
      }
      if (isDebug) {
        console.log(
          `DEBUG: Special case detected: ${fileName} -> baseName: ${baseName}, formPart: ${formPart}`,
          {
            baseName: baseName,
            formPart: formPart,
          },
        );
      }

      // Map form name to the standardized form value from KNOWN_FORMS
      let formName = null;
      if (formPart === 'plain') {
        formName = null;
        // } else if (formPart === 'galarian') {
        //   formName = KNOWN_FORMS.GALARIAN;
        // } else if (formPart === 'alolan') {
        //   formName = KNOWN_FORMS.ALOLAN;
        // } else if (formPart === 'hisuian') {
        // formName = KNOWN_FORMS.HISUIAN;
      } else if (formPart === 'paldean') {
        formName = KNOWN_FORMS.PALDEAN;
      } else if (formPart === 'paldean_fire') {
        formName = KNOWN_FORMS.PALDEAN_FIRE;
      } else if (formPart === 'paldean_water') {
        formName = KNOWN_FORMS.PALDEAN_WATER;
        // } else if (formPart === 'armored') {
        //   formName = KNOWN_FORMS.ARMORED;
        // } else if (formPart === 'bloodmoon') {
        //   formName = KNOWN_FORMS.BLOODMOON;
      } else if (formPart) {
        formName = formPart;
      }

      if (isDebug) {
        console.log(`DEBUG: Extracted formName: ${formName}`);
      }

      console.log(
        `Special case detected: ${fileName} -> baseName: ${baseName}, formName: ${formName}`,
      );
      return {
        basePokemonName: toTitleCase(baseName).trimEnd(),
        formName: formName,
      };
    }
  }
  // Check if the filename is a special hyphenated Pokémon name
  const normalizedFileName = fileName.toLowerCase();

  // Special case for porygon_z to avoid treating it as porygon with form Z
  if (normalizedFileName === 'porygon_z') {
    return {
      basePokemonName: 'porygon-z',
      formName: null,
    };
  }

  if (HYPHENATED_POKEMON_NAMES.includes(normalizedFileName)) {
    return {
      basePokemonName: toTitleCase(normalizedFileName).trimEnd(),
      formName: null,
    };
  }

  // Form indicators in filenames
  const formPatterns = [
    // Place special forms before plain to ensure correct matching
    { pattern: /_alolan$/, formName: KNOWN_FORMS.ALOLAN },
    { pattern: /_galarian$/, formName: KNOWN_FORMS.GALARIAN },
    { pattern: /_hisuian$/, formName: KNOWN_FORMS.HISUIAN },
    { pattern: /_paldean_fire$/, formName: KNOWN_FORMS.PALDEAN_FIRE },
    { pattern: /_paldean_water$/, formName: KNOWN_FORMS.PALDEAN_WATER },
    { pattern: /_paldean$/, formName: KNOWN_FORMS.PALDEAN },
    { pattern: /_armored$/, formName: KNOWN_FORMS.ARMORED },
    { pattern: /_bloodmoon$/, formName: KNOWN_FORMS.BLOODMOON },
    { pattern: /_flying$/, formName: KNOWN_FORMS.PIKACHU_FLY_FORM },
    { pattern: /_surfing$/, formName: KNOWN_FORMS.PIKACHU_SURF_FORM },
    { pattern: /_red$/, formName: KNOWN_FORMS.PIKACHU_RED_FORM },
    { pattern: /_yellow$/, formName: KNOWN_FORMS.PIKACHU_YELLOW_FORM },
    { pattern: /_spark$/, formName: KNOWN_FORMS.PIKACHU_SPARK_FORM },
    // Place special forms before plain to ensure correct matching
    // Support both underscore and hyphen format in file names
    { pattern: /_paldean_water$|[-]paldean[-]water$/, formName: KNOWN_FORMS.PALDEAN_WATER },
    { pattern: /_paldean_fire$|[-]paldean[-]fire$/, formName: KNOWN_FORMS.PALDEAN_FIRE },
    { pattern: /_alolan$|[-]alolan$/, formName: KNOWN_FORMS.ALOLAN },
    { pattern: /_galarian$|[-]galarian$/, formName: KNOWN_FORMS.GALARIAN },
    { pattern: /_hisuian$|[-]hisuian$/, formName: KNOWN_FORMS.HISUIAN },
    { pattern: /_paldean$|[-]paldean$/, formName: KNOWN_FORMS.PALDEAN },
    { pattern: /_armored$|[-]armored$/, formName: KNOWN_FORMS.ARMORED },
    { pattern: /_bloodmoon$|[-]bloodmoon$/, formName: KNOWN_FORMS.BLOODMOON },
    { pattern: /_flying$|[-]flying$/, formName: KNOWN_FORMS.PIKACHU_FLY_FORM },
    { pattern: /_surfing$|[-]surfing$/, formName: KNOWN_FORMS.PIKACHU_SURF_FORM },
    { pattern: /_red$|[-]red$/, formName: KNOWN_FORMS.PIKACHU_RED_FORM },
    { pattern: /_yellow$|[-]yellow$/, formName: KNOWN_FORMS.PIKACHU_YELLOW_FORM },
    { pattern: /_spark$|[-]spark$/, formName: KNOWN_FORMS.PIKACHU_SPARK_FORM },
    { pattern: /_plain$|[-]plain$/, formName: null }, // Plain forms should be base forms without form suffix
  ];

  let basePokemonName = fileName;
  let formName = null;

  for (const { pattern, formName: patternFormName } of formPatterns) {
    console.log(
      `Checking fileName ${fileName} against pattern ${pattern} for form ${patternFormName}`,
    );
    

    if (pattern.test(fileName)) {
      // Remove the form pattern from the file name to get base name
      basePokemonName = fileName.replace(pattern, '');
      console.log(`Matched form ${patternFormName} for base name ${basePokemonName}`);
      formName = patternFormName;
      console.log(`Extracted formName: ${formName}`);
      break;
    }
  }

  const finalBaseName = toTitleCase(basePokemonName).trimEnd();
  const finalFormName = formName ? formName.trimEnd() : null;
  
  console.log(`Final basePokemonName: ${finalBaseName}, formName:`, {
    basePokemonName: finalBaseName,
    formName: finalFormName,
  });
  
  console.log(`🎯 FORM EXTRACTION RETURNING: basePokemonName="${finalBaseName}", formName="${finalFormName}" (from file: ${fileName})`);

  return {
    basePokemonName: finalBaseName,
    formName: finalFormName,
  };
}

// /**
//  * Creates individual Pikachu form data based on the ROM constants
//  * Pikachu forms: FLY_FORM, SURF_FORM, RED_FORM, YELLOW_FORM, SPARK_FORM
//  */
// export function createPikachuFormVariants(basePikachuData: any): any[] {
//   if (!basePikachuData || basePikachuData.name !== 'pikachu') {
//     return [basePikachuData];
//   }

//   const variants = [];

//   // Base Pikachu (default form)
//   variants.push({
//     ...basePikachuData,
//     formName: null,
//     displayName: 'Pikachu',
//   });

//   // Flying Pikachu (PIKACHU_FLY_FORM)
//   const flyingPikachu = {
//     ...basePikachuData,
//     formName: KNOWN_FORMS.PIKACHU_FLY_FORM,
//     displayName: 'Pikachu (Flying)',
//     specialMoves: ['Fly'],
//     frontSpriteUrl: `/sprites/pokemon/pikachu/pikachu_fly_form_front_cropped.png`,
//   };
//   variants.push(flyingPikachu);

//   // Surfing Pikachu (PIKACHU_SURF_FORM)
//   const surfingPikachu = {
//     ...basePikachuData,
//     formName: KNOWN_FORMS.PIKACHU_SURF_FORM,
//     displayName: 'Pikachu (Surfing)',
//     specialMoves: ['Surf'],
//     frontSpriteUrl: `/sprites/pokemon/pikachu/pikachu_surf_form_front_cropped.png`,
//   };
//   variants.push(surfingPikachu);

//   // Red Pikachu (PIKACHU_RED_FORM)
//   const redPikachu = {
//     ...basePikachuData,
//     formName: KNOWN_FORMS.PIKACHU_RED_FORM,
//     displayName: 'Pikachu (Red)',
//     frontSpriteUrl: `/sprites/pokemon/pikachu/pikachu_red_form_front_cropped.png`,
//   };
//   variants.push(redPikachu);

//   // Yellow Pikachu (PIKACHU_YELLOW_FORM)
//   const yellowPikachu = {
//     ...basePikachuData,
//     formName: KNOWN_FORMS.PIKACHU_YELLOW_FORM,
//     displayName: 'Pikachu (Yellow)',
//     frontSpriteUrl: `/sprites/pokemon/pikachu/pikachu_yellow_form_front_cropped.png`,
//   };
//   variants.push(yellowPikachu);

//   // Spark Pikachu (PIKACHU_SPARK_FORM)
//   const sparkPikachu = {
//     ...basePikachuData,
//     formName: KNOWN_FORMS.PIKACHU_SPARK_FORM,
//     displayName: 'Pikachu (Spark)',
//     frontSpriteUrl: `/sprites/pokemon/pikachu/pikachu_spark_form_front_cropped.png`,
//   };
//   variants.push(sparkPikachu);

//   return variants;
// }

// /**
//  * Checks if a Pokemon should have form variants created
//  */
// export function shouldCreateFormVariants(pokemonName: string): boolean {
//   return pokemonName === 'Pikachu';
// }
