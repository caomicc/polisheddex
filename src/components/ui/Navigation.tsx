'use client';

import * as React from 'react';
import { NavigationMenu } from 'radix-ui';
import classNames from 'clsx';
// import { CaretDownIcon } from "@radix-ui/react-icons";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const NavigationMenuDemo = () => {
  const [heroVisible, setHeroVisible] = React.useState(true);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    // Mark as hydrated after first render
    setIsHydrated(true);

    const handleHeroVisibilityChange = (event: CustomEvent) => {
      setHeroVisible(event.detail.isVisible);
    };

    window.addEventListener('heroVisibilityChange', handleHeroVisibilityChange as EventListener);

    return () => {
      window.removeEventListener('heroVisibilityChange', handleHeroVisibilityChange as EventListener);
    };
  }, []);

  // Use consistent state until hydrated
  const shouldShowRedBackground = isHydrated && !heroVisible;

  return (
    <div
      className={cn(
      "fixed top-4 py-2 px-4 mx-4 w-[calc(100%-theme(spacing.8))] left-[50%] transform -translate-x-1/2 z-50 rounded-xl transition-bg duration-300 backdrop-blur-xl border border-2 max-w-4xl mx-auto",
      shouldShowRedBackground
        ? "bg-white/20 border-gray-200 text-white"
        : "dark:text-white text-white border-transparent"
      )}
    >
      <div className="w-full mx-auto flex items-center justify-between">
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
          "font-bold text-sm md:text-xl transition-colors duration-300",
          shouldShowRedBackground ? "text-gray-900" : "text-white"
          )}
        >
          PolishedDex
        </span>
        </Link>
      </div>
      <NavigationMenu.Root className="NavigationMenuRoot justify-end! w-full!">
        <NavigationMenu.List className="NavigationMenuList">
        <NavigationMenu.Item>
          <NavigationMenu.Link
          className={cn(
            "NavigationMenuLink transition-colors duration-300 !text-current",
            shouldShowRedBackground
              ? "text-white hover:bg-red-500"
              : "text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
          )}
          href="/pokemon"
          >
          Pokedex
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link
          className={cn(
            "NavigationMenuLink transition-colors duration-300 !text-current",
            shouldShowRedBackground
              ? "text-white hover:bg-red-500"
              : "text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
          )}
          href="/locations"
          >
          Locations
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link
          className={cn(
            "NavigationMenuLink transition-colors duration-300 !text-current",
            shouldShowRedBackground
              ? "text-white hover:bg-red-500"
              : "text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
          )}
          href="/items"
          >
          Items
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
        <Link
          ref={ref}
          className={classNames('ListItemLink', className)}
          href={href}
          {...props}
        >
          <div className="ListItemHeading">{title}</div>
          <p className="ListItemText">{children}</p>
        </Link>
      </NavigationMenu.Link>
    </li>
  ),
);

ListItem.displayName = 'ListItem';

export default NavigationMenuDemo;
