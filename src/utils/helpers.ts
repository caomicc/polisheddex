import { formTypeMap, KNOWN_FORMS, typeMap } from "../data/constants.ts";
import type { EncounterDetail, LocationAreaData, LocationEntry, PokemonDataV3 } from "../types/types.ts";
import { extractBasePokemonName } from "./extractors/pokedexExtractors.ts";

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
        if (Array.isArray(types)) {
          if (types.length === 1 || (types.length === 2 && types[1] === 'None')) {
            baseTypes = types[0];
          } else {
            baseTypes = Array.isArray(types) ? types : [types];
          }
        } else {
          baseTypes = Array.isArray(types) ? types : [types.toString()];
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
            if (Array.isArray(formTypeArray) && (formTypeArray.length === 1 || (formTypeArray.length === 2 && formTypeArray[1] === 'None'))) {
              formTypes = formTypeArray[0];
            } else {
              formTypes = Array.isArray(formTypeArray)
                ? formTypeArray.map(String)
                : [String(formTypeArray)];
            }
          }
        }

        groupedData[baseName].forms![formName] = {
          ...formData,
          formName,
          types: formTypes,
          moves: formData.moves,
          locations: formData.locations,
          baseStats: formData.baseStats,
          catchRate: formData.catchRate,
          baseExp: formData.baseExp,
          heldItems: formData.heldItems,
          abilities: formData.abilities,
          genderRatio: formData.genderRatio,
          height: formData.height,
          weight: formData.weight,
          bodyColor: formData.bodyColor,
          bodyShape: formData.bodyShape,
          // habitat: formData.habitat,
          // generation: formData.generation
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


// Helper function to process locations
export function processLocations(
  pokemon: string,
  locations: LocationEntry[],
  formName: string | null,
  locationsByArea: Record<string, LocationAreaData>
) {
  for (const location of locations) {
    if (!location.area) continue;

    // Format the area name to match UI component formatting
    const formattedAreaName = location.area
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    const method = location.method || 'unknown';
    const time = location.time || 'any';

    // Initialize area if it doesn't exist
    if (!locationsByArea[formattedAreaName]) {
      locationsByArea[formattedAreaName] = { pokemon: {} };
    }

    // Initialize Pokemon in this area if it doesn't exist
    if (!locationsByArea[formattedAreaName].pokemon[pokemon]) {
      locationsByArea[formattedAreaName].pokemon[pokemon] = { methods: {} };
    }

    // Initialize method if it doesn't exist
    if (!locationsByArea[formattedAreaName].pokemon[pokemon].methods[method]) {
      locationsByArea[formattedAreaName].pokemon[pokemon].methods[method] = { times: {} };
    }

    // Initialize time if it doesn't exist
    if (!locationsByArea[formattedAreaName].pokemon[pokemon].methods[method].times[time]) {
      locationsByArea[formattedAreaName].pokemon[pokemon].methods[method].times[time] = [];
    }

    // Add encounter details
    const encounterDetail: EncounterDetail = {
      level: location.level,
      chance: location.chance
    };

    // Add rareItem if present (for hidden grottoes)
    if ('rareItem' in location && location.rareItem) {
      encounterDetail.rareItem = location.rareItem;
    }

    // Add form name if present
    if (formName || ('formName' in location && location.formName)) {
      encounterDetail.formName = formName || location.formName;
    }

    locationsByArea[formattedAreaName].pokemon[pokemon].methods[method].times[time].push(encounterDetail);
  }
}


// Add function to validate and normalize Pokemon keys
export function validatePokemonKeys<T>(jsonData: Record<string, T>): Record<string, T> {
  const validatedData: Record<string, T> = {};

  for (const [key, value] of Object.entries(jsonData)) {
    const trimmedKey = key.trim();

    console.log(`Validating Pokémon key: x${trimmedKey}x`);

    // Deep clean any nested forms objects
    if (typeof value === 'object' && value !== null) {
      const valueObj = value as Record<string, unknown>;
      if (valueObj.forms && typeof valueObj.forms === 'object') {
        const cleanedForms: Record<string, unknown> = {};

        for (const [formKey, formValue] of Object.entries(valueObj.forms as Record<string, unknown>)) {
          const trimmedFormKey = formKey.trim();

          // Skip form names that start with a hyphen (like "- Z") as these are likely errors
          if (trimmedFormKey.startsWith('-')) {
            console.log(`Skipping invalid form name "${trimmedFormKey}" for Pokémon "${trimmedKey}"`);
            continue;
          }

          // Specific check for the problematic "- Z" form in Porygon
          if (trimmedKey.toLowerCase() === 'porygon' &&
            (trimmedFormKey === '- Z' || trimmedFormKey === '-Z' || trimmedFormKey === '- z' || trimmedFormKey === '-z')) {
            console.log(`Skipping invalid "- Z" form for Porygon`);
            continue;
          }

          cleanedForms[trimmedFormKey] = formValue;
        }

        // Only set forms if there are any valid forms left
        if (Object.keys(cleanedForms).length > 0) {
          valueObj.forms = cleanedForms;
        } else {
          delete valueObj.forms;
        }
      }
    }

    validatedData[trimmedKey] = value;
  }

  console.log('Validated Pokemon keys to remove trailing spaces');
  return validatedData;
}
