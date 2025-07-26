import { KNOWN_FORMS } from '../../data/constants.ts';
import { normalizeMonName, standardizePokemonKey } from '../stringUtils.ts';
import path from 'node:path';
import fs from 'node:fs';
import type { PokemonDexEntry } from '../../types/types.ts';
import { fileURLToPath } from 'node:url';

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

  // Special case for porygon-z which contains a hyphen but shouldn't be split
  if (fullName === 'porygon-z') {
    return 'porygon-z';
  }

  if (fullName === 'Mr-Mime') {
    return 'Mr-Mime';
  }

  if (fullName === 'Mime-Jr') {
    return 'Mime-Jr';
  }

  // Special case for mr-mime - should not be processed as having a regional form suffix
  if (fullName.toLowerCase() === 'mr-mime' || fullName.toLowerCase() === 'mrmime') {
    return 'mr-mime';
  }

  if (fullName === 'Nidoran-F') {
    return 'Nidoran-F';
  }

  if (fullName === 'Nidoran-M') {
    return 'Nidoran-M';
  }

  if (fullName === 'Sirfetch-d') {
    return 'Sirfetch-d';
  }

  // Special case for farfetch-d - should not be processed as having a regional form suffix
  if (fullName.toLowerCase() === 'farfetch-d' || fullName.toLowerCase() === 'farfetchd') {
    return 'farfetch-d';
  }

  if (fullName === 'taurospaldean' || fullName === 'Taurospaldean') {
    return 'tauros';
  }

  if (fullName === 'tauros paldean fire' || fullName === 'Taurospaldean_fire') {
    return 'tauros';
  }
  if (fullName === 'tauros paldean water' || fullName === 'Taurospaldean_water') {
    return 'tauros';
  }

  console.log(`Extracting base name from full name: ${fullName}`);

  // Regional form suffixes to check for
  const regionalFormSuffixes = [
    'hisuian',
    'Hisuian',
    'galarian',
    'Galarian',
    'alolan',
    'Alolan',
    'paldean',
    'Paldean',
    'plain',
    'Plain',
    'hisui',
    'Hisui',
    'galar',
    'Galar',
    'armored',
    'Armored',
    'armo',
    'Armored',
    'bloodmoon',
    'BloodMoon',
    'paldeanfire',
    'PaldeanFire',
    'paldeanwater',
    'PaldeanWater',
  ];

  // Check for regional form suffixes with proper word boundaries
  for (const suffix of regionalFormSuffixes) {
    const lowerFullName = fullName.toLowerCase();
    const lowerSuffix = suffix.toLowerCase();

    if (lowerFullName.endsWith(lowerSuffix)) {
      // Make sure there's a separator before the suffix (space, dash, underscore)
      // or the suffix is the entire second part of a compound name
      const beforeSuffix = fullName.substring(0, fullName.length - suffix.length);
      const lastChar = beforeSuffix.slice(-1);

      // Only treat as a regional form if there's a clear separator or it's a compound name
      if (lastChar === ' ' || lastChar === '-' || lastChar === '_' || beforeSuffix.length === 0) {
        return beforeSuffix.trim();
      }
    }
  }

  // Check if the name contains the special separator for complex forms
  if (fullName.includes('-')) {
    return fullName.split('-')[0];
  }

  // Use the KNOWN_FORMS constant for consistency
  const knownForms = Object.values(KNOWN_FORMS);
  let baseName = fullName
    .split('-')
    .filter((segment) => !Object.values(KNOWN_FORMS).includes(segment))
    .join('-');

  // Special handling for compound form names like "paldean_fire" and "paldean_water"
  if (fullName.toLowerCase().includes(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase())) {
    return fullName.substring(
      0,
      fullName.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_FIRE.toLowerCase()),
    );
  } else if (fullName.toLowerCase().includes(KNOWN_FORMS.PALDEAN_WATER.toLowerCase())) {
    return fullName.substring(
      0,
      fullName.toLowerCase().indexOf(KNOWN_FORMS.PALDEAN_WATER.toLowerCase()),
    );
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

  console.log(`Creating name for ${name} with form ${form} => ${baseName}${formName || ''}`);

  // Return the combined name - use consistent format for forms
  // For the special Paldean forms, use a unique separator to make extraction easier
  // if (formName === KNOWN_FORMS.PALDEAN_FIRE || formName === KNOWN_FORMS.PALDEAN_WATER) {
  //   return `${baseName}-${formName}`; // Use a separator for these complex forms
  // }

  return formName ? `${baseName}${formName}` : baseName;
}

