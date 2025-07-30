import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import type { LocationData, PokemonEncounter, PokemonType } from '@/types/types';

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
  'locations',
  'grotto',
  'kanto',
  'johto',
  'orange',
  'morn',
  'day',
  'nite',
  'any',
  'null',
] as const;

type BadgeVariant = (typeof badgeVariantNames)[number];

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-sm border px-1 md:px-1 py-[2px] md:py-[2px] text-[10px] md:text-[10px] uppercase tracking-wider font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  // 'inline-flex items-center justify-center rounded-sm border px-1 md:px-2 md:px-3 py-[2px] md:py-1 text-[10px] md:text-xs uppercase tracking-wider font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
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
        normal: 'bg-normal text-black border-normal-600',
        fire: 'bg-fire text-orange-950 border-red-600',
        water: 'bg-water text-blue-950 border-blue-500',
        electric: 'bg-electric text-yellow-950 border-yellow-600',
        grass: 'bg-grass text-green-950 border-green-600',
        ice: 'bg-ice text-blue-950 border-cyan-500',
        fighting: 'bg-fighting text-orange-950 border-orange-600',
        poison: 'bg-poison text-purple-950 border-purple-600',
        ground: 'bg-ground text-orange-950 border-orange-600',
        flying: 'bg-flying text-sky-950 border-sky-600',
        psychic: 'bg-psychic text-pink-950 border-pink-600',
        bug: 'bg-bug text-lime-950! border-lime-500',
        rock: 'bg-rock text-slate-900 border-slate-600',
        ghost: 'bg-ghost text-purple-950 border-purple-400',
        dragon: 'bg-dragon text-slate-950 border-indigo-500',
        dark: 'bg-dark text-purple-50 border-purple-950',
        steel: 'bg-steel text-grey-950 border-slate-600',
        fairy: 'bg-fairy text-pink-950 border-pink-400',
        locations: 'bg-cyan-100 text-cyan-900 border-cyan-200',
        grotto: 'bg-green-100 text-green-900 border-green-200',
        kanto: 'bg-red-100 text-red-900 border-red-200',
        johto: 'bg-blue-100 text-blue-900 border-blue-200',
        orange: 'bg-orange-100 text-orange-900 border-orange-200',
        morn: 'bg-yellow-100 text-yellow-900 border-yellow-200',
        day: 'bg-sky-100 text-sky-900 border-sky-200',
        nite: 'bg-purple-100 text-purple-900 border-purple-200',
        any: 'bg-pink-100 text-pink-900 border-pink-200',
        null: 'bg-gray-100 text-gray-900 border-gray-200',
        special: 'bg-purple-100 text-purple-900 border-purple-200',
        physical: 'bg-blue-100 text-blue-900 border-blue-200',
        status: 'bg-yellow-100 text-yellow-900 border-yellow-200',
        unknown: 'bg-yellow-100 text-yellow-900 border-yellow-200',
        tm: 'bg-yellow-100 text-yellow-900 border-yellow-200',
        hm: 'bg-blue-100 text-blue-900 border-blue-200',
        pokeball: 'bg-red-100 text-red-900 border-red-200',
        item: 'bg-green-100 text-green-900 border-green-200',
        berry: 'bg-pink-100 text-pink-900 border-pink-200',
        medicine: 'bg-blue-100 text-blue-900 border-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps extends React.ComponentProps<'span'> {
  variant?:
    | BadgeVariant
    | PokemonType['name']
    | LocationData['region']
    | PokemonEncounter['time']
    // fix
    | 'unknown'
    | 'physical'
    | 'special'
    | 'status'
    | 'tm'
    | 'hm'
    | 'pokeball'
    | 'item'
    | 'berry'
    | 'medicine';
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
