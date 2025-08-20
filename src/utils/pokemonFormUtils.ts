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
    'nidoran-f',
    'nidoran-m',
    'mr-mime',
    'mime-jr',
    'ho-oh',
    'porygon-z',
    'farfetch-d',
    'farfetch-d',
    'sirfetch-d',
    'type-null',
    'mr-rime',
    'jangmo-o',
    'hakamo-o',
    'kommo-o',
  ];

  let lowerName = pokemonName.toLowerCase();

  // Trim the end of the string if it matches any KNOWN_FORM (with or without _form suffix)
  for (const formValue of Object.values(KNOWN_FORMS)) {
    const formPattern = new RegExp(`[-_\\s]?${formValue.toLowerCase()}?$`, 'i');
    if (lowerName.match(formPattern)) {
      lowerName = lowerName.replace(formPattern, '').replace(/[-_\\s]+$/, '');
      break;
    }
  }

  // Check if this is a special hyphenated Pokémon (no form)
  if (specialHyphenatedPokemon.includes(lowerName)) {
    return { baseName: pokemonName, formName: null };
  }

  // Check for parentheses form first (like "Arbok (Johto)")
  const parenthesesMatch = pokemonName.match(/^(.+?)\s*\(([^)]+)\)/);
  if (parenthesesMatch) {
    const baseName = parenthesesMatch[1].trim();
    const formInParentheses = parenthesesMatch[2];
    const normalizedForm = normalizeFormName(formInParentheses);

    return {
      baseName: baseName,
      formName: normalizedForm,
    };
  }

  // Check for known regional forms
  for (const [key, formValue] of Object.entries(KNOWN_FORMS)) {
    // Match if the string ends with the form value (with or without _form suffix), not just _form
    // Accepts separators before the form value
    const formPattern = new RegExp(
      `[-_\\s](${formValue.replace(/_/g, '[-_\\s]?')})([-_\\s]?form)?$`,
      'i',
    );
    const match = pokemonName.match(formPattern);

    if (match && match[1].toLowerCase() === formValue.toLowerCase()) {
      // Extract base name by removing the matched form pattern
      const baseName = pokemonName
        .slice(0, match.index)
        .replace(formPattern, '')
        .replace(/[-_\\s]+$/, '')
        .trim();
      return {
        baseName: baseName || pokemonName,
        formName: formValue,
      };
    }
  }

  // Check for compound forms (like "paldean fire", "paldean water")
  if (lowerName.includes('paldean')) {
    if (lowerName.includes('fire')) {
      return {
        baseName: pokemonName.replace(/paldean[_\s-]?fire/i, '').trim(),
        formName: KNOWN_FORMS.PALDEAN_FIRE,
      };
    }
    if (lowerName.includes('water')) {
      return {
        baseName: pokemonName.replace(/paldean[_\s-]?water/i, '').trim(),
        formName: KNOWN_FORMS.PALDEAN_WATER,
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

  console.log('formatPokemonDisplayWithForm', { pokemonName, baseName, formName });

  if (!formName) {
    return formatPokemonBaseName(baseName);
  }

  const formattedBaseName = formatPokemonBaseName(baseName);
  const formattedFormName = formatFormName(formName);

  return `${formattedBaseName} (${formattedFormName})`;
}

/**
 * Format a Pokémon name with its form for display
 * @param pokemonName - The full Pokémon name
 * @returns Formatted display string
 */
/**
 * Format a Pokémon URL path with its form as a query string if present
 * @param pokemonName - The full Pokémon name
 * @returns URL string like "/pokemon/bulbasaur" or "/pokemon/oricorio?form=baile"
 */
export function formatPokemonUrlWithForm(pokemonName: string, formString: string): string {
  const { baseName, formName } = extractPokemonForm(pokemonName);
  // console.log('formatPokemonUrlWithForm', { baseName, formName });
  const base = `/pokemon/${encodeURIComponent(formatPokemonBaseName(baseName).toLowerCase().replace(/'/g, '-'))}`;

  // Normalize the form string if it has parentheses
  const normalizedFormString = formString ? normalizeFormName(formString) : formString;
  const finalFormName = formName || normalizedFormString;

  if (finalFormName && finalFormName !== 'plain') {
    // Remove _form suffix if present
    const formParam = encodeURIComponent(finalFormName.toLowerCase().replace(/_form$/, ''));
    return `${base}?form=${formParam}`;
  }
  return base;
}

/**
 * Format the base Pokémon name for display
 * @param baseName - The base Pokémon name
 * @returns Formatted base name
 */
export function formatPokemonBaseName(baseName: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'nidoran-f': 'Nidoran ♀',
    'nidoran-m': 'Nidoran ♂',
    'mr-mime': 'Mr. Mime',
    'mime-jr': 'Mime Jr.',
    'ho-oh': 'Ho-Oh',
    'porygon-z': 'Porygon-Z',
    'farfetch-d': "Farfetch'd",
    'sirfetch-d': "Sirfetch'd",
    'mr-rime': 'Mr. Rime',
    'type-null': 'Type: Null',
    'jangmo-o': 'Jangmo-o',
    'hakamo-o': 'Hakamo-o',
    'kommo-o': 'Kommo-o',
    ekansarbok: 'Ekans',
    'ekansarbok-johto-form': 'Ekans',
    'arbokarbok-johto-form': 'Arbok',
    'ekansarbok-kanto-form': 'Ekans',
    'arbokarbok-kanto-form': 'Arbok',
    arbok: 'Arbok',
    arbokarbok: 'Arbok',
  };

  let lowerName = baseName.toLowerCase();

  for (const formValue of Object.values(KNOWN_FORMS)) {
    if (lowerName.endsWith(formValue.toLowerCase())) {
      // Remove the form name from the end and trim any trailing separators
      const trimmed = lowerName
        .replace(new RegExp(`[-_\\s]?${formValue.toLowerCase()}$`), '')
        .split(/[\s-]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
      return trimmed.join(' ');
    }
  }

  if (specialCases[lowerName]) {
    return specialCases[lowerName];
  }

  // Default formatting: capitalize first letter of each word, preserve hyphens
  return lowerName
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(baseName.includes('-') ? '-' : ' ');
}

/**
 * Normalize form names that come with parentheses like "Arbok (Johto)" to just "johto"
 * @param formName - The form identifier that may contain parentheses
 * @returns Normalized form name
 */
export function normalizeFormName(formName: string): string {
  if (!formName) return formName;

  // Extract text from parentheses like "Arbok (Johto)" -> "Johto"
  const parenthesesMatch = formName.match(/\(([^)]+)\)/);
  if (parenthesesMatch) {
    const extractedForm = parenthesesMatch[1].toLowerCase().trim();

    // Map common form names to their canonical values
    const formMappings: Record<string, string> = {
      johto: KNOWN_FORMS.JOHTO_FORM,
      kanto: KNOWN_FORMS.KANTO_FORM,
      koga: KNOWN_FORMS.KOGA_FORM,
      agatha: KNOWN_FORMS.AGATHA_FORM,
      ariana: KNOWN_FORMS.ARIANA_FORM,
      alolan: KNOWN_FORMS.ALOLAN,
      galarian: KNOWN_FORMS.GALARIAN,
      hisuian: KNOWN_FORMS.HISUIAN,
      paldean: KNOWN_FORMS.PALDEAN,
    };

    return formMappings[extractedForm] || extractedForm;
  }

  // If no parentheses, check if it needs normalization
  const lowerForm = formName.toLowerCase().trim();
  const formMappings: Record<string, string> = {
    johto: KNOWN_FORMS.JOHTO_FORM,
    kanto: KNOWN_FORMS.KANTO_FORM,
    koga: KNOWN_FORMS.KOGA_FORM,
    agatha: KNOWN_FORMS.AGATHA_FORM,
    ariana: KNOWN_FORMS.ARIANA_FORM,
    alolan: KNOWN_FORMS.ALOLAN,
    galarian: KNOWN_FORMS.GALARIAN,
    hisuian: KNOWN_FORMS.HISUIAN,
    paldean: KNOWN_FORMS.PALDEAN,
  };

  return formMappings[lowerForm] || formName;
}

/**
 * Format form name for display
 * @param formName - The form identifier
 * @returns User-friendly form name
 */
export function formatFormName(formName: string): string {
  // First normalize the form name in case it has parentheses
  const normalizedForm = normalizeFormName(formName);

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
    [KNOWN_FORMS.PIKACHU_FLY_FORM]: 'Flying',
    [KNOWN_FORMS.PIKACHU_SURF_FORM]: 'Surfing',
    [KNOWN_FORMS.PLAIN]: 'Plain',
    [KNOWN_FORMS.JOHTO_FORM]: 'Johto',
    [KNOWN_FORMS.ARBOK_JOHTO_FORM]: 'Johto',
    [KNOWN_FORMS.KANTO_FORM]: 'Kanto',
    [KNOWN_FORMS.KOGA_FORM]: 'Koga',
    [KNOWN_FORMS.AGATHA_FORM]: 'Agatha',
    [KNOWN_FORMS.ARIANA_FORM]: 'Ariana',
  };

  return (
    formDisplayNames[normalizedForm] ||
    normalizedForm.charAt(0).toUpperCase() + normalizedForm.slice(1)
  );
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
    [KNOWN_FORMS.BLOODMOON]: 'form-bloodmoon',
    [KNOWN_FORMS.PIKACHU_FLY_FORM]: 'form-flying',
    [KNOWN_FORMS.PIKACHU_SURF_FORM]: 'form-surfing',
  };

  return formClasses[formName] || '';
}