/**
 * Update the respective Pokémon's JSON file with the extracted Pokédex entry.
 * Handles both base and regional forms, and always uses the { default: {...}, regionalform: {...} } format.
 */
function updatePokemonJsonWithDexEntry(mon: string, entry: PokemonDexEntry) {
  const baseName = extractBasePokemonName(mon).toLowerCase().replace(/\s/g, '-'); // Normalize base name for file naming
  // const baseName = extractBasePokemonName(mon).toLowerCase().replace(/[^a-z0-9]/g, '');
  console.warn(`Updating JSON for Pokémon: ${mon}, base name: ${baseName}`);
  const filePath = path.join(__dirname, `../../../output/pokemon/${baseName}.json`);
  console.log(`File path for Pokémon JSON: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.warn(`No JSON file found for ${mon} (${filePath})`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`Current data for ${mon}:`, data);

  // Always use the { default: {...}, regionalform: {...} } format
  if (
    !data.pokedexEntries ||
    typeof data.pokedexEntries !== 'object' ||
    Array.isArray(data.pokedexEntries)
  ) {
    data.pokedexEntries = {};
  }

  const formMatch = mon.match(/^(.*?)-(\w+)$/);
  if (formMatch) {
    // It's a form: update the correct key in pokedexEntries
    const formKey = formMatch[2][0].toUpperCase() + formMatch[2].slice(1).toLowerCase();
    data.pokedexEntries[formKey] = entry;
  } else {
    // Base form: update 'default'
    data.pokedexEntries.default = entry;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function extractPokedexEntries() {
  const pokedexEntriesPath = path.join(
    __dirname,
    '../../../polishedcrystal/data/pokemon/dex_entries.asm',
  );
  const entriesData = fs.readFileSync(pokedexEntriesPath, 'utf8');
  const lines = entriesData.split(/\r?\n/);

  // Store the entries as { pokemon: { species: string, entries: string[] } }
  const pokedexEntries: Record<
    string,
    {
      species: string;
      entries: string[];
      forms?: Record<string, { species: string; entries: string[] }>;
    }
  > = {};
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
        // fix later to use normalizeMonName
        const standardizedMon = standardizePokemonKey(currentMon).toLowerCase();
        // Trim the last camelcased piece from currentMon (e.g., "TaurosPaldeanFire" -> "TaurosPaldean")
        // Extract the regional form from the currentMon (e.g., TyphlosionHisuian -> Hisuian)
        // But only if it's an actual regional form, not just any camelCase ending
        const regionalFormMatch = currentMon.match(/([A-Z][a-z]+)$/);
        const potentialRegionalForm = regionalFormMatch ? regionalFormMatch[1] : '';
        const regionalForm = Object.values(KNOWN_FORMS).some((form) =>
          form.toLowerCase().includes(potentialRegionalForm.toLowerCase()),
        )
          ? potentialRegionalForm
          : '';
        console.log(`Processing Pokémon: ${currentMon}`, 'regionalForm:', regionalForm);
        if (regionalForm) {
          console.log(
            'currentMon:',
            currentMon,
            'standardizedMon:',
            standardizedMon,
            'currentSpecies:',
            currentSpecies,
            'currentEntries:',
            currentEntries,
          );
        }
        if (pokedexEntries[standardizedMon]) {
          console.log(`Duplicate entry for ${standardizedMon}`);
          const currentData = pokedexEntries[standardizedMon];
          const updatedData = {
            ...currentData,
            forms: {
              ...currentData.forms,
              [regionalForm]: {
                species: currentSpecies,
                entries: currentEntries,
              },
            },
          };
          console.log(
            'Updating existing entry:',
            standardizedMon,
            'with new form:',
            regionalForm,
            'currentData:',
            currentData,
            'updatedData:',
            updatedData,
          );
          pokedexEntries[standardizedMon] = updatedData;
        } else {
          pokedexEntries[standardizedMon] = {
            species: currentSpecies,
            entries: currentEntries,
          };
        }
        // If this is a form (has a valid regional form), also add the entry for the base mon if not present
        if (regionalForm) {
          const baseMon = standardizedMon.split('-')[0];
          if (!pokedexEntries[baseMon]) {
            pokedexEntries[baseMon] = {
              species: currentSpecies,
              entries: currentEntries,
            };
          }
        }
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
      skipConditional = true;
      continue;
    }
    if (skipConditional && line.includes('else')) {
      skipConditional = false;
      continue;
    }
    if (skipConditional && line.includes('endc')) {
      skipConditional = false;
      collectingSpecies = false;
      continue;
    }
    if (skipConditional) continue;
    // Species line (e.g., db "Seed@")
    if (collectingEntry && line.trim().startsWith('db "') && line.includes('@"')) {
      currentSpecies = line.trim().replace('db "', '').replace('@"', '');
      collectingSpecies = false;
      continue;
    }
    // Entry text lines
    if (collectingEntry && currentSpecies) {
      if (line.trim().startsWith('db ')) {
        const textMatch = line.match(/db\s+"([^"]+)"/);
        if (textMatch) {
          currentEntries.push(textMatch[1]);
        }
      } else if (line.trim().startsWith('next ')) {
        const nextMatch = line.match(/next\s+"([^"]+)"/);
        if (nextMatch) {
          currentEntries.push(nextMatch[1]);
        }
      } else if (line.trim().startsWith('page ')) {
        const pageMatch = line.match(/page\s+"([^"]+)"/);
        if (pageMatch) {
          currentEntries.push(pageMatch[1]);
        }
      }
    }
  }
  // Don't forget the last entry
  if (currentMon && currentSpecies && currentEntries.length > 0) {
    const standardizedMon = standardizePokemonKey(currentMon).toLowerCase();
    pokedexEntries[standardizedMon] = {
      species: currentSpecies,
      entries: currentEntries,
    };
    // If this is a form (contains a hyphen), also add the entry for the base mon if not present
    if (standardizedMon.includes('-')) {
      const baseMon = standardizedMon.split('-')[0];
      if (!pokedexEntries[baseMon]) {
        pokedexEntries[baseMon] = {
          species: currentSpecies,
          entries: currentEntries,
        };
      }
    }
  }

  // Clean up and format the entries
  const formattedEntries: Record<string, Record<string, PokemonDexEntry>> = {};

  for (const [mon, data] of Object.entries(pokedexEntries)) {
    const description = data.entries
      .join(' ')
      .replace(/@/g, '')
      .replace(/\s*-\s*(?=\w)/g, '')
      .replace(/\s+/g, ' ');

    console.log(data);

    const entry = {
      species: data.species,
      description: description.trim(),
    };

    if (!formattedEntries[mon]) formattedEntries[mon] = {};
    formattedEntries[mon].default = entry;

    const hasForms = data.forms && Object.keys(data.forms).length > 0;

    if (hasForms) {
      const forms = data.forms;
      for (const formKey in forms) {
        const formData = forms[formKey];
        const formDescription = formData.entries
          .join(' ')
          .replace(/@/g, '')
          .replace(/\s*-\s*(?=\w)/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Create the entry for this form
        formattedEntries[mon] = formattedEntries[mon] || {};
        formattedEntries[mon][formKey] = {
          species: formData.species,
          description: formDescription,
        };
      }
    }
    updatePokemonJsonWithDexEntry(mon, entry);
  }

  fs.writeFileSync(POKEDEX_ENTRIES_OUTPUT, JSON.stringify(formattedEntries, null, 2));
  console.log('Pokédex entries extracted to', POKEDEX_ENTRIES_OUTPUT);
}
