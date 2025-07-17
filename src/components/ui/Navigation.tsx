import * as React from 'react';
import { NavigationMenu } from 'radix-ui';
import classNames from 'clsx';
// import { CaretDownIcon } from "@radix-ui/react-icons";
import Link from 'next/link';
import Image from 'next/image';

const NavigationMenuDemo = () => {
  return (
    <div className="w-full bg-slate-100 py-3 px-4 shadow-lg shadow-slate-300 fixed top-0 left-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
            {/* Replace with your logo SVG or image if available */}
            <div className="aspect-square w-8 relative">
              <Image
                src="/25.png"
                alt="PolishedDex Logo"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <span className="font-bold text-sm md:text-xl text-slate-900">PolishedDex</span>
          </Link>
        </div>
        <NavigationMenu.Root className="NavigationMenuRoot justify-end! w-full!">
          <NavigationMenu.List className="NavigationMenuList">
            {/* <NavigationMenu.Item>
							<NavigationMenu.Trigger className="NavigationMenuTrigger">
								Database <CaretDownIcon className="CaretDown" aria-hidden />
							</NavigationMenu.Trigger>
							<NavigationMenu.Content className="NavigationMenuContent">
								<ul className="List one">
									<li style={{ gridRow: "span 3" }}>
										<NavigationMenu.Link asChild>
											<Link className="Callout" href="/">
												<svg
													aria-hidden
													width="38"
													height="38"
													viewBox="0 0 25 25"
													fill="white"
												>
													<path d="M12 25C7.58173 25 4 21.4183 4 17C4 12.5817 7.58173 9 12 9V25Z"></path>
													<path d="M12 0H4V8H12V0Z"></path>
													<path d="M17 8C19.2091 8 21 6.20914 21 4C21 1.79086 19.2091 0 17 0C14.7909 0 13 1.79086 13 4C13 6.20914 14.7909 8 17 8Z"></path>
												</svg>
												<div className="CalloutHeading">Radix Primitives</div>
												<p className="CalloutText">
													Unstyled, accessible components for React.
												</p>
											</Link>
										</NavigationMenu.Link>
									</li>

									<ListItem href="/locations" title="Locations">
										Search for Pokémon locations by area, method, and time.
									</ListItem>
									<ListItem
										href="/pokemon"
										title="Pokémon"
									>
										A Pokedex for Polished Crystal.
									</ListItem>

								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>

						<NavigationMenu.Item>
							<NavigationMenu.Trigger className="NavigationMenuTrigger">
								Overview <CaretDownIcon className="CaretDown" aria-hidden />
							</NavigationMenu.Trigger>
							<NavigationMenu.Content className="NavigationMenuContent">
								<ul className="List two">
									<ListItem
										title="Introduction"
										href="/primitives/docs/overview/introduction"
									>
										Build high-quality, accessible design systems and web apps.
									</ListItem>
									<ListItem
										title="Getting started"
										href="/primitives/docs/overview/getting-started"
									>
										A quick tutorial to get you up and running with Radix
										Primitives.
									</ListItem>
									<ListItem title="Styling" href="/primitives/docs/guides/styling">
										Unstyled and compatible with any styling solution.
									</ListItem>
									<ListItem
										title="Animation"
										href="/primitives/docs/guides/animation"
									>
										Use CSS keyframes or any animation library of your choice.
									</ListItem>
									<ListItem
										title="Accessibility"
										href="/primitives/docs/overview/accessibility"
									>
										Tested in a range of browsers and assistive technologies.
									</ListItem>
									<ListItem
										title="Releases"
										href="/primitives/docs/overview/releases"
									>
										Radix Primitives releases and their changelogs.
									</ListItem>
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item> */}

            <NavigationMenu.Item>
              <NavigationMenu.Link className="NavigationMenuLink" href="/pokemon">
                Pokedex
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link className="NavigationMenuLink" href="/locations">
                Locations
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
  ({ className, children, title, href, ...props }) => (
    <li>
      <NavigationMenu.Link asChild>
        <Link className={classNames('ListItemLink', className)} href={href} {...props}>
          <div className="ListItemHeading">{title}</div>
          <p className="ListItemText">{children}</p>
        </Link>
      </NavigationMenu.Link>
    </li>
  ),
);

ListItem.displayName = 'ListItem';

export default NavigationMenuDemo;
