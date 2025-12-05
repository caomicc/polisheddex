'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';

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
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from './badge';
import { Button } from './button';
import { IconMenu2, IconX, IconChevronDown } from '@tabler/icons-react';
import { ExternalLink } from 'lucide-react';

// Unified navigation structure
type NavChild = {
  title: string;
  href: string;
  description?: string;
  external?: boolean;
};

type NavItemGroup = {
  title: string;
  children: NavChild[];
};

type NavItemLink = {
  title: string;
  href: string;
  external?: boolean;
};

type NavItem = NavItemGroup | NavItemLink;

const isNavGroup = (item: NavItem): item is NavItemGroup => {
  return 'children' in item;
};

const navItems: NavItem[] = [
  {
    title: 'Pokédex',
    children: [
      {
        title: 'Pokemon',
        href: '/pokemon',
        description: 'Browse all Pokemon in the Pokedex.',
      },
      {
        title: 'Attackdex',
        href: '/moves',
        description: 'Browse all moves in the Pokedex.',
      },
      {
        title: 'Abilities',
        href: '/abilities',
        description: 'Browse all abilities.',
      },
      {
        title: 'Items',
        href: '/items',
        description: 'Browse all items.',
      },
    ],
  },
  {
    title: 'Explore',
    children: [
      {
        title: 'Pokéarth',
        href: '/locations',
        description: 'Browse all locations.',
      },
      {
        title: 'Map Viewer',
        href: '/map',
        description: 'View map for Polished Crystal.',
      },
      {
        title: 'Events',
        href: '/events',
        description: 'Browse all events.',
      },
    ],
  },
  {
    title: 'Tools',
    children: [
      {
        title: 'Team Builder',
        href: '/team-builder',
        description: 'Build your Pokemon team.',
      },
      {
        title: 'Polished Editor',
        href: 'https://polishededitor.vercel.app',
        description: 'Game Editor by Rev3lation.',
        external: true,
      },
    ],
  },
  {
    title: 'FAQ',
    href: '/faq',
  },
];

