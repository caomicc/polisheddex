/**
 * Utility functions to process item effects and parameters into meaningful user descriptions
 */

import { ComprehensiveItemsData } from '@/types/new';

export interface ProcessedItemEffect {
  name: string;
  description: string;
  category: string;
  valueDisplay?: string;
}

/**
 * Process an item's effect and parameter into a meaningful description
 */
export function processItemEffect(
  item: ComprehensiveItemsData['versions'][string],
): ProcessedItemEffect {
  return {
    name: item.name,
    description: item.description,
    category: item.attributes?.category || 'Unknown',
    valueDisplay: undefined,
  };
}

/**
 * Get a user-friendly description of item usage
 */
export function getUsageDescription(item: ComprehensiveItemsData['versions'][string]): string {
  console.log('Item in getUsageDescription:', item);
  switch (item.attributes?.category) {
    case 'item':
      return 'Item to be held or used.';
    case 'medicine':
      return 'Use to heal or restore your Pokémon.';
    case 'ball':
      return 'Throw at wild Pokémon to catch them.';
    case 'tm':
    case 'hm':
      return 'Teach moves to compatible Pokémon.';
    case 'candy':
      return 'Use to increase a Pokémon’s EXP.';
    case 'berries':
      return 'Give to Pokémon to hold for various effects.';
    case 'mail':
      return 'Attach to Pokémon to send messages.';
    case 'keyitem':
      return 'Special items used for story progression.';
    default:
      return 'Unknown usage type.';
  }
}
