'use client';

import { useEffect } from 'react';

interface EzoicAdProps {
  placeholderId: number;
  className?: string;
}

declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds: (id: number) => void;
    };
  }
}

export function EzoicAd({ placeholderId, className = '' }: EzoicAdProps) {
  useEffect(() => {
    // Only run in production and if ezstandalone is available
    if (typeof window !== 'undefined' && window.ezstandalone) {
      window.ezstandalone.cmd.push(() => {
        window.ezstandalone?.showAds(placeholderId);
      });
    }
  }, [placeholderId]);

  return (
    <div className={className}>
      <div id={`ezoic-pub-ad-placeholder-${placeholderId}`} />
    </div>
  );
}
