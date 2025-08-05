'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
// import { Switch } from "@/components/ui/switch"; // Commented out for now
import { useBuildInfo } from '@/hooks/useBuildInfo';
import { Button } from './button';
import Link from 'next/link';
import { Bug } from 'lucide-react';
// import { Switch } from './switch';

type FooterProps = {
  className?: string;
};

export const Footer: React.FC<FooterProps> = ({ className }) => {
  // const [isDark, setIsDark] = React.useState(false); // Commented out for now
  const { buildInfo } = useBuildInfo();

  // React.useEffect(() => {
  //   if (isDark) {
  //     document.body.classList.add('dark');
  //   } else {
  //     document.body.classList.remove('dark');
  //   }
  // }, [isDark]);

  // Function to get the last updated date
  const getLastUpdatedDate = (): string => {
    // Try Vercel environment variable first
    if (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_DATE) {
      return new Date(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_DATE).toLocaleDateString();
    }

    // Fallback to build info
    if (buildInfo?.gitCommitDate) {
      return new Date(buildInfo.gitCommitDate).toLocaleDateString();
    }

    // Final fallback to build date
    if (buildInfo?.buildDate) {
      return new Date(buildInfo.buildDate).toLocaleDateString();
    }

    return 'Unknown';
  };

  return (
    <footer
      className={cn(
        'w-full py-6 px-4 flex flex-col md:flex-row md:items-center spacing-2 justify-between border-t border-gray-200 dark:border-gray-900 bg-white dark:bg-black/30 gap-8',
        className,
      )}
      role="contentinfo"
    >
      <div className="flex flex-col md:flex-row items-center gap-1">
        <span className="text-sm text-gray-500 dark:text-gray-400 flex md:flex-inline">
          &copy; {new Date().getFullYear()} PolishedDex. All rights reserved.
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Made by{' '}
          <a
            href="https://caomi.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Cammy
          </a>
          .
        </span>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <Button variant={'bugs'} asChild>
          <Link
            href="https://www.notion.so/Polished-Dex-Roadmap-24662146b03a805e88f3c6db6b800837"
            target="_blank"
            rel="noopener noreferrer"
            passHref
          >
            Bugs & Feature Requests{' '}
            <Bug className="text-pink-950 dark:text-pink-100 inline-block ml-1 size-4" />
          </Link>
        </Button>
        <span className="text-muted-foreground">Updated: {getLastUpdatedDate()}</span>
        {/* <Switch checked={isDark} onCheckedChange={setIsDark} aria-label="Toggle dark mode" /> */}
      </div>
    </footer>
  );
};
