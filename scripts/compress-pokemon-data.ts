#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';

// Move normalization function to fix remaining PSYCHIC issues
function normalizeMoveData(moveArray: any[]): any[] {
  if (!Array.isArray(moveArray)) return moveArray;
  
  return moveArray.map((move: any) => {
    if (!move || typeof move !== 'object') return move;
    
    const normalizedMove = { ...move };
    
    // Normalize move names - specifically handle "Psychic M" -> "Psychic"
    if (move.name === 'Psychic M' || move.name === 'PSYCHIC_M') {
      normalizedMove.name = 'Psychic';
      
      // Check if this is a level move (has info object) or TM/HM move (direct properties)
      if (move.info !== undefined) {
        // Level move structure - update info object
        if (!move.info || !move.info.description || move.info.type === 'None' || move.info.pp === 0) {
          normalizedMove.info = {
            description: "An attack that may lower Sp.Def.",
            type: "Psychic", 
            pp: 10,
            power: 90,
            accuracy: 100,
            category: "Special"
          };
        }
      } else {
        // TM/HM move structure - update direct properties
        if (!move.description || move.type === 'None' || move.pp === 0) {
          normalizedMove.description = "An attack that may lower Sp.Def.";
          normalizedMove.type = "Psychic";
          normalizedMove.pp = 10;
          normalizedMove.power = 90;
          normalizedMove.accuracy = 100;
          normalizedMove.category = "Special";
        }
      }
    }
    
    return normalizedMove;
  });
}

interface CompressedAbility {
  id: string;
  isHidden: boolean;
  abilityType: 'primary' | 'secondary' | 'hidden';
}

interface CompressedPokemon {
  name: string;
  nationalDex: number;
  johtoDex?: number;
  types: string | string[];
  updatedTypes?: string | string[];
  frontSpriteUrl: string;
  detailedStats: {
    baseStats: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
      specialAttack: number;
      specialDefense: number;
      total: number;
    };
    faithfulBaseStats?: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
      specialAttack: number;
      specialDefense: number;
      total: number;
    };
    polishedBaseStats?: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
      specialAttack: number;
      specialDefense: number;
      total: number;
    };
    catchRate: number;
    baseExp: number;
    heldItems: string[];
    genderRatio: {
      male: number;
      female: number;
    };
    hatchRate: string;
    abilities: CompressedAbility[];
    faithfulAbilities?: CompressedAbility[] | null; // Only if different
    updatedAbilities?: CompressedAbility[] | null; // Only if different
    growthRate: string;
    eggGroups: string[];
    evYield: string;
    height: number;
    weight: number;
    bodyShape: string;
    bodyColor: string;
  };
  evolution?: any; // Keep as-is for now
  moves?: any; // Keep as-is for now
  locations?: any; // Keep as-is for now
  pokedexEntry?: any; // Keep as-is for now
}

function normalizeId(name?: string): string {
  if (!name) {
    return 'unknown';
  }
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function compressAbilities(abilities: any[]): CompressedAbility[] {
  if (!abilities || !Array.isArray(abilities)) {
    return [];
  }
  return abilities.map((ability) => ({
    id: ability?.id || normalizeId(ability?.name || 'unknown'),
    isHidden: ability?.isHidden,
    abilityType: ability?.abilityType,
  }));
}

function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => {
    const bVal = b[idx];
    return (
      val.id === bVal.id && val.isHidden === bVal.isHidden && val.abilityType === bVal.abilityType
    );
  });
}

