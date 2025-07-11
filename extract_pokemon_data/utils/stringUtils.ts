/**
 * String utility functions for working with Pokémon data
 */

import { KNOWN_FORMS } from '../data/constants.js';

/**
 * Converts a string to capital case with spaces
 * @param str Input string to format
 * @returns Formatted string in capital case with spaces
 */
export function toCapitalCaseWithSpaces(str: string): string {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Normalizes ASM labels to move keys (e.g., BatonPass -> BATON_PASS, Psybeam -> PSY_BEAM)
 * @param label The ASM label to normalize
 * @returns The normalized move key
 */
export function normalizeAsmLabelToMoveKey(label: string): string {
  return label
    .replace(/DESCRIPTION$/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2') // lowerUpper -> lower_Upper
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // ABBRWord -> ABBR_Word
    .toUpperCase();
}

/**
 * Normalizes a Pokémon name and form
 * @param name The original name
 * @param form The form name or null
 * @returns An object containing the normalized base name and form name
 */
export function normalizeMonName(name: string, form: string | null): { baseName: string; formName: string | null } {
  let baseName = name;
  let formName = form;

  // Handle specific Pokémon name formatting
  switch (name) {
    case 'NIDORAN_F':
      baseName = 'Nidoran♀';
      break;
    case 'NIDORAN_M':
      baseName = 'Nidoran♂';
      break;
    case 'FARFETCH_D':
      baseName = 'Farfetch\'d';
      break;
    case 'HO_OH':
      baseName = 'Ho-Oh';
      break;
    case 'MR__MIME':
      baseName = 'Mr. Mime';
      break;
    case 'MIME_JR':
      baseName = 'Mime Jr.';
      break;
    case 'MR__RIME':
      baseName = 'Mr. Rime';
      break;
    case 'FLABEBE':
      baseName = 'Flabébé';
      break;
    case 'TYPE_NULL':
      baseName = 'Type: Null';
      break;
    case 'JANGMO_O':
      baseName = 'Jangmo-o';
      break;
    case 'HAKAMO_O':
      baseName = 'Hakamo-o';
      break;
    case 'KOMMO_O':
      baseName = 'Kommo-o';
      break;
    default:
      baseName = toCapitalCaseWithSpaces(name);
      break;
  }

  // Process form name if present
  if (formName) {
    if (formName === KNOWN_FORMS.PALDEAN) {
      formName = KNOWN_FORMS.PALDEAN;
    } else if (formName === KNOWN_FORMS.PALDEAN_FIRE) {
      formName = KNOWN_FORMS.PALDEAN_FIRE;
    } else if (formName === KNOWN_FORMS.PALDEAN_WATER) {
      formName = KNOWN_FORMS.PALDEAN_WATER;
    } else if (formName === KNOWN_FORMS.ALOLAN) {
      formName = ' (Alolan)';
    } else if (formName === KNOWN_FORMS.GALARIAN) {
      formName = ' (Galarian)';
    } else if (formName === KNOWN_FORMS.HISUIAN) {
      formName = ' (Hisuian)';
    } else {
      formName = ` (${toCapitalCaseWithSpaces(formName)})`;
    }
  }

  return { baseName, formName };
}

/**
 * Gets the full Pokémon name including form information
 * @param name Base name of the Pokémon
 * @param form Form name if applicable
 * @returns Properly formatted full Pokémon name
 */
export function getFullPokemonName(name: string, form: string | null): string {
  const { baseName, formName } = normalizeMonName(name, form);

  // For the special Paldean forms, use a unique separator to make extraction easier
  if (formName === KNOWN_FORMS.PALDEAN_FIRE || formName === KNOWN_FORMS.PALDEAN_WATER) {
    return `${baseName}-${formName}`;  // Use a separator for these complex forms
  }

  return formName ? `${baseName}${formName}` : baseName;
}
