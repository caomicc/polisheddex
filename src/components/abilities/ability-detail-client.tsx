"use client";

import { useFaithfulPreferenceSafe } from "@/hooks/use-faithful-preference-safe";
import { AbilityData } from "@/types/new";
import { AbilityDescriptionCard } from "./ability-description-card";
import { AbilityPokemonCard } from "./ability-pokemon-card";

interface AbilityDetailClientProps {
  ability: AbilityData;
}

export function AbilityDetailClient({ ability }: AbilityDetailClientProps) {
  const { version } = useFaithfulPreferenceSafe();
  const versionData = ability.versions[version] || ability.versions.polished;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <AbilityDescriptionCard description={versionData?.description} />
      </div>
      <div className="md:col-span-2">
        <AbilityPokemonCard pokemon={versionData?.pokemon} />
      </div>
    </div>
  );
}
