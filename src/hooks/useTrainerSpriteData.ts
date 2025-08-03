import { useState, useEffect } from 'react';
import { SpriteInfo, TrainerManifest } from '@/types/spriteTypes';
import { loadTrainerManifest, getTrainerSpriteWithFallback } from '@/utils/trainerSpriteUtils';

interface UseTrainerSpriteDataResult {
  spriteInfo: SpriteInfo | null;
  isLoading: boolean;
  error: string | null;
  variants: string[];
}

export function useTrainerSpriteData(
  trainerName: string,
  variant?: string
): UseTrainerSpriteDataResult {
  const [spriteInfo, setSpriteInfo] = useState<SpriteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<string[]>([]);
  const [manifest, setManifest] = useState<TrainerManifest | null>(null);

  // Load manifest once
  useEffect(() => {
    let isMounted = true;

    loadTrainerManifest()
      .then((loadedManifest) => {
        if (isMounted) {
          setManifest(loadedManifest);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setManifest({});
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Get sprite info when manifest or dependencies change
  useEffect(() => {
    if (!manifest) {
      return;
    }

    try {
      const sprite = getTrainerSpriteWithFallback(manifest, trainerName, variant);
      setSpriteInfo(sprite);
      
      // Get available variants
      const normalizedName = trainerName.toLowerCase().replace(/-/g, '_');
      const trainerData = manifest[normalizedName];
      if (trainerData) {
        const availableVariants = Object.keys(trainerData).map(key => {
          // Remove trainer name prefix if present
          if (key.startsWith(`${normalizedName}_`)) {
            return key.replace(`${normalizedName}_`, '');
          }
          return key;
        });
        setVariants(availableVariants);
      } else {
        setVariants([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [manifest, trainerName, variant]);

  return {
    spriteInfo,
    isLoading,
    error,
    variants
  };
}