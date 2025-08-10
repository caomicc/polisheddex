import { loadManifest, type AbilityManifest } from '../manifest-resolver';

/**
 * Load abilities data using the manifest system
 */
export async function loadAbilitiesData(): Promise<Record<string, any>> {
  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the abilities manifest directly
      const abilitiesManifest = await loadManifest<AbilityManifest>('abilities');
      return abilitiesManifest;
    } else {
      // Client-side: Use fetch (fallback)
      const response = await fetch('/output/manifests/abilities.json');
      if (!response.ok) {
        throw new Error('Failed to load abilities manifest');
      }
      return await response.json();
    }
  } catch (error) {
    console.error('Error loading abilities data:', error);
    return {};
  }
}

/**
 * Load a specific ability by ID from the manifest
 */
export async function loadAbilityById(abilityId: string): Promise<any | null> {
  try {
    const abilitiesData = await loadAbilitiesData();
    return abilitiesData[abilityId] || null;
  } catch (error) {
    console.error(`Error loading ability ${abilityId}:`, error);
    return null;
  }
}

/**
 * Load multiple abilities by IDs efficiently
 */
export async function loadMultipleAbilitiesById(abilityIds: string[]): Promise<(any | null)[]> {
  try {
    const abilitiesData = await loadAbilitiesData();
    return abilityIds.map((id) => abilitiesData[id] || null);
  } catch (error) {
    console.error('Error loading multiple abilities:', error);
    return abilityIds.map(() => null);
  }
}

/**
 * Search abilities by name or description
 */
export async function searchAbilities(query: string): Promise<any[]> {
  try {
    const abilitiesData = await loadAbilitiesData();
    const lowerQuery = query.toLowerCase();

    return Object.entries(abilitiesData)
      .filter(
        ([id, ability]) =>
          ability.name?.toLowerCase().includes(lowerQuery) ||
          ability.description?.toLowerCase().includes(lowerQuery) ||
          id.toLowerCase().includes(lowerQuery),
      )
      .map(([id, ability]) => ({ id, ...ability }));
  } catch (error) {
    console.error('Error searching abilities:', error);
    return [];
  }
}

/**
 * Get all abilities
 */
export async function getAllAbilities(): Promise<any[]> {
  try {
    const abilitiesData = await loadAbilitiesData();
    return Object.entries(abilitiesData).map(([id, ability]) => ({ id, ...ability }));
  } catch (error) {
    console.error('Error getting all abilities:', error);
    return [];
  }
}

// Additional functionality for finding Pokemon that have abilities
import { BaseData } from '@/types/types';
import { loadPokemonBaseDataFromManifest } from './pokemon-data-loader';

export interface PokemonWithAbility {
  pokemon: BaseData;
  abilityTypes: ('primary' | 'secondary' | 'hidden')[];
  isHidden: boolean;
  faithful?: boolean;
  updated?: boolean;
}

