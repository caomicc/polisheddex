/**
 * Utility functions for handling and displaying Pokémon forms
 */

import { KNOWN_FORMS } from '@/data/constants';

/**
 * Extract form information from a Pokémon name
 * @param pokemonName - The full Pokémon name that may contain a form
 * @returns Object with base name and form name
 */
export function extractPokemonForm(pokemonName: string): {
  baseName: string;
  formName: string | null;
} {
  // Special cases for Pokémon with hyphens that aren't forms
  const specialHyphenatedPokemon = [
    'nidoran-f', 'nidoran-m', 'mr-mime', 'mime-jr', 'ho-oh',
    'porygon-z', 'farfetch-d', 'sirfetch-d', 'type-null',
    'mr-rime', 'jangmo-o', 'hakamo-o', 'kommo-o'
  ];

  const lowerName = pokemonName.toLowerCase();

  // Check if this is a special hyphenated Pokémon (no form)
  if (specialHyphenatedPokemon.includes(lowerName)) {
    return { baseName: pokemonName, formName: null };
  }

  // Check for known regional forms
  for (const [key, formValue] of Object.entries(KNOWN_FORMS)) {
    const formPattern = new RegExp(`\\b${formValue.replace('_', '[_\\s-]?')}\\b`, 'i');

    if (formPattern.test(pokemonName)) {
      // Extract base name by removing the form
      const baseName = pokemonName.replace(formPattern, '').trim();
      return {
        baseName: baseName || pokemonName,
        formName: formValue
      };
    }
  }

  // Check for compound forms (like "paldean fire", "paldean water")
  if (lowerName.includes('paldean')) {
    if (lowerName.includes('fire')) {
      return {
        baseName: pokemonName.replace(/paldean[_\s-]?fire/i, '').trim(),
        formName: KNOWN_FORMS.PALDEAN_FIRE
      };
    }
    if (lowerName.includes('water')) {
      return {
        baseName: pokemonName.replace(/paldean[_\s-]?water/i, '').trim(),
        formName: KNOWN_FORMS.PALDEAN_WATER
      };
    }
  }

  return { baseName: pokemonName, formName: null };
}

/**
 * Format a Pokémon name with its form for display
 * @param pokemonName - The full Pokémon name
 * @returns Formatted display string
 */
export function formatPokemonDisplayWithForm(pokemonName: string): string {
  const { baseName, formName } = extractPokemonForm(pokemonName);

  if (!formName) {
    return formatPokemonBaseName(baseName);
  }

  const formattedBaseName = formatPokemonBaseName(baseName);
  const formattedFormName = formatFormName(formName);

  return `${formattedBaseName} (${formattedFormName})`;
}

/**
 * Format the base Pokémon name for display
 * @param baseName - The base Pokémon name
 * @returns Formatted base name
 */
function formatPokemonBaseName(baseName: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'nidoran-f': 'Nidoran ♀',
    'nidoran-m': 'Nidoran ♂',
    'mr-mime': 'Mr. Mime',
    'mime-jr': 'Mime Jr.',
    'ho-oh': 'Ho-Oh',
    'porygon-z': 'Porygon-Z',
    'farfetch-d': 'Farfetch\'d',
    'sirfetch-d': 'Sirfetch\'d',
    'mr-rime': 'Mr. Rime',
    'type-null': 'Type: Null',
    'jangmo-o': 'Jangmo-o',
    'hakamo-o': 'Hakamo-o',
    'kommo-o': 'Kommo-o'
  };

  const lowerName = baseName.toLowerCase();
  if (specialCases[lowerName]) {
    return specialCases[lowerName];
  }

  // Default formatting: capitalize first letter of each word, preserve hyphens
  return baseName
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(baseName.includes('-') ? '-' : ' ');
}

/**
 * Format form name for display
 * @param formName - The form identifier
 * @returns User-friendly form name
 */
function formatFormName(formName: string): string {
  const formDisplayNames: Record<string, string> = {
    [KNOWN_FORMS.ALOLAN]: 'Alolan',
    [KNOWN_FORMS.GALARIAN]: 'Galarian',
    [KNOWN_FORMS.HISUIAN]: 'Hisuian',
    [KNOWN_FORMS.PALDEAN]: 'Paldean',
    [KNOWN_FORMS.PALDEAN_FIRE]: 'Paldean Fire',
    [KNOWN_FORMS.PALDEAN_WATER]: 'Paldean Water',
    [KNOWN_FORMS.ARMORED]: 'Armored',
    [KNOWN_FORMS.BLOODMOON]: 'Blood Moon',
    [KNOWN_FORMS.GALAR]: 'Galar',
    [KNOWN_FORMS.HISUI]: 'Hisui',
    [KNOWN_FORMS.RED]: 'Red',
    [KNOWN_FORMS.PLAIN]: 'Plain'
  };

  return formDisplayNames[formName] || formName.charAt(0).toUpperCase() + formName.slice(1);
}

/**
 * Check if a Pokémon name contains a regional or alternate form
 * @param pokemonName - The Pokémon name to check
 * @returns True if the name contains a form
 */
export function hasForm(pokemonName: string): boolean {
  const { formName } = extractPokemonForm(pokemonName);
  return formName !== null;
}

/**
 * Get the form type for styling purposes
 * @param formName - The form identifier
 * @returns CSS class or styling identifier for the form
 */
export function getFormTypeClass(formName: string | null): string {
  if (!formName) return '';

  const formClasses: Record<string, string> = {
    [KNOWN_FORMS.ALOLAN]: 'form-alolan',
    [KNOWN_FORMS.GALARIAN]: 'form-galarian',
    [KNOWN_FORMS.HISUIAN]: 'form-hisuian',
    [KNOWN_FORMS.PALDEAN]: 'form-paldean',
    [KNOWN_FORMS.PALDEAN_FIRE]: 'form-paldean-fire',
    [KNOWN_FORMS.PALDEAN_WATER]: 'form-paldean-water',
    [KNOWN_FORMS.ARMORED]: 'form-armored',
    [KNOWN_FORMS.BLOODMOON]: 'form-bloodmoon'
  };

  return formClasses[formName] || '';
}
