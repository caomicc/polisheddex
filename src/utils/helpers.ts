import {
  DEBUG_POKEMON,
  evoMap,
  formTypeMap,
  KNOWN_FORMS,
  preEvoMap,
  typeMap,
} from '../data/constants.ts';
import type {
  EncounterDetail,
  LocationAreaData,
  LocationEntry,
  PokemonDataV3,
} from '../types/types.ts';
import { extractBasePokemonName } from './extractors/pokedexExtractors.ts';
import { normalizePokemonDisplayName } from './pokemonUrlNormalizer.ts';
import { normalizeMoveString } from './stringNormalizer/stringNormalizer.ts';
import { standardizePokemonKey, toTitleCase } from './stringUtils.ts';

// Create a grouped data structure combining forms
export function groupPokemonForms(
  pokemonData: Record<string, PokemonDataV3>,
): Record<string, PokemonDataV3> {
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
      formsByBase[baseName] = { default: data };
    }
  }

  // Second pass: Combine data for each base Pokémon
  for (const [baseName, forms] of Object.entries(formsByBase)) {
    // Start with the default form as the base (plain form or first form)
    const baseForm = forms['default'] || Object.values(forms)[0];

    // console.log(`Processing base form for ${baseName} with default form:`, baseForm);

    // Ensure base form has proper types
    let baseTypes = baseForm.types;

    if (
      !baseTypes ||
      baseTypes === 'None' ||
      (Array.isArray(baseTypes) && baseTypes.includes('None'))
    ) {
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

    // Merge evolution chains from all forms to include regional form evolutions
    let mergedEvolution = baseForm.evolution;
    const allChainMembers = new Set(baseForm.evolution?.chain || []);
    const allChainMethods: Record<string, any[]> = {
      ...(baseForm.evolution?.chainWithMethods || {}),
    };
    const allMethods = [...(baseForm.evolution?.methods || [])];

    // Check all forms for additional evolution data
    for (const [formKey, formData] of Object.entries(forms)) {
      if (formKey !== 'default' && formData.evolution) {
        // Add any new chain members from this form
        formData.evolution.chain?.forEach((member) => allChainMembers.add(member));

        // Merge chain methods
        Object.entries(formData.evolution.chainWithMethods || {}).forEach(([key, methods]) => {
          if (!allChainMethods[key]) {
            allChainMethods[key] = [];
          }
          allChainMethods[key].push(...methods);
        });

        // Add any unique evolution methods
        formData.evolution.methods?.forEach((method) => {
          const existing = allMethods.find(
            (m) =>
              m.method === method.method &&
              m.target === method.target &&
              m.parameter === method.parameter,
          );
          if (!existing) {
            allMethods.push(method);
          }
        });
      }
    }

    // Update merged evolution data
    mergedEvolution = {
      methods: allMethods,
      chain: Array.from(allChainMembers),
      chainWithMethods: allChainMethods,
    };

    // Create the entry for this Pokémon
    groupedData[baseName] = {
      ...baseForm,
      types: baseTypes || baseForm.types,
      evolution: mergedEvolution,
      forms: {},
    };

    // Add all forms (including the default one)
    for (const [formName, formData] of Object.entries(forms)) {
      if (formName !== 'default') {
        // Check if we have specific type data for this form
        let formTypes = formData.types;

        // If form types are missing or set to None, try to get them from formTypeMap
        if (
          !formTypes ||
          formTypes === 'None' ||
          (Array.isArray(formTypes) && formTypes.includes('None'))
        ) {
          if (formTypeMap[baseName] && formTypeMap[baseName][formName]) {
            // Use the form-specific type data
            const formTypeArray = formTypeMap[baseName][formName];
            // Handle single type (remove duplicates or 'None')
            if (
              Array.isArray(formTypeArray) &&
              (formTypeArray.length === 1 ||
                (formTypeArray.length === 2 && formTypeArray[1] === 'None'))
            ) {
              formTypes = formTypeArray[0];
            } else {
              formTypes = Array.isArray(formTypeArray)
                ? formTypeArray.map(String)
                : [String(formTypeArray)];
            }
          }
        }

        // Ensure forms have the merged evolution data that includes regional form chains
        const formEvolutionData = formData.evolution || mergedEvolution;

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
        } as any; // Temporary type assertion to include evolution data

        // Add evolution data separately to avoid type conflicts
        (groupedData[baseName].forms![formName] as any).evolution = formEvolutionData;
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
  locationsByArea: Record<string, LocationAreaData>,
) {
  for (const location of locations) {
    if (!location.area) continue;

    // Format the area name to match UI component formatting
    const formattedAreaName = location.area
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
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
      chance: location.chance,
    };

    // Add rareItem if present (for hidden grottoes)
    if ('rareItem' in location && location.rareItem) {
      encounterDetail.rareItem = location.rareItem;
    }

    // Add form name if present
    if (formName || ('formName' in location && location.formName)) {
      encounterDetail.formName = formName || location.formName;
    }

    locationsByArea[formattedAreaName].pokemon[pokemon].methods[method].times[time].push(
      encounterDetail,
    );
  }

  // After all encounter details are added, combine duplicates (same level, same formName, same rareItem)
  for (const areaName of Object.keys(locationsByArea)) {
    const area = locationsByArea[areaName];
    if (!area.pokemon[pokemon]) continue;
    const methods = area.pokemon[pokemon].methods;
    for (const method of Object.keys(methods)) {
      const times = methods[method].times;
      for (const time of Object.keys(times)) {
        const details = times[time];
        // Group by level, formName, rareItem
        const grouped: Record<string, EncounterDetail> = {};
        for (const detail of details) {
          // Use a composite key for grouping
          const key = `${detail.level ?? ''}|${detail.formName ?? ''}|${detail.rareItem ?? ''}`;
          if (!grouped[key]) {
            grouped[key] = { ...detail };
          } else {
            grouped[key].chance += detail.chance;
          }
        }
        // Replace with grouped array
        methods[method].times[time] = Object.values(grouped);
      }
    }
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

        for (const [formKey, formValue] of Object.entries(
          valueObj.forms as Record<string, unknown>,
        )) {
          const trimmedFormKey = formKey.trim();

          // Skip form names that start with a hyphen (like "- Z") as these are likely errors
          if (trimmedFormKey.startsWith('-')) {
            console.log(
              `Skipping invalid form name "${trimmedFormKey}" for Pokémon "${trimmedKey}"`,
            );
            continue;
          }

          // Specific check for the problematic "- Z" form in Porygon
          if (
            trimmedKey.toLowerCase() === 'porygon' &&
            (trimmedFormKey === '- Z' ||
              trimmedFormKey === '-Z' ||
              trimmedFormKey === '- z' ||
              trimmedFormKey === '-z')
          ) {
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

// Helper function to extract base Pokemon name and form from evos_attacks entries
export function parseFormName(pokemonName: string): { baseName: string; formName: string | null } {
  // Directly check for Porygon-Z and similar cases that need special handling
  if (
    pokemonName.toLowerCase() === 'porygonz' ||
    pokemonName.toLowerCase() === 'porygon z' ||
    pokemonName.toLowerCase() === 'porygon-z'
  ) {
    return { baseName: 'porygon-z', formName: null };
  }

  // If the pokemon name is 'porygon' with something that looks like a Z suffix
  // but it should be Porygon-Z, handle it correctly
  if (
    pokemonName.toLowerCase().startsWith('porygon') &&
    (pokemonName.toLowerCase().endsWith('z') ||
      pokemonName.toLowerCase().includes(' z') ||
      pokemonName.toLowerCase().includes('-z'))
  ) {
    console.log(`DEBUG: Special handling for Porygon-Z variant: ${pokemonName}`);
    // If it's actually meant to be Porygon-Z, return as a distinct Pokemon, not a form
    return { baseName: 'porygon-z', formName: null };
  }

  // List of special Pokémon with hyphens in their base names
  const SPECIAL_HYPHENATED_POKEMON = [
    'farfetch-d',
    'nidoran-f',
    'nidoran-m',
    'mr-mime',
    'mime-jr',
    'ho-oh',
    'porygon-z',
    'sirfetch-d',
    'type-null',
    'jangmo-o',
    'hakamo-o',
    'kommo-o',
  ];

  // Form patterns for detecting variants
  const formPatterns = [
    { suffix: 'Plain', form: null }, // Plain forms are considered base forms
    { suffix: 'Hisuian', form: 'hisuian' },
    { suffix: 'Galarian', form: 'galarian' },
    { suffix: 'Alolan', form: 'alolan' },
    { suffix: 'Paldean', form: 'paldean' },
    { suffix: 'PaldeanFire', form: 'paldean_fire' },
    { suffix: 'PaldeanWater', form: 'paldean_water' },
    { suffix: 'Armored', form: 'armored' },
    { suffix: 'BloodMoon', form: 'bloodmoon' },
    { suffix: 'Bloodmoon', form: 'bloodmoon' }, // Add lowercase "m" version
    { suffix: 'plain', form: null },
    { suffix: 'hisui', form: 'hisui' },
    { suffix: 'galarian', form: 'galarian' },
    { suffix: 'alolan', form: 'alolan' },
    { suffix: 'paldean', form: 'paldean' },
    { suffix: 'galar', form: 'galar' },
    { suffix: 'hisuian', form: 'hisuian' },
    { suffix: 'red', form: 'red' },
    { suffix: 'bloodmoon', form: 'bloodmoon' },
    { suffix: 'paldean_fire', form: 'paldean_fire' },
    { suffix: 'paldean_water', form: 'paldean_water' },
    { suffix: 'paldean-fire', form: 'paldean_fire' },
    { suffix: 'paldean-water', form: 'paldean_water' },
  ];

  // Handle special hyphenated Pokémon first
  const lowerName = pokemonName.toLowerCase();
  for (const specialName of SPECIAL_HYPHENATED_POKEMON) {
    if (lowerName === specialName || lowerName.startsWith(specialName)) {
      // Check if there's a form suffix after the special name
      const formPart = lowerName.slice(specialName.length);
      if (!formPart) {
        return { baseName: specialName, formName: null };
      }

      // Check if the remaining part matches a known form pattern
      for (const pattern of formPatterns) {
        if (formPart.toLowerCase() === pattern.suffix.toLowerCase()) {
          return { baseName: specialName, formName: pattern.form };
        }
      }

      return { baseName: specialName, formName: null };
    }
  }

  // Handle patterns like TyphlosionHisuian, TyphlosionPlain, MrMimeGalarian, etc.
  for (const pattern of formPatterns) {
    if (pokemonName.endsWith(pattern.suffix)) {
      const baseName = pokemonName.slice(0, -pattern.suffix.length);
      console.log(
        `DEBUG: parseFormName - ${pokemonName} -> baseName: ${baseName}, formName: ${pattern.form}`,
      );
      return { baseName: normalizeMoveString(baseName), formName: pattern.form };
    }
  }

  // No form pattern found, treat as base form
  return { baseName: normalizeMoveString(pokemonName), formName: null };
}

// Helper to sort the evolution chain properly
export function sortEvolutionChain(chain: string[]): string[] {
  // Create a dependency graph for topological sorting
  const graph: Record<string, Set<string>> = {};

  // Initialize all nodes
  for (const mon of chain) {
    graph[mon] = new Set<string>();
  }

  // First pass: Add direct evolution connections to the graph
  for (const mon of chain) {
    const standardMon = standardizePokemonKey(mon);

    // Check all entries in evoMap for matches (considering form variations)
    for (const [evoKey, evos] of Object.entries(evoMap)) {
      const standardEvoKey = standardizePokemonKey(evoKey);

      // If this is the Pokémon we're looking at (either exact or standardized)
      if (evoKey === mon || standardEvoKey === standardMon) {
        // For each of its evolutions
        for (const evo of evos) {
          const targetMon = standardizePokemonKey(evo.target);
          const normalizedTargetName = normalizePokemonDisplayName(targetMon);

          // If the target is in our chain, add the dependency
          if (chain.includes(normalizedTargetName)) {
            graph[mon].add(normalizedTargetName); // mon evolves into target
          }
        }
      }
    }

    // Check all entries in preEvoMap for matches (considering form variations)
    for (const [preKey, preEvos] of Object.entries(preEvoMap)) {
      const standardPreKey = standardizePokemonKey(preKey);

      // If this is the Pokémon we're looking at (either exact or standardized)
      if (preKey === mon || standardPreKey === standardMon) {
        // For each of its pre-evolutions
        for (const pre of preEvos) {
          const standardPre = standardizePokemonKey(pre);
          const normalizedPreName = normalizePokemonDisplayName(standardPre);

          // If the pre-evolution is in our chain, add the dependency
          if (chain.includes(normalizedPreName)) {
            graph[normalizedPreName].add(mon); // pre evolves into mon
          }
        }
      }
    }
  }

  // Manual sorting based on evolution relationships
  const sortedChain: string[] = [];
  const addedNodes = new Set<string>();

  // Helper function to add a node and all its descendants
  function addNodeAndDescendants(node: string) {
    if (addedNodes.has(node)) return;
    addedNodes.add(node);
    sortedChain.push(node);

    // Add all evolutions of this node
    for (const nextNode of graph[node]) {
      if (!addedNodes.has(nextNode)) {
        addNodeAndDescendants(nextNode);
      }
    }
  }

  // Find nodes with no incoming edges (base forms)
  const baseNodes: string[] = [];
  for (const node of chain) {
    let hasIncoming = false;
    for (const outgoingNodes of Object.values(graph)) {
      if (outgoingNodes.has(node)) {
        hasIncoming = true;
        break;
      }
    }
    if (!hasIncoming) {
      baseNodes.push(node);
    }
  }

  // Add base nodes first, followed by their evolutions
  for (const node of baseNodes) {
    addNodeAndDescendants(node);
  }

  // Add any remaining nodes that weren't connected
  for (const node of chain) {
    if (!addedNodes.has(node)) {
      sortedChain.push(node);
    }
  }

  return sortedChain;
}

// Helper function to parse fish groups from fish.asm
export function parseFishGroups(
  content: string,
): Record<
  string,
  Record<string, Array<{ species: string; level: number; chance: number; form?: string }>>
> {
  const fishGroups: Record<
    string,
    Record<string, Array<{ species: string; level: number; chance: number; form?: string }>>
  > = {};
  const lines = content.split(/\r?\n/);

  let currentGroup: string | null = null;
  let currentRod: string | null = null;
  let currentEncounters: Array<{ species: string; level: number; chance: number; form?: string }> =
    [];
  let previousChance = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse fish group section headers like ".Shore_Old:"
    const groupMatch = trimmed.match(/^\.([A-Za-z_]+)_([A-Za-z]+):$/);
    if (groupMatch) {
      // Save previous encounters if any
      if (currentGroup && currentRod && currentEncounters.length > 0) {
        if (!fishGroups[currentGroup]) fishGroups[currentGroup] = {};
        fishGroups[currentGroup][currentRod] = [...currentEncounters];
      }

      currentGroup = groupMatch[1].toLowerCase();
      currentRod = groupMatch[2].toLowerCase();
      currentEncounters = [];
      previousChance = 0;
      continue;
    }

    // Parse fishentry lines
    const fishentryMatch = trimmed.match(
      /fishentry\s+(\d+)\s+percent(?:\s*\+\s*\d+)?,\s*([A-Z0-9_]+|\d+),\s*(\d+)/,
    );
    if (fishentryMatch && currentGroup && currentRod) {
      const [, chanceStr, speciesStr, levelStr] = fishentryMatch;
      const cumulativeChance = parseInt(chanceStr, 10);
      const actualChance = cumulativeChance - previousChance;

      // Handle special cases
      let species = speciesStr;
      let form: string | undefined;

      if (species === '0') {
        // Time-based species (corsola/staryu)
        species = 'CORSOLA'; // Default to corsola, could be enhanced for time-based logic
      }

      currentEncounters.push({
        species: species.toLowerCase(),
        level: parseInt(levelStr, 10),
        chance: actualChance,
        form,
      });

      previousChance = cumulativeChance;
    }
  }

  // Save last group
  if (currentGroup && currentRod && currentEncounters.length > 0) {
    if (!fishGroups[currentGroup]) fishGroups[currentGroup] = {};
    fishGroups[currentGroup][currentRod] = [...currentEncounters];
  }

  return fishGroups;
}

// Helper function to parse location to fish group mappings
export function parseFishLocationMappings(content: string): Record<string, string> {
  const mappings: Record<string, string> = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    const mapMatch = trimmed.match(/fishmon_map\s+([A-Z0-9_]+),\s*FISHGROUP_([A-Z0-9_]+)/);
    if (mapMatch) {
      const [, location, fishGroup] = mapMatch;
      mappings[location] = fishGroup.toLowerCase();
    }
  }

  return mappings;
}

// Helper function to extract form information from Pokemon names like "SlowpokeGalarian"
export function parseFormFromName(pokemonName: string): {
  baseName: string;
  formName: string | null;
} {
  // Common form suffixes in the ROM data
  const formSuffixes = ['Galarian', 'Alolan', 'Hisuian', 'Paldean', 'Plain'];

  for (const suffix of formSuffixes) {
    if (pokemonName.endsWith(suffix)) {
      const baseName = pokemonName.slice(0, -suffix.length);
      const formName = suffix.toLowerCase() === 'plain' ? null : suffix.toLowerCase();
      return { baseName, formName };
    }
  }

  // No form suffix found
  return { baseName: pokemonName, formName: null };
}

/**
 * Robust function to check if a Pokémon name matches any name in the DEBUG_POKEMON list
 * Handles various edge cases and name formats
 */
export function isDebugPokemon(pokemonName: string): boolean {
  if (!pokemonName) return false;

  // Normalize the input name by removing common variations
  const normalizedInput = standardizePokemonKey(pokemonName);

  // Also try with the original name and some common transformations
  const namesToCheck = [
    pokemonName,
    normalizedInput,
    toTitleCase(pokemonName),
    pokemonName.replace(/_/g, ''),
    pokemonName.replace(/([a-z])([A-Z])/g, '$1$2'), // Remove internal caps
    pokemonName.toLowerCase(),
    pokemonName.toUpperCase(),
  ];

  // Remove duplicates
  const uniqueNames = [...new Set(namesToCheck)];

  // Check each variation against the debug list
  for (const name of uniqueNames) {
    if (DEBUG_POKEMON.includes(name)) {
      return true;
    }
    // Also check if any debug Pokemon is a substring match (for partial matches)
    if (
      DEBUG_POKEMON.some(
        (debugName) =>
          name.toLowerCase().includes(debugName.toLowerCase()) ||
          debugName.toLowerCase().includes(name.toLowerCase()),
      )
    ) {
      return true;
    }
  }

  return false;
}
