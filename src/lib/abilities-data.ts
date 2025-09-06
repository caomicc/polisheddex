// Initialize with empty array to prevent key errors
export const ABILITIES: string[] = [];

// Function to load real abilities data
export async function loadAbilitiesData(): Promise<string[]> {
  try {
    const response = await fetch('/output/manifests/abilities.json');
    const abilitiesData: Record<string, any> = await response.json();

    const abilitiesList: string[] = Object.keys(abilitiesData).map((key) => {
      // Convert kebab-case key to proper name
      return key
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });

    // Sort alphabetically
    abilitiesList.sort((a, b) => a.localeCompare(b));

    // Update the exported list
    ABILITIES.splice(0, ABILITIES.length, ...abilitiesList);

    return abilitiesList;
  } catch (error) {
    console.error('Failed to load abilities data:', error);
    // Return empty array as fallback
    return [];
  }
}
