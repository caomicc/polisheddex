#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getVariants,
  hasVariants,
  normalizePokemonNameForConstants,
} from '../src/data/pokemonVariants.ts';
import { formTypeMap } from '../src/data/constants.ts';
import { toTitleCase } from '../src/utils/stringUtils.ts';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// fix types
interface PokemonData {
  name?: string;
  nationalDex?: number;
  johtoDex?: number;
  types?: string | string[];
  faithfulTypes?: string | string[];
  updatedTypes?: string | string[];
  moves?: any[];
  faithfulMoves?: any[];
  updatedMoves?: any[];
  evolution?: any;
  detailedStats?: any;
  forms?: Record<string, FormData> | string[];
  locations?: any[];
  [key: string]: any;
}

interface FormData {
  name: string;
  types?: string | string[];
  faithfulTypes?: string | string[];
  updatedTypes?: string | string[];
  abilities?: any[];
  faithfulAbilities?: any[];
  updatedAbilities?: any[];
  baseStats?: Record<string, number>;
  faithfulBaseStats?: Record<string, number>;
  updatedBaseStats?: Record<string, number>;
  moves?: any[];
  faithfulMoves?: any[];
  updatedMoves?: any[];
  locations?: any[];
}

function normalizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to get form-specific types or fallback to base types
function getFormTypes(
  pokemonKey: string,
  variant: string,
  pokemonData: PokemonData,
  typeField: 'types' | 'faithfulTypes' | 'updatedTypes',
): string | string[] {
  // Convert pokemonKey to the format used in formTypeMap
  const baseTypeName = toTitleCase(pokemonKey);
  const formName = variant.toLowerCase();

  // Check if form-specific types exist
  if (formTypeMap[baseTypeName] && formTypeMap[baseTypeName][formName]) {
    const formTypes = formTypeMap[baseTypeName][formName];

    // Map the type field to the corresponding form type field
    let formTypeData: string[];
    if (typeField === 'types' || typeField === 'faithfulTypes') {
      formTypeData = formTypes.types || ['None'];
    } else {
      // updatedTypes
      formTypeData = formTypes.updatedTypes || ['None'];
    }

    // Filter out 'None' types and format
    const filteredTypes = formTypeData.filter((t) => t !== 'None');
    if (filteredTypes.length === 0) {
      return 'Unknown';
    } else if (filteredTypes.length === 1) {
      return filteredTypes[0];
    } else {
      return filteredTypes;
    }
  }

  // Fallback to base Pokemon types
  return pokemonData[typeField] || 'Unknown';
}

function generateFormObjects(
  pokemonKey: string,
  pokemonData: PokemonData,
  pokemonLocations: Record<string, { locations: any[] }>,
  levelMovesData: Record<string, any>,
): Record<string, FormData> {
  const normalizedConstantName = normalizePokemonNameForConstants(pokemonKey);
  const formsObject: Record<string, FormData> = {};

  // Check if this Pokemon has variants according to our constants
  if (hasVariants(normalizedConstantName)) {
    const variants = getVariants(normalizedConstantName);

    for (const variant of variants) {
      const formKey = variant.toLowerCase();

      // Check if form-specific data exists in detailed stats
      // This would be the case if the extraction process found separate base stats files
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const formSpecificKey = `${pokemonKey}_${variant}`;
      const hasFormSpecificData = checkForFormSpecificData(pokemonKey, variant);

      let formData: FormData;

      if (hasFormSpecificData) {
        // TODO: Extract form-specific data from the detailed stats
        // For now, use the parent data (this will be enhanced when extraction is updated)
        console.log(`🔍 Form-specific data needed for ${pokemonKey} ${variant}`);
        formData = createFormDataFromParent(
          pokemonKey,
          variant,
          pokemonData,
          pokemonLocations,
          levelMovesData,
        );
      } else {
        // Cosmetic form - inherits all parent data
        console.log(`🎨 Cosmetic form: ${pokemonKey} ${variant} inherits parent data`);
        formData = createFormDataFromParent(
          pokemonKey,
          variant,
          pokemonData,
          pokemonLocations,
          levelMovesData,
        );
      }

      formsObject[formKey] = formData;
    }
  } else {
    // Pokemon without variants gets a single "normal" form
    formsObject['plain'] = {
      name: 'plain',
      types: pokemonData.types,
      ...(pokemonData.faithfulTypes ? { faithfulTypes: pokemonData.faithfulTypes } : {}),
      ...(pokemonData.updatedTypes ? { updatedTypes: pokemonData.updatedTypes } : {}),
      moves: pokemonData.moves || [],
      ...(pokemonData.faithfulMoves ? { faithfulMoves: pokemonData.faithfulMoves } : {}),
      ...(pokemonData.updatedMoves ? { updatedMoves: pokemonData.updatedMoves } : {}),
    };

    // Add abilities and base stats for plain form
    if (pokemonData.detailedStats) {
      if (pokemonData.detailedStats.abilities) {
        formsObject['plain'].abilities = pokemonData.detailedStats.abilities;
      }
      if (pokemonData.detailedStats.faithfulAbilities) {
        formsObject['plain'].faithfulAbilities = pokemonData.detailedStats.faithfulAbilities;
      }
      if (pokemonData.detailedStats.updatedAbilities) {
        formsObject['plain'].updatedAbilities = pokemonData.detailedStats.updatedAbilities;
      }
      if (pokemonData.detailedStats.baseStats) {
        formsObject['plain'].baseStats = pokemonData.detailedStats.baseStats;
      }
      if (pokemonData.detailedStats.faithfulBaseStats) {
        formsObject['plain'].faithfulBaseStats = pokemonData.detailedStats.faithfulBaseStats;
      }
      if (pokemonData.detailedStats.updatedBaseStats) {
        formsObject['plain'].updatedBaseStats = pokemonData.detailedStats.updatedBaseStats;
      }
    }
  }

  return formsObject;
}

