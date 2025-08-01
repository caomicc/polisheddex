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

export type { AbilityManifest };
