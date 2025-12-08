"use client";

import Link from "next/link";
import { useFaithfulPreferenceSafe } from "@/hooks/useFaithfulPreferenceSafe";
import { AbilityData } from "@/types/new";
import { AbilityPokemonCard } from "./ability-pokemon-card";
import { Hero } from "@/components/ui/Hero";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AbilityPokemon {
  id: string;
  name: string;
  form?: string;
  abilityTypes: string[];
  types?: string[];
}

interface AbilityDetailClientProps {
  ability: AbilityData;
}

export function AbilityDetailClient({ ability }: AbilityDetailClientProps) {
  const { showFaithful } = useFaithfulPreferenceSafe();
  const version = showFaithful ? 'faithful' : 'polished';
  const versionData = ability.versions[version] || ability.versions.polished;
  const pokemon: AbilityPokemon[] = versionData?.pokemon || [];

  return (
    <>
      <Hero
        headline={ability.name}
        description={versionData?.description}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:underline">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/abilities" className="hover:underline">
                    Abilities
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{ability.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="max-w-xl md:max-w-4xl mx-auto space-y-4">
        <AbilityPokemonCard pokemon={pokemon} />
      </div>
    </>
  );
}