// Mobile collapsible section component
function MobileNavSection({
  item,
  isActive,
  onLinkClick,
}: {
  item: NavItemGroup;
  isActive: (path: string) => boolean;
  onLinkClick: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Check if any child is active
  const hasActiveChild = item.children.some((child) => isActive(child.href));

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between py-2 text-lg font-semibold transition-colors hover:text-foreground/80',
          hasActiveChild ? 'text-foreground' : 'text-neutral-600 dark:text-neutral-300',
        )}
      >
        {item.title}
        <IconChevronDown
          className={cn('h-5 w-5 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 pb-2 pl-4">
              {item.children.map((child, idx) => (
                <Link
                  key={`mobile-child-${idx}`}
                  href={child.href}
                  onClick={onLinkClick}
                  target={child.external ? '_blank' : undefined}
                  rel={child.external ? 'noopener noreferrer' : undefined}
                  className={cn(
                    'flex items-center gap-2 py-2 text-base transition-colors hover:text-foreground/80',
                    isActive(child.href)
                      ? 'text-foreground font-medium'
                      : 'text-neutral-500 dark:text-neutral-400',
                  )}
                >
                  {child.title}
                  {child.external && <ExternalLink className="size-4 text-muted-foreground" />}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { showFaithful, toggleFaithful, isLoading } = useFaithfulPreferenceSafe();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
  const isActive = (path: string) => pathname?.startsWith(path);

  // Check if any path in a group is active
  const isGroupActive = (item: NavItemGroup) => {
    return item.children.some((child) => isActive(child.href));
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
          {/* Logo */}
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

          {/* Desktop Nav Menu */}
          <NavigationMenu className="!hidden md:!flex" viewport={false}>
            <NavigationMenuList>
              {navItems.map((item, idx) => (
                <NavigationMenuItem key={`desktop-nav-${idx}`}>
                  {isNavGroup(item) ? (
                    <>
                      <NavigationMenuTrigger
                        className={cn(
                          hasPokemonTheme && 'pokemon-themed-link',
                          isGroupActive(item) && 'active-link',
                        )}
                      >
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[300px] gap-2 p-2">
                          {item.children.map((child, childIdx) => (
                            <li key={`desktop-child-${childIdx}`}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={child.href}
                                  target={child.external ? '_blank' : undefined}
                                  rel={child.external ? 'noopener noreferrer' : undefined}
                                  className={cn(
                                    'block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                    isActive(child.href) && 'active-link',
                                  )}
                                >
                                  <div className="text-sm font-medium leading-none flex items-center gap-1">
                                    {child.title}
                                    {child.external && <ExternalLink className="size-3 mt-px" />}
                                  </div>
                                  {child.description && (
                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                      {child.description}
                                    </p>
                                  )}
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        navigationMenuTriggerStyle(),
                        hasPokemonTheme && 'pokemon-themed-link',
                        isActive(item.href) && 'active-link',
                      )}
                    >
                      <Link
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                      >
                        {item.title}
                        {item.external && <ExternalLink className="size-3 ml-1" />}
                      </Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Controls */}
          <div className={cn('flex items-center gap-2')}>
            <Label htmlFor="type-toggle" className="text-sm whitespace-nowrap">
              <Badge>{showFaithful ? 'Faithful' : 'Polished'}</Badge>
            </Label>
            {isLoading ? (
              <div className="w-11 h-6 bg-gray-200 rounded-full animate-pulse" />
            ) : (
              <Switch
                id="type-toggle"
                checked={showFaithful}
                onCheckedChange={toggleFaithful}
                aria-label="Toggle between faithful and polished versions"
              />
            )}
            <SimpleThemeToggle />
          </div>
        </div>
      </motion.div>

      {/* Mobile Navigation Header */}
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
              <Badge>{showFaithful ? 'Faithful' : 'Polished'}</Badge>
            </Label>
            {isLoading ? (
              <div className="w-11 h-6 bg-gray-200 rounded-full animate-pulse" />
            ) : (
              <Switch
                id="mobile-type-toggle-header"
                checked={showFaithful}
                onCheckedChange={toggleFaithful}
                aria-label="Toggle between faithful and polished versions"
              />
            )}
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
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 50,
            }}
            className={cn(
              'absolute inset-x-0 top-20 z-50 mx-auto flex w-[calc(100vw-3rem)] max-w-7xl flex-col items-start justify-start gap-1 px-4 rounded-xl bg-white py-4 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] lg:hidden dark:bg-neutral-950 backdrop-blur-md',
            )}
          >
            {/* Home link */}
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={cn(
                'w-full py-2 text-lg font-semibold transition-colors hover:text-foreground/80',
                pathname === '/' ? 'text-foreground' : 'text-neutral-600 dark:text-neutral-300',
              )}
            >
              Home
            </Link>

            {/* Nav items */}
            {navItems.map((item, idx) =>
              isNavGroup(item) ? (
                <MobileNavSection
                  key={`mobile-section-${idx}`}
                  item={item}
                  isActive={isActive}
                  onLinkClick={closeMobileMenu}
                />
              ) : (
                <Link
                  key={`mobile-link-${idx}`}
                  href={item.href}
                  onClick={closeMobileMenu}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className={cn(
                    'w-full py-2 text-lg font-semibold transition-colors hover:text-foreground/80',
                    isActive(item.href)
                      ? 'text-foreground'
                      : 'text-neutral-600 dark:text-neutral-300',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.title}
                    {item.external && <ExternalLink className="size-5 text-muted-foreground" />}
                  </span>
                </Link>
              ),
            )}

            {/* Mobile toggle (redundant with header but kept for visibility in menu) */}
            <div className="flex w-full flex-col gap-4 pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Label htmlFor="mobile-type-toggle" className="text-sm">
                  <Badge>{showFaithful ? 'Faithful' : 'Polished'}</Badge>
                </Label>
                {isLoading ? (
                  <div className="w-11 h-6 bg-gray-200 rounded-full animate-pulse" />
                ) : (
                  <Switch
                    id="mobile-type-toggle"
                    checked={showFaithful}
                    onCheckedChange={toggleFaithful}
                    aria-label="Toggle between faithful and polished versions"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
