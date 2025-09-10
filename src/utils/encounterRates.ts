/**
 * Independent encounter rate calculation utilities
 * Based on Pokémon Crystal probability tables from probabilities.asm
 */

/**
 * Converts cumulative probability thresholds to individual slot percentages
 */
export function getSlotPercentages(cumulative: number[]): number[] {
  return cumulative.map((val, idx, arr) => val - (arr[idx - 1] ?? 0));
}

/**
 * Maps encounter rates to Pokémon based on encounter method and slot position
 * 
 * @param pokemonList - Array of Pokémon names in encounter slot order
 * @param encounterMethod - The encounter method ('grass', 'surfing', 'fishing', 'headbutt')
 * @returns Array of objects with name and rate
 */
export function mapEncounterRatesToPokemon(
  pokemonList: string[],
  encounterMethod: string,
): Array<{ name: string; rate: number }> {
  
  // Probability tables from probabilities.asm (cumulative percentages)
  // These represent the cumulative probability thresholds for each encounter slot
  const PROBABILITY_TABLES = {
    grass: [30, 60, 80, 90, 95, 98, 100], // 7 slots: 30%, 30%, 20%, 10%, 5%, 3%, 2%
    surfing: [60, 90, 100],                // 3 slots: 60%, 30%, 10%
    fishing: [70, 90, 98, 100],            // 4 slots: 70%, 20%, 8%, 2%
    headbutt: [50, 85, 95, 100],           // 4 slots: 50%, 35%, 10%, 5%
  };

  // Get the probability table for this encounter method
  const cumulativeTable = PROBABILITY_TABLES[encounterMethod as keyof typeof PROBABILITY_TABLES];
  
  if (!cumulativeTable) {
    console.warn(`Unknown encounter method: ${encounterMethod}`);
    // Return all pokemon with equal rates if method unknown
    const equalRate = Math.floor(100 / pokemonList.length);
    return pokemonList.map(name => ({ name, rate: equalRate }));
  }

  // Convert cumulative to individual percentages
  const slotPercentages = getSlotPercentages(cumulativeTable);

  // Map each pokemon to its corresponding rate
  return pokemonList.map((name, idx) => ({
    name,
    rate: slotPercentages[idx] || 0, // 0 if more Pokémon than available slots
  }));
}

/**
 * Groups encounters by method and time, then calculates proper rates
 * 
 * @param encounters - Raw encounter data
 * @returns Encounters with properly calculated rates
 */
export function calculateEncounterRates(encounters: Array<{
  pokemon: string;
  method: string;
  version: string;
  levelRange: string;
  rate: number;
}>): Array<{
  pokemon: string;
  method: string;
  version: string;
  levelRange: string;
  rate: number;
}> {
  // Group encounters by method and time slot
  const groupedEncounters = new Map<string, typeof encounters>();
  
  for (const encounter of encounters) {
    const key = `${encounter.method}_${encounter.version}`;
    if (!groupedEncounters.has(key)) {
      groupedEncounters.set(key, []);
    }
    groupedEncounters.get(key)!.push(encounter);
  }

  const updatedEncounters: typeof encounters = [];

  // Process each group and calculate rates
  for (const [key, groupEncounters] of groupedEncounters) {
    const [method] = key.split('_');
    
    // Extract just the pokemon names in order for rate calculation
    const pokemonNames = groupEncounters.map(enc => enc.pokemon);
    
    // Calculate rates for this group
    const ratedPokemon = mapEncounterRatesToPokemon(pokemonNames, method);
    
    // Apply the calculated rates back to the encounters
    for (let i = 0; i < groupEncounters.length; i++) {
      const encounter = groupEncounters[i];
      const ratedInfo = ratedPokemon[i];
      
      updatedEncounters.push({
        ...encounter,
        rate: ratedInfo?.rate || 0,
      });
    }
  }

  return updatedEncounters;
}

/**
 * Helper function to update encounter rates for a single location
 * 
 * @param locationData - Location data with encounters array
 * @returns Updated location data with calculated encounter rates
 */
export function updateLocationEncounterRates<T extends {
  encounters?: Array<{
    pokemon: string;
    method: string;
    version: string;
    levelRange: string;
    rate: number;
  }>;
}>(locationData: T): T {
  if (!locationData.encounters || locationData.encounters.length === 0) {
    return locationData;
  }

  return {
    ...locationData,
    encounters: calculateEncounterRates(locationData.encounters),
  };
}