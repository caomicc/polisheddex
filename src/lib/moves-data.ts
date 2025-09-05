export type MoveData = {
  name: string;
  type: string;
};

// Initialize with empty array to prevent key errors
export const MOVES: MoveData[] = [];

// Function to load real moves data
export async function loadMovesData(): Promise<MoveData[]> {
  try {
    const response = await fetch('/output/manifests/moves.json');
    const movesData: Record<string, any> = await response.json();

    const movesList: MoveData[] = Object.entries(movesData).map(([key, moveInfo]) => {
      // Get type from updated or faithful data
      const typeData = moveInfo.updated || moveInfo.faithful;
      const type = typeData?.type || 'Normal';

      // Convert kebab-case key to proper name
      const name = key
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        name,
        type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
      };
    });

    // Sort alphabetically
    movesList.sort((a, b) => a.name.localeCompare(b.name));

    // Update the exported list
    MOVES.splice(0, MOVES.length, ...movesList);

    return movesList;
  } catch (error) {
    console.error('Failed to load moves data:', error);
    // Return empty array as fallback
    return [];
  }
}