// Check if form-specific base stats files exist for this Pokemon form
function checkForFormSpecificData(pokemonKey: string, variant: string): boolean {
  // Check if form-specific base stats files exist
  const baseStatsDir = path.join(__dirname, '../polishedcrystal/data/pokemon/base_stats');
  const formFileName = `${pokemonKey.toLowerCase()}_${variant.toLowerCase()}.asm`;
  const formFilePath = path.join(baseStatsDir, formFileName);

  return fs.existsSync(formFilePath);
}

// Create form data from parent Pokemon data (for cosmetic forms or fallback)
function createFormDataFromParent(
  pokemonKey: string,
  variant: string,
  pokemonData: PokemonData,
  pokemonLocations: Record<string, { locations: any[] }>,
  levelMovesData?: Record<string, any>,
): FormData {
  const formKey = variant.toLowerCase();

  // Check if there are form-specific moves in the levelMovesData
  let formMoves = pokemonData.moves || [];
  let formFaithfulMoves = pokemonData.faithfulMoves;
  let formUpdatedMoves = pokemonData.updatedMoves;

  // Look for form-specific movesets in the level moves data
  if (levelMovesData && levelMovesData[pokemonKey] && levelMovesData[pokemonKey].forms) {
    const formSpecificMoves =
      levelMovesData[pokemonKey].forms[variant] || levelMovesData[pokemonKey].forms[formKey];
    if (formSpecificMoves) {
      console.log(`🎯 Found form-specific moves for ${pokemonKey} ${variant}`);
      if (formSpecificMoves.moves) formMoves = formSpecificMoves.moves;
      if (formSpecificMoves.faithfulMoves) formFaithfulMoves = formSpecificMoves.faithfulMoves;
      if (formSpecificMoves.updatedMoves) formUpdatedMoves = formSpecificMoves.updatedMoves;
    }
  }

  const formData: FormData = {
    name: variant,
    types: getFormTypes(pokemonKey, variant, pokemonData, 'types'),
    ...(pokemonData.faithfulTypes
      ? { faithfulTypes: getFormTypes(pokemonKey, variant, pokemonData, 'faithfulTypes') }
      : {}),
    ...(pokemonData.updatedTypes
      ? { updatedTypes: getFormTypes(pokemonKey, variant, pokemonData, 'updatedTypes') }
      : {}),
    moves: formMoves,
    ...(formFaithfulMoves ? { faithfulMoves: formFaithfulMoves } : {}),
    ...(formUpdatedMoves ? { updatedMoves: formUpdatedMoves } : {}),
  };

  // Add form-specific location data if available
  const formLocationKey = `${pokemonKey.toLowerCase()}_${formKey}`;
  const formLocationData = pokemonLocations[formLocationKey];
  if (formLocationData?.locations) {
    formData.locations = formLocationData.locations;
  }

  // Add abilities and base stats if available in detailedStats
  if (pokemonData.detailedStats) {
    if (pokemonData.detailedStats.abilities) {
      formData.abilities = pokemonData.detailedStats.abilities;
    }
    if (pokemonData.detailedStats.faithfulAbilities) {
      formData.faithfulAbilities = pokemonData.detailedStats.faithfulAbilities;
    }
    if (pokemonData.detailedStats.updatedAbilities) {
      formData.updatedAbilities = pokemonData.detailedStats.updatedAbilities;
    }
    if (pokemonData.detailedStats.baseStats) {
      formData.baseStats = pokemonData.detailedStats.baseStats;
    }
    if (pokemonData.detailedStats.faithfulBaseStats) {
      formData.faithfulBaseStats = pokemonData.detailedStats.faithfulBaseStats;
    }
    if (pokemonData.detailedStats.updatedBaseStats) {
      formData.updatedBaseStats = pokemonData.detailedStats.updatedBaseStats;
    }
  }

  return formData;
}

