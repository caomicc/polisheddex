// Utilities for resolving manifest references in compressed data

interface AbilityManifest {
  [abilityId: string]: {
    name: string;
    description: string;
  };
}

interface MoveManifest {
  [moveId: string]: {
    name: string;
    type?: string;
    category?: string;
    power?: number;
    accuracy?: number;
    pp?: number;
    description?: string;
    updated?: Omit<MoveManifest, 'updated' | 'faithful'>;
    faithful?: Omit<MoveManifest, 'faithful' | 'updated'>;
  };
}

interface ItemManifest {
  [itemId: string]: any;
}

interface CompressedAbility {
  id: string;
  isHidden: boolean;
  abilityType: 'primary' | 'secondary' | 'hidden';
}

interface ExpandedAbility {
  id: string;
  name: string;
  description: string;
  isHidden: boolean;
  abilityType: 'primary' | 'secondary' | 'hidden';
}

// Cache for manifests to avoid repeated loading
const manifestCache = new Map<string, any>();

export async function loadManifest<T>(manifestName: string): Promise<T> {
  if (manifestCache.has(manifestName)) {
    return manifestCache.get(manifestName);
  }

  try {
    // Check if we're in a server environment
    if (typeof window === 'undefined') {
      // Server-side: use fs
      const fs = await import('fs/promises');
      const path = await import('path');
      const manifestPath = path.join(process.cwd(), 'output', 'manifests', `${manifestName}.json`);
      const data = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(data);
      manifestCache.set(manifestName, manifest);
      return manifest;
    } else {
      // Client-side: use fetch
      const response = await fetch(`/output/manifests/${manifestName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${manifestName}`);
      }

      const manifest = await response.json();
      manifestCache.set(manifestName, manifest);
      return manifest;
    }
  } catch (error) {
    console.error(`Error loading manifest ${manifestName}:`, error);
    throw error;
  }
}

export async function resolveAbilities(
  compressedAbilities: CompressedAbility[],
  abilityManifest?: AbilityManifest,
): Promise<ExpandedAbility[]> {
  const manifest = abilityManifest || (await loadManifest<AbilityManifest>('abilities'));

  return compressedAbilities.map((compressed) => {
    const abilityData = manifest[compressed.id];
    if (!abilityData) {
      console.warn(`Ability not found in manifest: ${compressed.id}`);
      return {
        id: compressed.id,
        name: compressed.id,
        description: 'Description not available',
        isHidden: compressed.isHidden,
        abilityType: compressed.abilityType,
      };
    }

    return {
      id: compressed.id,
      name: abilityData.name,
      description: abilityData.description,
      isHidden: compressed.isHidden,
      abilityType: compressed.abilityType,
    };
  });
}

export async function resolveMove(moveId: string, moveManifest?: MoveManifest): Promise<any> {
  const manifest = moveManifest || (await loadManifest<MoveManifest>('moves'));

  const moveData = manifest[moveId];
  if (!moveData) {
    console.warn(`Move not found in manifest: ${moveId}`);
    return {
      name: moveId,
      description: 'Description not available',
    };
  }

  return moveData;
}

export async function resolveMoves(moveIds: string[], moveManifest?: MoveManifest): Promise<any[]> {
  const manifest = moveManifest || (await loadManifest<MoveManifest>('moves'));

  return moveIds.map((id) => {
    const moveData = manifest[id];
    if (!moveData) {
      console.warn(`Move not found in manifest: ${id}`);
      return {
        name: id,
        description: 'Description not available',
      };
    }
    return moveData;
  });
}

export async function resolveItem(itemId: string, itemManifest?: ItemManifest): Promise<any> {
  const manifest = itemManifest || (await loadManifest<ItemManifest>('items'));

  const itemData = manifest[itemId];
  if (!itemData) {
    console.warn(`Item not found in manifest: ${itemId}`);
    return {
      name: itemId,
      description: 'Description not available',
    };
  }

  return itemData;
}

export async function resolveItems(itemIds: string[], itemManifest?: ItemManifest): Promise<any[]> {
  const manifest = itemManifest || (await loadManifest<ItemManifest>('items'));

  return itemIds.map((id) => {
    const itemData = manifest[id];
    if (!itemData) {
      console.warn(`Item not found in manifest: ${id}`);
      return {
        name: id,
        description: 'Description not available',
      };
    }
    return itemData;
  });
}

// Helper to normalize string to ID format (should match the one in manifest creation)
export function normalizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Preload commonly used manifests
export async function preloadManifests(): Promise<void> {
  try {
    await Promise.all([loadManifest('abilities'), loadManifest('moves'), loadManifest('items')]);
    console.log('Manifests preloaded successfully');
  } catch (error) {
    console.error('Error preloading manifests:', error);
  }
}

// Clear manifest cache (useful for development)
export function clearManifestCache(): void {
  manifestCache.clear();
}

export type { AbilityManifest, MoveManifest, ItemManifest, CompressedAbility, ExpandedAbility };
