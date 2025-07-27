#!/usr/bin/env ts-node

import fs from 'fs/promises';
import path from 'path';

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

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function compressAbilities(abilities: any[]): CompressedAbility[] {
  return abilities.map(ability => ({
    id: normalizeId(ability.name),
    isHidden: ability.isHidden,
    abilityType: ability.abilityType
  }));
}

function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => {
    const bVal = b[idx];
    return val.id === bVal.id && 
           val.isHidden === bVal.isHidden && 
           val.abilityType === bVal.abilityType;
  });
}

function removeDuplicateAbilities(abilities: CompressedAbility[]): CompressedAbility[] {
  const seen = new Set<string>();
  return abilities.filter(ability => {
    const key = `${ability.id}-${ability.abilityType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function compressPokemonFile(filePath: string): Promise<void> {
  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    
    // Compress abilities
    const compressedAbilities = removeDuplicateAbilities(
      compressAbilities(data.detailedStats.abilities || [])
    );
    
    // Handle faithful abilities - only keep if different
    let faithfulAbilities: CompressedAbility[] | null = null;
    if (data.detailedStats.faithfulAbilities) {
      const compressedFaithful = removeDuplicateAbilities(
        compressAbilities(data.detailedStats.faithfulAbilities)
      );
      
      if (!arraysEqual(compressedAbilities, compressedFaithful)) {
        faithfulAbilities = compressedFaithful;
      }
    }
    
    // Create compressed version
    const compressed: CompressedPokemon = {
      ...data,
      detailedStats: {
        ...data.detailedStats,
        abilities: compressedAbilities,
        faithfulAbilities: faithfulAbilities
      }
    };
    
    // Remove updatedAbilities as it's usually empty
    delete (compressed.detailedStats as any).updatedAbilities;
    
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
  
  const jsonFiles = files.filter(file => 
    file.endsWith('.json') && file !== '_index.json'
  );
  
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
      
      // Compress abilities
      const compressedAbilities = removeDuplicateAbilities(
        compressAbilities(pokemon.abilities || [])
      );
      
      // Handle faithful abilities
      let faithfulAbilities: CompressedAbility[] | null = null;
      if (pokemon.faithfulAbilities) {
        const compressedFaithful = removeDuplicateAbilities(
          compressAbilities(pokemon.faithfulAbilities)
        );
        
        if (!arraysEqual(compressedAbilities, compressedFaithful)) {
          faithfulAbilities = compressedFaithful;
        }
      }
      
      compressed[pokemonName] = {
        ...pokemon,
        abilities: compressedAbilities,
        faithfulAbilities: faithfulAbilities
      };
      
      // Remove updatedAbilities
      delete compressed[pokemonName].updatedAbilities;
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