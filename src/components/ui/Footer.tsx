'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { useBuildInfo } from '@/hooks/useBuildInfo';
import Link from 'next/link';
import { Bug, Github, ExternalLink } from 'lucide-react';

type FooterProps = {
  className?: string;
};

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const { buildInfo } = useBuildInfo();

  const getLastUpdatedDate = (): string => {
    if (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_DATE) {
      return new Date(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_DATE).toLocaleDateString();
    }
    if (buildInfo?.gitCommitDate) {
      return new Date(buildInfo.gitCommitDate).toLocaleDateString();
    }
    if (buildInfo?.buildDate) {
      return new Date(buildInfo.buildDate).toLocaleDateString();
    }
    return 'Unknown';
  };

  return (
    <footer
      className={cn(
        'w-full py-8 px-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/40',
        className,
      )}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand & Description */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">PolishedDex</h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
              <strong>Disclaimer:</strong> PolishedDex is an independent fan project and is not
              affiliated with, endorsed by, or connected to the Polished Crystal development team,
              Nintendo, Game Freak, or The Pokémon Company. Pokémon and all related names are
              trademarks of their respective owners.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/pokemon"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Pokémon
                </Link>
              </li>
              <li>
                <Link
                  href="/moves"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Moves
                </Link>
              </li>
              <li>
                <Link
                  href="/abilities"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Abilities
                </Link>
              </li>
            </ul>
          </div>

          {/* External Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Community
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/Rangi42/polishedcrystal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                >
                  <Github className="size-3.5" />
                  Polished Crystal Repository
                  <ExternalLink className="size-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mb-6"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>&copy; {new Date().getFullYear()} PolishedDex</span>
            <span className="hidden sm:inline">•</span>
            <span>
              Made by{' '}
              <a
                href="https://caomi.cc"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Cammy
              </a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Terms
            </Link>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <Link
              href="/privacy"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Privacy
            </Link>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <span className="">Updated: {getLastUpdatedDate()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
