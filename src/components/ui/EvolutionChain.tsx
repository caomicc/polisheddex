import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { EvolutionChainProps } from "@/types/types";

export function EvolutionChain({
  chain,
  className,
}: EvolutionChainProps) {
  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {chain.map((name, i) => (
        <React.Fragment key={name}>
          <div className="flex flex-col items-center">
            <Image
              src={`/sprites/pokemon/${name.toLowerCase()}/front_cropped.png`}
              alt={`Sprite of Pokémon ${name}`}
              width={64}
              height={64}
              className="w-16 h-16"
            />
            <Link
              href={`/pokemon/${name}`}
              className="hover:underline text-blue-700 text-sm font-mono"
            >
              {name}
            </Link>
          </div>
          {i < chain.length - 1 && <span className="mx-1">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
