'use client';

import * as React from 'react';
import Link from 'next/link';
// import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Label } from './label';
import { SimpleThemeToggle } from './theme-toggle';
import HamburgerMenu from './hamburger';
import { Switch } from './switch';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
import { usePokemonType } from '@/contexts/PokemonTypeContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from './badge';

export default function Navigation() {
  const pathname = usePathname();
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

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <div
      className={cn(
        'fixed top-2 md:top-4 py-2 px-4 mx-4 w-[calc(100%-theme(spacing.4))] md:w-[calc(100%-theme(spacing.8))] left-[50%] transform -translate-x-1/2 z-50 rounded-xl transition-all duration-300 backdrop-blur-xl border border-2 max-w-4xl mx-auto',
        showBackground
          ? 'bg-white/0 text-foreground border-border'
          : 'dark:text-white border-transparent',
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
                hasPokemonTheme && 'pokemon-hero-text',
              )}
            >
              PolishedDex
            </span>
          </Link>
        </div>
        <NavigationMenu className="!hidden md:!flex" viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  hasPokemonTheme && 'pokemon-themed-link',
                  isActive('/pokemon') && 'active-link',
                )}
              >
                Pokedex
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="/pokemon" className={cn(isActive('/pokemon') && 'active-link')}>
                        <div className="font-medium">Pokemon</div>
                        <div className="text-muted-foreground">
                          Browse all Pokemon in the Pokedex.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/moves" className={cn(isActive('/moves') && 'active-link')}>
                        <div className="font-medium">Attackdex</div>
                        <div className="text-muted-foreground">
                          Browse all moves in the Pokedex.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/abilities"
                        className={cn(isActive('/abilities') && 'active-link')}
                      >
                        <div className="font-medium">Abilities</div>
                        <div className="text-muted-foreground">Browse all abilities.</div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/team-builder"
                        className={cn(isActive('/team-builder') && 'active-link')}
                      >
                        <div className="font-medium">Team Builder</div>
                        <div className="text-muted-foreground">Build your Pokemon team.</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), isActive('/items') && 'active-link')}
              >
                <Link href="/items">Items</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/locations') && 'active-link',
                )}
              >
                <Link href="/locations">Locations</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            {/* <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), isActive('/wiki') && 'active-link')}
              >
                <Link href="/wiki">Wiki</Link>
              </NavigationMenuLink>
            </NavigationMenuItem> */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), isActive('/wiki/faq') && 'active-link')}
              >
                <Link href="/faq">FAQ</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* <NavigationMenuItem>
              <NavigationMenuTrigger>Simple</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px] gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#">Components</Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#">Documentation</Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#">Blocks</Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem> */}
            {/* <NavigationMenuItem>
              <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px] gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex-row items-center gap-2">
                        <CircleHelpIcon />
                        Backlog
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex-row items-center gap-2">
                        <CircleIcon />
                        To Do
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex-row items-center gap-2">
                        <CircleCheckIcon />
                        Done
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem> */}
          </NavigationMenuList>
        </NavigationMenu>
        <div className={cn('flex items-center gap-2 ml-auto')}>
          <Label htmlFor="type-toggle" className="text-sm whitespace-nowrap">
            <Badge>{!showFaithful ? 'Polished' : 'Faithful'}</Badge>
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
}

// function ListItem({
//   title,
//   children,
//   href,
//   ...props
// }: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
//   return (
//     <li {...props}>
//       <NavigationMenuLink asChild>
//         <Link href={href}>
//           <div className="text-sm leading-none font-medium">{title}</div>
//           <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
//         </Link>
//       </NavigationMenuLink>
//     </li>
//   );
// }
