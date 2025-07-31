'use client';

import * as React from 'react';
import { NavigationMenu } from 'radix-ui';
import classNames from 'clsx';
// import { CaretDownIcon } from "@radix-ui/react-icons";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePokemonType } from '@/contexts/PokemonTypeContext';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { Switch } from './switch';
import { Label } from './label';
import HamburgerMenu from './hamburger';
import { SimpleThemeToggle } from './theme-toggle';

const NavigationMenuDemo = () => {
  const [heroVisible, setHeroVisible] = React.useState(true);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const { primaryType } = usePokemonType();
  const { showFaithful, toggleFaithful } = useFaithfulPreference();

  React.useEffect(() => {
    // Mark as hydrated after first render
    setIsHydrated(true);

    const handleHeroVisibilityChange = (event: CustomEvent) => {
      setHeroVisible(event.detail.isVisible);
    };

    window.addEventListener('heroVisibilityChange', handleHeroVisibilityChange as EventListener);

    return () => {
      window.removeEventListener(
        'heroVisibilityChange',
        handleHeroVisibilityChange as EventListener,
      );
    };
  }, []);

  // Use consistent state until hydrated
  const showBackground = isHydrated && !heroVisible;
  const hasPokemonTheme = primaryType !== null;

  return (
    <div
      className={cn(
        'fixed top-2 md:top-4 py-2 px-4 mx-4 w-[calc(100%-theme(spacing.4))] md:w-[calc(100%-theme(spacing.8))] left-[50%] transform -translate-x-1/2 z-50 rounded-xl transition-all duration-300 backdrop-blur-xl border border-2 max-w-4xl mx-auto',
        showBackground
          ? 'bg-white/20 border-gray-200 text-foreground dark:border-gray-700'
          : 'dark:text-white! text-white border-transparent',
        hasPokemonTheme && 'pokemon-themed',
      )}
    >
      <div className="w-full max-w-full mx-auto flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
            <div className="aspect-square w-8 relative">
              <Image
                src="/25.png"
                alt="PolishedDex Logo"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <span
              className={cn(
                'hidden lg:inline-flex font-bold text-sm md:text-lg transition-colors duration-300 dark:text-white',
                showBackground && !hasPokemonTheme ? 'text-gray-900' : 'text-white',
                hasPokemonTheme && 'pokemon-hero-text',
              )}
            >
              PolishedDex
            </span>
          </Link>
        </div>
        <NavigationMenu.Root className="NavigationMenuRoot justify-start! !hidden md:!flex">
          <NavigationMenu.List className="NavigationMenuList">
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link
                  className={cn(
                    'NavigationMenuLink transition-colors duration-300',
                    !hasPokemonTheme &&
                      !showBackground &&
                      'text-white! hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
                    !hasPokemonTheme &&
                      showBackground &&
                      'text-gray-900! hover:bg-pink-50! hover:text-gray-900! dark:text-white! dark:hover:bg-gray-800',
                    hasPokemonTheme && 'pokemon-themed-link',
                  )}
                  href="/pokemon"
                >
                  Pokedex
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link
                  className={cn(
                    'NavigationMenuLink transition-colors duration-300',
                    !hasPokemonTheme &&
                      !showBackground &&
                      'text-white! hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
                    !hasPokemonTheme &&
                      showBackground &&
                      'text-gray-900! hover:bg-pink-50! hover:text-gray-900! dark:text-white! dark:hover:bg-gray-800',
                    hasPokemonTheme && 'pokemon-themed-link',
                  )}
                  href="/locations"
                >
                  Locations
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link
                  className={cn(
                    'NavigationMenuLink transition-colors duration-300',
                    !hasPokemonTheme &&
                      !showBackground &&
                      'text-white! hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
                    !hasPokemonTheme &&
                      showBackground &&
                      'text-gray-900! hover:bg-pink-50! hover:text-gray-900! dark:text-white! dark:hover:bg-gray-800',
                    hasPokemonTheme && 'pokemon-themed-link',
                  )}
                  href="/items"
                >
                  Items
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link
                  className={cn(
                    'NavigationMenuLink transition-colors duration-300',
                    !hasPokemonTheme &&
                      !showBackground &&
                      'text-white! hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
                    !hasPokemonTheme &&
                      showBackground &&
                      'text-gray-900! hover:bg-pink-50! hover:text-gray-900! dark:text-white! dark:hover:bg-gray-800',
                    hasPokemonTheme && 'pokemon-themed-link',
                  )}
                  href="/moves"
                >
                  Moves
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link
                  className={cn(
                    'NavigationMenuLink transition-colors duration-300',
                    !hasPokemonTheme &&
                      !showBackground &&
                      'text-white! hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
                    !hasPokemonTheme &&
                      showBackground &&
                      'text-gray-900! hover:bg-pink-50! hover:text-gray-900! dark:text-white! dark:hover:bg-gray-800',
                    hasPokemonTheme && 'pokemon-themed-link',
                  )}
                  href="/team-builder"
                >
                  Team Builder
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Indicator className="NavigationMenuIndicator">
              <div className="Arrow" />
            </NavigationMenu.Indicator>
          </NavigationMenu.List>
          <div className="ViewportPosition">
            <NavigationMenu.Viewport className="NavigationMenuViewport" />
          </div>
        </NavigationMenu.Root>

        <div className="flex items-center gap-2 ml-auto">
          <Label htmlFor="type-toggle" className="text-sm whitespace-nowrap">
            <span className={showFaithful ? 'font-bold' : ''}>Faithful</span>
            {' / '}
            <span className={!showFaithful ? 'font-bold' : ''}>Polished</span>
          </Label>
          <Switch
            id="type-toggle"
            checked={!showFaithful}
            onCheckedChange={toggleFaithful}
            aria-label="Toggle between faithful and updated Pokémon types"
          />
          <SimpleThemeToggle />
        </div>

        <HamburgerMenu />
      </div>
    </div>
  );
};

type ListItemProps = {
  className?: string;
  children: React.ReactNode;
  title: string;
  href: string;
};

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, children, title, href, ...props }, ref) => (
    <li>
      <NavigationMenu.Link asChild>
        <Link ref={ref} className={classNames('ListItemLink', className)} href={href} {...props}>
          <div className="ListItemHeading">{title}</div>
          <p className="ListItemText">{children}</p>
        </Link>
      </NavigationMenu.Link>
    </li>
  ),
);

ListItem.displayName = 'ListItem';

export default NavigationMenuDemo;
