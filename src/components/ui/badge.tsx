import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import type { PokemonType } from '@/types/types';

// All possible badge variants, including Pokémon types and UI variants
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const badgeVariantNames = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

type BadgeVariant = (typeof badgeVariantNames)[number];

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 md:px-2 md:px-3 md:py-1 text-[10px] md:text-xs uppercase tracking-wider font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        // Pokémon type variants
        normal: 'bg-normal text-brown-900 border-transparent',
        fire: 'bg-fire text-orange-50 border-transparent',
        water: 'bg-water text-blue-50 border-transparent',
        electric: 'bg-electric text-yellow-900 border-transparent',
        grass: 'bg-grass text-green-900 border-transparent',
        ice: 'bg-ice text-blue-900 border-transparent',
        fighting: 'bg-fighting text-white border-transparent',
        poison: 'bg-poison text-purple-50 border-transparent',
        ground: 'bg-ground text-orange-900 border-transparent',
        flying: 'bg-flying text-blue-900 border-transparent',
        psychic: 'bg-psychic text-pink-900 border-transparent',
        bug: 'bg-bug text-brown-900 border-transparent',
        rock: 'bg-rock text-brown-50 border-transparent',
        ghost: 'bg-ghost text-purple-50 border-transparent',
        dragon: 'bg-dragon text-purple-50 border-transparent',
        dark: 'bg-dark text-purple-50 border-transparent',
        steel: 'bg-steel text-grey-50 border-transparent',
        fairy: 'bg-fairy text-pink-900 border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps extends React.ComponentProps<'span'> {
  variant?: BadgeVariant | PokemonType['name'];
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
