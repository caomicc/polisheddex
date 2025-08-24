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

// Helper to merge wild encounters with gift and legendary locations
function mergeLocationData(
  wildLocations: any[] | undefined,
  giftLocations: any[] | undefined,
  legendaryLocations: any[] | undefined,
): any[] {
  const merged: any[] = [];

  // Add existing wild encounter locations
  if (wildLocations) {
    merged.push(...wildLocations);
  }

  // Add gift locations with proper structure
  if (giftLocations) {
    for (const gift of giftLocations) {
      merged.push({
        area: gift.location,
        method: 'gift',
        npc: gift.npc,
        conditions: gift.conditions,
        ...(gift.level && { level: gift.level }),
      });
    }
  }

  // Add legendary locations
  if (legendaryLocations) {
    merged.push(...legendaryLocations);
  }

  return merged;
}

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
  polishedBaseStats?: Record<string, number>;
  moves?: any[];
  faithfulMoves?: any[];
  updatedMoves?: any[];
  eggMoves?: string[];
  tmHmMoves?: any[];
  locations?: any[];
  catchRate?: number;
  baseExp?: number;
  heldItems?: string[];
  genderRatio?: { male: number; female: number };
  hatchRate?: string;
  growthRate?: string;
  eggGroups?: string[];
  evYield?: string;
}

function normalizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to add descriptions to abilities
function addAbilityDescriptions(
  abilities: any[],
  abilityDescriptionsData: Record<string, { description: string }>,
): any[] {
  if (!abilities || !abilityDescriptionsData) return abilities;

  return abilities.map((ability) => {
    if (ability.id && abilityDescriptionsData[ability.id]) {
      return {
        ...ability,
        description: abilityDescriptionsData[ability.id].description || ability.description || '',
      };
    }
    return ability;
  });
}

// Helper function to normalize types to always be an array
function normalizeTypes(types: string | string[] | undefined): string[] {
  if (!types) return [];
  if (typeof types === 'string') {
    return [types];
  }
  if (Array.isArray(types)) {
    return types;
  }
  return [];
}

// Helper function to get form-specific types or fallback to base types
function getFormTypes(
  pokemonKey: string,
  variant: string,
  pokemonData: PokemonData,
  typeField: 'types' | 'faithfulTypes' | 'updatedTypes',
): string[] {
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
      return ['Unknown'];
    } else {
      return filteredTypes;
    }
  }

  // Fallback to base Pokemon types, normalize to array
  return normalizeTypes(pokemonData[typeField]) || ['Unknown'];
}

