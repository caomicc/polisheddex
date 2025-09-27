'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavigationData } from '@/utils/pokemonNavigation';

interface PokemonNavigationProps {
  navigation: NavigationData;
}

export default function PokemonNavigation({ navigation }: PokemonNavigationProps) {
  const { previous, next, current } = navigation;

  // Debug logging
  console.log('PokemonNavigation render:', { navigation });
  console.log('Current index:', current.index, 'Total:', current.total);

  // If we don't have valid navigation data, don't render anything
  if (current.index === -1) {
    console.log('PokemonNavigation: Not rendering because current.index is -1');
    return null;
  }

  return (
    <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      {/* Dex info */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Pokédex: #{current.index} of {current.total}
      </div>

      {/* Navigation buttons */}
      <div className="flex-row md:flex-row flex justify-between items-center gap-4">
        {/* Previous button */}
        {previous ? (
          <Button asChild variant="default">
            <Link href={previous.url}>
              <div className="font-medium truncate text-sm">
                ←{/* {formatPokemonName(previous.name)} */}#{current.index - 1}
              </div>
            </Link>
          </Button>
        ) : (
          <div className="flex-1"></div>
        )}

        {/* Back to list button */}
        <Button asChild variant="ghost" className="flex-shrink-0">
          <Link href="/pokemon">
            <span className="text-xs">Back to List</span>
          </Link>
        </Button>

        {/* Next button */}
        {next ? (
          <Button asChild variant="default">
            <Link href={next.url} className="">
              <div className="font-medium truncate text-sm">
                #{current.index + 1} {/* {formatPokemonName(next.name)} */} →
              </div>
            </Link>
          </Button>
        ) : (
          <div className="flex-1"></div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        Use ← → arrow keys to navigate
      </div>
    </div>
  );
}
