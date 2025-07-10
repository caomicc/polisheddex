import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm border px-3 py-1 text-xs uppercase tracking-wider font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Pokémon type variants
        normal: "bg-type-normal text-white border-transparent",
        fire: "bg-type-fire text-white border-transparent",
        water: "bg-type-water text-white border-transparent",
        electric: "bg-type-electric text-black border-transparent",
        grass: "bg-type-grass text-white border-transparent",
        ice: "bg-type-ice text-black border-transparent",
        fighting: "bg-type-fighting text-white border-transparent",
        poison: "bg-type-poison text-white border-transparent",
        ground: "bg-type-ground text-black border-transparent",
        flying: "bg-type-flying text-white border-transparent",
        psychic: "bg-type-psychic text-white border-transparent",
        bug: "bg-type-bug text-white border-transparent",
        rock: "bg-type-rock text-white border-transparent",
        ghost: "bg-type-ghost text-white border-transparent",
        dragon: "bg-type-dragon text-white border-transparent",
        dark: "bg-type-dark text-white border-transparent",
        steel: "bg-type-steel text-black border-transparent",
        fairy: "bg-type-fairy text-white border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
