import * as React from 'react';
import { DetailedStats } from '@/types/types';
import { cn } from '@/lib/utils';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';

interface PokemonAbilitiesProps {
  faithfulAbilities?: DetailedStats['faithfulAbilities'];
  updatedAbilities?: DetailedStats['updatedAbilities'];
  className?: string;
}

export function PokemonAbilities({
  faithfulAbilities,
  updatedAbilities,
  className,
}: PokemonAbilitiesProps) {
  // const showUpdated = Array.isArray(updatedAbilities) && updatedAbilities.length > 0;

  const { showFaithful } = useFaithfulPreference();

  return (
    <div>
      <h3 className={cn('font-bold text-sm mb-2 text-left')}>Abilities:</h3>
      <div className={cn('flex flex-col gap-2', className)}>
        {(showFaithful
          ? faithfulAbilities
          : updatedAbilities && updatedAbilities.length > 0
            ? updatedAbilities
            : faithfulAbilities
        )?.map((ability, idx) => (
          <AbilityRow key={`${ability.name}-${idx}`} ability={ability} />
        ))}
      </div>
    </div>
  );
}

function AbilityRow({
  ability,
}: {
  ability: NonNullable<DetailedStats['faithfulAbilities']>[number];
}) {
  return (
    <div className="w-full flex flex-col items-start justify-start">
      <span className="text-xs text-foreground">
        {ability.name} ({ability.abilityType}):
      </span>
      <span className="text-xs text-muted-foreground">{ability.description}</span>
    </div>
  );
}
