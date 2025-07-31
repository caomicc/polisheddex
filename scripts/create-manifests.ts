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

async function main(): Promise<void> {
  console.log('Starting manifest creation...');

  await createAbilitiesManifest();
  await createMovesManifest();
  await createItemsManifest();

  console.log('All manifests created successfully!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createAbilitiesManifest, createMovesManifest, createItemsManifest };
