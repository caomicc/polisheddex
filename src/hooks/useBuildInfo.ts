import { useEffect, useState } from 'react';

interface BuildInfo {
  buildDate: string;
  gitCommitSha: string;
  gitCommitDate: string;
}

/**
 * Hook to fetch build information including deployment date
 */
export const useBuildInfo = () => {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuildInfo = async () => {
      try {
        const response = await fetch('/build-info.json');
        if (response.ok) {
          const info = await response.json();
          setBuildInfo(info);
        }
      } catch (error) {
        console.warn('Could not fetch build info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildInfo();
  }, []);

  return { buildInfo, loading };
};
