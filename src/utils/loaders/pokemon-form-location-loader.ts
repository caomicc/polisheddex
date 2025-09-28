// /**
//  * Utility to load location data for Pokemon forms
//  */

// import { loadJsonFile } from '../fileLoader';
// import { extractPokemonForm } from '../pokemonFormUtils';

// interface LocationData {
//   area: string;
//   method: string;
//   time: string;
//   level: string;
//   chance: number;
//   formName?: string | null;
//   rareItem?: string;
// }

// interface PokemonLocationData {
//   locations: LocationData[];
// }

// /**
//  * Load location data for a specific Pokemon form
//  * @param pokemonName - The base Pokemon name (e.g., "arbok")
//  * @param formName - The form name (e.g., "johto")
//  * @returns Location data for the specific form, or null if not found
//  */
// export async function loadFormLocationData(
//   pokemonName: string,
//   formName: string | null,
// ): Promise<LocationData[] | null> {
//   try {
//     // Load the pokemon_locations.json file
//     const allLocationData = await loadJsonFile<Record<string, PokemonLocationData>>(
//       'output/pokemon_locations.json',
//     );

//     if (!allLocationData) {
//       return null;
//     }

//     // If no form specified, try to load base Pokemon data
//     if (!formName) {
//       const baseData = allLocationData[pokemonName.toLowerCase()];
//       return baseData?.locations || null;
//     }

//     // Try different possible form key formats
//     const possibleKeys = [
//       `${pokemonName.toLowerCase()}-${formName.toLowerCase()}-form`,
//       `${pokemonName.toLowerCase()}-${formName.toLowerCase()}`,
//       `${pokemonName.toLowerCase()}${formName.toLowerCase()}`,
//       // Handle compound names like "ekansarbok-johto-form"
//       `${pokemonName.toLowerCase()}${formName.toLowerCase()}-form`,
//     ];

//     // Also try the form name patterns we've seen in the data
//     const additionalKeys = [
//       `${pokemonName.toLowerCase()}${formName.toLowerCase()}`, // like "growlithehisuian"
//       `${pokemonName.toLowerCase()}${formName.toLowerCase()}form`,
//     ];

//     const allKeys = [...possibleKeys, ...additionalKeys];

//     for (const key of allKeys) {
//       const formData = allLocationData[key];
//       if (formData?.locations) {
//         return formData.locations;
//       }
//     }

//     // If we couldn't find form-specific data, return null
//     return null;
//   } catch (error) {
//     console.error(`Error loading form location data for ${pokemonName} (${formName}):`, error);
//     return null;
//   }
// }

// /**
//  * Load location data for any Pokemon (with or without form)
//  * This function can handle compound names like "ekansarbok-johto-form"
//  * @param fullPokemonName - The full Pokemon name including any form suffix
//  * @returns Location data or null if not found
//  */
// export async function loadPokemonLocationData(
//   fullPokemonName: string,
// ): Promise<LocationData[] | null> {
//   try {
//     // First try to extract form information from the name
//     const { baseName, formName } = extractPokemonForm(fullPokemonName);

//     // Load the pokemon_locations.json file
//     const allLocationData = await loadJsonFile<Record<string, PokemonLocationData>>(
//       'output/pokemon_locations.json',
//     );

//     if (!allLocationData) {
//       return null;
//     }

//     // Try the original full name first (in case it's an exact match)
//     const exactMatch = allLocationData[fullPokemonName.toLowerCase()];
//     if (exactMatch?.locations) {
//       return exactMatch.locations;
//     }

//     // If we have a form, try form-specific loading
//     if (formName) {
//       const formData = await loadFormLocationData(baseName, formName);
//       if (formData) {
//         return formData;
//       }
//     }

//     // Fall back to base Pokemon data
//     const baseData = allLocationData[baseName.toLowerCase()];
//     return baseData?.locations || null;
//   } catch (error) {
//     console.error(`Error loading Pokemon location data for ${fullPokemonName}:`, error);
//     return null;
//   }
// }

// /**
//  * Merge form-specific location data with base location data
//  * @param baseLocations - Base Pokemon location data
//  * @param formLocations - Form-specific location data
//  * @returns Merged location data (form-specific takes precedence)
//  */
// export function mergeLocationData(
//   baseLocations: LocationData[] | null,
//   formLocations: LocationData[] | null,
// ): LocationData[] {
//   if (!baseLocations && !formLocations) {
//     return [];
//   }

//   if (!baseLocations) {
//     return formLocations || [];
//   }

//   if (!formLocations) {
//     return baseLocations;
//   }

//   // Form-specific data takes precedence
//   return formLocations;
// }

// export type { LocationData, PokemonLocationData };
