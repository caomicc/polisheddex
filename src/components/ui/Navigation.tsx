'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';

import { SimpleThemeToggle } from './theme-toggle';
import { useFaithfulPreferenceSafe } from '@/hooks/useFaithfulPreferenceSafe';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from './button';
import { IconMenu2, IconX, IconChevronDown, IconSearch } from '@tabler/icons-react';
import { ExternalLink } from 'lucide-react';
import { GlobalSearch } from '@/components/global-search';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

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
    title: 'Data',
    children: [
      {
        title: 'Pokedex',
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
        title: 'World Map Viewer',
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
        title: 'Polished Editor by Rev3lation',
        href: 'https://polishededitor.vercel.app',
        description: 'Game Editor by Rev3lation.',
        external: true,
      },
    ],
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
  const { showFaithful, toggleFaithful } = useFaithfulPreferenceSafe();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <motion.div ref={ref} className={cn('sticky inset-x-0 top-0 z-40 w-full')}>
      {/* Desktop Navigation */}
      <div
        className={cn(
          'relative z-[60] mx-auto w-full flex-row items-center justify-between self-start bg-white px-4 py-2 hidden lg:flex dark:bg-background border-b',
        )}
      >
        <div className="w-full max-w-full mx-auto flex items-center justify-between gap-4">
          {/* Left: Logo + Version Control */}
          <div className="flex items-center gap-3">
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

            {/* Version Control Pill */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">
                  <span className={cn(
                    'size-2 rounded-full',
                    showFaithful ? 'bg-amber-500' : 'bg-emerald-500'
                  )} />
                  {showFaithful ? 'Faithful' : 'Polished'}
                  <IconChevronDown className="size-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-2">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => !showFaithful || toggleFaithful()}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                      !showFaithful && 'bg-accent'
                    )}
                  >
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Polished
                    {!showFaithful && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                  </button>
                  <button
                    onClick={() => showFaithful || toggleFaithful()}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                      showFaithful && 'bg-accent'
                    )}
                  >
                    <span className="size-2 rounded-full bg-amber-500" />
                    Faithful
                    {showFaithful && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: Search, Nav, Theme Toggle */}
          <div className="flex items-center gap-1">
            {/* Search Button */}
            <button
              data-slot="dialog-trigger"
              aria-label="Search (Cmd+K)"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm transition-all hover:bg-secondary/80 px-3 py-2 bg-muted/50 text-muted-foreground relative h-8 justify-start font-medium shadow-none w-48 border border-border"
              type="button"
            >
              <IconSearch className="size-4" />
              <span className="hidden lg:inline-flex">Search...</span>
              <span className="inline-flex lg:hidden">Search...</span>
              <div className=" hidden gap-0.5 sm:flex ml-auto">
                <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1 font-sans text-[10px] font-medium select-none border">⌘</kbd>
                <kbd className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1 font-sans text-[10px] font-medium select-none border">K</kbd>
              </div>
            </button>

            {/* Desktop Nav Menu - Click-based dropdowns */}
            <nav className="!hidden md:!flex items-center gap-1">
              {navItems.map((item, idx) => (
                <React.Fragment key={`desktop-nav-${idx}`}>
                  {isNavGroup(item) ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            'h-9 px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] hover:bg-accent hover:text-accent-foreground',
                            hasPokemonTheme && 'pokemon-themed-link',
                            isGroupActive(item) && 'bg-primary text-primary-foreground hover:bg-primary/90',
                          )}
                        >
                          {item.title}
                          <IconChevronDown className="size-3 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align={'end'}
                        className="w-[300px] p-2"
                      >
                        <ul className="grid gap-1">
                          {item.children.map((child, childIdx) => (
                            <li key={`desktop-child-${childIdx}`}>
                              <Link
                                href={child.href}
                                target={child.external ? '_blank' : undefined}
                                rel={child.external ? 'noopener noreferrer' : undefined}
                                className={cn(
                                  'block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                  isActive(child.href) && 'bg-primary text-primary-foreground',
                                )}
                              >
                                <div className="text-sm font-medium leading-none flex items-center gap-1">
                                  {child.title}
                                  {child.external && <ExternalLink className="size-3 mt-px" />}
                                </div>
                                {/* {child.description && (
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {child.description}
                                  </p>
                                )} */}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Link
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className={cn(
                        'h-9 px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] hover:bg-accent hover:text-accent-foreground',
                        hasPokemonTheme && 'pokemon-themed-link',
                        isActive(item.href) && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                    >
                      {item.title}
                      {item.external && <ExternalLink className="size-3 ml-1" />}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>

            <SimpleThemeToggle />
          </div>
        </div>
      </div>

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
          {/* Left: Logo + Version Control */}
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

            {/* Version Control Pill - Mobile */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-muted">
                  <span className={cn(
                    'size-1.5 rounded-full',
                    showFaithful ? 'bg-amber-500' : 'bg-emerald-500'
                  )} />
                  {showFaithful ? 'Faithful' : 'Polished'}
                  <IconChevronDown className="size-2.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-40 p-2">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => !showFaithful || toggleFaithful()}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                      !showFaithful && 'bg-accent'
                    )}
                  >
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Polished
                    {!showFaithful && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                  </button>
                  <button
                    onClick={() => showFaithful || toggleFaithful()}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                      showFaithful && 'bg-accent'
                    )}
                  >
                    <span className="size-2 rounded-full bg-amber-500" />
                    Faithful
                    {showFaithful && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: Search, Theme, Menu */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
            >
              <IconSearch className="h-5 w-5" />
            </Button>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Search Dialog */}
      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </motion.div>
  );
}
