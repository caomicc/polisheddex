import { useState, useEffect } from 'react';
import {
  SpriteInfo,
  SpriteManifest,
  SpriteVariant,
  SpriteType,
  TrainerManifest,
  UnifiedSpriteManifest,
  SpriteCategory,
} from '@/types/spriteTypes';
import {
  loadUnifiedSpriteManifest,
  loadSpriteManifest,
  getSpriteWithFallback,
  getTrainerSpriteWithFallback,
  getUnifiedSpriteWithFallback,
} from '@/utils/spriteUtils';

interface UseSpriteDataResult {
  spriteInfo: SpriteInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useSpriteData(
  spriteName: string,
  variant: SpriteVariant = 'normal',
  type: SpriteType = 'static',
): UseSpriteDataResult {
  const [spriteInfo, setSpriteInfo] = useState<SpriteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<UnifiedSpriteManifest | null>(null);

  // Load manifest once
  useEffect(() => {
    let isMounted = true;

    loadUnifiedSpriteManifest()
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
      const sprite = getUnifiedSpriteWithFallback(manifest, spriteName, 'pokemon', variant, type);
      setSpriteInfo(sprite);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [manifest, spriteName, variant, type]);

  return {
    spriteInfo,
    isLoading,
    error,
  };
}

export function useTrainerSpriteData(trainerName: string): UseSpriteDataResult {
  const [spriteInfo, setSpriteInfo] = useState<SpriteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<UnifiedSpriteManifest | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadUnifiedSpriteManifest()
      .then((loadedManifest) => {
        if (isMounted) {
          setManifest(loadedManifest);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setManifest(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!manifest) {
      return;
    }

    try {
      const sprite = getUnifiedSpriteWithFallback(manifest, trainerName, 'trainer');
      setSpriteInfo(sprite);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [manifest, trainerName]);

  return {
    spriteInfo,
    isLoading,
    error,
  };
}
