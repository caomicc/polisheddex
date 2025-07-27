import * as React from 'react';
import { DetailedStats } from '@/types/types';
import { cn } from '@/lib/utils';
import { useFaithfulPreference } from '@/contexts/FaithfulPreferenceContext';

interface PokemonAbilitiesProps {
  abilities?: DetailedStats['abilities'];
  faithfulAbilities?: DetailedStats['faithfulAbilities'];
  updatedAbilities?: DetailedStats['updatedAbilities'];
  className?: string;
}

export function PokemonAbilities({
  abilities,
  faithfulAbilities,
  updatedAbilities,
  className,
}: PokemonAbilitiesProps) {
  const { showFaithful } = useFaithfulPreference();

  console.log('PokemonAbilities props:', {
    abilities,
    faithfulAbilities,
    updatedAbilities,
    showFaithful,
  });

  // Determine which abilities to show based on faithful preference and availability
  let abilitiesToShow;
  if (showFaithful) {
    abilitiesToShow =
      faithfulAbilities && faithfulAbilities.length > 0 ? faithfulAbilities : abilities;
  } else {
    abilitiesToShow =
      updatedAbilities && updatedAbilities.length > 0 ? updatedAbilities : abilities;
  }

  return (
    <div>
      <h3 className={cn('font-bold text-sm mb-2 text-left')}>Abilities:</h3>
      <div className={cn('flex flex-col gap-2', className)}>
        {abilitiesToShow?.map((ability, idx) => (
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
