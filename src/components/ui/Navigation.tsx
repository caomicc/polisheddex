// 'use client';

// import * as React from 'react';
// import Link from 'next/link';
// import Image from 'next/image';
// import { cn } from '@/lib/utils';
// import { usePokemonType } from '@/contexts/PokemonTypeContext';
// import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';
// import { Switch } from './switch';
// import { Label } from './label';
// import HamburgerMenu from './hamburger';
// import { SimpleThemeToggle } from './theme-toggle';
// import {
//   NavigationMenu,
//   NavigationMenuContent,
//   NavigationMenuIndicator,
//   NavigationMenuItem,
//   NavigationMenuLink,
//   NavigationMenuList,
//   NavigationMenuTrigger,
// } from './navigation-menu';

// const NavigationMenuDemo = () => {
// const [heroVisible, setHeroVisible] = React.useState(true);
// const [isHydrated, setIsHydrated] = React.useState(false);
// const { primaryType } = usePokemonType();
// const { showFaithful, toggleFaithful } = useFaithfulPreference();

// React.useEffect(() => {
//   // Mark as hydrated after first render
//   setIsHydrated(true);

//   const handleHeroVisibilityChange = (event: CustomEvent) => {
//     setHeroVisible(event.detail.isVisible);
//   };

//   window.addEventListener('heroVisibilityChange', handleHeroVisibilityChange as EventListener);

//   return () => {
//     window.removeEventListener(
//       'heroVisibilityChange',
//       handleHeroVisibilityChange as EventListener,
//     );
//   };
// }, []);

// // Use consistent state until hydrated
// const showBackground = isHydrated && !heroVisible;
// const hasPokemonTheme = primaryType !== null;

//   return (
// <div
//   className={cn(
//     'fixed top-2 md:top-4 py-2 px-4 mx-4 w-[calc(100%-theme(spacing.4))] md:w-[calc(100%-theme(spacing.8))] left-[50%] transform -translate-x-1/2 z-50 rounded-xl transition-all duration-300 backdrop-blur-xl border border-2 max-w-4xl mx-auto',
//     showBackground
//       ? 'bg-white/0 border-gray-200 text-foreground dark:border-gray-700'
//       : 'dark:text-white border-transparent',
//     hasPokemonTheme && 'pokemon-themed',
//   )}
// >
//   <div className="w-full max-w-full mx-auto flex items-center justify-between gap-2 md:gap-4">
//     <div className="flex items-center gap-2">
//       <Link href="/" className="flex items-center gap-2" aria-label="Home">
//         <div className="aspect-square w-8 relative">
//           <Image
//             src="/25.png"
//             alt="PolishedDex Logo"
//             fill
//             sizes="64px"
//             className="object-contain"
//           />
//         </div>
//         <span
//           className={cn(
//             'hidden lg:inline-flex font-bold text-sm md:text-lg transition-colors duration-300 dark:text-white',
//             showBackground && !hasPokemonTheme ? 'text-gray-900' : 'text-white',
//             hasPokemonTheme && 'pokemon-hero-text',
//           )}
//         >
//           PolishedDex
//         </span>
//       </Link>
//     </div>
//         <NavigationMenu className=" justify-start! !hidden md:!flex relative">
//           <NavigationMenuList className="">
//             <NavigationMenuItem>
//               <NavigationMenuTrigger
//                 className={cn(
//                   !hasPokemonTheme &&
//                     !showBackground &&
//                     'hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
//                   !hasPokemonTheme &&
//                     showBackground &&
//                     'text-gray-900 hover:bg-pink-50! hover:text-gray-900! dark:text-white dark:hover:bg-gray-800',
//                   hasPokemonTheme && 'pokemon-themed-link',
//                 )}
//               >
//                 Pokedex
//               </NavigationMenuTrigger>
//               <NavigationMenuContent className="shadow-none border-0">
//                 <ul className="grid w-[300px] gap-4">
//                   <li>
//                     <NavigationMenuLink asChild>
//                       <Link href="/pokemon">
//                         <div className="font-medium">Pokemon Search</div>
//                         <div className="text-muted-foreground">
//                           Browse all Pokemon in the Pokedex.
//                         </div>
//                       </Link>
//                     </NavigationMenuLink>
//                     <NavigationMenuLink asChild>
//                       <Link href="/moves">
//                         <div className="font-medium">Moves</div>
//                         <div className="text-muted-foreground">Learn about available moves.</div>
//                       </Link>
//                     </NavigationMenuLink>
//                     <NavigationMenuLink asChild>
//                       <Link href="/team-builder">
//                         <div className="font-medium">Team Builder</div>
//                         <div className="text-muted-foreground">
//                           Create and manage your Pokemon team.
//                         </div>
//                       </Link>
//                     </NavigationMenuLink>
//                   </li>
//                 </ul>
//               </NavigationMenuContent>
//             </NavigationMenuItem>
//             <NavigationMenuItem>
//               <NavigationMenuLink asChild>
//                 <Link
//                   className={cn(
//                     !hasPokemonTheme &&
//                       !showBackground &&
//                       'text-white hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
//                     !hasPokemonTheme &&
//                       showBackground &&
//                       'text-gray-900 hover:bg-pink-50! hover:text-gray-900! dark:text-white! dark:hover:bg-gray-800',
//                     hasPokemonTheme && 'pokemon-themed-link',
//                   )}
//                   href="/locations"
//                 >
//                   Locations
//                 </Link>
//               </NavigationMenuLink>
//             </NavigationMenuItem>
//             <NavigationMenuItem>
//               <NavigationMenuLink asChild>
//                 <Link
//                   className={cn(
//                     !hasPokemonTheme &&
//                       !showBackground &&
//                       'text-white! hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
//                     !hasPokemonTheme &&
//                       showBackground &&
//                       'text-gray-900! hover:bg-pink-50! hover:text-gray-900! dark:text-white! dark:hover:bg-gray-800',
//                     hasPokemonTheme && 'pokemon-themed-link',
//                   )}
//                   href="/items"
//                 >
//                   Items
//                 </Link>
//               </NavigationMenuLink>
//             </NavigationMenuItem>
//             <NavigationMenuItem>
//               <NavigationMenuLink asChild>
//                 <Link
// className={cn(
//   !hasPokemonTheme &&
//     !showBackground &&
//     'text-white! hover:text-gray-900! hover:bg-gray-200 dark:hover:bg-gray-800',
//   !hasPokemonTheme &&
//     showBackground &&
//     'text-gray-900! hover:bg-pink-50! hover:text-gray-900! dark:text-white! dark:hover:bg-gray-800',
//   hasPokemonTheme && 'pokemon-themed-link',
// )}
//                   href="/wiki"
//                 >
//                   Wiki
//                 </Link>
//               </NavigationMenuLink>
//             </NavigationMenuItem>
//             <NavigationMenuIndicator className="">
//               <div className="Arrow" />
//             </NavigationMenuIndicator>
//           </NavigationMenuList>
//         </NavigationMenu>