function removeDuplicateAbilities(abilities: CompressedAbility[]): CompressedAbility[] {
  const seen = new Set<string>();
  return abilities.filter((ability) => {
    const key = `${ability.id}-${ability.abilityType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Global variable to cache location data
let pokemonLocationsData: any = null;
// Global variable to cache detailed stats data
let pokemonDetailedStatsData: any = null;

async function loadLocationData(): Promise<any> {
  if (pokemonLocationsData) {
    return pokemonLocationsData;
  }

  try {
    const locationsPath = path.join(process.cwd(), 'output', 'pokemon_locations.json');
    const data = await fs.readFile(locationsPath, 'utf8');
    pokemonLocationsData = JSON.parse(data);
    return pokemonLocationsData;
  } catch (error) {
    console.warn('Could not load pokemon_locations.json:', error);
    return {};
  }
}

async function loadDetailedStatsData(): Promise<any> {
  if (pokemonDetailedStatsData) {
    return pokemonDetailedStatsData;
  }

  try {
    const detailedStatsPath = path.join(process.cwd(), 'output', 'pokemon_detailed_stats.json');
    const data = await fs.readFile(detailedStatsPath, 'utf8');
    pokemonDetailedStatsData = JSON.parse(data);
    return pokemonDetailedStatsData;
  } catch (error) {
    console.warn('Could not load pokemon_detailed_stats.json:', error);
    return {};
  }
}

async function compressPokemonFile(filePath: string): Promise<void> {
  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

    // Skip compression if detailedStats is null or missing
    if (!data.detailedStats) {
      console.warn(`Skipping compression for ${filePath}: no detailed stats`);
      return;
    }

    // Compress abilities
    const compressedAbilities = removeDuplicateAbilities(
      compressAbilities(data.detailedStats.abilities || []),
    );

    // Handle faithful abilities - only keep if different
    let faithfulAbilities: CompressedAbility[] | null = null;
    if (data.detailedStats.faithfulAbilities) {
      const compressedFaithful = removeDuplicateAbilities(
        compressAbilities(data.detailedStats.faithfulAbilities),
      );

      if (!arraysEqual(compressedAbilities, compressedFaithful)) {
        faithfulAbilities = compressedFaithful;
      }
    }

    // Handle updated abilities - only keep if different
    let updatedAbilities: CompressedAbility[] | null = null;
    if (data.detailedStats.updatedAbilities && data.detailedStats.updatedAbilities.length > 0) {
      const compressedUpdated = removeDuplicateAbilities(
        compressAbilities(data.detailedStats.updatedAbilities),
      );

      if (!arraysEqual(compressedAbilities, compressedUpdated)) {
        updatedAbilities = compressedUpdated;
      }
    }

    // Load location data
    const allLocationsData = await loadLocationData();
    // Derive Pokemon name from filename instead of data.name which may not exist
    const fileName = path.basename(filePath, '.json');
    const pokemonName = fileName.toLowerCase();
    const pokemonLocationData = allLocationsData[pokemonName];
    const locations = pokemonLocationData?.locations || [];

    // Load detailed stats data to get faithful/polished base stats
    const allDetailedStatsData = await loadDetailedStatsData();
    const pokemonNameCapitalized = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    const pokemonDetailedStats = allDetailedStatsData[pokemonNameCapitalized];

    // Extract faithful and polished base stats if they exist and are different
    let faithfulBaseStats = undefined;
    let polishedBaseStats = undefined;
    
    if (pokemonDetailedStats) {
      // Check if faithful base stats exist and are different from regular base stats
      if (pokemonDetailedStats.faithfulBaseStats && 
          JSON.stringify(pokemonDetailedStats.faithfulBaseStats) !== JSON.stringify(data.detailedStats.baseStats)) {
        faithfulBaseStats = pokemonDetailedStats.faithfulBaseStats;
      }
      
      // Check if polished base stats exist and are different from regular base stats
      if (pokemonDetailedStats.polishedBaseStats && 
          JSON.stringify(pokemonDetailedStats.polishedBaseStats) !== JSON.stringify(data.detailedStats.baseStats)) {
        polishedBaseStats = pokemonDetailedStats.polishedBaseStats;
      }
    }

    // Apply move normalization to fix remaining PSYCHIC issues
    const normalizedData = {
      ...data,
      levelMoves: data.levelMoves ? normalizeMoveData(data.levelMoves) : data.levelMoves,
      faithfulLevelMoves: data.faithfulLevelMoves ? normalizeMoveData(data.faithfulLevelMoves) : data.faithfulLevelMoves,
      updatedLevelMoves: data.updatedLevelMoves ? normalizeMoveData(data.updatedLevelMoves) : data.updatedLevelMoves,
      moves: data.moves ? normalizeMoveData(data.moves) : data.moves,
      faithfulMoves: data.faithfulMoves ? normalizeMoveData(data.faithfulMoves) : data.faithfulMoves,
      updatedMoves: data.updatedMoves ? normalizeMoveData(data.updatedMoves) : data.updatedMoves,
      tmHmMoves: data.tmHmMoves ? normalizeMoveData(data.tmHmMoves) : data.tmHmMoves,
    };

    // Create compressed version
    const compressed: CompressedPokemon = {
      ...normalizedData,
      name: pokemonName, // Use derived name from filename
      detailedStats: {
        ...normalizedData.detailedStats,
        abilities: compressedAbilities,
        faithfulAbilities: faithfulAbilities,
        updatedAbilities: updatedAbilities,
        faithfulBaseStats: faithfulBaseStats,
        polishedBaseStats: polishedBaseStats,
      },
      locations: locations, // Add locations to compressed data
    };

    // Don't remove updatedAbilities anymore - we handle it above

    // Remove duplicate type data
    if (compressed.types === compressed.updatedTypes) {
      delete compressed.updatedTypes;
    }

    // Write compressed version
    await fs.writeFile(filePath, JSON.stringify(compressed, null, 2));
  } catch (error) {
    console.error(`Error compressing ${filePath}:`, error);
  }
}

async function compressAllPokemonFiles(): Promise<void> {
  console.log('Compressing individual Pokemon files...');

  const pokemonDir = path.join(process.cwd(), 'output', 'pokemon');
  const files = await fs.readdir(pokemonDir);

  const jsonFiles = files.filter((file) => file.endsWith('.json') && file !== '_index.json');

  let processed = 0;
  const total = jsonFiles.length;

  for (const file of jsonFiles) {
    const filePath = path.join(pokemonDir, file);
    await compressPokemonFile(filePath);
    processed++;

    if (processed % 50 === 0) {
      console.log(`Processed ${processed}/${total} files...`);
    }
  }

  console.log(`Compression complete! Processed ${processed} Pokemon files.`);
}

async function compressDetailedStats(): Promise<void> {
  console.log('Compressing pokemon_detailed_stats.json...');

  try {
    const detailedStatsPath = path.join(process.cwd(), 'output', 'pokemon_detailed_stats.json');
    const data = JSON.parse(await fs.readFile(detailedStatsPath, 'utf8'));

    const compressed: { [key: string]: any } = {};

    for (const [pokemonName, pokemonData] of Object.entries(data)) {
      const pokemon = pokemonData as any;

      // Skip if pokemon data is invalid
      if (!pokemon || typeof pokemon !== 'object') {
        console.warn(`Skipping invalid pokemon data for: ${pokemonName}`);
        continue;
      }

      // Compress abilities
      const compressedAbilities = removeDuplicateAbilities(
        compressAbilities(pokemon.abilities || []),
      );

      // Handle faithful abilities
      let faithfulAbilities: CompressedAbility[] | null = null;
      if (pokemon.faithfulAbilities) {
        const compressedFaithful = removeDuplicateAbilities(
          compressAbilities(pokemon.faithfulAbilities),
        );

        if (!arraysEqual(compressedAbilities, compressedFaithful)) {
          faithfulAbilities = compressedFaithful;
        }
      }

      // Handle updated abilities
      let updatedAbilities: CompressedAbility[] | null = null;
      if (pokemon.updatedAbilities && pokemon.updatedAbilities.length > 0) {
        const compressedUpdated = removeDuplicateAbilities(
          compressAbilities(pokemon.updatedAbilities),
        );

        if (!arraysEqual(compressedAbilities, compressedUpdated)) {
          updatedAbilities = compressedUpdated;
        }
      }

      compressed[pokemonName] = {
        ...pokemon,
        abilities: compressedAbilities,
        faithfulAbilities: faithfulAbilities,
        updatedAbilities: updatedAbilities,
      };

      // Don't remove updatedAbilities anymore - we handle it above
    }

    await fs.writeFile(detailedStatsPath, JSON.stringify(compressed, null, 2));
    console.log('Compressed pokemon_detailed_stats.json successfully!');
  } catch (error) {
    console.error('Error compressing detailed stats:', error);
  }
}

async function main(): Promise<void> {
  console.log('Starting Pokemon data compression...');

  await compressDetailedStats();
  await compressAllPokemonFiles();

  console.log('Pokemon data compression complete!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { compressAllPokemonFiles, compressDetailedStats };