export async function getPokemonThatHaveAbility(abilityId: string): Promise<PokemonWithAbility[]> {
  const pokemonBaseData = await loadPokemonBaseDataFromManifest();
  const pokemonWithAbility: PokemonWithAbility[] = [];

  // Normalize ability ID for comparison
  const normalizedAbilityId = abilityId.toLowerCase();

  // Load individual Pokemon files to get full ability data
  for (const [pokemonKey, basePokemon] of Object.entries(pokemonBaseData)) {
    try {
      const fs = await import('fs');
      const path = await import('path');

      // The pokemonKey is already normalized (lowercase), so use it directly
      const pokemonFilePath = path.join(process.cwd(), `output/pokemon/${pokemonKey}.json`);

      if (!fs.existsSync(pokemonFilePath)) {
        continue; // Skip if individual file doesn't exist
      }

      const pokemonData = JSON.parse(fs.readFileSync(pokemonFilePath, 'utf8'));
      const pokemon = {
        ...basePokemon,
        ...pokemonData,
        normalizedUrl: pokemonKey, // Use the pokemonKey as it's already normalized
      };

      // Determine which abilities to use for each version with fallback logic
      const faithfulAbilities =
        pokemon.detailedStats?.faithfulAbilities || pokemon.faithfulAbilities;
      const updatedAbilities = pokemon.detailedStats?.updatedAbilities || pokemon.updatedAbilities;
      const mainAbilities = pokemon.detailedStats?.abilities || pokemon.abilities;

      // Use fallback logic: if no specific version abilities, use the other version or main abilities
      const effectiveFaithfulAbilities = faithfulAbilities || updatedAbilities || mainAbilities;
      const effectiveUpdatedAbilities = updatedAbilities || mainAbilities;

      // Check faithful abilities (with fallback)
      if (effectiveFaithfulAbilities) {
        effectiveFaithfulAbilities.forEach((ability: any) => {
          if (ability.id && ability.id.toLowerCase() === normalizedAbilityId) {
            const existingIndex = pokemonWithAbility.findIndex(
              (item) => item.pokemon.name === pokemon.name,
            );

            if (existingIndex >= 0) {
              const existing = pokemonWithAbility[existingIndex];
              if (!existing.abilityTypes.includes(ability.abilityType)) {
                existing.abilityTypes.push(ability.abilityType);
              }
              existing.faithful = true;
              // If no specific updated abilities, use faithful abilities for both versions
              if (!updatedAbilities || updatedAbilities.length === 0) {
                existing.updated = true;
              }
              if (ability.isHidden) existing.isHidden = true;
            } else {
              pokemonWithAbility.push({
                pokemon,
                abilityTypes: [ability.abilityType],
                isHidden: ability.isHidden,
                faithful: true,
                // If no specific updated abilities, use faithful abilities for both versions
                updated: !updatedAbilities || updatedAbilities.length === 0,
              });
            }
          }
        });
      }

      // Check updated abilities
      if (effectiveUpdatedAbilities) {
        effectiveUpdatedAbilities.forEach((ability: any) => {
          if (ability.id && ability.id.toLowerCase() === normalizedAbilityId) {
            const existingIndex = pokemonWithAbility.findIndex(
              (item) => item.pokemon.name === pokemon.name,
            );

            if (existingIndex >= 0) {
              const existing = pokemonWithAbility[existingIndex];
              if (!existing.abilityTypes.includes(ability.abilityType)) {
                existing.abilityTypes.push(ability.abilityType);
              }
              existing.updated = true;
              if (ability.isHidden) existing.isHidden = true;
            } else {
              pokemonWithAbility.push({
                pokemon,
                abilityTypes: [ability.abilityType],
                isHidden: ability.isHidden,
                updated: true,
              });
            }
          }
        });
      }

      // Check forms if they exist
      if (pokemon.forms) {
        Object.entries(pokemon.forms).forEach(([formName, formData]) => {
          // Apply same fallback logic for forms
          const formFaithfulAbilities =
            (formData as any).detailedStats?.faithfulAbilities ||
            (formData as any).faithfulAbilities;
          const formUpdatedAbilities =
            (formData as any).detailedStats?.updatedAbilities || (formData as any).updatedAbilities;
          const formMainAbilities =
            (formData as any).detailedStats?.abilities || (formData as any).abilities;

          const effectiveFormFaithfulAbilities =
            formFaithfulAbilities || formUpdatedAbilities || formMainAbilities;
          const effectiveFormUpdatedAbilities = formUpdatedAbilities || formMainAbilities;

          // Check faithful abilities for form (with fallback)
          if (effectiveFormFaithfulAbilities) {
            effectiveFormFaithfulAbilities.forEach((ability: any) => {
              if (ability.id && ability.id.toLowerCase() === normalizedAbilityId) {
                const formPokemonName = `${pokemon.name}`;
                const existingIndex = pokemonWithAbility.findIndex(
                  (item) => item.pokemon.name === formPokemonName,
                );

                if (existingIndex >= 0) {
                  const existing = pokemonWithAbility[existingIndex];
                  if (!existing.abilityTypes.includes(ability.abilityType)) {
                    existing.abilityTypes.push(ability.abilityType);
                  }
                  existing.faithful = true;
                  if (ability.isHidden) existing.isHidden = true;
                } else {
                  pokemonWithAbility.push({
                    pokemon: {
                      ...pokemon,
                      // name: formPokemonName,
                      formName,
                      // normalizedUrl: pokemonKey, // Use pokemonKey for consistent URL generation
                    },
                    abilityTypes: [ability.abilityType],
                    isHidden: ability.isHidden,
                    faithful: true,
                    // If no specific updated abilities for form, use faithful for both versions
                    updated: !formUpdatedAbilities || formUpdatedAbilities.length === 0,
                  });
                }
              }
            });
          }

          // Check updated abilities for form
          if (effectiveFormUpdatedAbilities) {
            effectiveFormUpdatedAbilities.forEach((ability: any) => {
              if (ability.id && ability.id.toLowerCase() === normalizedAbilityId) {
                const formPokemonName = `${pokemon.name} (${formName})`;
                const existingIndex = pokemonWithAbility.findIndex(
                  (item) => item.pokemon.name === formPokemonName,
                );

                if (existingIndex >= 0) {
                  const existing = pokemonWithAbility[existingIndex];
                  if (!existing.abilityTypes.includes(ability.abilityType)) {
                    existing.abilityTypes.push(ability.abilityType);
                  }
                  existing.updated = true;
                  if (ability.isHidden) existing.isHidden = true;
                } else {
                  pokemonWithAbility.push({
                    pokemon: {
                      ...pokemon,
                      // name: formPokemonName,
                      formName,
                      // normalizedUrl: pokemonKey, // Use pokemonKey for consistent URL generation
                    },
                    abilityTypes: [ability.abilityType],
                    isHidden: ability.isHidden,
                    updated: true,
                  });
                }
              }
            });
          }
        });
      }
    } catch (error: any) {
      // Skip Pokemon if there's an error loading their data
      console.warn(`Error loading data for ${pokemonKey}:`, error.message);
      continue;
    }
  }

  // Sort ability types by priority (primary > secondary > hidden)
  pokemonWithAbility.forEach((item) => {
    item.abilityTypes.sort((a, b) => {
      const order = { primary: 0, secondary: 1, hidden: 2 };
      return (order[a as keyof typeof order] || 999) - (order[b as keyof typeof order] || 999);
    });
  });

  return pokemonWithAbility.sort((a, b) => a.pokemon.name.localeCompare(b.pokemon.name));
}

export type { AbilityManifest };
