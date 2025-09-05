#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-unused-vars */

import fs from 'fs/promises';
import path from 'path';

// interface Ability {
//   name: string;
//   description: string;
//   isHidden: boolean;
//   abilityType: string;
// }

// interface Move {
//   name: string;
//   type?: string;
//   category?: string;
//   power?: number;
//   accuracy?: number;
//   pp?: number;
//   description?: string;
// }

interface AbilityManifest {
  [abilityId: string]: {
    name: string;
    description: string;
  };
}

interface MoveManifest {
  [moveId: string]: {
    name: string;
    description?: string;
    faithful?: {
      type: string;
      category: string;
      power: number;
      accuracy: number;
      pp: number;
    };
    updated?: {
      type: string;
      category: string;
      power: number;
      accuracy: number;
      pp: number;
    };
    tm?: {
      number: string;
      location?: {
        area: string;
        details?: string;
      };
    };
  };
}

interface PokemonManifest {
  [pokemonId: string]: {
    name: string;
    johtoNumber: number | null;
    nationalNumber: number;
    spriteUrl: string;
    spriteDimensions?: {
      width: number;
      height: number;
    };
    types: {
      faithful: string[];
      polished: string[];
    };
    forms: string[];
  };
}

function normalizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function createAbilitiesManifest(): Promise<void> {
  console.log('Creating abilities manifest...');

  const abilities: AbilityManifest = {};
  const seenAbilities = new Set<string>();

  try {
    // Check if there's an ability descriptions file first
    const abilityDescPath = path.join(process.cwd(), 'output', 'pokemon_ability_descriptions.json');
    let abilityDescriptions: Record<string, { name: string; description: string }> = {};

    try {
      abilityDescriptions = JSON.parse(await fs.readFile(abilityDescPath, 'utf8'));
      console.log(
        `Found ability descriptions file with ${Object.keys(abilityDescriptions).length} abilities`,
      );
    } catch (error) {
      console.log('No ability descriptions file found, will use individual Pokemon files');
    }

    // Read from individual Pokemon files
    const pokemonDir = path.join(process.cwd(), 'output', 'pokemon');
    const files = await fs.readdir(pokemonDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json') && file !== '_index.json');

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(pokemonDir, file);
        const pokemonData = JSON.parse(await fs.readFile(filePath, 'utf8'));

        // Process abilities from detailedStats
        if (pokemonData.detailedStats && pokemonData.detailedStats.abilities) {
          const abilityArrays = [
            pokemonData.detailedStats.abilities || [],
            pokemonData.detailedStats.faithfulAbilities || [],
            pokemonData.detailedStats.updatedAbilities || [],
          ];

          for (const abilityArray of abilityArrays) {
            if (!abilityArray) continue;

            for (const ability of abilityArray) {
              if (!ability || !ability.id) continue;

              const abilityId = ability.id.toLowerCase().replace(/\s+/g, '-');

              if (!seenAbilities.has(abilityId)) {
                // Try to get name and description from ability descriptions file
                const abilityDesc =
                  abilityDescriptions[abilityId] ||
                  abilityDescriptions[ability.id.charAt(0).toUpperCase() + ability.id.slice(1)];

                abilities[abilityId] = {
                  name:
                    abilityDesc?.name ||
                    ability.name ||
                    ability.id.charAt(0).toUpperCase() + ability.id.slice(1).replace(/-/g, ' '),
                  description:
                    abilityDesc?.description || ability.description || 'No description available',
                };
                seenAbilities.add(abilityId);
              }
            }
          }
        }
      } catch (fileError) {
        console.warn(`Error reading ${file}:`, fileError);
      }
    }

    // Create manifests directory
    const manifestsDir = path.join(process.cwd(), 'output', 'manifests');
    await fs.mkdir(manifestsDir, { recursive: true });

    // Write abilities manifest
    await fs.writeFile(
      path.join(manifestsDir, 'abilities.json'),
      JSON.stringify(abilities, null, 2),
    );

    console.log(
      `Created abilities manifest with ${Object.keys(abilities).length} unique abilities`,
    );
  } catch (error) {
    console.error('Error creating abilities manifest:', error);
  }
}

