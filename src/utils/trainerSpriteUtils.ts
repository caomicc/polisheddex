import { TrainerManifest, SpriteInfo } from '@/types/spriteTypes';

let trainerManifest: TrainerManifest | null = null;

/**
 * Load the trainer sprite manifest from the public directory
 */
export async function loadTrainerManifest(): Promise<TrainerManifest | null> {
  if (trainerManifest) {
    return trainerManifest;
  }

  try {
    const response = await fetch('/trainer_manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load trainer manifest: ${response.statusText}`);
    }
    trainerManifest = await response.json();
    return trainerManifest;
  } catch (error) {
    console.error('Failed to load trainer manifest:', error);
    return {};
  }
}

/**
 * Get trainer sprite information for a specific trainer and variant
 */
export function getTrainerSprite(
  manifest: TrainerManifest,
  trainerName: string,
  variant?: string,
): SpriteInfo | null {
  const normalizedName = trainerName.toLowerCase().replace(/-/g, '_');
  const trainerData = manifest[normalizedName];

  if (!trainerData) {
    return null;
  }

  // If no variant specified, try to get the default (trainer name itself)
  if (!variant) {
    // First try the trainer name as key
    if (trainerData[normalizedName]) {
      return trainerData[normalizedName];
    }

    // If not found, return the first available variant
    const firstKey = Object.keys(trainerData)[0];
    return firstKey ? trainerData[firstKey] : null;
  }

  // Try to get the specific variant
  const variantKey = variant.toLowerCase().replace(/-/g, '_');

  // Try exact match first
  if (trainerData[variantKey]) {
    return trainerData[variantKey];
  }

  // Try with trainer name prefix
  const prefixedKey = `${normalizedName}_${variantKey}`;
  if (trainerData[prefixedKey]) {
    return trainerData[prefixedKey];
  }

  return null;
}

/**
 * Get all available variants for a trainer
 */
export function getTrainerVariants(manifest: TrainerManifest, trainerName: string): string[] {
  const normalizedName = trainerName.toLowerCase().replace(/-/g, '_');
  const trainerData = manifest[normalizedName];

  if (!trainerData) {
    return [];
  }

  return Object.keys(trainerData).map((key) => {
    // Remove trainer name prefix if present
    if (key.startsWith(`${normalizedName}_`)) {
      return key.replace(`${normalizedName}_`, '');
    }
    return key;
  });
}

/**
 * Generate fallback trainer sprite info
 */
export function getFallbackTrainerSprite(trainerName: string, variant?: string): SpriteInfo {
  const normalizedName = trainerName.toLowerCase().replace(/-/g, '_');
  const filename = variant
    ? `${normalizedName}_${variant.toLowerCase().replace(/-/g, '_')}.png`
    : `${normalizedName}.png`;

  return {
    url: `/sprites/trainers/${normalizedName}/${filename}`,
    width: 64, // fallback dimensions
    height: 64,
  };
}

/**
 * Get trainer sprite with automatic fallback
 */
export function getTrainerSpriteWithFallback(
  manifest: TrainerManifest,
  trainerName: string,
  variant?: string,
): SpriteInfo {
  const sprite = getTrainerSprite(manifest, trainerName, variant);
  return sprite || getFallbackTrainerSprite(trainerName, variant);
}

/**
 * Check if a trainer exists in the manifest
 */
export function trainerExists(manifest: TrainerManifest, trainerName: string): boolean {
  const normalizedName = trainerName.toLowerCase().replace(/-/g, '_');
  return normalizedName in manifest;
}

/**
 * Get all trainer names from the manifest
 */
export function getAllTrainerNames(manifest: TrainerManifest): string[] {
  return Object.keys(manifest).sort();
}