async function generateIndividualPokemonFiles(): Promise<void> {
  console.log('🔄 Generating individual Pokemon JSON files...');

  // Read the detailed stats file
  const detailedStatsPath = path.join(__dirname, '../output/pokemon_detailed_stats.json');
  const pokemonLocationPath = path.join(__dirname, '../output/pokemon_locations.json');

  // Also read the level moves output to get form-specific movesets
  const levelMovesPath = path.join(__dirname, '../output/pokemon_level_moves.json');

  if (!fs.existsSync(detailedStatsPath)) {
    console.error('❌ Detailed stats file not found:', detailedStatsPath);
    return;
  }

  const detailedStats: Record<string, PokemonData> = JSON.parse(
    fs.readFileSync(detailedStatsPath, 'utf8'),
  );

  // Read locations if available
  let pokemonLocations: Record<string, { locations: any[] }> = {};
  if (fs.existsSync(pokemonLocationPath)) {
    pokemonLocations = JSON.parse(fs.readFileSync(pokemonLocationPath, 'utf8'));
    console.log(`📍 Loaded location data for ${Object.keys(pokemonLocations).length} Pokemon`);
  }

  // Read level moves for form-specific movesets
  let levelMovesData: Record<string, any> = {};
  if (fs.existsSync(levelMovesPath)) {
    levelMovesData = JSON.parse(fs.readFileSync(levelMovesPath, 'utf8'));
    console.log(`⚔️ Loaded level moves data for ${Object.keys(levelMovesData).length} Pokemon`);
  }

  // Create output directory
  const outputDir = path.join(__dirname, '../output/pokemon');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let filesGenerated = 0;
  const pokemonIndex: Record<string, string> = {};

  for (const [pokemonKey, pokemonData] of Object.entries(detailedStats)) {
    try {
      // Create individual Pokemon file
      const fileName = normalizeFileName(pokemonKey);
      const filePath = path.join(outputDir, `${fileName}.json`);

      // Get location data for this Pokemon (try multiple key formats)
      const pokemonName = pokemonKey.toLowerCase();
      const locationData =
        pokemonLocations[pokemonName] || pokemonLocations[pokemonKey] || pokemonLocations[fileName];

      // Generate proper form objects
      const formsObject = generateFormObjects(
        pokemonKey,
        pokemonData,
        pokemonLocations,
        levelMovesData,
      );

      // Create the individual Pokemon data object
      const individualPokemonData: PokemonData = {
        name: pokemonKey,
        nationalDex: pokemonData.nationalDex,
        johtoDex: pokemonData.johtoDex,
        // types: pokemonData.types || 'Unknown',
        // ...(pokemonData.faithfulTypes ? { faithfulTypes: pokemonData.faithfulTypes } : {}),
        // ...(pokemonData.updatedTypes ? { updatedTypes: pokemonData.updatedTypes } : {}),
        // moves: pokemonData.moves || [],
        // ...(pokemonData.faithfulMoves ? { faithfulMoves: pokemonData.faithfulMoves } : {}),
        // ...(pokemonData.updatedMoves ? { updatedMoves: pokemonData.updatedMoves } : {}),
        evolution: pokemonData.evolution || null,
        ...(pokemonData.detailedStats ? { detailedStats: pokemonData.detailedStats } : {}),
        forms: formsObject,
        ...(locationData?.locations ? { locations: locationData.locations } : {}),
      };

      // Write the individual file
      fs.writeFileSync(filePath, JSON.stringify(individualPokemonData, null, 2));

      // Add to index
      pokemonIndex[fileName] = pokemonKey;

      filesGenerated++;

      if (filesGenerated % 50 === 0) {
        console.log(`📝 Generated ${filesGenerated} files...`);
      }
    } catch (error) {
      console.error(`❌ Error generating file for ${pokemonKey}:`, error);
    }
  }

  // Generate index file
  const indexPath = path.join(outputDir, '_index.json');
  fs.writeFileSync(indexPath, JSON.stringify(pokemonIndex, null, 2));

  console.log(`✅ Generated ${filesGenerated} individual Pokemon files`);
  console.log(`📁 Files saved to: ${outputDir}`);
  console.log(`📋 Index file saved to: ${indexPath}`);
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateIndividualPokemonFiles().catch(console.error);
}

export { generateIndividualPokemonFiles };