// <div className="flex items-center gap-2 ml-auto">
//   <Label htmlFor="type-toggle" className="text-sm whitespace-nowrap">
//     <span className={showFaithful ? 'font-bold' : ''}>Faithful</span>
//     {' / '}
//     <span className={!showFaithful ? 'font-bold' : ''}>Polished</span>
//   </Label>
//   <Switch
//     id="type-toggle"
//     checked={!showFaithful}
//     onCheckedChange={toggleFaithful}
//     aria-label="Toggle between faithful and updated Pokémon types"
//   />
//   <SimpleThemeToggle />
// </div>

// <HamburgerMenu />
//       </div>
//     </div>
//   );
// };

// export default NavigationMenuDemo;

'use client';

import * as React from 'react';
import Link from 'next/link';
// import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from 'lucide-react';

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

// const components: { title: string; href: string; description: string }[] = [
//   {
//     title: 'Alert Dialog',
//     href: '/docs/primitives/alert-dialog',
//     description:
//       'A modal dialog that interrupts the user with important content and expects a response.',
//   },
//   {
//     title: 'Hover Card',
//     href: '/docs/primitives/hover-card',
//     description: 'For sighted users to preview content available behind a link.',
//   },
//   {
//     title: 'Progress',
//     href: '/docs/primitives/progress',
//     description:
//       'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
//   },
//   {
//     title: 'Scroll-area',
//     href: '/docs/primitives/scroll-area',
//     description: 'Visually or semantically separates content.',
//   },
//   {
//     title: 'Tabs',
//     href: '/docs/primitives/tabs',
//     description:
//       'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
//   },
//   {
//     title: 'Tooltip',
//     href: '/docs/primitives/tooltip',
//     description:
//       'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
//   },
// ];

export default function Navigation() {
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
          ? 'bg-white/0 border-gray-200 text-foreground dark:border-gray-700'
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
                showBackground && !hasPokemonTheme ? 'text-gray-900' : 'text-white',
                hasPokemonTheme && 'pokemon-hero-text',
              )}
            >
              PolishedDex
            </span>
          </Link>
        </div>
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  !hasPokemonTheme && !showBackground && 'text-white',
                  hasPokemonTheme && 'pokemon-themed-link',
                )}
              >
                Pokedex
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="/pokemon">
                        <div className="font-medium">Pokemon</div>
                        <div className="text-muted-foreground">
                          Browse all Pokemon in the Pokedex.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/moves">
                        <div className="font-medium">Moves</div>
                        <div className="text-muted-foreground">
                          Browse all moves in the Pokedex.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/team-builder">
                        <div className="font-medium">Team Builder</div>
                        <div className="text-muted-foreground">Build your Pokemon team.</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link
                  className={cn(
                    !hasPokemonTheme && !showBackground && 'text-white',
                    hasPokemonTheme && 'pokemon-themed-link',
                  )}
                  href="/items"
                >
                  Items
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link
                  className={cn(
                    !hasPokemonTheme && !showBackground && 'text-white',
                    hasPokemonTheme && 'pokemon-themed-link',
                  )}
                  href="/locations"
                >
                  Locations
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link
                  className={cn(
                    !hasPokemonTheme && !showBackground && 'text-white',
                    hasPokemonTheme && 'pokemon-themed-link',
                  )}
                  href="/wiki"
                >
                  Wiki
                </Link>
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
