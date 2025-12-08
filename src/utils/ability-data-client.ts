export interface AbilityData {
  id: string;
  name: string;
  description: string;
}

/**
 * Client-side function to fetch ability data via API
 */
export async function fetchAbilityData(abilityId: string, version: 'faithful' | 'polished' = 'polished'): Promise<AbilityData | null> {
  try {
    const response = await fetch(`/api/abilities/${abilityId}?version=${version}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching ability data:', error);
    return null;
  }
}

/**
 * Client-side function to fetch multiple abilities data via API
 */
export async function fetchMultipleAbilitiesData(abilityIds: string[], version: 'faithful' | 'polished' = 'polished'): Promise<Record<string, AbilityData>> {
  try {
    const queryString = abilityIds.map(id => `ids=${encodeURIComponent(id)}`).join('&');
    const response = await fetch(`/api/abilities?${queryString}&version=${version}`);
    if (!response.ok) {
      return {};
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching abilities data:', error);
    return {};
  }
}