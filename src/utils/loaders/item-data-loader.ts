// Enhanced item data loader that works with the items manifest

import { loadJsonFile } from './fileLoader';
import { loadManifest, type ItemManifest } from './manifest-resolver';

/**
 * Load items data using the manifest system
 */
export async function loadItemsData(): Promise<Record<string, any>> {
  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the items manifest directly
      const itemsManifest = await loadManifest<ItemManifest>('items');
      return itemsManifest;
    } else {
      // Client-side: Use fetch (fallback)
      const response = await fetch('/output/manifests/items.json');
      if (!response.ok) {
        throw new Error('Failed to load items manifest');
      }
      return await response.json();
    }
  } catch (error) {
    console.error('Error loading items data:', error);
    // Fallback to original items_data.json if manifest fails
    try {
      const fallbackData = await loadJsonFile<Record<string, any>>('output/items_data.json');
      return fallbackData || {};
    } catch (fallbackError) {
      console.error('Failed to load fallback items data:', fallbackError);
      return {};
    }
  }
}

/**
 * Load a specific item by ID from the manifest
 */
export async function loadItemById(itemId: string): Promise<any | null> {
  try {
    const itemsData = await loadItemsData();
    return itemsData[itemId] || null;
  } catch (error) {
    console.error(`Error loading item ${itemId}:`, error);
    return null;
  }
}

/**
 * Load multiple items by IDs efficiently
 */
export async function loadMultipleItemsById(itemIds: string[]): Promise<(any | null)[]> {
  try {
    const itemsData = await loadItemsData();
    return itemIds.map(id => itemsData[id] || null);
  } catch (error) {
    console.error('Error loading multiple items:', error);
    return itemIds.map(() => null);
  }
}

/**
 * Search items by name, type, or attributes
 */
export async function searchItems(query: string): Promise<any[]> {
  try {
    const itemsData = await loadItemsData();
    const allItems = Object.values(itemsData);
    
    const queryLower = query.toLowerCase();
    
    return allItems.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      // Search in name
      if (item.name && typeof item.name === 'string' && 
          item.name.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Search in description
      if (item.description && typeof item.description === 'string' && 
          item.description.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Search in type/category
      if (item.category && typeof item.category === 'string' && 
          item.category.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      return false;
    });
  } catch (error) {
    console.error('Error searching items:', error);
    return [];
  }
}

/**
 * Get items by category/type
 */
export async function getItemsByCategory(category: string): Promise<any[]> {
  try {
    const itemsData = await loadItemsData();
    const allItems = Object.values(itemsData);
    
    return allItems.filter(item => {
      if (!item || typeof item !== 'object') return false;
      return item.category === category || 
             (item.type && item.type === category) ||
             (item.attributes && item.attributes.category === category);
    });
  } catch (error) {
    console.error(`Error loading items for category ${category}:`, error);
    return [];
  }
}

export type { ItemManifest };