export interface MoveData {
  id: string;
  name: string;
  description: string;
  power: number;
  type: string;
  accuracy: number;
  pp: number;
  effectChance: number;
  category: string;
}

/**
 * Client-side function to fetch move data via API
 */
export async function fetchMoveData(moveId: string, version: 'faithful' | 'polished' = 'polished'): Promise<MoveData | null> {
  try {
    const response = await fetch(`/api/moves/${moveId}?version=${version}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching move data:', error);
    return null;
  }
}

/**
 * Client-side function to fetch multiple moves data via API
 */
export async function fetchMultipleMovesData(moveIds: string[], version: 'faithful' | 'polished' = 'polished'): Promise<Record<string, MoveData>> {
  try {
    const queryString = moveIds.map(id => `ids=${encodeURIComponent(id)}`).join('&');
    const response = await fetch(`/api/moves?${queryString}&version=${version}`);
    if (!response.ok) {
      return {};
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching moves data:', error);
    return {};
  }
}