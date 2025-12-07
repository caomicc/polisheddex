"use client";

import { useFaithfulPreferenceSafe } from "@/hooks/useFaithfulPreferenceSafe";
import { AbilityData } from "@/types/new";
import { AbilityDescriptionCard } from "./ability-description-card";
import { AbilityPokemonCard } from "./ability-pokemon-card";

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
    <div className="grid gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <AbilityDescriptionCard description={versionData?.description} />
      </div>
      <div className="md:col-span-2">
        <AbilityPokemonCard pokemon={pokemon} />
      </div>
    </div>
  );
}
