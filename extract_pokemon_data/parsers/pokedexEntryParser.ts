/**
 * Parser for Pokémon Pokédex entries from ASM files
 */

import path from 'node:path';
import { readFileSync, writeJSONSync } from '../utils/fileUtils.js';
import { getFullPokemonName } from '../utils/stringUtils.js';
import { OUTPUT_PATHS } from '../data/constants.js';
import type { PokemonDexEntry } from '../types/pokemon.js';

/**
 * Extract and process Pokémon Pokédex entries
 * @returns Record of Pokémon names mapped to their Pokédex entries
 */
export function extractPokedexEntries(): Record<string, PokemonDexEntry> {
  console.log('Starting to process Pokémon Pokédex entries...');

  // Get Pokédex entries
  const dexPath = path.join(process.cwd(), 'data/pokedex/bio.asm');
  const content = readFileSync(dexPath);

  // Parse the entries
  const dexEntries = parsePokedexEntries(content);

  // Write the Pokédex entries to a JSON file
  writeJSONSync(OUTPUT_PATHS.POKEDEX_ENTRIES, dexEntries);
  console.log('Pokémon Pokédex entries extracted to', OUTPUT_PATHS.POKEDEX_ENTRIES);

  return dexEntries;
}

/**
 * Parse Pokédex entries from a file content
 * @param content File content to parse
 * @returns Record of Pokémon names mapped to their Pokédex entries
 */
function parsePokedexEntries(content: string): Record<string, PokemonDexEntry> {
  const lines = content.split(/\r?\n/);
  const dexEntries: Record<string, PokemonDexEntry> = {};

  let currentPokemon: string | null = null;
  let currentForm: string | null = null;
  let description = '';
  let species = '';
  let collecting = false;

  for (const line of lines) {
    // Check for entry headers
    const headerMatch = line.match(/^([A-Za-z0-9_]+)PokedexEntry::$/);
    const formMatch = line.match(/^([A-Za-z0-9_]+)_([A-Za-z0-9_]+)PokedexEntry::$/);

    // If we find a new header, save the previous entry
    if (headerMatch || formMatch) {
      if (currentPokemon && description) {
        const fullName = getFullPokemonName(currentPokemon, currentForm);
        dexEntries[fullName] = {
          description,
          species
        };
      }

      // Reset for new entry
      description = '';
      species = '';
      collecting = false;

      // Set the new Pokémon name
      if (headerMatch) {
        currentPokemon = headerMatch[1];
        currentForm = null;
      } else if (formMatch) {
        currentPokemon = formMatch[1];
        currentForm = formMatch[2];
      }

      continue;
    }

    // Check for species
    if (line.includes('db ') && line.includes('; species')) {
      const speciesMatch = line.match(/db\s+"([^"]+)"/);
      if (speciesMatch) {
        species = speciesMatch[1];
      }
      continue;
    }

    // Skip height/weight lines as they're not part of the PokemonDexEntry interface
    if (line.includes('dw') && (line.includes('; height') || line.includes('; weight'))) {
      continue;
    }

    // Text collection - starts with 'db "' or 'next "'
    if (line.trim().startsWith('db "')) {
      collecting = true;
      description = line.trim().replace('db "', '').replace('"', '');
      continue;
    }

    if (line.trim().startsWith('next "') && collecting) {
      description += ' ' + line.trim().replace('next "', '').replace('"', '');
      continue;
    }

    // End of entry
    if (line.trim() === 'db 0' || line.trim() === 'dw 0') {
      collecting = false;
    }
  }

  // Add the last entry
  if (currentPokemon && description) {
    const fullName = getFullPokemonName(currentPokemon, currentForm);
    dexEntries[fullName] = {
      description,
      species
    };
  }

  return dexEntries;
}
