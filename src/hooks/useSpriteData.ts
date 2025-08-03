import { useState, useEffect } from 'react';
import { SpriteInfo, SpriteManifest, SpriteVariant, SpriteType } from '@/types/spriteTypes';
import { loadSpriteManifest, getSpriteWithFallback } from '@/utils/spriteUtils';

interface UseSpriteDataResult {
  spriteInfo: SpriteInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useSpriteData(
  pokemonName: string,
  variant: SpriteVariant = 'normal',
  type: SpriteType = 'static'
): UseSpriteDataResult {
  const [spriteInfo, setSpriteInfo] = useState<SpriteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<SpriteManifest | null>(null);

  // Load manifest once
  useEffect(() => {
    let isMounted = true;

    loadSpriteManifest()
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
      const sprite = getSpriteWithFallback(manifest, pokemonName, variant, type);
      setSpriteInfo(sprite);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [manifest, pokemonName, variant, type]);

  return {
    spriteInfo,
    isLoading,
    error
  };
}