'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface EzoicAdProps {
  placeholderId: number;
  className?: string;
}

declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds: (...ids: number[]) => void;
    };
  }
}

export function EzoicAd({ placeholderId, className = '' }: EzoicAdProps) {
  const [isEzoicAvailable, setIsEzoicAvailable] = useState(false);

  useEffect(() => {
    // Check if ezstandalone is available
    if (typeof window !== 'undefined' && window.ezstandalone) {
      setIsEzoicAvailable(true);
      window.ezstandalone.cmd.push(function () {
        window.ezstandalone?.showAds(placeholderId);
      });
    }
  }, [placeholderId]);

  return (
    <div className={cn('ezoic-ad-container w-full max-w-4xl mx-auto', className)}>
      <div id={`ezoic-pub-ad-placeholder-${placeholderId}`}/>
      {/* Show placeholder when Ezoic isn't loaded (local dev)
        {!isEzoicAvailable && (
          <div className="bg-neutral-200 dark:bg-neutral-800 border-2 border-dashed border-neutral-400 dark:border-neutral-600 rounded-lg p-4 text-center text-neutral-500 dark:text-neutral-400 min-h-[90px] flex items-center justify-center w-full">
            <span className="text-sm font-mono">
              Ad Placeholder #{placeholderId}
            </span>
          </div>
        )} */}
    </div>
  );
}
