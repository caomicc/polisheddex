// Enhanced item data loader that works with the new items manifest

import { loadJsonFile } from '../fileLoader';
import { ItemsManifest, ComprehensiveItemsData } from '@/types/new';
import { getAllLocations, getLocationData } from '../location-data-server';

/**
 * Load items data using the new manifest system with fallbacks
 * Returns a Record where keys are item IDs and values are item data
 */
export async function loadItemsData(): Promise<Record<string, any>> {
  try {
    // Use the new manifest system
    const newManifestData = await loadItemsFromNewManifest();
    console.log('Successfully loaded items from new manifest system');
    return newManifestData;
  } catch (error) {
    console.error('Error loading items data:', error);
    return {};
  }
}

/**
 * Load items data from the new manifest structure (new/items_manifest.json)
 * This function handles the new flattened array structure
 */
export async function loadItemsFromNewManifest(): Promise<Record<string, ItemsManifest>> {
  try {
    console.log('Loading Items from new manifest...');

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the new items manifest directly
      const itemsArray = await loadJsonFile<ItemsManifest[]>('public/new/items_manifest.json');

      if (!itemsArray || !Array.isArray(itemsArray)) {
        console.error('Invalid items manifest structure or file not found');
        return {};
      }

      console.log(`Processing ${itemsArray.length} Items from manifest`);
      const baseData: Record<string, ItemsManifest> = {};

      itemsArray.forEach((item, index) => {
        if (!item || !item.id) {
          console.warn(`Skipping invalid Item at index ${index}`);
          return;
        }

        // Store the Item data using its ID as the key
        baseData[item.id] = item;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} Items`);
      return baseData;
    } else {
      console.log('Client-side: Fetching new items manifest...');
      // Client-side: Use fetch
      const response = await fetch('/new/items_manifest.json');
      if (!response.ok) {
        console.error('Failed to load new items manifest on client');
        return {};
      }

      const itemsArray = await response.json();

      if (!Array.isArray(itemsArray)) {
        console.error('Invalid items manifest structure');
        return {};
      }

      console.log(`Processing ${itemsArray.length} Items from client manifest`);
      const baseData: Record<string, ItemsManifest> = {};

      itemsArray.forEach((item: ItemsManifest, index: number) => {
        if (!item || !item.id) {
          console.warn(`Skipping invalid Item at index ${index}`);
          return;
        }

        // Store the Item data using its ID as the key
        baseData[item.id] = item;
      });

      console.log(`Successfully processed ${Object.keys(baseData).length} Items on client`);
      return baseData;
    }
  } catch (error) {
    console.error('Error loading Items from new manifest:', error);
    return {};
  }
}

/**
 * Load detailed item data from individual files (new/items/{id}.json)
 * This contains version-specific data with location information
 */
export async function loadDetailedItemData(itemId: string): Promise<ComprehensiveItemsData> {
  try {
    let itemData: ComprehensiveItemsData;

    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: Load the detailed item data directly
      const loadedData = await loadJsonFile<ComprehensiveItemsData>(`new/items/${itemId}.json`);
      itemData = loadedData || {
        id: itemId,
        versions: {},
      };
    } else {
      // Client-side: Use fetch
      const response = await fetch(`/new/items/${itemId}.json`);
      if (!response.ok) {
        console.error(`Failed to load detailed data for item ${itemId} on client`);
      }

      itemData = await response.json();
    }

    // Load location data to resolve location names and parent information
    const locationsArray = await getAllLocations();
    const locationsData = locationsArray.reduce(
      (acc, location) => {
        acc[location.id] = location;
        return acc;
      },
      {} as Record<string, any>,
    );

    // Enrich location data with names and parent location info
    for (const version in itemData.versions) {
      const versionData = itemData.versions[version];
      if (versionData.locations && versionData.locations.length > 0) {
        // Process locations in parallel but ensure stable result
        const processedLocations = await Promise.all(
          versionData.locations.map(async (location) => {
            const name = locationsData[location.area]?.name || location.area;

            // Load detailed location data to get parent information
            let parentId: string | undefined;
            try {
              const detailedLocationData = await getLocationData(location.area);
              if (detailedLocationData?.parent) {
                const parentLocationData = locationsData[detailedLocationData.parent];
                parentId =
                  parentLocationData?.id || detailedLocationData.parent || detailedLocationData.id;
              }
            } catch (error) {
              // Silently continue if location data can't be loaded
            }

            return {
              area: location.area,
              method: location.method,
              name,
              parentId,
            };
          }),
        );

        versionData.locations = processedLocations;
      }
    }

    return itemData;
  } catch (error) {
    console.error(`Error loading detailed data for item ${itemId}:`, error);
    throw error;
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
    return itemIds.map((id) => itemsData[id] || null);
  } catch (error) {
    console.error('Error loading multiple items:', error);
    return itemIds.map(() => null);
  }
}
