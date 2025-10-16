'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';

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
import { Switch } from './switch';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from './badge';
import { Button } from './button';
import { IconMenu2, IconX } from '@tabler/icons-react';
import { AnimatePresence } from 'motion/react';
import { ExternalLink } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  // const { primaryType } = usePokemonType();
  const { showFaithful, toggleFaithful, isLoading } = useFaithfulPreference();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { title: 'Home', href: '/' },
    { title: 'Pokemon', href: '/pokemon' },
    { title: 'Locations', href: '/locations' },
    { title: 'Map', href: '/map' },
    { title: 'Items', href: '/items' },
    { title: 'Events', href: '/events' },
    { title: 'Attackdex', href: '/moves' },
    { title: 'Abilities', href: '/abilities' },
    { title: 'Team Builder', href: '/team-builder' },
    { title: 'Polished Editor', href: 'https://polishededitor.vercel.app' },
    { title: 'FAQ', href: '/faq' },
  ];

  // Animation state for scroll-based resizing
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const [visible, setVisible] = React.useState<boolean>(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  const hasPokemonTheme = false;
  // const hasPokemonTheme = primaryType !== null;
  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <motion.div ref={ref} className={cn('sticky inset-x-0 top-0 lg:top-10 z-40 w-full')}>
      {/* Desktop Navigation */}
      <motion.div
        animate={{
          backdropFilter: visible ? 'blur(10px)' : 'blur(2px)',
          boxShadow: visible
            ? '0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset'
            : 'none',
          width: visible ? '80%' : '100%',
          y: visible ? 10 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 50,
        }}
        className={cn(
          'relative z-[60] mx-auto w-full max-w-7xl flex-row items-center justify-between self-start rounded-full bg-transparent px-4 py-2 hidden lg:flex dark:bg-transparent',
          visible && 'bg-white/80 dark:bg-neutral-950/80',
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
                  <ul className="grid w-[300px] gap-4 p-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/pokemon"
                          className={cn(
                            'block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            isActive('/pokemon') && 'active-link',
                          )}
                        >
                          <div className="text-sm font-medium leading-none">Pokemon</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse all Pokemon in the Pokedex.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/moves"
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            isActive('/moves') && 'active-link',
                          )}
                        >
                          <div className="text-sm font-medium leading-none">Attackdex</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse all moves in the Pokedex.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/abilities"
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            isActive('/abilities') && 'active-link',
                          )}
                        >
                          <div className="text-sm font-medium leading-none">Abilities</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse all abilities.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    hasPokemonTheme && 'pokemon-themed-link',
                    (isActive('/locations') || isActive('/map')) && 'active-link',
                  )}
                >
                  Pokéarth
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[300px] gap-4 p-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/locations"
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            isActive('/locations') && 'active-link',
                          )}
                        >
                          <div className="text-sm font-medium leading-none">Locations Table</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse all locations.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/map"
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            isActive('/map') && 'active-link',
                          )}
                        >
                          <div className="text-sm font-medium leading-none">Map Viewer</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            View map for Polished Crystal
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem> */}

              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    hasPokemonTheme && 'pokemon-themed-link',
                    (isActive('/team-builder') || isActive('/map')) && 'active-link',
                  )}
                >
                  Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[300px] gap-4 p-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/map"
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            isActive('/map') && 'active-link',
                          )}
                        >
                          <div className="text-sm font-medium leading-none">Map Viewer</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            View map for Polished Crystal
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/team-builder"
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                            isActive('/team-builder') && 'active-link',
                          )}
                        >
                          <div className="text-sm font-medium leading-none">Team Builder</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Build your Pokemon team.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="https://polishededitor.vercel.app"
                          target="_blank"
                          className={cn(
                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                          )}
                        >
                          <div className="text-sm font-medium leading-none flex gap-1">
                            Polished Editor <ExternalLink className="size-3 mt-px" />
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Game Editor by Rev3lation
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    hasPokemonTheme && 'pokemon-themed-link',
                    isActive('/locations') && 'active-link',
                  )}
                >
                  <Link href="/locations">Pokéarth</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    hasPokemonTheme && 'pokemon-themed-link',
                    isActive('/items') && 'active-link',
                  )}
                >
                  <Link href="/items">Items</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    hasPokemonTheme && 'pokemon-themed-link',
                    isActive('/events') && 'active-link',
                  )}
                >
                  <Link href="/events">Events</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    hasPokemonTheme && 'pokemon-themed-link',
                    isActive('/faq') && 'active-link',
                  )}
                >
                  <Link href="/faq">FAQ</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className={cn('flex items-center gap-2')}>
            <Label htmlFor="type-toggle" className="text-sm whitespace-nowrap">
              <Badge>{!showFaithful ? 'Polished' : 'Faithful'}</Badge>
            </Label>
            {isLoading && <>loading...</>}
            <Switch
              id="type-toggle"
              checked={!showFaithful}
              onCheckedChange={toggleFaithful}
              aria-label="Toggle between faithful and updated Pokémon types"
            />
            <SimpleThemeToggle />
          </div>
        </div>
      </motion.div>

      {/* Mobile Navigation */}
      <motion.div
        animate={{
          backdropFilter: visible ? 'blur(10px)' : 'none',
          boxShadow: visible
            ? '0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset'
            : 'none',
          width: visible ? '90%' : '100%',
          paddingRight: visible ? '12px' : '0px',
          paddingLeft: visible ? '12px' : '0px',
          borderRadius: visible ? '2rem' : '2rem',
          y: visible ? 20 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 50,
        }}
        className={cn(
          'relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden',
          visible && 'bg-white/80 dark:bg-neutral-950/80',
        )}
      >
        <div className="flex w-full flex-row items-center justify-between">
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
                  'hidden sm:flex font-bold text-sm md:text-lg transition-colors duration-300 dark:text-white',
                  hasPokemonTheme && 'pokemon-hero-text',
                )}
              >
                PolishedDex
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="mobile-type-toggle-header" className="text-sm whitespace-nowrap">
              <Badge>{!showFaithful ? 'Polished' : 'Faithful'}</Badge>
            </Label>
            <Switch
              id="mobile-type-toggle-header"
              checked={!showFaithful}
              onCheckedChange={toggleFaithful}
              aria-label="Toggle between faithful and updated Pokémon types"
            />
            <SimpleThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <IconX className="h-5 w-5" /> : <IconMenu2 className="h-5 w-5" />}
              <span className="sr-only">Toggle mobile menu</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              // width: visible ? '90%' : '100%',
            }}
            exit={{ opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 50,
            }}
            className={cn(
              'absolute inset-x-0 top-20 z-50 mx-auto flex w-[calc(100vw-3rem)] max-w-7xl flex-col items-start justify-start gap-2 px-4 rounded-xl bg-white py-4 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] lg:hidden dark:bg-neutral-950 backdrop-blur-md',
              // visible && 'bg-white dark:bg-background',
            )}
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                target={item.href.startsWith('https') ? '_blank' : undefined}
                rel={item.href.startsWith('https') ? 'noopener noreferrer' : undefined}
                className={cn(
                  'relative text-lg font-semibold transition-colors hover:text-foreground/80',
                  isActive(item.href)
                    ? 'text-foreground'
                    : 'text-neutral-600 dark:text-neutral-300',
                )}
              >
                <span className="flex gap-2 items-center">
                  {item.title}{' '}
                  {item.href.startsWith('https') ? (
                    <ExternalLink className="size-5 text-muted-foreground" />
                  ) : undefined}
                </span>
              </Link>
            ))}
            {/* <div className="flex w-full flex-col gap-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <Label htmlFor="mobile-type-toggle" className="text-sm">
                  <Badge>{!showFaithful ? 'Polished' : 'Faithful'}</Badge>
                </Label>
                <Switch
                  id="mobile-type-toggle"
                  checked={!showFaithful}
                  onCheckedChange={toggleFaithful}
                  aria-label="Toggle between faithful and updated Pokémon types"
                />
              </div>
            </div> */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
