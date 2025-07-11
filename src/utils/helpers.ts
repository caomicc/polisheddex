import { formTypeMap, KNOWN_FORMS, typeMap } from "../data/constants.ts";
import type { PokemonDataV3 } from "../types/types.ts";
import { extractBasePokemonName } from "./extractUtils.ts";

// Create a grouped data structure combining forms
export function groupPokemonForms(pokemonData: Record<string, PokemonDataV3>): Record<string, PokemonDataV3> {
  const groupedData: Record<string, PokemonDataV3> = {};
  const formsByBase: Record<string, Record<string, PokemonDataV3>> = {};

  // console.log('Starting to group Pokémon forms...', pokemonData);

  // Skip entries with 'plain' in the name - we'll merge these later
  const pokemonWithoutPlain: Record<string, PokemonDataV3> = {};
  const plainForms: Record<string, PokemonDataV3> = {};

  // Pre-process to identify plain forms
  for (const [name, data] of Object.entries(pokemonData)) {
    if (name.toLowerCase().endsWith(KNOWN_FORMS.PLAIN)) {
      // Store plain forms separately
      const baseName = name.substring(0, name.length - KNOWN_FORMS.PLAIN.length); // Remove 'plain' suffix
      plainForms[baseName] = data;
    } else {
      // Keep non-plain forms
      pokemonWithoutPlain[name] = data;
    }
  }

  // First pass: Group by base name and identify forms
  for (const [name, data] of Object.entries(pokemonWithoutPlain)) {
    const baseName = extractBasePokemonName(name);

    // console.log(`1 Processing ${name} with base name ${baseName}`);

    // Initialize baseName entry if it doesn't exist
    if (!formsByBase[baseName]) {
      formsByBase[baseName] = {};

      // If we have a plain form for this base name, use it as the default
      if (plainForms[baseName]) {
        formsByBase[baseName]['default'] = plainForms[baseName];
      }
    }

    // Determine form name
    let formName: string | null = null;
    if (name !== baseName) {
      formName = name.substring(baseName.length);
    }

    // Add to the forms collection
    const formKey = formName || 'default';
    formsByBase[baseName][formKey] = data;
  }

  // Add any plain forms that don't have a corresponding base form
  for (const [baseName, data] of Object.entries(plainForms)) {
    if (!formsByBase[baseName]) {
      formsByBase[baseName] = { 'default': data };
    }
  }

  // Second pass: Combine data for each base Pokémon
  for (const [baseName, forms] of Object.entries(formsByBase)) {
    // Start with the default form as the base (plain form or first form)
    const baseForm = forms['default'] || Object.values(forms)[0];

    // console.log(`Processing base form for ${baseName} with default form:`, baseForm);

    // Ensure base form has proper types
    let baseTypes = baseForm.types;

    if (!baseTypes || baseTypes === 'None' || (Array.isArray(baseTypes) && baseTypes.includes('None'))) {
      if (typeMap[baseName]) {
        const types = typeMap[baseName];
        if (types.length === 1 || (types.length === 2 && types[1] === 'None')) {
          baseTypes = types[0];
        } else {
          baseTypes = types;
        }
      }
    }

    // Create the entry for this Pokémon
    groupedData[baseName] = {
      ...baseForm,
      types: baseTypes || baseForm.types,
      forms: {}
    };

    // Add all forms (including the default one)
    for (const [formName, formData] of Object.entries(forms)) {
      if (formName !== 'default') {
        // Check if we have specific type data for this form
        let formTypes = formData.types;

        // If form types are missing or set to None, try to get them from formTypeMap
        if (!formTypes || formTypes === 'None' || (Array.isArray(formTypes) && formTypes.includes('None'))) {
          if (formTypeMap[baseName] && formTypeMap[baseName][formName]) {
            // Use the form-specific type data
            const formTypeArray = formTypeMap[baseName][formName];
            // Handle single type (remove duplicates or 'None')
            if (formTypeArray.length === 1 || (formTypeArray.length === 2 && formTypeArray[1] === 'None')) {
              formTypes = formTypeArray[0];
            } else {
              formTypes = formTypeArray;
            }
          }
        }

        groupedData[baseName].forms![formName] = {
          formName,
          types: formTypes,
          moves: formData.moves,
          locations: formData.locations
        };
      }
    }

    // If there are no non-default forms, clean up the empty forms object
    if (Object.keys(groupedData[baseName].forms!).length === 0) {
      delete groupedData[baseName].forms;
    }
  }

  return groupedData;
}
