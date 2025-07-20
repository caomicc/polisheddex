'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationData } from '@/utils/pokemonNavigation';

interface PokemonKeyboardNavigationProps {
  navigation: NavigationData;
}

export default function PokemonKeyboardNavigation({ navigation }: PokemonKeyboardNavigationProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys if we're not in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (navigation.previous) {
            router.push(navigation.previous.url);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (navigation.next) {
            router.push(navigation.next.url);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, navigation]);

  // This component doesn't render anything visible
  return null;
}
