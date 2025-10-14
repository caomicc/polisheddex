import { useEffect, useState } from 'react';
import { MoveData, fetchMultipleMovesData } from '@/utils/move-data-client';

interface UseMoveDataProps {
  moveIds: string[];
  version: 'faithful' | 'polished';
  enabled?: boolean;
}

interface UseMoveDataReturn {
  movesData: Record<string, MoveData>;
  isLoading: boolean;
  error: string | null;
}

export function useMoveData({ moveIds, version, enabled = true }: UseMoveDataProps): UseMoveDataReturn {
  const [movesData, setMovesData] = useState<Record<string, MoveData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !moveIds.length) {
      return;
    }

    let cancelled = false;

    async function fetchMoves() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchMultipleMovesData(moveIds, version);
        
        if (!cancelled) {
          setMovesData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch move data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchMoves();

    return () => {
      cancelled = true;
    };
  }, [moveIds.join(','), version, enabled]);

  return { movesData, isLoading, error };
}

export default useMoveData;