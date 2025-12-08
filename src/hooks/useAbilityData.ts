import { useState, useEffect } from 'react';
import { fetchMultipleAbilitiesData, AbilityData } from '@/utils/ability-data-client';

interface UseAbilityDataProps {
  abilityIds: string[];
  version: 'faithful' | 'polished';
  enabled?: boolean;
}

interface UseAbilityDataReturn {
  abilitiesData: Record<string, AbilityData>;
  isLoading: boolean;
  error: string | null;
}

export function useAbilityData({ abilityIds, version, enabled = true }: UseAbilityDataProps): UseAbilityDataReturn {
  const [abilitiesData, setAbilitiesData] = useState<Record<string, AbilityData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || abilityIds.length === 0) {
      setAbilitiesData({});
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchMultipleAbilitiesData(abilityIds, version);
        setAbilitiesData(data);
      } catch (err) {
        console.error('Error fetching abilities data:', err);
        setError('Failed to fetch abilities data');
        setAbilitiesData({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [abilityIds, version, enabled]);

  return {
    abilitiesData,
    isLoading,
    error,
  };
}