async function createMovesManifest(): Promise<void> {
  console.log('Creating moves manifest...');

  const moves: MoveManifest = {};
  const seenMoves = new Set<string>();

  try {
    // Read from move descriptions file
    const moveDescPath = path.join(process.cwd(), 'output', 'pokemon_move_descriptions.json');
    const moveDescriptions = JSON.parse(await fs.readFile(moveDescPath, 'utf8'));

    for (const [moveName, moveData] of Object.entries(moveDescriptions)) {
      const moveId = normalizeId(moveName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const move = moveData as any;

      if (!seenMoves.has(moveId)) {
        moves[moveId] = {
          name: moveName,
          description: move.description,
        };

        // Add faithful stats if they exist and are valid (type is not 'None' and category is not 'Unknown')
        if (
          move.faithful &&
          move.faithful.type !== 'None' &&
          move.faithful.category !== 'Unknown'
        ) {
          moves[moveId].faithful = {
            type: move.faithful.type,
            category: move.faithful.category,
            power: move.faithful.power,
            accuracy: move.faithful.accuracy,
            pp: move.faithful.pp,
          };
        }

        // Add updated stats if they exist and are valid (type is not 'None' and category is not 'Unknown')
        if (move.updated && move.updated.type !== 'None' && move.updated.category !== 'Unknown') {
          moves[moveId].updated = {
            type: move.updated.type,
            category: move.updated.category,
            power: move.updated.power,
            accuracy: move.updated.accuracy,
            pp: move.updated.pp,
          };
        }

        // Add TM/HM information if it exists
        if (move.tm) {
          moves[moveId].tm = {
            number: move.tm.number,
            location: move.tm.location,
          };
        }

        seenMoves.add(moveId);
      }
    }

    // Write moves manifest
    const manifestsDir = path.join(process.cwd(), 'output', 'manifests');
    await fs.writeFile(path.join(manifestsDir, 'moves.json'), JSON.stringify(moves, null, 2));

    console.log(`Created moves manifest with ${Object.keys(moves).length} unique moves`);
  } catch (error) {
    console.error('Error creating moves manifest:', error);
  }
}

async function createItemsManifest(): Promise<void> {
  console.log('Creating items manifest...');

  try {
    const itemsPath = path.join(process.cwd(), 'output', 'items_data.json');
    const itemsData = JSON.parse(await fs.readFile(itemsPath, 'utf8'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: { [itemId: string]: any } = {};

    for (const [itemName, itemData] of Object.entries(itemsData)) {
      const itemId = normalizeId(itemName);
      items[itemId] = itemData;
    }

    // Write items manifest
    const manifestsDir = path.join(process.cwd(), 'output', 'manifests');
    await fs.writeFile(path.join(manifestsDir, 'items.json'), JSON.stringify(items, null, 2));

    console.log(`Created items manifest with ${Object.keys(items).length} items`);
  } catch (error) {
    console.error('Error creating items manifest:', error);
  }
}

async function createPokemonManifest(): Promise<void> {
  console.log('Creating pokemon manifest...');

  const pokemon: PokemonManifest = {};
  const seenPokemon = new Set<string>();

  try {
    // Read from individual Pokemon files
    const pokemonDir = path.join(process.cwd(), 'output', 'pokemon');
    const files = await fs.readdir(pokemonDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json') && file !== '_index.json');

    // Read sprite manifest for dimensions and URLs
    const spriteManifestPath = path.join(
      process.cwd(),
      'public',
      'sprites',
      'pokemon',
      'manifest.json',
    );
    let spriteManifest: Record<string, { normal: string | null; shiny: string | null }> = {};

    try {
      spriteManifest = JSON.parse(await fs.readFile(spriteManifestPath, 'utf8'));
    } catch (error) {
      console.warn('No sprite manifest found, sprite URLs will be generated');
    }

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(pokemonDir, file);
        console.log(`Processing file: ${filePath}`);
        const pokemonData = JSON.parse(await fs.readFile(filePath, 'utf8'));

        if (!pokemonData.name || !pokemonData.nationalDex) continue;

        const pokemonId = normalizeId(pokemonData.name);

        if (!seenPokemon.has(pokemonId)) {
          // Get sprite URL - prefer from manifest, fallback to frontSpriteUrl
          let spriteUrl =
            pokemonData.frontSpriteUrl || `/sprites/pokemon/${pokemonId}/front_cropped.png`;

          // Check if sprite exists in manifest
          if (spriteManifest[pokemonId]?.normal) {
            spriteUrl = `/${spriteManifest[pokemonId].normal}`;
          }

          // Handle types - support both string and array formats
          let faithfulTypes: string[] = [];
          let polishedTypes: string[] = [];

          if (pokemonData.detailedStats?.types) {
            faithfulTypes = Array.isArray(pokemonData.detailedStats.types)
              ? pokemonData.detailedStats.types
              : [pokemonData.detailedStats.types];
          } else if (pokemonData.types) {
            faithfulTypes = Array.isArray(pokemonData.types)
              ? pokemonData.types
              : [pokemonData.types];
          }

          if (pokemonData.detailedStats?.updatedTypes) {
            polishedTypes = Array.isArray(pokemonData.detailedStats.updatedTypes)
              ? pokemonData.detailedStats.updatedTypes
              : [pokemonData.detailedStats.updatedTypes];
          } else if (pokemonData.updatedTypes) {
            polishedTypes = Array.isArray(pokemonData.updatedTypes)
              ? pokemonData.updatedTypes
              : [pokemonData.updatedTypes];
          } else {
            // If no updated types, use the same as faithful
            polishedTypes = [...faithfulTypes];
          }

          // Determine forms - check if this pokemon has form variations
          const formsSet = new Set<string>();

          console.log(
            `Checking forms for ${pokemonData.name} (${pokemonId})...`,
            pokemonData.forms,
          );

          // Check for forms in evolution data or other indicators
          if (pokemonData.forms) {
            // Special cases: consolidate purely cosmetic sprite variants to single form
            if (pokemonId === 'arbok' || pokemonId === 'magikarp' || pokemonId === 'unown') {
              // These Pokemon's forms are just cosmetic sprite variants, use first form as primary
              const firstForm = Object.keys(pokemonData.forms)[0];
              formsSet.add(firstForm);
            } else {
              Object.keys(pokemonData.forms).forEach((form) => formsSet.add(form));
            }
          }

          // Check sprite manifest for form variations (but prioritize Pokemon data forms)
          const baseNamePattern = new RegExp(`^${pokemonId}(_.*)?$`);
          Object.keys(spriteManifest).forEach((key) => {
            if (baseNamePattern.test(key) && key !== pokemonId) {
              let formName = key.replace(`${pokemonId}_`, '');

              // Exclude known separate evolutions that might be mistaken for forms
              const separateEvolutions = ['z']; // porygon_z should be treated as separate Pokemon, not a form
              if (pokemonId === 'porygon' && separateEvolutions.includes(formName)) {
                return; // Skip this, it's a separate evolution
              }

              // Exclude cosmetic sprite variants that should be consolidated
              if (pokemonId === 'arbok' || pokemonId === 'magikarp' || pokemonId === 'unown') {
                return; // Skip all sprite variants for these Pokemon, they're just cosmetic
              }

              // Normalize form name to match Pokemon data conventions (underscores to hyphens)
              formName = formName.replace(/_/g, '-');

              // Only add if we don't already have this form from Pokemon data
              if (!formsSet.has(formName)) {
                formsSet.add(formName);
              }
            }
          });

          // Convert set to array and ensure at least one form exists
          const forms = Array.from(formsSet);
          if (forms.length === 0) {
            forms.push('plain');
          }

          pokemon[pokemonId] = {
            name: pokemonData.name,
            johtoNumber: pokemonData.johtoDex || null,
            nationalNumber: pokemonData.nationalDex,
            spriteUrl: spriteUrl,
            types: {
              faithful: faithfulTypes,
              polished: polishedTypes,
            },
            forms: forms,
          };

          seenPokemon.add(pokemonId);
        }
      } catch (fileError) {
        console.warn(`Error reading ${file}:`, fileError);
      }
    }

    // Create manifests directory
    const manifestsDir = path.join(process.cwd(), 'output', 'manifests');
    await fs.mkdir(manifestsDir, { recursive: true });

    // Write pokemon manifest
    await fs.writeFile(path.join(manifestsDir, 'pokemon.json'), JSON.stringify(pokemon, null, 2));

    console.log(`Created pokemon manifest with ${Object.keys(pokemon).length} unique pokemon`);
  } catch (error) {
    console.error('Error creating pokemon manifest:', error);
  }
}

async function main(): Promise<void> {
  console.log('Starting manifest creation...');

  await createAbilitiesManifest();
  await createMovesManifest();
  await createItemsManifest();
  await createPokemonManifest();

  console.log('All manifests created successfully!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createAbilitiesManifest, createMovesManifest, createItemsManifest, createPokemonManifest };