function generateFormObjects(
  pokemonKey: string,
  pokemonData: PokemonData,
  pokemonLocations: Record<string, { locations: any[] }>,
  giftLocations: Record<string, any[]>,
  legendaryLocations: Record<string, any[]>,
  levelMovesData: Record<string, any>,
  eggMovesData: Record<string, string[]>,
  tmHmLearnsetData: Record<string, any[]>,
  abilityDescriptionsData: Record<string, { description: string }>,
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
          giftLocations,
          legendaryLocations,
          levelMovesData,
          eggMovesData,
          tmHmLearnsetData,
          abilityDescriptionsData,
        );
      } else {
        // Cosmetic form - inherits all parent data
        console.log(`🎨 Cosmetic form: ${pokemonKey} ${variant} inherits parent data`);
        formData = createFormDataFromParent(
          pokemonKey,
          variant,
          pokemonData,
          pokemonLocations,
          giftLocations,
          legendaryLocations,
          levelMovesData,
          eggMovesData,
          tmHmLearnsetData,
          abilityDescriptionsData,
        );
      }

      formsObject[formKey] = formData;
    }
  } else {
    // Pokemon without variants gets a single "normal" form
    formsObject['plain'] = {
      name: 'plain',
      types: normalizeTypes(pokemonData.types),
      ...(pokemonData.faithfulTypes
        ? { faithfulTypes: normalizeTypes(pokemonData.faithfulTypes) }
        : {}),
      ...(pokemonData.updatedTypes
        ? { updatedTypes: normalizeTypes(pokemonData.updatedTypes) }
        : {}),
      moves: pokemonData.moves || [],
      ...(pokemonData.faithfulMoves ? { faithfulMoves: pokemonData.faithfulMoves } : {}),
      ...(pokemonData.updatedMoves ? { updatedMoves: pokemonData.updatedMoves } : {}),
    };

    // Add abilities and base stats for plain form
    if (pokemonData.detailedStats) {
      if (pokemonData.detailedStats.abilities) {
        formsObject['plain'].abilities = addAbilityDescriptions(
          pokemonData.detailedStats.abilities,
          abilityDescriptionsData,
        );
      }
      if (pokemonData.detailedStats.faithfulAbilities) {
        formsObject['plain'].faithfulAbilities = addAbilityDescriptions(
          pokemonData.detailedStats.faithfulAbilities,
          abilityDescriptionsData,
        );
      }
      if (pokemonData.detailedStats.updatedAbilities) {
        formsObject['plain'].updatedAbilities = addAbilityDescriptions(
          pokemonData.detailedStats.updatedAbilities,
          abilityDescriptionsData,
        );
      }
      if (pokemonData.detailedStats.baseStats) {
        formsObject['plain'].baseStats = pokemonData.detailedStats.baseStats;
      }
      if (pokemonData.detailedStats.faithfulBaseStats) {
        formsObject['plain'].faithfulBaseStats = pokemonData.detailedStats.faithfulBaseStats;
      }
      if (pokemonData.detailedStats.polishedBaseStats) {
        formsObject['plain'].polishedBaseStats = pokemonData.detailedStats.polishedBaseStats;
      }

      // Add shared fields that the frontend expects to be available in form data
      if (pokemonData.detailedStats.catchRate) {
        formsObject['plain'].catchRate = pokemonData.detailedStats.catchRate;
      }
      if (pokemonData.detailedStats.baseExp) {
        formsObject['plain'].baseExp = pokemonData.detailedStats.baseExp;
      }
      if (pokemonData.detailedStats.heldItems) {
        formsObject['plain'].heldItems = pokemonData.detailedStats.heldItems;
      }
      if (pokemonData.detailedStats.genderRatio) {
        formsObject['plain'].genderRatio = pokemonData.detailedStats.genderRatio;
      }
      if (pokemonData.detailedStats.hatchRate) {
        formsObject['plain'].hatchRate = pokemonData.detailedStats.hatchRate;
      }
      if (pokemonData.detailedStats.growthRate) {
        formsObject['plain'].growthRate = pokemonData.detailedStats.growthRate;
      }
      if (pokemonData.detailedStats.eggGroups) {
        formsObject['plain'].eggGroups = pokemonData.detailedStats.eggGroups;
      }
      if (pokemonData.detailedStats.evYield) {
        formsObject['plain'].evYield = pokemonData.detailedStats.evYield;
      }
    }

    // Add egg moves and TM/HM data for plain form
    if (eggMovesData) {
      const pokemonNameLower = pokemonKey.toLowerCase();
      const eggMoves = eggMovesData[pokemonNameLower] || [];
      if (eggMoves.length > 0) {
        formsObject['plain'].eggMoves = eggMoves;
      }
    }

    if (tmHmLearnsetData) {
      const pokemonNameLower = pokemonKey.toLowerCase();
      const tmHmMoves = tmHmLearnsetData[pokemonNameLower] || [];
      if (tmHmMoves.length > 0) {
        formsObject['plain'].tmHmMoves = tmHmMoves;
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

// Extract form-specific base stats from ROM file
function extractFormSpecificBaseStats(
  pokemonKey: string,
  variant: string,
): {
  baseStats?: Record<string, number>;
  faithfulBaseStats?: Record<string, number>;
  polishedBaseStats?: Record<string, number>;
  types?: string[];
  faithfulTypes?: string[];
  updatedTypes?: string[];
} | null {
  try {
    const baseStatsDir = path.join(__dirname, '../polishedcrystal/data/pokemon/base_stats');
    const formFileName = `${pokemonKey.toLowerCase()}_${variant.toLowerCase()}.asm`;
    const formFilePath = path.join(baseStatsDir, formFileName);

    if (!fs.existsSync(formFilePath)) {
      return null;
    }

    const content = fs.readFileSync(formFilePath, 'utf8');
    const lines = content.split('\n');

    let baseStats: Record<string, number> | undefined;
    let faithfulTypes: string[] | undefined;
    let polishedTypes: string[] | undefined;
    let insideFaithfulBlock: boolean | null = null;

    // Helper function to format ROM type names
    const formatType = (romType: string) => {
      return romType
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Parse the base stats line (first line with stats)
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // Parse base stats: db  90,  85, 100,  85,  95, 125 ; 580 BST
      if (
        trimmed.startsWith('db ') &&
        trimmed.includes(',') &&
        trimmed.includes(';') &&
        trimmed.includes('BST')
      ) {
        const statsMatch = trimmed.match(/db\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)/);
        if (statsMatch) {
          const [, hp, atk, def, spe, sat, sdf] = statsMatch.map(Number);
          const total = hp + atk + def + spe + sat + sdf;
          baseStats = {
            hp,
            attack: atk,
            defense: def,
            speed: spe,
            specialAttack: sat,
            specialDefense: sdf,
            total,
          };
        }
      }

      // Check for conditional blocks
      else if (trimmed.startsWith('if DEF(FAITHFUL)')) {
        insideFaithfulBlock = true;
      } else if (trimmed === 'else' && insideFaithfulBlock !== null) {
        insideFaithfulBlock = false; // Now in polished block
      } else if (trimmed === 'endc') {
        insideFaithfulBlock = null; // Exit conditional block
      }

      // Parse types: db FIRE, FIRE ; type or db FIRE, GROUND ; type
      else if (
        trimmed.startsWith('db ') &&
        trimmed.includes(';') &&
        trimmed.toLowerCase().includes('type')
      ) {
        const typesMatch = trimmed.match(/db\s+([A-Z_]+),\s*([A-Z_]+)/);
        if (typesMatch) {
          const [, type1, type2] = typesMatch;
          const formattedType1 = formatType(type1);
          const formattedType2 = formatType(type2);

          const typeArray =
            formattedType1 === formattedType2 ? [formattedType1] : [formattedType1, formattedType2];

          if (insideFaithfulBlock === true) {
            faithfulTypes = typeArray;
          } else if (insideFaithfulBlock === false) {
            polishedTypes = typeArray;
          } else {
            // Not in a conditional block, use for both
            faithfulTypes = typeArray;
            polishedTypes = typeArray;
          }
        }
      }
    }

    if (baseStats || faithfulTypes || polishedTypes) {
      return {
        ...(baseStats
          ? {
              baseStats,
              faithfulBaseStats: baseStats,
              polishedBaseStats: baseStats,
            }
          : {}),
        ...(faithfulTypes || polishedTypes
          ? {
              types: polishedTypes || faithfulTypes || [],
              faithfulTypes: faithfulTypes || polishedTypes || [],
              updatedTypes: polishedTypes || faithfulTypes || [],
            }
          : {}),
      };
    }

    return null;
  } catch (error) {
    console.warn(`Error extracting form-specific data for ${pokemonKey}_${variant}:`, error);
    return null;
  }
}

// Create form data from parent Pokemon data (for cosmetic forms or fallback)
function createFormDataFromParent(
  pokemonKey: string,
  variant: string,
  pokemonData: PokemonData,
  pokemonLocations: Record<string, { locations: any[] }>,
  giftLocations: Record<string, any[]>,
  legendaryLocations: Record<string, any[]>,
  levelMovesData?: Record<string, any>,
  eggMovesData?: Record<string, string[]>,
  tmHmLearnsetData?: Record<string, any[]>,
  abilityDescriptionsData?: Record<string, { description: string }>,
): FormData {
  const formKey = variant.toLowerCase();

  // Extract form-specific data from ROM file if available
  const formSpecificData = extractFormSpecificBaseStats(pokemonKey, variant);
  if (formSpecificData) {
    console.log(`📊 Found form-specific data for ${pokemonKey} ${variant}:`, {
      hasBaseStats: !!formSpecificData.baseStats,
      hasTypes: !!formSpecificData.types,
      types: formSpecificData.types,
    });
  }

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
    // Use form-specific types if available, otherwise use parent data (normalize to ensure arrays)
    types:
      normalizeTypes(formSpecificData?.types) ||
      getFormTypes(pokemonKey, variant, pokemonData, 'types'),
    ...(pokemonData.faithfulTypes || formSpecificData?.faithfulTypes
      ? {
          faithfulTypes:
            normalizeTypes(formSpecificData?.faithfulTypes) ||
            getFormTypes(pokemonKey, variant, pokemonData, 'faithfulTypes'),
        }
      : {}),
    ...(pokemonData.updatedTypes || formSpecificData?.updatedTypes
      ? {
          updatedTypes:
            normalizeTypes(formSpecificData?.updatedTypes) ||
            getFormTypes(pokemonKey, variant, pokemonData, 'updatedTypes'),
        }
      : {}),
    moves: formMoves,
    ...(formFaithfulMoves ? { faithfulMoves: formFaithfulMoves } : {}),
    ...(formUpdatedMoves ? { updatedMoves: formUpdatedMoves } : {}),
  };

  // Add egg moves and TM/HM data if available
  if (eggMovesData) {
    const pokemonNameLower = pokemonKey.toLowerCase();
    const eggMoves = eggMovesData[pokemonNameLower] || [];
    if (eggMoves.length > 0) {
      formData.eggMoves = eggMoves;
    }
  }

  if (tmHmLearnsetData) {
    const pokemonNameLower = pokemonKey.toLowerCase();
    const tmHmMoves = tmHmLearnsetData[pokemonNameLower] || [];
    if (tmHmMoves.length > 0) {
      formData.tmHmMoves = tmHmMoves;
    }
  }

  // Add form-specific location data if available
  const formLocationKey = `${pokemonKey.toLowerCase()}_${formKey}`;
  const formLocationData = pokemonLocations[formLocationKey];
  const formGiftData =
    giftLocations[formLocationKey.toLowerCase()] || giftLocations[pokemonKey.toLowerCase()];
  const formLegendaryData =
    legendaryLocations[formLocationKey.toLowerCase()] ||
    legendaryLocations[pokemonKey.toLowerCase()];

  if (formLocationData?.locations || formGiftData || formLegendaryData) {
    formData.locations = mergeLocationData(
      formLocationData?.locations,
      formGiftData,
      formLegendaryData,
    );
  }

  // Add abilities and base stats if available in detailedStats
  if (pokemonData.detailedStats) {
    if (pokemonData.detailedStats.abilities) {
      formData.abilities = addAbilityDescriptions(
        pokemonData.detailedStats.abilities,
        abilityDescriptionsData || {},
      );
    }
    if (pokemonData.detailedStats.faithfulAbilities) {
      formData.faithfulAbilities = addAbilityDescriptions(
        pokemonData.detailedStats.faithfulAbilities,
        abilityDescriptionsData || {},
      );
    }
    if (pokemonData.detailedStats.updatedAbilities) {
      formData.updatedAbilities = addAbilityDescriptions(
        pokemonData.detailedStats.updatedAbilities,
        abilityDescriptionsData || {},
      );
    }

    // Use form-specific base stats if available, otherwise use parent stats
    if (formSpecificData?.baseStats || pokemonData.detailedStats.baseStats) {
      formData.baseStats = formSpecificData?.baseStats || pokemonData.detailedStats.baseStats;
    }
    if (formSpecificData?.faithfulBaseStats || pokemonData.detailedStats.faithfulBaseStats) {
      formData.faithfulBaseStats =
        formSpecificData?.faithfulBaseStats || pokemonData.detailedStats.faithfulBaseStats;
    }
    if (formSpecificData?.polishedBaseStats || pokemonData.detailedStats.polishedBaseStats) {
      formData.polishedBaseStats =
        formSpecificData?.polishedBaseStats || pokemonData.detailedStats.polishedBaseStats;
    }
    // Add shared fields that the frontend expects to be available in form data
    if (pokemonData.detailedStats.catchRate) {
      formData.catchRate = pokemonData.detailedStats.catchRate;
    }
    if (pokemonData.detailedStats.baseExp) {
      formData.baseExp = pokemonData.detailedStats.baseExp;
    }
    if (pokemonData.detailedStats.heldItems) {
      formData.heldItems = pokemonData.detailedStats.heldItems;
    }
    if (pokemonData.detailedStats.genderRatio) {
      formData.genderRatio = pokemonData.detailedStats.genderRatio;
    }
    if (pokemonData.detailedStats.hatchRate) {
      formData.hatchRate = pokemonData.detailedStats.hatchRate;
    }
    if (pokemonData.detailedStats.growthRate) {
      formData.growthRate = pokemonData.detailedStats.growthRate;
    }
    if (pokemonData.detailedStats.eggGroups) {
      formData.eggGroups = pokemonData.detailedStats.eggGroups;
    }
    if (pokemonData.detailedStats.evYield) {
      formData.evYield = pokemonData.detailedStats.evYield;
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

  // Read egg moves and TM/HM data
  const eggMovesPath = path.join(__dirname, '../output/pokemon_egg_moves.json');
  const tmHmLearnsetPath = path.join(__dirname, '../output/pokemon_tm_hm_learnset.json');
  const abilityDescriptionsPath = path.join(
    __dirname,
    '../output/pokemon_ability_descriptions.json',
  );

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

  // Read gift locations if available
  const giftLocationPath = path.join(__dirname, '../output/pokemon_gift_locations.json');
  let giftLocations: Record<string, any[]> = {};
  if (fs.existsSync(giftLocationPath)) {
    giftLocations = JSON.parse(fs.readFileSync(giftLocationPath, 'utf8'));
    console.log(`🎁 Loaded gift location data for ${Object.keys(giftLocations).length} Pokemon`);
  }

  // Read legendary locations if available
  const legendaryLocationPath = path.join(__dirname, '../output/pokemon_legendary_locations.json');
  let legendaryLocations: Record<string, any[]> = {};
  if (fs.existsSync(legendaryLocationPath)) {
    legendaryLocations = JSON.parse(fs.readFileSync(legendaryLocationPath, 'utf8'));
    console.log(
      `🏛️ Loaded legendary location data for ${Object.keys(legendaryLocations).length} Pokemon`,
    );
  }

  // Read level moves for form-specific movesets
  let levelMovesData: Record<string, any> = {};
  if (fs.existsSync(levelMovesPath)) {
    levelMovesData = JSON.parse(fs.readFileSync(levelMovesPath, 'utf8'));
    console.log(`⚔️ Loaded level moves data for ${Object.keys(levelMovesData).length} Pokemon`);
  }

  // Read egg moves data
  let eggMovesData: Record<string, string[]> = {};
  if (fs.existsSync(eggMovesPath)) {
    eggMovesData = JSON.parse(fs.readFileSync(eggMovesPath, 'utf8'));
    console.log(`🥚 Loaded egg moves data for ${Object.keys(eggMovesData).length} Pokemon`);
  }

  // Read TM/HM learnset data
  let tmHmLearnsetData: Record<string, any[]> = {};
  if (fs.existsSync(tmHmLearnsetPath)) {
    tmHmLearnsetData = JSON.parse(fs.readFileSync(tmHmLearnsetPath, 'utf8'));
    console.log(
      `📀 Loaded TM/HM learnset data for ${Object.keys(tmHmLearnsetData).length} Pokemon`,
    );
  }

  // Read ability descriptions data
  let abilityDescriptionsData: Record<string, { description: string }> = {};
  if (fs.existsSync(abilityDescriptionsPath)) {
    abilityDescriptionsData = JSON.parse(fs.readFileSync(abilityDescriptionsPath, 'utf8'));
    console.log(
      `💪 Loaded ability descriptions for ${Object.keys(abilityDescriptionsData).length} abilities`,
    );
  }

  // Read Pokédex entries data
  const pokedexEntriesPath = path.join(__dirname, '../output/pokemon_pokedex_entries.json');
  let pokedexEntriesData: Record<string, any> = {};
  if (fs.existsSync(pokedexEntriesPath)) {
    pokedexEntriesData = JSON.parse(fs.readFileSync(pokedexEntriesPath, 'utf8'));
    console.log(`📖 Loaded Pokédex entries for ${Object.keys(pokedexEntriesData).length} Pokémon`);
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
        giftLocations,
        legendaryLocations,
        levelMovesData,
        eggMovesData,
        tmHmLearnsetData,
        abilityDescriptionsData,
      );

      // Process detailedStats to include ability descriptions
      let processedDetailedStats = pokemonData.detailedStats;
      if (processedDetailedStats) {
        processedDetailedStats = {
          ...processedDetailedStats,
          ...(processedDetailedStats.abilities
            ? {
                abilities: addAbilityDescriptions(
                  processedDetailedStats.abilities,
                  abilityDescriptionsData,
                ),
              }
            : {}),
          ...(processedDetailedStats.faithfulAbilities
            ? {
                faithfulAbilities: addAbilityDescriptions(
                  processedDetailedStats.faithfulAbilities,
                  abilityDescriptionsData,
                ),
              }
            : {
                faithfulAbilities: addAbilityDescriptions(
                  processedDetailedStats.abilities,
                  abilityDescriptionsData,
                ),
              }),
          ...(processedDetailedStats.updatedAbilities
            ? {
                updatedAbilities: addAbilityDescriptions(
                  processedDetailedStats.updatedAbilities,
                  abilityDescriptionsData,
                ),
              }
            : {}),
        };
      }

      // Get Pokédex entries for this Pokémon
      const pokemonNameLower = pokemonKey.toLowerCase();
      const pokedexEntries = pokedexEntriesData[pokemonNameLower];

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
        ...(processedDetailedStats ? { detailedStats: processedDetailedStats } : {}),
        forms: formsObject,
        ...(locationData?.locations ||
        giftLocations[pokemonKey.toLowerCase()] ||
        legendaryLocations[pokemonKey.toLowerCase()]
          ? {
              locations: mergeLocationData(
                locationData?.locations,
                giftLocations[pokemonKey.toLowerCase()],
                legendaryLocations[pokemonKey.toLowerCase()],
              ),
            }
          : {}),
        ...(pokedexEntries ? { pokedexEntries: pokedexEntries } : {}),
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
