'use client';

import * as React from 'react';
import { Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type MenuItem = {
  title: string;
  href?: string;
  submenu?: MenuItem[];
};

const menuItems: MenuItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Pokedex', href: '/pokemon' },
  { title: 'Locations', href: '/locations' },
  { title: 'Items', href: '/items' },
  { title: 'Moves', href: '/moves' },
  { title: 'Team Builder', href: '/team-builder' },
];

const MenuItemComponent: React.FC<{ item: MenuItem; depth?: number }> = ({ item, depth = 0 }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (item.submenu) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={
              cn()
              // 'flex w-full items-center justify-between py-2 text-lg font-medium transition-colors hover:text-primary',
              // depth > 0 && 'pl-4',
            }
          >
            {item.title}
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {item.submenu.map((subItem) => (
            <MenuItemComponent key={subItem.title} item={subItem} depth={depth + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <a
      href={item.href}
      className={cn(
        'font-bold transition-colors hover:text-primary',
        depth > 0 && 'pl-4',
        item.href === '/' && 'text-primary',
      )}
    >
      {item.title}
    </a>
  );
};

export default function HamburgerMenu() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px] border-border">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="grid flex-1 auto-rows-min gap-6 px-4 py-12">
          {menuItems.map((item) => (
            <MenuItemComponent key={item.title} item={item} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
