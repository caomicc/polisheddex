// Initialize with empty array to prevent key errors
export const TYPES: string[] = [];

export type TypeName = string;

// Function to load real types data
export async function loadTypesData(): Promise<string[]> {
  try {
    const response = await fetch('/output/type_chart.json');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typeChartData: Record<string, any> = await response.json();

    // Extract all type names from the type chart
    const typesList: string[] = Object.keys(typeChartData)
      .filter((type) => {
        const data = typeChartData[type];
        return data && Object.keys(data).length > 0;
      })
      .map((type) => type.charAt(0).toUpperCase() + type.slice(1).toLowerCase());

    // Sort alphabetically
    typesList.sort((a, b) => a.localeCompare(b));

    // Update the exported list
    TYPES.splice(0, TYPES.length, ...typesList);

    return typesList;
  } catch (error) {
    console.error('Failed to load types data:', error);
    // Return default types as fallback
    const defaultTypes = [
      'Normal',
      'Fire',
      'Water',
      'Electric',
      'Grass',
      'Ice',
      'Fighting',
      'Poison',
      'Ground',
      'Flying',
      'Psychic',
      'Bug',
      'Rock',
      'Ghost',
      'Dragon',
      'Dark',
      'Steel',
      'Fairy',
    ];
    TYPES.splice(0, TYPES.length, ...defaultTypes);
    return defaultTypes;
  }
}
