import { KNOWN_FORMS } from "../../data/constants.ts";
import { normalizeMonName, standardizePokemonKey } from "../stringUtils.ts";
import path from "node:path";
import fs from 'node:fs';
import type { PokemonDexEntry } from "../../types/types.ts";
import { fileURLToPath } from "node:url";

// Use this workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const POKEDEX_ENTRIES_OUTPUT = path.join(__dirname, '../../../output/pokemon_pokedex_entries.json');


// Helper to extract the base name from a combined name with form
export function extractBasePokemonName(fullName: string): string {
  // Special case for Ho-Oh which contains a hyphen but shouldn't be split
  if (fullName === 'Ho-Oh') {
    return 'Ho-Oh';
  }
  
  // Check if the name contains the special separator for complex forms
  if (fullName.includes('-')) {
    return fullName.split('-')[0];
  }

  // Use the KNOWN_FORMS constant for consistency
  const knownForms = Object.values(KNOWN_FORMS);
  let baseName = fullName.split('-').filter(segment => !Object.values(KNOWN_FORMS).includes(segment)).join('-');


  // Special handling for compound form names like "paldean_fire" and "paldean_water"
  if (fullName.toLowerCase().includes(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase())) {
    return fullName.substring(0, fullName.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase()));
  } else if (fullName.toLowerCase().includes(KNOWN_FORMS.PALDEAN_WATER.toLowerCase())) {
    return fullName.substring(0, fullName.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_WATER.toLowerCase()));
  }

  // Handle standard forms
  for (const form of knownForms) {
    if (fullName.toLowerCase().endsWith(form.toLowerCase())) {
      baseName = fullName.substring(0, fullName.length - form.length);
      break;
    }
  }
  // Trim any trailing spaces
  return baseName.trim();
}

// TODO: REMOVE

// Legacy function for compatibility with existing code
// Will be gradually phased out as we convert the code to use the new structure
export function getFullPokemonName(name: string, form: string | null): string {
  console.log(`getFullPokemonName called with name: ${name}, form: ${form}`);
  const { baseName, formName } = normalizeMonName(name, form);

  // For debugging special cases
  if ((name === 'TAUROS' || name === 'WOOPER') && form) {
    console.log(`Creating name for ${name} with form ${form} => ${baseName}${formName || ''}`);
  }

  // Return the combined name - use consistent format for forms
  // For the special Paldean forms, use a unique separator to make extraction easier
  if (formName === KNOWN_FORMS.PALDEAN_FIRE || formName === KNOWN_FORMS.PALDEAN_WATER) {
    return `${baseName}-${formName}`;  // Use a separator for these complex forms
  }

  return formName ? `${baseName}${formName}` : baseName;
}


export function extractPokedexEntries() {
  const pokedexEntriesPath = path.join(__dirname, '../../../rom/data/pokemon/dex_entries.asm');
  const entriesData = fs.readFileSync(pokedexEntriesPath, 'utf8');
  const lines = entriesData.split(/\r?\n/);

  // Store the entries as { pokemon: { species: string, entries: string[] } }
  const pokedexEntries: Record<string, { species: string, entries: string[] }> = {};

  let currentMon: string | null = null;
  let currentSpecies: string | null = null;
  let currentEntries: string[] = [];
  let collectingEntry = false;
  let collectingSpecies = false;
  let skipConditional = false;

  for (const line of lines) {
    // Check for new Pokémon section
    const sectionMatch = line.match(/SECTION "([A-Za-z0-9]+)PokedexEntry"/);
    if (sectionMatch) {
      // Save previous entry if we were processing one
      if (currentMon && currentSpecies && currentEntries.length > 0) {
        // Convert to title case for consistency with other data files
        const standardizedMon = standardizePokemonKey(currentMon);
        console.log(`Saving entry for ${standardizedMon}:`, currentSpecies, currentEntries);
        pokedexEntries[standardizedMon] = {
          species: currentSpecies,
          entries: currentEntries
        };
      }

      // Start a new entry
      currentMon = sectionMatch[1];
      currentSpecies = null;
      currentEntries = [];
      collectingEntry = false;
      collectingSpecies = false;
      skipConditional = false;
      continue;
    }

    // Check for entry start
    if (line.includes('::')) {
      collectingEntry = true;
      collectingSpecies = true;
      continue;
    }

    // Handle conditional species entries (like Blastoise)
    if (collectingSpecies && line.includes('if DEF')) {
      // We're in a conditional block, get the species from the non-FAITHFUL branch if available
      skipConditional = true;
      continue;
    }

    if (skipConditional && line.includes('else')) {
      // Now we're in the else part, we can collect the species
      skipConditional = false;
      continue;
    }

    if (skipConditional && line.includes('endc')) {
      // End of conditional, go back to normal processing
      skipConditional = false;
      collectingSpecies = false;
      continue;
    }

    // Skip lines while in a conditional we want to ignore
    if (skipConditional) continue;

    // Species line (e.g., db "Seed@")
    if (collectingEntry && line.trim().startsWith('db "') && line.includes('@"')) {
      currentSpecies = line.trim().replace('db "', '').replace('@"', '');
      collectingSpecies = false;
      continue;
    }

    // Entry text lines
    if (collectingEntry && currentSpecies) {
      // Extract the text content between the quotes
      if (line.trim().startsWith('db ')) {
        const textMatch = line.match(/db\s+"([^"]+)"/);
        if (textMatch) {
          currentEntries.push(textMatch[1]);
        }
      } else if (line.trim().startsWith('next ')) {
        // Handle lines with 'next' keyword
        const nextMatch = line.match(/next\s+"([^"]+)"/);
        if (nextMatch) {
          currentEntries.push(nextMatch[1]);
        }
      } else if (line.trim().startsWith('page ')) {
        // Handle lines with 'page' keyword - indicates a new page in the Pokédex
        const pageMatch = line.match(/page\s+"([^"]+)"/);
        if (pageMatch) {
          currentEntries.push(pageMatch[1]);
        }
      }
    }
  }

  // Don't forget the last entry
  if (currentMon && currentSpecies && currentEntries.length > 0) {
    const standardizedMon = standardizePokemonKey(currentMon);

    pokedexEntries[standardizedMon] = {
      species: currentSpecies,
      entries: currentEntries
    };
  }

  // Clean up and format the entries
  const formattedEntries: Record<string, PokemonDexEntry> = {};

  // eslint-disable-next-line prefer-const
  for (let [mon, data] of Object.entries(pokedexEntries)) {

    // Join the entries into a single description, handling line breaks
    // We'll preserve some formatting by adding spaces between entries
    // and replacing @ with an empty string (end of entry marker)
    const description = data.entries.join(' ')
      .replace(/@/g, '')
      .replace(/\s*-\s*(?=\w)/g, '') // Remove hyphens at end of lines
      .replace(/\s+/g, ' ');        // Normalize multiple spaces

    formattedEntries[mon] = {
      species: data.species,
      description: description.trim()
    };
  }

  fs.writeFileSync(POKEDEX_ENTRIES_OUTPUT, JSON.stringify(formattedEntries, null, 2));
  console.log('Pokédex entries extracted to', POKEDEX_ENTRIES_OUTPUT);
}
