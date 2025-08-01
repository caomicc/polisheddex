import fs from 'node:fs';
import { KNOWN_FORMS } from '../data/constants.ts';
import { toTitleCase } from './stringUtils.ts';

/**
 * Accepts a file path to a dex order file and returns an array of TitleCase names in order
 */
export function parseDexEntries(file: string): string[] {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const names: string[] = [];

  // Keep track of Pokemon that have been processed to avoid duplicates
  const processedBaseNames = new Set<string>();

  // Check if this is a dp-style file (dex_order_new.asm) or a SECTION-style file (dex_entries.asm)
  const isOrderStyle = text.includes('dp ');

  for (const line of lines) {
    if (isOrderStyle) {
      // Look for lines with dp POKEMON_NAME format
      const match = line.match(/dp ([A-Z0-9_]+)/);
      if (match) {
        const name = toTitleCase(match[1]);
        if (!processedBaseNames.has(name)) {
          processedBaseNames.add(name);
          names.push(name);
        }
      }
    } else {
      // Look for lines with SECTION "PokemonNamePokedexEntry" format
      const match = line.match(/SECTION "([A-Za-z0-9_]+)PokedexEntry"/);
      if (match) {
        let name = match[1];

        // Remove form suffixes from names
        for (const form of Object.values(KNOWN_FORMS)) {
          const formCapitalized = form.charAt(0).toUpperCase() + form.slice(1);
          if (name.endsWith(formCapitalized)) {
            name = name.slice(0, name.length - formCapitalized.length);
            break;
          }
        }

        // Convert to TitleCase
        name = toTitleCase(name);

        if (!processedBaseNames.has(name)) {
          processedBaseNames.add(name);
          names.push(name);
        }
      }
    }
  }
  return names;
}
